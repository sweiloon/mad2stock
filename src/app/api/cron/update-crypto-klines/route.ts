import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { coingeckoApi, TIER_1_COINS, CRON_CONFIG } from '@/lib/crypto'

// ============================================
// UPDATE CRYPTO KLINES CRON
// Runs every 5 minutes
// Fetches OHLC data from CoinGecko for charting
// Note: CoinGecko has limited OHLC intervals (1, 7, 14, 30 days)
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CoinGecko OHLC days mapping (API limitation)
const OHLC_CONFIGS = [
  { days: 1, interval: '1h' as const },   // 1 day = hourly candles
  { days: 7, interval: '4h' as const },   // 7 days = 4-hour candles
  { days: 30, interval: '1d' as const },  // 30 days = daily candles
]

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Verify cron secret (supports both header and query param)
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')

  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Only update Tier 1 coins for klines (top 20 - CoinGecko rate limit constraint)
    const allSymbols = [...TIER_1_COINS]

    // Filter to only CoinGecko-supported symbols
    const symbols = allSymbols.filter(s => coingeckoApi.isSymbolSupported(s))

    console.log(`[Klines Cron] Updating klines for ${symbols.length} coins via CoinGecko`)

    let totalUpdated = 0
    const errors: string[] = []

    // Process in batches to respect rate limits
    const batchSize = CRON_CONFIG.batchSize
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize)

      for (const symbol of batch) {
        const pairSymbol = `${symbol}USDT`

        for (const config of OHLC_CONFIGS) {
          try {
            const klines = await coingeckoApi.getOHLC(symbol, config.days)

            // Transform to database format
            const records = klines.map((k) => ({
              pair_symbol: pairSymbol,
              interval: config.interval,
              open_time: k.openTime.toISOString(),
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close,
              volume: k.volume,
            }))

            if (records.length === 0) continue

            // Upsert klines
            const { error } = await supabase
              .from('crypto_klines')
              .upsert(records, {
                onConflict: 'pair_symbol,interval,open_time',
              })

            if (error) {
              errors.push(`${pairSymbol} ${config.interval}: ${error.message}`)
            } else {
              totalUpdated += records.length
            }
          } catch (err) {
            errors.push(
              `${pairSymbol} ${config.interval}: ${err instanceof Error ? err.message : 'Unknown error'}`
            )
          }
        }

        // Delay between symbols to respect CoinGecko rate limit
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Larger delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    // Cleanup old klines (keep last 7 days for 1h, 30 days for 4h, 365 days for 1d)
    await cleanupOldKlines()

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      symbols: symbols.length,
      source: 'COINGECKO',
      intervals: OHLC_CONFIGS.map(c => c.interval),
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Klines Cron] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function cleanupOldKlines() {
  const now = new Date()

  // 1h: keep 7 days
  const hourlyThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 4h: keep 30 days
  const fourHourThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // 1d: keep 365 days
  const dailyThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  try {
    await Promise.all([
      supabase
        .from('crypto_klines')
        .delete()
        .eq('interval', '1h')
        .lt('open_time', hourlyThreshold.toISOString()),
      supabase
        .from('crypto_klines')
        .delete()
        .eq('interval', '4h')
        .lt('open_time', fourHourThreshold.toISOString()),
      supabase
        .from('crypto_klines')
        .delete()
        .eq('interval', '1d')
        .lt('open_time', dailyThreshold.toISOString()),
    ])
  } catch (err) {
    console.error('[Klines Cron] Cleanup error:', err)
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

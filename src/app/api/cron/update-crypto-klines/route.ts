import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { coingeckoApi } from '@/lib/crypto'

// ============================================
// UPDATE CRYPTO KLINES CRON
// Runs every 5 minutes
// Fetches OHLC data from CoinGecko for charting
// Note: CoinGecko free tier allows ~10-30 calls/minute
// We limit to top 7 coins × 3 intervals = 21 calls with 3s delays
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Top 3 coins for klines (CoinGecko free tier allows ~10-15 calls/minute)
// 3 coins × 3 intervals = 9 API calls per run
const KLINE_COINS = ['BTC', 'ETH', 'SOL']

// CoinGecko OHLC days mapping (API limitation)
const OHLC_CONFIGS = [
  { days: 1, interval: '1h' as const },   // 1 day = hourly candles
  { days: 7, interval: '4h' as const },   // 7 days = 4-hour candles
  { days: 30, interval: '1d' as const },  // 30 days = daily candles
]

// Rate limit: 5 seconds between API calls to stay under 12 calls/minute
const API_DELAY_MS = 5000

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
    // Filter to only CoinGecko-supported symbols from our top coins list
    const symbols = KLINE_COINS.filter(s => coingeckoApi.isSymbolSupported(s))

    console.log(`[Klines Cron] Updating klines for ${symbols.length} coins via CoinGecko`)

    let totalUpdated = 0
    const errors: string[] = []
    let apiCallCount = 0

    // Process sequentially with delays to respect rate limits
    for (const symbol of symbols) {
      const pairSymbol = `${symbol}USDT`

      for (const config of OHLC_CONFIGS) {
        try {
          // Delay before each API call (except first)
          if (apiCallCount > 0) {
            await new Promise((resolve) => setTimeout(resolve, API_DELAY_MS))
          }
          apiCallCount++

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

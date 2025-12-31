import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { binanceApi, TIER_1_COINS, TIER_2_COINS, CRON_CONFIG } from '@/lib/crypto'

// ============================================
// UPDATE CRYPTO KLINES CRON
// Runs every 5 minutes
// Fetches 1h and 1d candlestick data for charting
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type KlineInterval = '1h' | '4h' | '1d'

const INTERVALS: KlineInterval[] = ['1h', '4h', '1d']
const KLINE_LIMIT = 100 // Fetch last 100 candles per interval

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
    // Only update Tier 1 and Tier 2 coins for klines (most viewed)
    const symbols = [...TIER_1_COINS, ...TIER_2_COINS]

    console.log(`[Klines Cron] Updating klines for ${symbols.length} coins`)

    let totalUpdated = 0
    const errors: string[] = []

    // Process in batches to avoid rate limiting
    const batchSize = CRON_CONFIG.batchSize
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (symbol) => {
          const pairSymbol = `${symbol}USDT`

          for (const interval of INTERVALS) {
            try {
              const klines = await binanceApi.getCryptoKlines(
                symbol,
                'USDT',
                interval,
                KLINE_LIMIT
              )

              // Transform to database format
              const records = klines.map((k) => ({
                pair_symbol: pairSymbol,
                interval,
                open_time: k.openTime.toISOString(),
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
              }))

              // Upsert klines
              const { error } = await supabase
                .from('crypto_klines')
                .upsert(records, {
                  onConflict: 'pair_symbol,interval,open_time',
                })

              if (error) {
                errors.push(`${pairSymbol} ${interval}: ${error.message}`)
              } else {
                totalUpdated += records.length
              }
            } catch (err) {
              errors.push(
                `${pairSymbol} ${interval}: ${err instanceof Error ? err.message : 'Unknown error'}`
              )
            }
          }
        })
      )

      // Small delay between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Cleanup old klines (keep last 7 days for 1h, 30 days for 4h, 365 days for 1d)
    await cleanupOldKlines()

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      symbols: symbols.length,
      intervals: INTERVALS,
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

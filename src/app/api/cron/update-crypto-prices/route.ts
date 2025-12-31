import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { coingeckoApi, TIER_1_COINS, TIER_2_COINS, TIER_3_COINS, getCoinTier } from '@/lib/crypto'

// ============================================
// UPDATE CRYPTO PRICES CRON
// Runs every 1 minute
// Uses CoinGecko API (Binance is geo-blocked from Vercel)
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Determine which tier to update based on the minute
function getTierToUpdate(): 1 | 2 | 3 | 'all' {
  const minute = new Date().getMinutes()

  // Every minute: Tier 1
  // Every 3 minutes: Tier 2
  // Every 5 minutes: Tier 3

  if (minute % 5 === 0) return 'all'
  if (minute % 3 === 0) return 2
  return 1
}

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
    const tierToUpdate = getTierToUpdate()
    let symbols: string[] = []

    if (tierToUpdate === 'all') {
      symbols = [...TIER_1_COINS, ...TIER_2_COINS, ...TIER_3_COINS]
    } else if (tierToUpdate === 2) {
      symbols = [...TIER_1_COINS, ...TIER_2_COINS]
    } else {
      symbols = [...TIER_1_COINS]
    }

    console.log(`[Crypto Cron] Updating ${symbols.length} coins (tier: ${tierToUpdate}) via CoinGecko`)

    // Filter to only supported symbols
    const supportedSymbols = symbols.filter(s => coingeckoApi.isSymbolSupported(s))

    // Fetch market data from CoinGecko
    const priceMap = await coingeckoApi.getMarketData(supportedSymbols)

    // Transform to database format
    const updates: Array<{
      symbol: string
      price: number
      change: number
      change_percent: number
      open_24h: number
      high_24h: number
      low_24h: number
      volume_24h: number
      quote_volume_24h: number
      bid: number
      ask: number
      trades_24h: number
      data_source: string
      tier: number
      updated_at: string
    }> = []

    for (const [symbol, data] of priceMap) {
      const tier = getCoinTier(symbol)
      updates.push({
        symbol,
        price: data.price,
        change: data.change,
        change_percent: data.changePercent,
        open_24h: data.open24h,
        high_24h: data.high24h,
        low_24h: data.low24h,
        volume_24h: data.volume24h,
        quote_volume_24h: data.quoteVolume24h,
        bid: data.bid,
        ask: data.ask,
        trades_24h: data.trades24h || 0,
        data_source: 'COINGECKO',
        tier,
        updated_at: new Date().toISOString(),
      })
    }

    console.log(`[Crypto Cron] Got ${updates.length} prices from CoinGecko`)

    // Batch upsert to database
    if (updates.length > 0) {
      const { error } = await supabase
        .from('crypto_prices')
        .upsert(updates, {
          onConflict: 'symbol',
        })

      if (error) {
        console.error('[Crypto Cron] Database error:', error)
        throw error
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      tier: tierToUpdate,
      updated: updates.length,
      source: 'COINGECKO',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Crypto Cron] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

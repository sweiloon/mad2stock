import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIER_1_COINS, getCoinTier, getCoinCategory } from '@/lib/crypto'
import OpenAI from 'openai'

// ============================================
// GENERATE CRYPTO SIGNALS CRON
// Runs every 15 minutes
// AI analysis of top coins to generate trading signals
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Only generate signals for Tier 1 coins (top 20)
const SIGNAL_COINS = TIER_1_COINS

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
    console.log(`[Crypto Signals] Generating signals for ${SIGNAL_COINS.length} coins`)

    // Fetch current prices
    const { data: prices, error: pricesError } = await supabase
      .from('crypto_prices')
      .select('*')
      .in('symbol', [...SIGNAL_COINS])

    if (pricesError) throw pricesError

    // Fetch recent klines for technical analysis
    const { data: klines, error: klinesError } = await supabase
      .from('crypto_klines')
      .select('*')
      .in('pair_symbol', SIGNAL_COINS.map(s => `${s}USDT`))
      .eq('interval', '1h')
      .order('open_time', { ascending: false })
      .limit(500) // ~20 coins * 24 hours

    if (klinesError) throw klinesError

    // Group klines by symbol
    const klinesBySymbol = new Map<string, typeof klines>()
    klines?.forEach(k => {
      const symbol = k.pair_symbol.replace('USDT', '')
      if (!klinesBySymbol.has(symbol)) {
        klinesBySymbol.set(symbol, [])
      }
      klinesBySymbol.get(symbol)!.push(k)
    })

    // Generate signals for each coin
    const signals: Array<{
      symbol: string
      signal_type: string
      confidence: number
      entry_price: number
      target_price: number
      stop_loss: number
      time_horizon: string
      reasoning: string
      is_active: boolean
      created_at: string
    }> = []

    for (const symbol of SIGNAL_COINS) {
      const price = prices?.find(p => p.symbol === symbol)
      const symbolKlines = klinesBySymbol.get(symbol) || []

      if (!price) continue

      try {
        const signal = await generateSignalForCoin(symbol, price, symbolKlines)
        if (signal) {
          signals.push(signal)
        }
      } catch (err) {
        console.error(`[Crypto Signals] Error generating signal for ${symbol}:`, err)
      }
    }

    // Deactivate old signals
    await supabase
      .from('crypto_signals')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()) // 4 hours old

    // Insert new signals
    if (signals.length > 0) {
      const { error: insertError } = await supabase
        .from('crypto_signals')
        .insert(signals)

      if (insertError) {
        console.error('[Crypto Signals] Insert error:', insertError)
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      generated: signals.length,
      coins: SIGNAL_COINS.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Crypto Signals] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function generateSignalForCoin(
  symbol: string,
  price: any,
  klines: any[]
): Promise<{
  symbol: string
  signal_type: string
  confidence: number
  entry_price: number
  target_price: number
  stop_loss: number
  time_horizon: string
  reasoning: string
  is_active: boolean
  created_at: string
} | null> {
  const category = getCoinCategory(symbol)
  const tier = getCoinTier(symbol)

  // Calculate basic technicals
  const closes = klines.slice(0, 24).map(k => parseFloat(k.close)).reverse()
  const sma20 = closes.length >= 20
    ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20
    : price.price

  const priceVsSma = ((price.price - sma20) / sma20) * 100
  const momentum = price.change_percent

  // Build context for AI
  const context = `
Crypto Signal Analysis for ${symbol}

Current Data:
- Price: $${price.price.toFixed(2)}
- 24h Change: ${price.change_percent.toFixed(2)}%
- 24h Volume: $${(price.quote_volume_24h / 1e6).toFixed(2)}M
- 24h High: $${price.high_24h.toFixed(2)}
- 24h Low: $${price.low_24h.toFixed(2)}
- Bid/Ask Spread: ${((price.ask - price.bid) / price.price * 100).toFixed(4)}%

Technical Indicators:
- Price vs 20-hour SMA: ${priceVsSma.toFixed(2)}%
- Recent momentum: ${momentum > 0 ? 'Bullish' : 'Bearish'}

Metadata:
- Category: ${category}
- Tier: ${tier} (1=Top20, 2=Top50, 3=Top100)

Generate a trading signal with:
1. Signal Type (BUY, SELL, or HOLD)
2. Confidence (0-100)
3. Target Price (for BUY/SELL)
4. Stop Loss Price
5. Time Horizon (SHORT_TERM, MEDIUM_TERM, LONG_TERM)
6. Brief Reasoning (max 200 chars)

Respond in JSON format only:
{
  "signal_type": "BUY|SELL|HOLD",
  "confidence": 75,
  "target_price": 100000,
  "stop_loss": 90000,
  "time_horizon": "SHORT_TERM",
  "reasoning": "Brief explanation"
}
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a cryptocurrency technical analyst. Provide objective analysis based on the data. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: context,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) return null

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    return {
      symbol,
      signal_type: parsed.signal_type,
      confidence: Math.min(100, Math.max(0, parsed.confidence)),
      entry_price: price.price,
      target_price: parsed.target_price || price.price * 1.05,
      stop_loss: parsed.stop_loss || price.price * 0.95,
      time_horizon: parsed.time_horizon || 'SHORT_TERM',
      reasoning: (parsed.reasoning || '').slice(0, 500),
      is_active: true,
      created_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error(`[Crypto Signals] AI error for ${symbol}:`, err)
    return null
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

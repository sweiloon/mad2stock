import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIER_1_COINS, getCoinTier, getCoinCategory } from '@/lib/crypto'
import OpenAI from 'openai'

// ============================================
// ARENA CRYPTO TRADING CRON
// Runs every hour
// AI models execute crypto trades in competition
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Tradeable coins for Arena (Tier 1 only for simplicity)
const TRADEABLE_COINS = TIER_1_COINS

// Trading constraints
const MAX_POSITION_SIZE = 0.25 // Max 25% of portfolio per position
const MIN_TRADE_VALUE = 100   // Minimum $100 trade
const MAX_TRADE_VALUE = 2500  // Maximum $2500 trade

interface Participant {
  id: string
  model_id: string
  display_name: string
  cash_balance: number
  total_value: number
  allowed_markets: string[]
}

interface CryptoHolding {
  symbol: string
  pair_symbol: string
  quantity: number
  avg_buy_price: number
  current_price: number
  unrealized_pnl: number
}

interface CryptoPrice {
  symbol: string
  price: number
  change_percent: number
  volume_24h: number
  high_24h: number
  low_24h: number
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
    // Check if crypto trading is enabled
    const { data: config } = await supabase
      .from('arena_config')
      .select('*')
      .eq('key', 'crypto_trading_enabled')
      .single()

    if (!config || config.value !== 'true') {
      return NextResponse.json({
        success: true,
        message: 'Crypto trading is not enabled',
        skipped: true,
      })
    }

    // Get active participants with crypto access
    const { data: participants, error: participantsError } = await supabase
      .from('arena_participants')
      .select('*')
      .eq('is_active', true)
      .contains('allowed_markets', ['CRYPTO'])

    if (participantsError) throw participantsError
    if (!participants || participants.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No participants with crypto access',
        skipped: true,
      })
    }

    console.log(`[Arena Crypto] Processing ${participants.length} participants`)

    // Fetch current crypto prices
    const { data: prices, error: pricesError } = await supabase
      .from('crypto_prices')
      .select('*')
      .in('symbol', [...TRADEABLE_COINS])

    if (pricesError) throw pricesError

    const priceMap = new Map<string, CryptoPrice>()
    prices?.forEach(p => priceMap.set(p.symbol, p))

    // Process each participant
    const results = await Promise.all(
      participants.map(async (participant) => {
        try {
          return await processParticipantCryptoTrade(participant, priceMap)
        } catch (err) {
          console.error(`[Arena Crypto] Error for ${participant.model_id}:`, err)
          return { participant: participant.model_id, error: true }
        }
      })
    )

    // Take daily snapshots
    await takeCryptoSnapshots(participants)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      participants: participants.length,
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Arena Crypto] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function processParticipantCryptoTrade(
  participant: Participant,
  priceMap: Map<string, CryptoPrice>
): Promise<{
  participant: string
  action?: string
  symbol?: string
  error?: boolean
}> {
  // Get current crypto holdings
  const { data: holdings } = await supabase
    .from('arena_crypto_holdings')
    .select('*')
    .eq('participant_id', participant.id)

  const holdingsWithPrices: CryptoHolding[] = (holdings || []).map(h => {
    const price = priceMap.get(h.symbol)
    return {
      symbol: h.symbol,
      pair_symbol: h.pair_symbol,
      quantity: parseFloat(h.quantity),
      avg_buy_price: parseFloat(h.avg_buy_price),
      current_price: price?.price || 0,
      unrealized_pnl: price
        ? (price.price - parseFloat(h.avg_buy_price)) * parseFloat(h.quantity)
        : 0,
    }
  })

  // Calculate portfolio value
  const holdingsValue = holdingsWithPrices.reduce(
    (sum, h) => sum + h.current_price * h.quantity,
    0
  )
  const totalValue = participant.cash_balance + holdingsValue

  // Build market context for AI
  const marketContext = buildMarketContext(priceMap, holdingsWithPrices)

  // Get AI trading decision
  const decision = await getAITradingDecision(
    participant,
    totalValue,
    holdingsWithPrices,
    marketContext
  )

  if (!decision || decision.action === 'HOLD') {
    return { participant: participant.model_id, action: 'HOLD' }
  }

  // Execute trade
  const price = priceMap.get(decision.symbol)
  if (!price) {
    return { participant: participant.model_id, error: true }
  }

  if (decision.action === 'BUY') {
    await executeCryptoBuy(
      participant,
      decision.symbol,
      price.price,
      decision.quantity,
      decision.reasoning
    )
  } else if (decision.action === 'SELL') {
    await executeCryptoSell(
      participant,
      decision.symbol,
      price.price,
      decision.quantity,
      decision.reasoning,
      holdingsWithPrices
    )
  }

  return {
    participant: participant.model_id,
    action: decision.action,
    symbol: decision.symbol,
  }
}

function buildMarketContext(
  priceMap: Map<string, CryptoPrice>,
  holdings: CryptoHolding[]
): string {
  const topMovers = Array.from(priceMap.values())
    .sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent))
    .slice(0, 10)

  let context = 'CRYPTO MARKET OVERVIEW:\n\n'

  context += 'Top Movers (24h):\n'
  topMovers.forEach(p => {
    const direction = p.change_percent >= 0 ? '↑' : '↓'
    context += `- ${p.symbol}: $${p.price.toFixed(2)} ${direction}${Math.abs(p.change_percent).toFixed(2)}%\n`
  })

  if (holdings.length > 0) {
    context += '\nCURRENT POSITIONS:\n'
    holdings.forEach(h => {
      const pnlPct = ((h.current_price - h.avg_buy_price) / h.avg_buy_price * 100).toFixed(2)
      context += `- ${h.symbol}: ${h.quantity.toFixed(6)} @ $${h.avg_buy_price.toFixed(2)} (P&L: ${pnlPct}%)\n`
    })
  }

  return context
}

async function getAITradingDecision(
  participant: Participant,
  totalValue: number,
  holdings: CryptoHolding[],
  marketContext: string
): Promise<{
  action: 'BUY' | 'SELL' | 'HOLD'
  symbol: string
  quantity: number
  reasoning: string
} | null> {
  const holdingsValue = holdings.reduce((sum, h) => sum + h.current_price * h.quantity, 0)

  const prompt = `
You are ${participant.display_name}, an AI crypto trader competing in Mad2Arena.

PORTFOLIO STATUS:
- Cash: $${participant.cash_balance.toFixed(2)}
- Holdings Value: $${holdingsValue.toFixed(2)}
- Total Value: $${totalValue.toFixed(2)}

${marketContext}

TRADING RULES:
- Max position size: 25% of portfolio
- Min trade: $100, Max trade: $2500
- Trade crypto pairs against USDT only
- Available coins: ${TRADEABLE_COINS.join(', ')}

Decide your next action. Respond with JSON only:
{
  "action": "BUY|SELL|HOLD",
  "symbol": "BTC",
  "quantity": 0.001,
  "reasoning": "Brief explanation"
}

If HOLD, set symbol to "" and quantity to 0.
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a cryptocurrency trader. Make strategic decisions. Respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 200,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) return null

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('[Arena Crypto] AI decision error:', err)
    return null
  }
}

async function executeCryptoBuy(
  participant: Participant,
  symbol: string,
  price: number,
  quantity: number,
  reasoning: string
) {
  const totalValue = price * quantity
  const pairSymbol = `${symbol}USDT`

  // Validate
  if (totalValue > participant.cash_balance) {
    quantity = participant.cash_balance / price * 0.99 // Leave 1% buffer
  }
  if (totalValue < MIN_TRADE_VALUE) return
  if (totalValue > MAX_TRADE_VALUE) {
    quantity = MAX_TRADE_VALUE / price
  }

  const finalValue = price * quantity

  // Update cash balance
  await supabase
    .from('arena_participants')
    .update({ cash_balance: participant.cash_balance - finalValue })
    .eq('id', participant.id)

  // Upsert holding
  const { data: existing } = await supabase
    .from('arena_crypto_holdings')
    .select('*')
    .eq('participant_id', participant.id)
    .eq('symbol', symbol)
    .single()

  if (existing) {
    const newQty = parseFloat(existing.quantity) + quantity
    const newAvg = (parseFloat(existing.quantity) * parseFloat(existing.avg_buy_price) + finalValue) / newQty
    await supabase
      .from('arena_crypto_holdings')
      .update({
        quantity: newQty,
        avg_buy_price: newAvg,
        current_price: price,
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('arena_crypto_holdings').insert({
      participant_id: participant.id,
      symbol,
      pair_symbol: pairSymbol,
      quantity,
      avg_buy_price: price,
      current_price: price,
    })
  }

  // Record trade
  await supabase.from('arena_crypto_trades').insert({
    participant_id: participant.id,
    symbol,
    pair_symbol: pairSymbol,
    trade_type: 'BUY',
    quantity,
    price,
    total_value: finalValue,
    reasoning,
  })
}

async function executeCryptoSell(
  participant: Participant,
  symbol: string,
  price: number,
  quantity: number,
  reasoning: string,
  holdings: CryptoHolding[]
) {
  const holding = holdings.find(h => h.symbol === symbol)
  if (!holding || holding.quantity < quantity) {
    quantity = holding?.quantity || 0
  }
  if (quantity === 0) return

  const pairSymbol = `${symbol}USDT`
  const totalValue = price * quantity
  const realizedPnl = (price - holding!.avg_buy_price) * quantity

  // Update cash balance
  await supabase
    .from('arena_participants')
    .update({
      cash_balance: participant.cash_balance + totalValue,
      realized_pnl: (participant as any).realized_pnl + realizedPnl,
    })
    .eq('id', participant.id)

  // Update or remove holding
  const remainingQty = holding!.quantity - quantity
  if (remainingQty <= 0.00000001) {
    await supabase
      .from('arena_crypto_holdings')
      .delete()
      .eq('participant_id', participant.id)
      .eq('symbol', symbol)
  } else {
    await supabase
      .from('arena_crypto_holdings')
      .update({ quantity: remainingQty, current_price: price })
      .eq('participant_id', participant.id)
      .eq('symbol', symbol)
  }

  // Record trade
  await supabase.from('arena_crypto_trades').insert({
    participant_id: participant.id,
    symbol,
    pair_symbol: pairSymbol,
    trade_type: 'SELL',
    quantity,
    price,
    total_value: totalValue,
    realized_pnl: realizedPnl,
    reasoning,
  })
}

async function takeCryptoSnapshots(participants: Participant[]) {
  const today = new Date().toISOString().split('T')[0]

  for (const participant of participants) {
    const { data: holdings } = await supabase
      .from('arena_crypto_holdings')
      .select('*')
      .eq('participant_id', participant.id)

    const holdingsValue = (holdings || []).reduce(
      (sum, h) => sum + parseFloat(h.current_price) * parseFloat(h.quantity),
      0
    )

    await supabase.from('arena_crypto_snapshots').upsert(
      {
        participant_id: participant.id,
        snapshot_date: today,
        cash_balance: participant.cash_balance,
        holdings_value: holdingsValue,
        total_value: participant.cash_balance + holdingsValue,
        market_type: 'CRYPTO',
      },
      { onConflict: 'participant_id,snapshot_date,market_type' }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

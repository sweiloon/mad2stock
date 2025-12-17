import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  AI_TRADER_SYSTEM_PROMPT,
  buildTradingContext,
  parseAIResponse,
  validateTradeAction,
  getMockStockPrice
} from '@/lib/arena/ai-trader'
import { AI_MODELS } from '@/lib/arena/types'
import type { AIParticipant, Holding, TradeAction } from '@/lib/arena/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for AI calls

// Validate cron request (supports both GET query param and POST Bearer token)
function validateCronRequest(request: Request): boolean {
  // Check Vercel cron header
  if (request.headers.get('x-vercel-cron') === '1') return true

  // Check Bearer token in Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true

  // Check secret in query param (for cron-job.org)
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret === process.env.CRON_SECRET) return true

  return false
}

// GET /api/arena/analyze - Support cron-job.org (uses GET with query param)
export async function GET(request: Request) {
  return handleAnalyze(request)
}

// POST /api/arena/analyze - Trigger AI analysis and trading (cron job)
export async function POST(request: Request) {
  return handleAnalyze(request)
}

async function handleAnalyze(request: Request) {
  try {
    // Verify cron secret
    if (!validateCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient() as any

    // Check if competition is active
    const { data: config } = await supabase
      .from('arena_config')
      .select('*')
      .single()

    if (!config?.is_active) {
      return NextResponse.json({ message: 'Competition not active' })
    }

    const now = new Date()
    const startDate = new Date(config.start_date)
    const endDate = new Date(config.end_date)

    if (now < startDate) {
      return NextResponse.json({
        message: 'Competition has not started yet',
        startsAt: config.start_date
      })
    }

    if (now > endDate) {
      return NextResponse.json({
        message: 'Competition has ended',
        endedAt: config.end_date
      })
    }

    // Check market hours (9am - 5pm MYT = UTC+8)
    const myt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }))
    const hour = myt.getHours()
    const day = myt.getDay()

    if (day === 0 || day === 6 || hour < 9 || hour >= 17) {
      return NextResponse.json({
        message: 'Outside market hours',
        currentTime: myt.toISOString(),
        marketHours: '9am - 5pm MYT (Mon-Fri)'
      })
    }

    // Get all active participants
    const { data: participants, error: participantsError } = await supabase
      .from('arena_participants')
      .select('*')
      .eq('status', 'active')

    if (participantsError || !participants) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }

    const results: any[] = []

    // Process each AI model
    for (const participant of participants) {
      try {
        const modelConfig = AI_MODELS.find(
          m => m.name === participant.display_name
        )

        if (!modelConfig) {
          results.push({
            participant: participant.display_name,
            status: 'skipped',
            reason: 'Model config not found'
          })
          continue
        }

        // Check if API key is available
        const apiKey = process.env[modelConfig.apiKeyEnvVar]
        if (!apiKey) {
          results.push({
            participant: participant.display_name,
            status: 'skipped',
            reason: `Missing API key: ${modelConfig.apiKeyEnvVar}`
          })
          continue
        }

        // Get participant holdings
        const { data: holdings } = await supabase
          .from('arena_holdings')
          .select('*')
          .eq('participant_id', participant.id)

        // Get recent trades
        const { data: recentTrades } = await supabase
          .from('arena_trades')
          .select('stock_code, trade_type, price, executed_at')
          .eq('participant_id', participant.id)
          .order('executed_at', { ascending: false })
          .limit(10)

        // Build context for AI
        const context = buildTradingContext(
          participant as AIParticipant,
          (holdings || []) as Holding[],
          recentTrades || []
        )

        // Call AI model
        const aiResponse = await callAIModel(modelConfig, context, apiKey)

        if (!aiResponse) {
          results.push({
            participant: participant.display_name,
            status: 'error',
            reason: 'No response from AI'
          })
          continue
        }

        // Parse AI response
        const analysis = parseAIResponse(aiResponse)

        if (!analysis) {
          results.push({
            participant: participant.display_name,
            status: 'error',
            reason: 'Failed to parse AI response'
          })
          continue
        }

        // Log AI decision
        await (supabase as any)
          .from('arena_ai_decisions')
          .insert({
            participant_id: participant.id,
            decision_type: analysis.recommended_actions.length > 0 ? 'TRADE' : 'HOLD',
            stocks_analyzed: analysis.top_picks,
            market_sentiment: analysis.sentiment,
            decision_summary: analysis.market_summary,
            raw_response: aiResponse,
            tokens_used: aiResponse.length // Approximate
          })

        // Execute valid trade actions
        const executedTrades: any[] = []
        for (const action of analysis.recommended_actions) {
          if (action.action === 'HOLD') continue

          // Get stock price (mock for now)
          const stockPrice = getMockStockPrice(action.stock_code)
          if (!stockPrice) continue

          // Validate trade
          const validation = validateTradeAction(
            action,
            participant as AIParticipant,
            (holdings || []) as Holding[],
            stockPrice,
            {
              min_trade_value: config.min_trade_value,
              max_position_pct: config.max_position_pct,
              trading_fee_pct: config.trading_fee_pct
            }
          )

          if (!validation.valid) {
            continue
          }

          // Execute trade via internal call
          const tradeResult = await executeTrade(
            supabase,
            participant.id,
            action,
            stockPrice,
            config.trading_fee_pct
          )

          if (tradeResult.success) {
            executedTrades.push(tradeResult)
          }
        }

        results.push({
          participant: participant.display_name,
          status: 'success',
          sentiment: analysis.sentiment,
          tradesExecuted: executedTrades.length,
          trades: executedTrades
        })

      } catch (err) {
        console.error(`Error processing ${participant.display_name}:`, err)
        results.push({
          participant: participant.display_name,
          status: 'error',
          reason: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Update rankings
    await updateRankings(supabase)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (err) {
    console.error('Arena analyze error:', err)
    return NextResponse.json(
      { error: 'Failed to run analysis' },
      { status: 500 }
    )
  }
}

async function callAIModel(
  config: typeof AI_MODELS[0],
  context: string,
  apiKey: string
): Promise<string | null> {
  try {
    const messages = [
      { role: 'system', content: AI_TRADER_SYSTEM_PROMPT },
      { role: 'user', content: context }
    ]

    // Handle different API providers
    if (config.provider === 'OpenAI') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature
        })
      })

      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    }

    if (config.provider === 'Anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          system: AI_TRADER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: context }]
        })
      })

      const data = await response.json()
      return data.content?.[0]?.text || null
    }

    if (config.provider === 'Google') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${config.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${AI_TRADER_SYSTEM_PROMPT}\n\n${context}` }] }],
            generationConfig: {
              maxOutputTokens: config.maxTokens,
              temperature: config.temperature
            }
          })
        }
      )

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null
    }

    // For other providers (Mistral, Together/Llama, xAI), use OpenAI-compatible endpoint
    if (config.endpoint) {
      const response = await fetch(`${config.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature
        })
      })

      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    }

    // Mistral API
    if (config.provider === 'Mistral') {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature
        })
      })

      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    }

    return null
  } catch (err) {
    console.error(`Error calling ${config.provider}:`, err)
    return null
  }
}

async function executeTrade(
  supabase: any,
  participantId: string,
  action: TradeAction,
  price: number,
  feeRate: number
): Promise<{ success: boolean; trade?: any; error?: string }> {
  try {
    const total_value = action.quantity * price
    const fees = total_value * feeRate

    // Get participant
    const { data: participant } = await supabase
      .from('arena_participants')
      .select('*')
      .eq('id', participantId)
      .single()

    if (!participant) {
      return { success: false, error: 'Participant not found' }
    }

    let realized_pnl: number | null = null

    if (action.action === 'BUY') {
      const required = total_value + fees
      if (required > participant.current_capital) {
        return { success: false, error: 'Insufficient capital' }
      }

      // Update holding
      const { data: existing } = await supabase
        .from('arena_holdings')
        .select('*')
        .eq('participant_id', participantId)
        .eq('stock_code', action.stock_code)
        .single()

      if (existing) {
        const new_qty = existing.quantity + action.quantity
        const new_avg = (existing.avg_buy_price * existing.quantity + price * action.quantity) / new_qty

        await supabase
          .from('arena_holdings')
          .update({
            quantity: new_qty,
            avg_buy_price: new_avg,
            current_price: price,
            market_value: new_qty * price
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('arena_holdings')
          .insert({
            participant_id: participantId,
            stock_code: action.stock_code,
            stock_name: action.stock_name,
            quantity: action.quantity,
            avg_buy_price: price,
            current_price: price,
            market_value: action.quantity * price
          })
      }

      await supabase
        .from('arena_participants')
        .update({
          current_capital: participant.current_capital - required,
          total_trades: participant.total_trades + 1,
          last_trade_at: new Date().toISOString()
        })
        .eq('id', participantId)

    } else if (action.action === 'SELL') {
      const { data: holding } = await supabase
        .from('arena_holdings')
        .select('*')
        .eq('participant_id', participantId)
        .eq('stock_code', action.stock_code)
        .single()

      if (!holding || action.quantity > holding.quantity) {
        return { success: false, error: 'Insufficient shares' }
      }

      realized_pnl = (price - holding.avg_buy_price) * action.quantity - fees
      const isWin = realized_pnl > 0
      const remaining = holding.quantity - action.quantity

      if (remaining === 0) {
        await supabase.from('arena_holdings').delete().eq('id', holding.id)
      } else {
        await supabase
          .from('arena_holdings')
          .update({ quantity: remaining, market_value: remaining * price })
          .eq('id', holding.id)
      }

      await supabase
        .from('arena_participants')
        .update({
          current_capital: participant.current_capital + total_value - fees,
          total_trades: participant.total_trades + 1,
          winning_trades: participant.winning_trades + (isWin ? 1 : 0),
          total_profit_loss: participant.total_profit_loss + realized_pnl,
          last_trade_at: new Date().toISOString()
        })
        .eq('id', participantId)
    }

    // Record trade
    const { data: trade } = await supabase
      .from('arena_trades')
      .insert({
        participant_id: participantId,
        stock_code: action.stock_code,
        stock_name: action.stock_name,
        trade_type: action.action,
        quantity: action.quantity,
        price,
        total_value,
        fees,
        realized_pnl,
        reasoning: action.reasoning
      })
      .select()
      .single()

    return { success: true, trade }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Trade failed' }
  }
}

async function updateRankings(supabase: any) {
  // Get all participants sorted by portfolio value
  const { data: participants } = await supabase
    .from('arena_participants')
    .select('*')
    .order('portfolio_value', { ascending: false })

  if (!participants) return

  // Update ranks
  for (let i = 0; i < participants.length; i++) {
    await supabase
      .from('arena_participants')
      .update({ rank: i + 1 })
      .eq('id', participants[i].id)
  }
}

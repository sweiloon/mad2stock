/**
 * Mad2Arena - Trading Engine
 * Core engine that orchestrates AI trading sessions
 */

import { createAdminClient } from '@/lib/supabase/server'
import { COMPANY_DATA } from '@/lib/company-data'
import { AI_MODELS, type AIParticipant, type TradeAction, type Holding, type ArenaConfig } from './types'
import { getProvider } from './ai/router'
import { TRADING_SYSTEM_PROMPT, buildTradingPrompt, type TradingPromptContext } from './prompts/trading'
import { parseAIResponse, validateTradeAction, calculateTradeMetrics } from './ai-trader'

// Supabase client type - using ReturnType for proper inference
type SupabaseClient = ReturnType<typeof createAdminClient>

export interface TradingSessionConfig {
  dryRun?: boolean // If true, don't execute trades, just log decisions
  singleModel?: string // If set, only run for this model
}

export interface TradingSessionReport {
  timestamp: Date
  marketHours: boolean
  competitionActive: boolean
  modelsProcessed: number
  tradesExecuted: number
  totalTokensUsed: number
  results: ModelSessionResult[]
  errors: string[]
}

export interface ModelSessionResult {
  modelId: string
  modelName: string
  success: boolean
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  tradesExecuted: number
  trades: ExecutedTrade[]
  tokensUsed: number
  latencyMs: number
  error?: string
}

export interface ExecutedTrade {
  stockCode: string
  action: 'BUY' | 'SELL'
  quantity: number
  price: number
  totalValue: number
  fees: number
  realizedPnl: number | null
  reasoning: string
}

/**
 * Check if current time is within KLSE market hours
 */
export function isMarketOpen(): { open: boolean; reason: string } {
  const now = new Date()
  const myt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }))
  const hour = myt.getHours()
  const day = myt.getDay()
  const minutes = myt.getMinutes()

  // Weekend
  if (day === 0 || day === 6) {
    return { open: false, reason: 'Weekend - market closed' }
  }

  // Before market open (9:00 AM)
  if (hour < 9) {
    return { open: false, reason: `Pre-market (opens at 9:00 AM MYT)` }
  }

  // After market close (5:00 PM)
  if (hour >= 17) {
    return { open: false, reason: `After hours (closed at 5:00 PM MYT)` }
  }

  // Lunch break (12:30 PM - 2:30 PM)
  if ((hour === 12 && minutes >= 30) || hour === 13 || (hour === 14 && minutes < 30)) {
    return { open: false, reason: 'Lunch break (12:30 PM - 2:30 PM MYT)' }
  }

  return { open: true, reason: 'Market is open' }
}

/**
 * Get stock price from database or fallback
 */
async function getStockPrice(supabase: SupabaseClient, stockCode: string): Promise<number | null> {
  // Try to get from stock_prices table
  const { data } = await supabase
    .from('stock_prices')
    .select('current_price')
    .eq('stock_code', stockCode)
    .single()

  if (data?.current_price) {
    return data.current_price
  }

  // Fallback: generate reasonable mock price based on company data
  const company = COMPANY_DATA.find(c => c.code === stockCode)
  if (company && company.latestRevenue) {
    // Generate price between 0.50 and 50 based on revenue scale
    const basePrice = Math.max(0.5, Math.min(50, company.latestRevenue / 100))
    const variance = (Math.random() - 0.5) * 0.1
    return Number((basePrice * (1 + variance)).toFixed(4))
  }

  return null
}

/**
 * Build trading context for an AI participant
 */
async function buildContext(
  supabase: SupabaseClient,
  participant: AIParticipant,
  config: ArenaConfig
): Promise<TradingPromptContext> {
  // Get holdings
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
    .limit(5)

  // Get all participants for ranking context
  const { data: allParticipants } = await supabase
    .from('arena_participants')
    .select('id')
    .eq('status', 'active')

  // Calculate days remaining
  const endDate = new Date(config.end_date)
  const now = new Date()
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  // Build stocks by category
  const stocksByCategory = {
    strongGrowth: COMPANY_DATA
      .filter(c => c.yoyCategory === 1)
      .map(c => ({
        code: c.code,
        revenueYoY: c.revenueYoY || 0,
        profitYoY: c.profitYoY || 0
      })),
    efficiencyGains: COMPANY_DATA
      .filter(c => c.yoyCategory === 2)
      .map(c => ({
        code: c.code,
        revenueYoY: c.revenueYoY || 0,
        profitYoY: c.profitYoY || 0
      })),
    turnaround: COMPANY_DATA
      .filter(c => c.yoyCategory === 5)
      .map(c => ({
        code: c.code,
        revenueYoY: c.revenueYoY || 0,
        profitYoY: c.profitYoY || 0
      }))
  }

  return {
    cashAvailable: participant.current_capital,
    portfolioValue: participant.portfolio_value,
    totalPnL: participant.total_profit_loss,
    pnlPct: participant.profit_loss_pct,
    totalTrades: participant.total_trades,
    winningTrades: participant.winning_trades,
    holdings: (holdings || []).map((h: Holding) => ({
      stockCode: h.stock_code,
      quantity: h.quantity,
      avgBuyPrice: h.avg_buy_price,
      currentPrice: h.current_price || h.avg_buy_price,
      unrealizedPnl: h.unrealized_pnl || 0
    })),
    recentTrades: (recentTrades || []).map((t: { stock_code: string; trade_type: 'BUY' | 'SELL'; price: number; executed_at: string }) => ({
      stockCode: t.stock_code,
      tradeType: t.trade_type,
      price: t.price,
      executedAt: t.executed_at
    })),
    stocksByCategory,
    currentRank: participant.rank,
    daysRemaining,
    competitorCount: allParticipants?.length || 7
  }
}

/**
 * Execute trades for a participant based on AI decisions
 */
async function executeTrades(
  supabase: SupabaseClient,
  participantId: string,
  actions: TradeAction[],
  config: ArenaConfig
): Promise<ExecutedTrade[]> {
  const executedTrades: ExecutedTrade[] = []

  for (const action of actions) {
    if (action.action === 'HOLD') continue

    try {
      // Get stock price
      const price = await getStockPrice(supabase, action.stock_code)
      if (!price) {
        console.warn(`No price available for ${action.stock_code}`)
        continue
      }

      // Get current participant state
      const { data: participant } = await supabase
        .from('arena_participants')
        .select('*')
        .eq('id', participantId)
        .single()

      // Get holdings
      const { data: holdings } = await supabase
        .from('arena_holdings')
        .select('*')
        .eq('participant_id', participantId)

      // Validate trade
      const validation = validateTradeAction(
        action,
        participant,
        holdings || [],
        price,
        {
          min_trade_value: config.min_trade_value,
          max_position_pct: config.max_position_pct,
          trading_fee_pct: config.trading_fee_pct
        }
      )

      if (!validation.valid) {
        console.warn(`Trade validation failed: ${validation.error}`)
        continue
      }

      // Calculate trade metrics
      const holding = holdings?.find((h: Holding) => h.stock_code === action.stock_code)
      const metrics = calculateTradeMetrics(
        action.action as 'BUY' | 'SELL',
        action.quantity,
        price,
        config.trading_fee_pct,
        holding?.avg_buy_price
      )

      // Execute trade
      if (action.action === 'BUY') {
        if (holding) {
          // Update existing holding
          const newQty = holding.quantity + action.quantity
          const newAvg = (holding.avg_buy_price * holding.quantity + price * action.quantity) / newQty

          await supabase
            .from('arena_holdings')
            .update({
              quantity: newQty,
              avg_buy_price: newAvg,
              current_price: price,
              market_value: newQty * price
            })
            .eq('id', holding.id)
        } else {
          // Create new holding
          await supabase
            .from('arena_holdings')
            .insert({
              participant_id: participantId,
              stock_code: action.stock_code,
              stock_name: action.stock_name || action.stock_code,
              quantity: action.quantity,
              avg_buy_price: price,
              current_price: price,
              market_value: action.quantity * price
            })
        }

        // Update participant capital
        await supabase
          .from('arena_participants')
          .update({
            current_capital: participant.current_capital - metrics.netValue,
            total_trades: participant.total_trades + 1,
            last_trade_at: new Date().toISOString()
          })
          .eq('id', participantId)

      } else if (action.action === 'SELL') {
        const remaining = holding.quantity - action.quantity

        if (remaining === 0) {
          await supabase.from('arena_holdings').delete().eq('id', holding.id)
        } else {
          await supabase
            .from('arena_holdings')
            .update({
              quantity: remaining,
              market_value: remaining * price
            })
            .eq('id', holding.id)
        }

        const isWin = (metrics.realizedPnl || 0) > 0

        await supabase
          .from('arena_participants')
          .update({
            current_capital: participant.current_capital + metrics.netValue,
            total_trades: participant.total_trades + 1,
            winning_trades: participant.winning_trades + (isWin ? 1 : 0),
            total_profit_loss: participant.total_profit_loss + (metrics.realizedPnl || 0),
            last_trade_at: new Date().toISOString()
          })
          .eq('id', participantId)
      }

      // Record trade
      await supabase
        .from('arena_trades')
        .insert({
          participant_id: participantId,
          stock_code: action.stock_code,
          stock_name: action.stock_name || action.stock_code,
          trade_type: action.action,
          quantity: action.quantity,
          price,
          total_value: metrics.grossValue,
          fees: metrics.fees,
          realized_pnl: metrics.realizedPnl,
          reasoning: action.reasoning
        })

      executedTrades.push({
        stockCode: action.stock_code,
        action: action.action as 'BUY' | 'SELL',
        quantity: action.quantity,
        price,
        totalValue: metrics.grossValue,
        fees: metrics.fees,
        realizedPnl: metrics.realizedPnl,
        reasoning: action.reasoning
      })

    } catch (err) {
      console.error(`Error executing trade for ${action.stock_code}:`, err)
    }
  }

  return executedTrades
}

/**
 * Update portfolio values and rankings for all participants
 */
async function updatePortfoliosAndRankings(supabase: SupabaseClient): Promise<void> {
  // Get all participants
  const { data: participants } = await supabase
    .from('arena_participants')
    .select('id, current_capital, initial_capital')

  if (!participants) return

  // Update each participant's portfolio value
  for (const participant of participants) {
    const { data: holdings } = await supabase
      .from('arena_holdings')
      .select('market_value')
      .eq('participant_id', participant.id)

    const holdingsValue = holdings?.reduce((sum: number, h: { market_value: number }) => sum + (h.market_value || 0), 0) || 0
    const portfolioValue = participant.current_capital + holdingsValue
    const totalPnL = portfolioValue - participant.initial_capital
    const pnlPct = (totalPnL / participant.initial_capital) * 100

    await supabase
      .from('arena_participants')
      .update({
        portfolio_value: portfolioValue,
        total_profit_loss: totalPnL,
        profit_loss_pct: pnlPct
      })
      .eq('id', participant.id)
  }

  // Update rankings
  const { data: sorted } = await supabase
    .from('arena_participants')
    .select('id, portfolio_value')
    .order('portfolio_value', { ascending: false })

  if (sorted) {
    for (let i = 0; i < sorted.length; i++) {
      await supabase
        .from('arena_participants')
        .update({ rank: i + 1 })
        .eq('id', sorted[i].id)
    }
  }
}

/**
 * Main trading session execution
 */
export async function runTradingSession(
  options: TradingSessionConfig = {}
): Promise<TradingSessionReport> {
  const report: TradingSessionReport = {
    timestamp: new Date(),
    marketHours: false,
    competitionActive: false,
    modelsProcessed: 0,
    tradesExecuted: 0,
    totalTokensUsed: 0,
    results: [],
    errors: []
  }

  const supabase = createAdminClient()

  try {
    // Check market hours
    const marketStatus = isMarketOpen()
    report.marketHours = marketStatus.open

    if (!marketStatus.open && !options.dryRun) {
      report.errors.push(marketStatus.reason)
      return report
    }

    // Get competition config
    const { data: config, error: configError } = await supabase
      .from('arena_config')
      .select('*')
      .single()

    if (configError || !config) {
      report.errors.push('Competition config not found')
      return report
    }

    // Check competition dates
    const now = new Date()
    const startDate = new Date(config.start_date)
    const endDate = new Date(config.end_date)

    if (!config.is_active) {
      report.errors.push('Competition is not active')
      return report
    }

    if (now < startDate) {
      report.errors.push(`Competition starts on ${startDate.toISOString()}`)
      return report
    }

    if (now > endDate) {
      report.errors.push(`Competition ended on ${endDate.toISOString()}`)
      return report
    }

    report.competitionActive = true

    // Get active participants
    let participantsQuery = supabase
      .from('arena_participants')
      .select('*')
      .eq('status', 'active')

    if (options.singleModel) {
      participantsQuery = participantsQuery.eq('model_name', options.singleModel)
    }

    const { data: participants } = await participantsQuery

    if (!participants || participants.length === 0) {
      report.errors.push('No active participants found')
      return report
    }

    // Process each participant
    for (const participant of participants) {
      const modelConfig = AI_MODELS.find(m =>
        m.name.toLowerCase() === participant.display_name.toLowerCase() ||
        m.id === participant.model_name
      )

      if (!modelConfig) {
        report.results.push({
          modelId: participant.model_name,
          modelName: participant.display_name,
          success: false,
          tradesExecuted: 0,
          trades: [],
          tokensUsed: 0,
          latencyMs: 0,
          error: 'Model configuration not found'
        })
        continue
      }

      const provider = getProvider(modelConfig.id)

      if (!provider.isAvailable()) {
        report.results.push({
          modelId: modelConfig.id,
          modelName: modelConfig.name,
          success: false,
          tradesExecuted: 0,
          trades: [],
          tokensUsed: 0,
          latencyMs: 0,
          error: `API key not configured: ${modelConfig.apiKeyEnvVar}`
        })
        continue
      }

      try {
        // Build context
        const context = await buildContext(supabase, participant, config)
        const userPrompt = buildTradingPrompt(context)

        // Call AI
        const response = await provider.chat(TRADING_SYSTEM_PROMPT, userPrompt)

        if (!response.success) {
          report.results.push({
            modelId: modelConfig.id,
            modelName: modelConfig.name,
            success: false,
            tradesExecuted: 0,
            trades: [],
            tokensUsed: response.tokensUsed,
            latencyMs: response.latencyMs,
            error: response.error
          })
          continue
        }

        // Parse response
        const analysis = parseAIResponse(response.content)

        if (!analysis) {
          report.results.push({
            modelId: modelConfig.id,
            modelName: modelConfig.name,
            success: false,
            tradesExecuted: 0,
            trades: [],
            tokensUsed: response.tokensUsed,
            latencyMs: response.latencyMs,
            error: 'Failed to parse AI response'
          })
          continue
        }

        // Log AI decision
        await supabase
          .from('arena_ai_decisions')
          .insert({
            participant_id: participant.id,
            decision_type: analysis.recommended_actions.length > 0 ? 'TRADE' : 'HOLD',
            stocks_analyzed: analysis.top_picks,
            market_sentiment: analysis.sentiment,
            decision_summary: analysis.market_summary,
            raw_response: response.content,
            tokens_used: response.tokensUsed
          })

        // Execute trades (unless dry run)
        let executedTrades: ExecutedTrade[] = []
        if (!options.dryRun) {
          executedTrades = await executeTrades(
            supabase,
            participant.id,
            analysis.recommended_actions,
            config
          )
        }

        report.results.push({
          modelId: modelConfig.id,
          modelName: modelConfig.name,
          success: true,
          sentiment: analysis.sentiment,
          tradesExecuted: executedTrades.length,
          trades: executedTrades,
          tokensUsed: response.tokensUsed,
          latencyMs: response.latencyMs
        })

        report.modelsProcessed++
        report.tradesExecuted += executedTrades.length
        report.totalTokensUsed += response.tokensUsed

      } catch (err) {
        report.results.push({
          modelId: modelConfig.id,
          modelName: modelConfig.name,
          success: false,
          tradesExecuted: 0,
          trades: [],
          tokensUsed: 0,
          latencyMs: 0,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Update portfolios and rankings
    if (!options.dryRun && report.tradesExecuted > 0) {
      await updatePortfoliosAndRankings(supabase)
    }

  } catch (err) {
    report.errors.push(err instanceof Error ? err.message : 'Unknown error')
  }

  return report
}

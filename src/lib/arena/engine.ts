/**
 * Mad2Arena - Trading Engine
 * Core engine that orchestrates AI trading sessions
 *
 * Now with COMPREHENSIVE market data pipeline:
 * - Real-time stock prices and volume
 * - Market sentiment and order flow
 * - News and fundamentals
 * - Mode-specific prompts
 */

import { createAdminClient } from '@/lib/supabase/server'
import { COMPANY_DATA } from '@/lib/company-data'
import { AI_MODELS, type AIParticipant, type TradeAction, type Holding, type ArenaConfig, type CompetitionModeCode, COMPETITION_MODES } from './types'
import { getProvider } from './ai/router'
import { buildSystemPrompt, buildTradingPrompt, type TradingPromptContext } from './prompts/trading'
import { parseAIResponse, validateTradeAction, calculateTradeMetrics } from './ai-trader'
import { buildComprehensiveMarketData, type ComprehensiveMarketData } from './market-data'

// Mode-specific rules for validation and enforcement
const MODE_RULES: Record<CompetitionModeCode, {
  maxPositionPct: number
  leverageRequired?: boolean
  maxLeverage?: number
  minLeverage?: number
  newsAccess: boolean
  memoryEnabled: boolean
  canSeeCompetitors?: boolean
  maxDailyLossPct?: number
  mandatoryStopLoss?: boolean
}> = {
  'NEW_BASELINE': {
    maxPositionPct: 30,
    newsAccess: true,
    memoryEnabled: true
  },
  'MONK_MODE': {
    maxPositionPct: 15,
    maxDailyLossPct: 2,
    mandatoryStopLoss: true,
    newsAccess: true,
    memoryEnabled: true
  },
  'SITUATIONAL_AWARENESS': {
    maxPositionPct: 30,
    canSeeCompetitors: true,
    newsAccess: true,
    memoryEnabled: true
  },
  'MAX_LEVERAGE': {
    maxPositionPct: 30,
    leverageRequired: true,
    minLeverage: 2.5,
    maxLeverage: 3,
    newsAccess: true,
    memoryEnabled: true
  }
}

// Supabase client type - using ReturnType for proper inference
type SupabaseClient = ReturnType<typeof createAdminClient>

export interface TradingSessionConfig {
  dryRun?: boolean // If true, don't execute trades, just log decisions
  singleModel?: string // If set, only run for this model
  singleParticipant?: string // If set, only run for this participant ID
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
  modeCode: CompetitionModeCode
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
  leverage?: number
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('stock_prices')
    .select('price')
    .eq('stock_code', stockCode)
    .single()

  if (data?.price) {
    return data.price
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
 * Build comprehensive trading context for an AI participant
 */
async function buildContext(
  supabase: SupabaseClient,
  participant: AIParticipant,
  config: ArenaConfig,
  marketData: ComprehensiveMarketData
): Promise<TradingPromptContext> {
  // Get mode code - default to NEW_BASELINE if not set
  const modeCode: CompetitionModeCode = (participant.mode_code as CompetitionModeCode) || 'NEW_BASELINE'
  const modeRules = MODE_RULES[modeCode]

  // Get holdings with full details
  const { data: holdingsData } = await supabase
    .from('arena_holdings')
    .select('*')
    .eq('participant_id', participant.id)

  // Get recent trades with reasoning
  const { data: recentTradesData } = await supabase
    .from('arena_trades')
    .select('stock_code, stock_name, trade_type, price, quantity, realized_pnl, reasoning, executed_at')
    .eq('participant_id', participant.id)
    .order('executed_at', { ascending: false })
    .limit(10)

  // Get all participants for ranking context (same mode only)
  const { data: allParticipants } = await supabase
    .from('arena_participants')
    .select('id')
    .eq('status', 'active')
    .eq('mode_code', modeCode)

  // Calculate days
  const endDate = new Date(config.end_date)
  const startDate = new Date(config.start_date)
  const now = new Date()
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Build holdings with calculated fields
  const holdings = (holdingsData || []).map((h: Holding) => {
    const currentPrice = h.current_price || h.avg_buy_price
    const unrealizedPnl = (currentPrice - h.avg_buy_price) * h.quantity
    const unrealizedPnlPct = h.avg_buy_price > 0 ? ((currentPrice - h.avg_buy_price) / h.avg_buy_price) * 100 : 0
    const positionValue = h.quantity * currentPrice
    const positionPct = participant.portfolio_value > 0 ? (positionValue / participant.portfolio_value) * 100 : 0

    return {
      stockCode: h.stock_code,
      stockName: h.stock_name || h.stock_code,
      quantity: h.quantity,
      avgBuyPrice: h.avg_buy_price,
      currentPrice,
      unrealizedPnl,
      unrealizedPnlPct,
      positionPct,
      leverage: h.leverage,
      entryTime: h.entry_time
    }
  })

  // Get competitor positions for SITUATIONAL_AWARENESS mode
  let competitorPositions: TradingPromptContext['competitorPositions'] = undefined
  if (modeCode === 'SITUATIONAL_AWARENESS') {
    const { data: competitors } = await supabase
      .from('arena_participants')
      .select('id, model_name, display_name, rank, portfolio_value, current_capital, profit_loss_pct')
      .eq('status', 'active')
      .eq('mode_code', 'SITUATIONAL_AWARENESS')
      .neq('id', participant.id)
      .order('rank', { ascending: true })
      .limit(6)

    if (competitors) {
      competitorPositions = await Promise.all(
        competitors.map(async (c: {
          id: string
          model_name: string
          display_name: string
          rank: number
          portfolio_value: number
          current_capital: number
          profit_loss_pct: number
        }) => {
          const { data: compHoldings } = await supabase
            .from('arena_holdings')
            .select('stock_code, market_value, quantity, avg_buy_price, current_price')
            .eq('participant_id', c.id)
            .order('market_value', { ascending: false })
            .limit(3)

          const cashPct = c.portfolio_value > 0 ? (c.current_capital / c.portfolio_value) * 100 : 100

          return {
            displayName: c.display_name,
            modelName: c.model_name,
            rank: c.rank,
            portfolioValue: c.portfolio_value,
            pnlPct: c.profit_loss_pct,
            cashPct,
            topHoldings: (compHoldings || []).map((h: {
              stock_code: string
              market_value: number
              avg_buy_price: number
              current_price: number
            }) => {
              const unrealizedPnlPct = h.avg_buy_price > 0
                ? ((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100
                : 0
              return {
                stockCode: h.stock_code,
                pctOfPortfolio: c.portfolio_value > 0 ? (h.market_value / c.portfolio_value) * 100 : 0,
                unrealizedPnlPct
              }
            })
          }
        })
      )
    }
  }

  // Calculate daily loss for MONK_MODE
  let dailyLoss = 0
  let dailyLossPct = 0
  let dailyTradeCount = 0
  if (modeCode === 'MONK_MODE') {
    // Get today's date at midnight MYT
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's trades for this participant
    const { data: todayTrades } = await supabase
      .from('arena_trades')
      .select('realized_pnl')
      .eq('participant_id', participant.id)
      .gte('executed_at', today.toISOString())

    // Sum up realized P&L for today
    dailyTradeCount = (todayTrades || []).length
    dailyLoss = (todayTrades || []).reduce((sum: number, t: { realized_pnl: number | null }) =>
      sum + (t.realized_pnl || 0), 0)

    // Calculate as percentage of initial capital
    if (participant.initial_capital > 0) {
      dailyLossPct = dailyLoss < 0 ? Math.abs(dailyLoss) / participant.initial_capital * 100 : 0
    }
  }

  return {
    // Identity
    modelName: participant.model_name,
    participantId: participant.id,

    // Portfolio state
    cashAvailable: participant.current_capital,
    portfolioValue: participant.portfolio_value,
    totalPnL: participant.total_profit_loss,
    pnlPct: participant.profit_loss_pct,
    totalTrades: participant.total_trades,
    winningTrades: participant.winning_trades,
    initialCapital: participant.initial_capital,

    // Holdings and trades
    holdings,
    recentTrades: (recentTradesData || []).map((t: {
      stock_code: string
      trade_type: 'BUY' | 'SELL'
      price: number
      quantity: number
      realized_pnl: number | null
      reasoning: string
      executed_at: string
    }) => ({
      stockCode: t.stock_code,
      tradeType: t.trade_type,
      price: t.price,
      quantity: t.quantity,
      pnl: t.realized_pnl,
      executedAt: t.executed_at,
      reasoning: t.reasoning || ''
    })),

    // COMPREHENSIVE MARKET DATA
    marketData,

    // Competition context
    currentRank: participant.rank,
    daysRemaining,
    daysElapsed,
    competitorCount: allParticipants?.length || 7,

    // Mode-specific context
    modeCode,
    modeRules,
    competitorPositions,

    // Monk mode tracking
    dailyLoss: modeCode === 'MONK_MODE' ? dailyLoss : undefined,
    dailyLossPct: modeCode === 'MONK_MODE' ? dailyLossPct : undefined,
    dailyTradeCount: modeCode === 'MONK_MODE' ? dailyTradeCount : undefined
  }
}

/**
 * Execute trades for a participant based on AI decisions
 */
async function executeTrades(
  supabase: SupabaseClient,
  participantId: string,
  actions: TradeAction[],
  config: ArenaConfig,
  modeCode: CompetitionModeCode
): Promise<ExecutedTrade[]> {
  const executedTrades: ExecutedTrade[] = []
  const modeRules = MODE_RULES[modeCode]

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: participant } = await (supabase as any)
        .from('arena_participants')
        .select('*')
        .eq('id', participantId)
        .single()

      if (!participant) {
        console.error(`Participant ${participantId} not found`)
        continue
      }

      // Get holdings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: holdings } = await (supabase as any)
        .from('arena_holdings')
        .select('*')
        .eq('participant_id', participantId)

      // Mode-specific validation: MONK_MODE daily loss check
      if (modeCode === 'MONK_MODE' && modeRules.maxDailyLossPct) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: todayTrades } = await supabase
          .from('arena_trades')
          .select('realized_pnl')
          .eq('participant_id', participantId)
          .gte('executed_at', today.toISOString())

        const dailyLoss = (todayTrades || []).reduce((sum: number, t: { realized_pnl: number | null }) =>
          sum + (t.realized_pnl || 0), 0)
        const dailyLossPct = participant.initial_capital > 0
          ? (Math.abs(Math.min(0, dailyLoss)) / participant.initial_capital) * 100
          : 0

        if (dailyLossPct >= modeRules.maxDailyLossPct) {
          console.warn(`MONK_MODE: Daily loss limit reached (${dailyLossPct.toFixed(2)}% >= ${modeRules.maxDailyLossPct}%), skipping trade`)
          continue
        }
      }

      // Mode-specific validation: MONK_MODE mandatory stop-loss
      if (modeCode === 'MONK_MODE' && modeRules.mandatoryStopLoss) {
        if (action.action === 'BUY' && !action.stop_loss) {
          console.warn(`MONK_MODE: Trade rejected - stop_loss is mandatory`)
          continue
        }
      }

      // Mode-specific validation: MAX_LEVERAGE leverage requirement
      let tradeLeverage = 1
      if (modeCode === 'MAX_LEVERAGE') {
        if (modeRules.leverageRequired) {
          tradeLeverage = action.leverage || 2.5 // Default to 2.5x if not specified
          const minLev = modeRules.minLeverage || 2.5
          const maxLev = modeRules.maxLeverage || 3
          if (tradeLeverage < minLev || tradeLeverage > maxLev) {
            console.warn(`MAX_LEVERAGE: Adjusting leverage from ${tradeLeverage} to ${minLev}x (must be ${minLev}-${maxLev}x)`)
            tradeLeverage = minLev
          }
        }
      }

      // Validate trade with mode-specific max position
      const validation = validateTradeAction(
        action,
        participant,
        holdings || [],
        price,
        {
          min_trade_value: config.min_trade_value,
          max_position_pct: modeRules.maxPositionPct, // Use mode-specific max position
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      // Calculate notional value for leveraged trades
      const notionalValue = action.quantity * price * tradeLeverage
      const margin = action.quantity * price // Actual capital used

      if (action.action === 'BUY') {
        if (holding) {
          // Update existing holding
          const newQty = holding.quantity + action.quantity
          const newAvg = (holding.avg_buy_price * holding.quantity + price * action.quantity) / newQty

          await db
            .from('arena_holdings')
            .update({
              quantity: newQty,
              avg_buy_price: newAvg,
              current_price: price,
              market_value: newQty * price,
              leverage: tradeLeverage > 1 ? tradeLeverage : (holding.leverage || null),
              notional_value: tradeLeverage > 1 ? newQty * price * tradeLeverage : null,
              margin: tradeLeverage > 1 ? newQty * price : null
            })
            .eq('id', holding.id)
        } else {
          // Create new holding
          await db
            .from('arena_holdings')
            .insert({
              participant_id: participantId,
              stock_code: action.stock_code,
              stock_name: action.stock_name || action.stock_code,
              quantity: action.quantity,
              avg_buy_price: price,
              current_price: price,
              market_value: action.quantity * price,
              mode_code: modeCode,
              leverage: tradeLeverage > 1 ? tradeLeverage : null,
              notional_value: tradeLeverage > 1 ? notionalValue : null,
              margin: tradeLeverage > 1 ? margin : null,
              entry_time: new Date().toISOString()
            })
        }

        // Update participant capital
        await db
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
          await db.from('arena_holdings').delete().eq('id', holding.id)
        } else {
          await db
            .from('arena_holdings')
            .update({
              quantity: remaining,
              market_value: remaining * price,
              notional_value: holding.leverage ? remaining * price * holding.leverage : null,
              margin: holding.leverage ? remaining * price : null
            })
            .eq('id', holding.id)
        }

        // Calculate P&L with leverage consideration
        let realizedPnl = metrics.realizedPnl || 0
        if (holding.leverage && holding.leverage > 1) {
          // Leverage amplifies P&L
          realizedPnl = realizedPnl * holding.leverage
        }
        const isWin = realizedPnl > 0

        await db
          .from('arena_participants')
          .update({
            current_capital: participant.current_capital + metrics.netValue + (realizedPnl - (metrics.realizedPnl || 0)),
            total_trades: participant.total_trades + 1,
            winning_trades: participant.winning_trades + (isWin ? 1 : 0),
            total_profit_loss: participant.total_profit_loss + realizedPnl,
            last_trade_at: new Date().toISOString()
          })
          .eq('id', participantId)
      }

      // Record trade with mode info
      await db
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
          reasoning: action.reasoning,
          mode_code: modeCode,
          leverage: tradeLeverage > 1 ? tradeLeverage : null
        })

      executedTrades.push({
        stockCode: action.stock_code,
        action: action.action as 'BUY' | 'SELL',
        quantity: action.quantity,
        price,
        totalValue: metrics.grossValue,
        fees: metrics.fees,
        realizedPnl: metrics.realizedPnl,
        reasoning: action.reasoning,
        leverage: tradeLeverage > 1 ? tradeLeverage : undefined
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Get all participants
  const { data: participants } = await db
    .from('arena_participants')
    .select('id, current_capital, initial_capital')

  if (!participants) return

  // Update each participant's portfolio value
  for (const participant of participants) {
    const { data: holdings } = await db
      .from('arena_holdings')
      .select('market_value')
      .eq('participant_id', participant.id)

    const holdingsValue = holdings?.reduce((sum: number, h: { market_value: number }) => sum + (h.market_value || 0), 0) || 0
    const portfolioValue = participant.current_capital + holdingsValue
    const totalPnL = portfolioValue - participant.initial_capital
    const pnlPct = (totalPnL / participant.initial_capital) * 100

    await db
      .from('arena_participants')
      .update({
        portfolio_value: portfolioValue,
        total_profit_loss: totalPnL,
        profit_loss_pct: pnlPct
      })
      .eq('id', participant.id)
  }

  // Update rankings by mode
  const modes: CompetitionModeCode[] = ['NEW_BASELINE', 'MONK_MODE', 'SITUATIONAL_AWARENESS', 'MAX_LEVERAGE']

  for (const mode of modes) {
    const { data: sorted } = await db
      .from('arena_participants')
      .select('id, portfolio_value')
      .eq('mode_code', mode)
      .order('portfolio_value', { ascending: false })

    if (sorted) {
      for (let i = 0; i < sorted.length; i++) {
        await db
          .from('arena_participants')
          .update({ rank: i + 1 })
          .eq('id', sorted[i].id)
      }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  try {
    // Check market hours
    const marketStatus = isMarketOpen()
    report.marketHours = marketStatus.open

    if (!marketStatus.open && !options.dryRun) {
      report.errors.push(marketStatus.reason)
      return report
    }

    // Get competition config
    const { data: config, error: configError } = await db
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

    // =========================================================================
    // FETCH COMPREHENSIVE MARKET DATA ONCE FOR ALL PARTICIPANTS
    // =========================================================================
    console.log('📊 Fetching comprehensive market data...')
    const marketData = await buildComprehensiveMarketData()
    console.log(`✅ Market data fetched: ${marketData.topGainers.length} gainers, ${marketData.topLosers.length} losers, ${marketData.latestNews.length} news items`)

    // Get active participants
    let participantsQuery = db
      .from('arena_participants')
      .select('*')
      .eq('status', 'active')

    if (options.singleModel) {
      participantsQuery = participantsQuery.eq('model_name', options.singleModel)
    }

    if (options.singleParticipant) {
      participantsQuery = participantsQuery.eq('id', options.singleParticipant)
    }

    const { data: participants } = await participantsQuery

    if (!participants || participants.length === 0) {
      report.errors.push('No active participants found')
      return report
    }

    console.log(`🤖 Processing ${participants.length} participants...`)

    // Process each participant
    for (const participant of participants) {
      const modeCode = (participant.mode_code as CompetitionModeCode) || 'NEW_BASELINE'
      const modelConfig = AI_MODELS.find(m =>
        m.name.toLowerCase() === participant.display_name.split(' ')[0].toLowerCase() ||
        m.id === participant.model_name
      )

      if (!modelConfig) {
        report.results.push({
          modelId: participant.model_name,
          modelName: participant.display_name,
          modeCode,
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
          modeCode,
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
        console.log(`  🔄 Processing: ${participant.display_name} (${modeCode})`)

        // Build context with COMPREHENSIVE market data
        const context = await buildContext(db, participant, config, marketData)

        // Build mode-specific prompts
        const systemPrompt = buildSystemPrompt(modeCode)
        const userPrompt = buildTradingPrompt(context)

        // Call AI with mode-aware prompt
        const response = await provider.chat(systemPrompt, userPrompt)

        if (!response.success) {
          report.results.push({
            modelId: modelConfig.id,
            modelName: modelConfig.name,
            modeCode,
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
            modeCode,
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
        await db
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

        // Execute trades (unless dry run) with mode-specific rules
        let executedTrades: ExecutedTrade[] = []
        if (!options.dryRun) {
          executedTrades = await executeTrades(
            db,
            participant.id,
            analysis.recommended_actions,
            config,
            modeCode
          )
        }

        console.log(`  ✅ ${participant.display_name}: ${executedTrades.length} trades executed`)

        report.results.push({
          modelId: modelConfig.id,
          modelName: modelConfig.name,
          modeCode,
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
        console.error(`  ❌ Error processing ${participant.display_name}:`, err)
        report.results.push({
          modelId: modelConfig.id,
          modelName: modelConfig.name,
          modeCode,
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
      console.log('📈 Updating portfolios and rankings...')
      await updatePortfoliosAndRankings(db)
    }

    console.log(`\n✅ Trading session complete: ${report.modelsProcessed} participants, ${report.tradesExecuted} trades`)

  } catch (err) {
    report.errors.push(err instanceof Error ? err.message : 'Unknown error')
  }

  return report
}

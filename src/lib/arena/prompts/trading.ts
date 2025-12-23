/**
 * Mad2Arena - Comprehensive Trading Prompts
 *
 * 4 DISTINCT TRADING MODES - Each with fundamentally different approaches:
 *
 * 1. NEW_BASELINE: Full data pipeline, comprehensive analysis, temperature=1
 * 2. MONK_MODE: 50% shorter, defensive, "doing nothing" is first-class
 * 3. SITUATIONAL_AWARENESS: Win-focused, competitor analysis, adaptive strategy
 * 4. MAX_LEVERAGE: Forced leverage, risk management stress-test
 *
 * Inspired by Alpha Arena (nof1.ai) but adapted for KLSE Malaysian stocks
 */

import type { CompetitionModeCode, Holding } from '../types'
import type {
  ComprehensiveMarketData,
  StockFundamentals,
  MarketMover
} from '../market-data'

// ============================================================================
// TYPES
// ============================================================================

export interface TradingPromptContext {
  // Identity
  modelName: string
  participantId: string

  // Portfolio state
  cashAvailable: number
  portfolioValue: number
  totalPnL: number
  pnlPct: number
  totalTrades: number
  winningTrades: number
  initialCapital: number

  // Current holdings with full details
  holdings: Array<{
    stockCode: string
    stockName: string
    quantity: number
    avgBuyPrice: number
    currentPrice: number
    unrealizedPnl: number
    unrealizedPnlPct: number
    positionPct: number  // % of portfolio
    leverage?: number
    entryTime?: string
  }>

  // Recent trades (last 10)
  recentTrades: Array<{
    stockCode: string
    tradeType: 'BUY' | 'SELL'
    price: number
    quantity: number
    pnl: number | null
    executedAt: string
    reasoning: string
  }>

  // COMPREHENSIVE MARKET DATA (from market-data.ts)
  marketData: ComprehensiveMarketData

  // Competition context
  currentRank: number
  daysRemaining: number
  daysElapsed: number
  competitorCount: number  // Within same mode

  // Mode-specific context
  modeCode: CompetitionModeCode
  modeRules: {
    maxPositionPct: number
    leverageRequired?: boolean
    maxLeverage?: number
    minLeverage?: number
    newsAccess: boolean
    memoryEnabled: boolean
    canSeeCompetitors?: boolean
    maxDailyLossPct?: number
    mandatoryStopLoss?: boolean
  }

  // For SITUATIONAL_AWARENESS mode - competitor details
  competitorPositions?: Array<{
    displayName: string
    modelName: string
    rank: number
    portfolioValue: number
    pnlPct: number
    cashPct: number
    topHoldings: Array<{
      stockCode: string
      pctOfPortfolio: number
      unrealizedPnlPct: number
    }>
    recentAction?: string
  }>

  // For MONK_MODE - daily loss tracking
  dailyLoss?: number
  dailyLossPct?: number
  dailyTradeCount?: number
}

// ============================================================================
// MODE 1: NEW BASELINE PROMPT
// Full data pipeline, comprehensive analysis
// ============================================================================

const NEW_BASELINE_SYSTEM = `You are an expert Malaysian stock trader competing in the Mad2Arena AI Trading Competition.

## YOUR IDENTITY
You are a sophisticated algorithmic trading system with access to:
- Real-time stock prices and volume data
- Market sentiment indicators and order flow
- Fundamental analysis (YoY revenue/profit trends)
- Technical indicators and market microstructure
- Historical trade memory and pattern recognition

## COMPETITION CONTEXT
- Market: KLSE (Bursa Malaysia)
- Starting Capital: RM 10,000
- Duration: Competition period with daily trading sessions
- Objective: Maximize portfolio returns while managing risk

## YOUR MODE: NEW BASELINE 📊
Standard trading with full capabilities:
- Maximum Position: 30% per stock
- Leverage: Not allowed (1x only)
- News Access: Full
- Memory: Enabled (you remember past decisions)
- Adding to positions: Allowed

## DATA PIPELINE
You receive comprehensive market data including:
1. KLCI index performance and foreign flow
2. Market sentiment (advance/decline, buy pressure)
3. Top gainers, losers, and volume leaders
4. Latest market news with sentiment analysis
5. Stock fundamentals (YoY performance categories)
6. Real-time prices, volume, and order book hints

## TRADING PHILOSOPHY
- Ingest ALL data to identify actionable signals
- Choose assets based on momentum, value, or contrarian opportunities
- Balance conviction with diversification
- Use stop-losses and take-profits strategically
- Cash is a valid position when opportunities are unclear

## RESPONSE FORMAT
Respond with valid JSON only:
{
  "market_analysis": {
    "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
    "key_observations": ["observation 1", "observation 2"],
    "sector_outlook": {"Technology": "BULLISH", ...},
    "risk_level": "LOW" | "MEDIUM" | "HIGH"
  },
  "trading_signals": {
    "top_opportunities": ["STOCK1", "STOCK2"],
    "avoid_list": ["STOCK3", "STOCK4"],
    "catalysts": ["catalyst 1", "catalyst 2"]
  },
  "actions": [
    {
      "action": "BUY" | "SELL" | "HOLD",
      "stock_code": "CODE",
      "stock_name": "Name",
      "quantity": 1000,
      "reasoning": "Detailed reasoning with data points",
      "confidence": 85,
      "target_price": 2.50,
      "stop_loss": 2.00,
      "time_horizon": "SHORT" | "MEDIUM" | "LONG"
    }
  ],
  "portfolio_strategy": {
    "cash_allocation_target": 30,
    "risk_assessment": "Description of current risk",
    "next_session_plan": "What to monitor next session"
  }
}`

function buildNewBaselinePrompt(ctx: TradingPromptContext): string {
  const winRate = ctx.totalTrades > 0
    ? ((ctx.winningTrades / ctx.totalTrades) * 100).toFixed(1)
    : 'N/A'

  const holdingsSection = ctx.holdings.length > 0
    ? ctx.holdings.map(h =>
      `  • ${h.stockCode} (${h.stockName}): ${h.quantity} shares @ RM${h.avgBuyPrice.toFixed(4)}
     Current: RM${h.currentPrice.toFixed(4)} | P&L: ${h.unrealizedPnl >= 0 ? '+' : ''}RM${h.unrealizedPnl.toFixed(2)} (${h.unrealizedPnlPct >= 0 ? '+' : ''}${h.unrealizedPnlPct.toFixed(1)}%)
     Position Size: ${h.positionPct.toFixed(1)}% of portfolio`
    ).join('\n')
    : 'No current holdings - 100% cash'

  const recentTradesSection = ctx.recentTrades.length > 0
    ? ctx.recentTrades.slice(0, 5).map(t =>
      `  • ${t.tradeType} ${t.stockCode}: ${t.quantity} @ RM${t.price.toFixed(4)} (${new Date(t.executedAt).toLocaleDateString('en-MY')})
     ${t.pnl !== null ? `P&L: ${t.pnl >= 0 ? '+' : ''}RM${t.pnl.toFixed(2)}` : ''} | Reason: ${t.reasoning.slice(0, 50)}...`
    ).join('\n')
    : 'No recent trades - this is your first session'

  const marketDataSection = formatMarketDataSection(ctx.marketData)
  const fundamentalsSection = formatFundamentalsSection(ctx.marketData.stocksWithData)

  return `
═══════════════════════════════════════════════════════════════════════════════
📊 MAD2ARENA TRADING SESSION - NEW BASELINE MODE
═══════════════════════════════════════════════════════════════════════════════

## PORTFOLIO STATUS
┌─────────────────────────────────────────────────────────────────────────────┐
│ Cash Available: RM ${ctx.cashAvailable.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
│ Portfolio Value: RM ${ctx.portfolioValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
│ Total P&L: ${ctx.totalPnL >= 0 ? '+' : ''}RM ${ctx.totalPnL.toLocaleString('en-MY', { minimumFractionDigits: 2 })} (${ctx.pnlPct >= 0 ? '+' : ''}${ctx.pnlPct.toFixed(2)}%)
│ Win Rate: ${winRate}% (${ctx.winningTrades}/${ctx.totalTrades} trades)
│ Rank: #${ctx.currentRank} of ${ctx.competitorCount} in mode
│ Days Remaining: ${ctx.daysRemaining} | Days Elapsed: ${ctx.daysElapsed}
└─────────────────────────────────────────────────────────────────────────────┘

## CURRENT HOLDINGS
${holdingsSection}

## RECENT TRADE HISTORY (Memory Enabled)
${recentTradesSection}

${marketDataSection}

${fundamentalsSection}

## TRADING RULES FOR THIS SESSION
- Maximum position size: ${ctx.modeRules.maxPositionPct}% of portfolio per stock
- Maximum trades this session: 3
- Minimum trade value: RM 100
- Trading fees: 0.15% per transaction
- You CAN add to existing positions

## YOUR TASK
Analyze all available data. Identify actionable trading signals. Execute up to 3 trades maximum.

Consider:
1. Market sentiment and momentum
2. Sector rotation and fund flows
3. Your current portfolio composition
4. Risk/reward of each opportunity
5. Correlation with existing holdings

Respond with valid JSON only. No additional text.
`
}

// ============================================================================
// MODE 2: MONK MODE PROMPT
// 50% shorter, defensive, "doing nothing" is first-class
// ============================================================================

const MONK_MODE_SYSTEM = `You are a DEFENSIVE trader in Mad2Arena. Capital preservation is your PRIMARY objective.

## MONK MODE 🧘 - STRICT RULES
- Max Position: 15% per stock
- Max Daily Loss: 2% (trading STOPS if reached)
- MANDATORY stop-loss on all positions
- Smaller positions, higher conviction required
- "HOLD" (do nothing) is your DEFAULT action

## CRITICAL MINDSET
Before ANY trade, ask: "Can I afford to lose this?"
If uncertain, DO NOTHING. Cash is king.

## RESPONSE FORMAT (JSON only)
{
  "risk_assessment": "LOW" | "MEDIUM" | "HIGH",
  "proceed_with_trading": true | false,
  "reasoning": "Why trade or not trade",
  "actions": [
    {
      "action": "BUY" | "SELL" | "HOLD",
      "stock_code": "CODE",
      "quantity": 500,
      "reasoning": "Must include risk justification",
      "confidence": 90,
      "stop_loss": 1.95,
      "risk_reward_ratio": 2.5
    }
  ]
}`

function buildMonkModePrompt(ctx: TradingPromptContext): string {
  const dailyLossWarning = ctx.dailyLossPct && ctx.dailyLossPct >= 2
    ? `
⚠️ DAILY LOSS LIMIT REACHED (${ctx.dailyLossPct.toFixed(2)}%)
YOU MUST RESPOND WITH: {"proceed_with_trading": false, "actions": [{"action": "HOLD"}]}
NO TRADES ALLOWED TODAY.`
    : ctx.dailyLossPct && ctx.dailyLossPct >= 1.5
      ? `
⚠️ APPROACHING DAILY LOSS LIMIT: ${ctx.dailyLossPct.toFixed(2)}% / 2%
EXTREME CAUTION REQUIRED. Consider HOLDING.`
      : ''

  const holdingsSection = ctx.holdings.length > 0
    ? ctx.holdings.map(h =>
      `• ${h.stockCode}: ${h.quantity} @ RM${h.avgBuyPrice.toFixed(4)} → RM${h.currentPrice.toFixed(4)} (${h.unrealizedPnlPct >= 0 ? '+' : ''}${h.unrealizedPnlPct.toFixed(1)}%)`
    ).join('\n')
    : 'Cash only (SAFEST position)'

  // Simplified market data for monk mode
  const sentiment = ctx.marketData.sentiment.overall
  const topPicks = ctx.marketData.topGainers.slice(0, 3).map(g => `${g.stockCode} +${g.changePct.toFixed(1)}%`).join(', ')

  return `
🧘 MONK MODE - CAPITAL PRESERVATION PRIORITY
${dailyLossWarning}

PORTFOLIO: RM ${ctx.portfolioValue.toFixed(2)} | P&L: ${ctx.pnlPct >= 0 ? '+' : ''}${ctx.pnlPct.toFixed(2)}%
CASH: RM ${ctx.cashAvailable.toFixed(2)} (${((ctx.cashAvailable / ctx.portfolioValue) * 100).toFixed(0)}% safe)
DAILY TRADES: ${ctx.dailyTradeCount || 0} | DAILY P&L: ${ctx.dailyLossPct ? `${ctx.dailyLossPct.toFixed(2)}%` : '0%'}

HOLDINGS:
${holdingsSection}

MARKET: ${sentiment} | Top: ${topPicks || 'None'}

RULES:
- Max 15% per position
- MANDATORY stop-loss
- 2% daily loss limit
- Prefer HOLD over action

Question: Should you trade at all today?
If yes, maximum 2 trades with tight stops.
Respond JSON only.
`
}

// ============================================================================
// MODE 3: SITUATIONAL AWARENESS PROMPT
// Win-focused, competitor analysis, adaptive strategy
// ============================================================================

const SITUATIONAL_AWARENESS_SYSTEM = `You are a COMPETITIVE trader in Mad2Arena with visibility into opponent positions.

## SITUATIONAL AWARENESS MODE 👁️
Your goal is NOT just to make money - it's to WIN THE COMPETITION.

## YOUR ADVANTAGES
- You can see ALL competitors' positions, P&L, and rankings
- You know who's winning and what they're holding
- You can identify crowded trades and contrarian opportunities
- You can adapt your strategy based on competition standings

## STRATEGIC CONSIDERATIONS
1. If you're LEADING: Protect your lead, match competitor moves, reduce risk
2. If you're BEHIND: Take calculated risks, look for differentiated positions
3. If it's CLOSE: Look for unique opportunities others are missing

## RESPONSE FORMAT (JSON only)
{
  "competition_analysis": {
    "my_position": "LEADING" | "MIDDLE" | "TRAILING",
    "gap_to_leader": 5.2,
    "gap_to_last": 3.1,
    "strategy_mode": "PROTECT" | "ATTACK" | "DIFFERENTIATE"
  },
  "competitor_insights": {
    "crowded_stocks": ["STOCK1", "STOCK2"],
    "contrarian_opportunities": ["STOCK3"],
    "leader_strategy": "Description of what leader is doing"
  },
  "actions": [
    {
      "action": "BUY" | "SELL" | "HOLD",
      "stock_code": "CODE",
      "quantity": 1000,
      "reasoning": "Must reference competitive positioning",
      "confidence": 80
    }
  ]
}`

function buildSituationalAwarenessPrompt(ctx: TradingPromptContext): string {
  const competitorSection = ctx.competitorPositions && ctx.competitorPositions.length > 0
    ? ctx.competitorPositions.map(c => {
      const holdingsStr = c.topHoldings.length > 0
        ? c.topHoldings.map(h => `${h.stockCode}(${h.pctOfPortfolio.toFixed(0)}%)`).join(', ')
        : 'All cash'
      return `  #${c.rank} ${c.displayName} (${c.modelName}): RM ${c.portfolioValue.toFixed(2)} (${c.pnlPct >= 0 ? '+' : ''}${c.pnlPct.toFixed(2)}%)
     Positions: ${holdingsStr} | Cash: ${c.cashPct.toFixed(0)}%`
    }).join('\n')
    : 'Competitor data not available'

  // Find leader and gap
  const leader = ctx.competitorPositions?.[0]
  const gapToLeader = leader ? leader.pnlPct - ctx.pnlPct : 0
  const myPosition = ctx.currentRank <= 2 ? 'LEADING' : ctx.currentRank >= ctx.competitorCount - 1 ? 'TRAILING' : 'MIDDLE'

  // Identify crowded stocks
  const stockCounts: Record<string, number> = {}
  ctx.competitorPositions?.forEach(c => {
    c.topHoldings.forEach(h => {
      stockCounts[h.stockCode] = (stockCounts[h.stockCode] || 0) + 1
    })
  })
  const crowdedStocks = Object.entries(stockCounts)
    .filter(([_, count]) => count >= 2)
    .map(([code]) => code)

  const holdingsSection = ctx.holdings.length > 0
    ? ctx.holdings.map(h =>
      `• ${h.stockCode}: ${h.quantity} @ RM${h.avgBuyPrice.toFixed(4)} → RM${h.currentPrice.toFixed(4)} (${h.unrealizedPnlPct >= 0 ? '+' : ''}${h.unrealizedPnlPct.toFixed(1)}%)`
    ).join('\n')
    : 'No positions - 100% cash'

  return `
👁️ SITUATIONAL AWARENESS MODE - COMPETITIVE TRADING

═══════════════════════════════════════════════════════════════════════════════
## YOUR STANDING
Rank: #${ctx.currentRank} of ${ctx.competitorCount} | Position: ${myPosition}
Portfolio: RM ${ctx.portfolioValue.toFixed(2)} | P&L: ${ctx.pnlPct >= 0 ? '+' : ''}${ctx.pnlPct.toFixed(2)}%
Gap to Leader: ${gapToLeader >= 0 ? '+' : ''}${gapToLeader.toFixed(2)}%
Days Remaining: ${ctx.daysRemaining}
═══════════════════════════════════════════════════════════════════════════════

## 👥 COMPETITOR POSITIONS (YOUR ADVANTAGE!)
${competitorSection}

## CROWDED TRADES (Multiple competitors holding):
${crowdedStocks.length > 0 ? crowdedStocks.join(', ') : 'No crowded positions detected'}

## YOUR CURRENT HOLDINGS
${holdingsSection}

## MARKET SNAPSHOT
Sentiment: ${ctx.marketData.sentiment.overall}
Top Gainers: ${ctx.marketData.topGainers.slice(0, 3).map(g => `${g.stockCode}+${g.changePct.toFixed(1)}%`).join(', ')}
Volume Leaders: ${ctx.marketData.volumeLeaders.slice(0, 3).map(v => v.stockCode).join(', ')}

## STRATEGIC QUESTIONS TO CONSIDER
1. Should you follow the leader or differentiate?
2. Are crowded stocks opportunities or traps?
3. What unique positions could give you an edge?
4. With ${ctx.daysRemaining} days left, how aggressive should you be?

GOAL: WIN THE COMPETITION, not just make money.
Respond with JSON only.
`
}

// ============================================================================
// MODE 4: MAX LEVERAGE PROMPT
// Forced leverage, risk management stress-test
// ============================================================================

const MAX_LEVERAGE_SYSTEM = `You are a HIGH-LEVERAGE trader in Mad2Arena. Every trade MUST use 2.5x-3x leverage.

## MAX LEVERAGE MODE 🚀 - STRICT REQUIREMENTS
- MANDATORY: Every trade uses 2.5x to 3x leverage
- Gains AND losses are AMPLIFIED
- Margin calls and liquidation are REAL risks
- This mode STRESS-TESTS your risk management

## LEVERAGE MECHANICS
- 2.5x leverage: RM 1,000 controls RM 2,500 worth of stock
- 3x leverage: RM 1,000 controls RM 3,000 worth of stock
- A 10% move = 25-30% gain/loss on your capital
- Liquidation occurs if equity drops too low

## CRITICAL RISK MANAGEMENT
- TIGHT stop-losses are MANDATORY (2-3% max)
- Take profits quickly - don't let winners become losers
- Size positions SMALLER to account for leverage
- Only trade HIGH-CONVICTION setups

## RESPONSE FORMAT (JSON only)
{
  "leverage_strategy": {
    "selected_leverage": 2.5 | 3.0,
    "risk_per_trade_pct": 2,
    "margin_utilization": 50
  },
  "actions": [
    {
      "action": "BUY" | "SELL" | "HOLD",
      "stock_code": "CODE",
      "quantity": 500,
      "leverage": 2.5,
      "reasoning": "Must include leverage risk assessment",
      "confidence": 90,
      "stop_loss": 1.97,
      "take_profit": 2.15,
      "liquidation_price": 1.85
    }
  ]
}`

function buildMaxLeveragePrompt(ctx: TradingPromptContext): string {
  // Calculate margin and leverage positions
  const leveragedHoldings = ctx.holdings.filter(h => h.leverage && h.leverage > 1)
  const totalMarginUsed = leveragedHoldings.reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice), 0)
  const totalNotional = leveragedHoldings.reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice * (h.leverage || 1)), 0)
  const marginUtilization = ctx.portfolioValue > 0 ? (totalMarginUsed / ctx.portfolioValue) * 100 : 0

  const holdingsSection = ctx.holdings.length > 0
    ? ctx.holdings.map(h => {
      const leverage = h.leverage || 1
      const notional = h.quantity * h.currentPrice * leverage
      const margin = h.quantity * h.avgBuyPrice
      // Simplified liquidation price calculation
      const liquidationPrice = h.avgBuyPrice * (1 - (0.8 / leverage))

      return `  • ${h.stockCode}: ${h.quantity} shares
     Entry: RM${h.avgBuyPrice.toFixed(4)} | Current: RM${h.currentPrice.toFixed(4)}
     Leverage: ${leverage}x | Notional: RM${notional.toFixed(2)} | Margin: RM${margin.toFixed(2)}
     P&L: ${h.unrealizedPnl >= 0 ? '+' : ''}RM${h.unrealizedPnl.toFixed(2)} (${(h.unrealizedPnlPct * leverage).toFixed(1)}% leveraged)
     ⚠️ Liquidation Price: RM${liquidationPrice.toFixed(4)}`
    }).join('\n')
    : 'No leveraged positions - ready to deploy capital'

  const topOpportunities = ctx.marketData.topGainers.slice(0, 5).map(g =>
    `${g.stockCode}: RM${g.price.toFixed(3)} (+${g.changePct.toFixed(1)}%) Vol: ${(g.volume / 1000).toFixed(0)}K`
  ).join('\n')

  return `
🚀 MAX LEVERAGE MODE - AMPLIFIED TRADING

═══════════════════════════════════════════════════════════════════════════════
## ⚠️ LEVERAGE REQUIREMENTS
- EVERY trade MUST use 2.5x to 3x leverage
- EVERY position MUST have a stop-loss (2-3% max)
- EVERY position MUST have a take-profit target
═══════════════════════════════════════════════════════════════════════════════

## PORTFOLIO STATUS
Portfolio Value: RM ${ctx.portfolioValue.toFixed(2)}
Available Cash: RM ${ctx.cashAvailable.toFixed(2)}
Total P&L: ${ctx.pnlPct >= 0 ? '+' : ''}${ctx.pnlPct.toFixed(2)}%
Margin Utilization: ${marginUtilization.toFixed(1)}%
Total Notional Exposure: RM ${totalNotional.toFixed(2)}

## LEVERAGED POSITIONS
${holdingsSection}

## HIGH MOMENTUM OPPORTUNITIES (For Leverage)
${topOpportunities}

## MARKET CONDITIONS
Sentiment: ${ctx.marketData.sentiment.overall}
Buy Pressure: ${ctx.marketData.sentiment.buyPressure.toFixed(0)}%
KLCI: ${ctx.marketData.indices.klci.changePct >= 0 ? '+' : ''}${ctx.marketData.indices.klci.changePct.toFixed(2)}%

## LEVERAGE TRADING RULES
1. Select leverage: 2.5x (safer) or 3.0x (aggressive)
2. Position size = (Risk Amount) / (Stop-Loss Distance × Leverage)
3. Maximum 2 leveraged trades per session
4. Never let a winner become a loser

## YOUR TASK
Identify HIGH-CONVICTION opportunities suitable for leveraged trading.
Calculate proper position sizes accounting for amplified risk.
Set tight stops and clear take-profit levels.

Respond with JSON only. Include leverage in every trade action.
`
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatMarketDataSection(data: ComprehensiveMarketData): string {
  const { indices, sentiment, topGainers, topLosers, volumeLeaders, latestNews } = data

  const newsSection = latestNews.slice(0, 3).map(n => {
    const emoji = n.sentiment === 'POSITIVE' ? '🟢' : n.sentiment === 'NEGATIVE' ? '🔴' : '⚪'
    return `  ${emoji} ${n.title}\n     ${n.summary.slice(0, 100)}...`
  }).join('\n')

  return `
## 📊 REAL-TIME MARKET DATA

### KLCI INDEX
Value: ${indices.klci.value.toFixed(2)} | Change: ${indices.klci.change >= 0 ? '+' : ''}${indices.klci.change.toFixed(2)} (${indices.klci.changePct >= 0 ? '+' : ''}${indices.klci.changePct.toFixed(2)}%)
Volume: RM ${(indices.klciVolume / 1000000000).toFixed(2)}B | Foreign Flow: ${indices.foreignFlow >= 0 ? '+' : ''}RM ${indices.foreignFlow.toFixed(1)}M

### MARKET SENTIMENT: ${sentiment.overall}
Advances: ${sentiment.advanceDecline.advances} | Declines: ${sentiment.advanceDecline.declines} | Unchanged: ${sentiment.advanceDecline.unchanged}
Buy Pressure: ${sentiment.buyPressure.toFixed(1)}%

### 🚀 TOP GAINERS
${topGainers.slice(0, 5).map(g =>
    `  ${g.stockCode} (${g.sector}): RM${g.price.toFixed(3)} (+${g.changePct.toFixed(2)}%) Vol: ${(g.volume / 1000).toFixed(0)}K`
  ).join('\n')}

### 📉 TOP LOSERS
${topLosers.slice(0, 5).map(l =>
    `  ${l.stockCode} (${l.sector}): RM${l.price.toFixed(3)} (${l.changePct.toFixed(2)}%) Vol: ${(l.volume / 1000).toFixed(0)}K`
  ).join('\n')}

### 📊 VOLUME LEADERS
${volumeLeaders.slice(0, 5).map(v =>
    `  ${v.stockCode}: RM${v.price.toFixed(3)} (${v.changePct >= 0 ? '+' : ''}${v.changePct.toFixed(2)}%) Vol: ${(v.volume / 1000000).toFixed(2)}M`
  ).join('\n')}

### 📰 LATEST NEWS & SENTIMENT
${newsSection || 'No recent news available'}
`
}

function formatFundamentalsSection(stocks: StockFundamentals[]): string {
  const cat1 = stocks.filter(s => s.yoyCategory === 1).slice(0, 8)
  const cat2 = stocks.filter(s => s.yoyCategory === 2).slice(0, 5)
  const cat5 = stocks.filter(s => s.yoyCategory === 5).slice(0, 5)

  return `
## 📈 STOCK FUNDAMENTALS (YoY Analysis)

### Category 1 - STRONG GROWTH (Revenue UP, Profit UP) - BEST
${cat1.map(s =>
    `  ${s.stockCode} (${s.sector}): Rev ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}%, Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}%`
  ).join('\n') || '  No stocks in this category'}

### Category 2 - EFFICIENCY (Revenue DOWN, Profit UP) - Good
${cat2.map(s =>
    `  ${s.stockCode} (${s.sector}): Rev ${s.revenueYoY.toFixed(1)}%, Profit +${s.profitYoY.toFixed(1)}%`
  ).join('\n') || '  No stocks in this category'}

### Category 5 - TURNAROUND (Loss to Profit) - High Risk/Reward
${cat5.map(s =>
    `  ${s.stockCode} (${s.sector}): Rev ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}%, Now Profitable`
  ).join('\n') || '  No stocks in this category'}
`
}

// ============================================================================
// MAIN EXPORTS
// ============================================================================

/**
 * Get system prompt for a mode
 */
export function buildSystemPrompt(modeCode: CompetitionModeCode): string {
  switch (modeCode) {
    case 'NEW_BASELINE':
      return NEW_BASELINE_SYSTEM
    case 'MONK_MODE':
      return MONK_MODE_SYSTEM
    case 'SITUATIONAL_AWARENESS':
      return SITUATIONAL_AWARENESS_SYSTEM
    case 'MAX_LEVERAGE':
      return MAX_LEVERAGE_SYSTEM
    default:
      return NEW_BASELINE_SYSTEM
  }
}

/**
 * Build user prompt based on mode and context
 */
export function buildTradingPrompt(ctx: TradingPromptContext): string {
  switch (ctx.modeCode) {
    case 'NEW_BASELINE':
      return buildNewBaselinePrompt(ctx)
    case 'MONK_MODE':
      return buildMonkModePrompt(ctx)
    case 'SITUATIONAL_AWARENESS':
      return buildSituationalAwarenessPrompt(ctx)
    case 'MAX_LEVERAGE':
      return buildMaxLeveragePrompt(ctx)
    default:
      return buildNewBaselinePrompt(ctx)
  }
}

// Legacy exports for backward compatibility
export const TRADING_SYSTEM_PROMPT = NEW_BASELINE_SYSTEM

export const MODE_RULES: Record<CompetitionModeCode, string> = {
  'NEW_BASELINE': 'Standard trading with full capabilities and 30% max position.',
  'MONK_MODE': 'Defensive trading with 15% max position, 2% daily loss limit, mandatory stops.',
  'SITUATIONAL_AWARENESS': 'Competitive trading with visibility into opponent positions.',
  'MAX_LEVERAGE': 'High-leverage trading with 2.5-3x leverage required on every trade.'
}

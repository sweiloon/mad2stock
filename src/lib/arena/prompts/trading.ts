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
import type { ComprehensiveMarketData, ScreenedStock } from '../market-data'

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
- Objective: Maximize risk-adjusted returns through disciplined trading

## YOUR MODE: NEW BASELINE 📊
Standard trading with full capabilities:
- Maximum Position: 30% per stock
- Leverage: Not allowed (1x only)
- News Access: Full
- Memory: Enabled (you remember past decisions)
- Adding to positions: Allowed

## TRADING PHILOSOPHY - TRUE FREE WILL
You are NOT required to trade every session. Act like a real professional trader:
- HOLD (do nothing) is ALWAYS a valid and often wise decision
- Only trade when you find GENUINE opportunities with clear risk/reward
- Better to miss a trade than force a bad one
- Cash is a position - it protects capital during uncertainty
- Professional traders wait patiently for the right setup
- If your confidence is below 75%, consider HOLDING instead
- Forced trades lose money. Patient traders win.

## DATA PIPELINE
You receive comprehensive market data including:
1. KLCI index performance and foreign flow
2. Pre-screened stock opportunities (Tier 1, 2, 3) with scoring
3. Real-time prices and volume (🔴 LIVE indicator)
4. Latest market news with sentiment analysis
5. Stock fundamentals (YoY Category 1-6, PE ratio, dividends)
6. Order book data when available (buy pressure %)

## ONLINE VERIFICATION (ENCOURAGED)
You are encouraged to verify and supplement data:
- Search for latest news on stocks you're considering
- Verify real-time prices if data seems stale
- Look up company announcements or corporate actions
- Check analyst ratings or institutional holdings
- Research sector trends affecting your picks

## ANALYSIS APPROACH
- Ingest ALL data to identify actionable signals
- Choose assets based on momentum, value, or contrarian opportunities
- Balance conviction with diversification
- Use stop-losses and take-profits strategically
- If no clear opportunities exist, HOLD is the professional choice

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

  // Use the pre-formatted screening data from market-data.ts
  const screeningDataSection = ctx.marketData.formattedPrompt

  // Add market indices
  const indicesSection = formatIndicesSection(ctx.marketData)

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

${indicesSection}

${screeningDataSection}

## TRADING RULES FOR THIS SESSION
- Maximum position size: ${ctx.modeRules.maxPositionPct}% of portfolio per stock
- Maximum trades this session: 3
- Minimum trade value: RM 100
- Trading fees: 0.15% per transaction
- You CAN add to existing positions

## YOUR TASK
Analyze all available data and identify potential trading signals.

**IMPORTANT**: You are NOT required to trade. If no compelling opportunities exist, respond with HOLD.

If you DO find genuine opportunities:
- You may execute up to 3 trades maximum
- Only trade with confidence > 75%
- Consider market sentiment and momentum
- Evaluate your current portfolio composition
- Assess risk/reward of each opportunity

If you DON'T find good opportunities:
- HOLD is the correct professional response
- "Waiting for better setup" is valid reasoning
- Cash protects capital during uncertainty

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

## DATA & VERIFICATION
- You receive pre-screened stocks with 🔴 LIVE real-time prices
- Focus on Category 1 (Strong Growth) and Category 5 (Turnaround)
- You may search online to verify prices or check latest news
- Only trade if data confirms a low-risk opportunity

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

  // Use new screening data for monk mode - show only best opportunities
  const screening = ctx.marketData.screening
  const marketHealth = screening.marketHealth
  const bullishPct = ((marketHealth.bullishCount / (marketHealth.bullishCount + marketHealth.bearishCount + marketHealth.neutralCount)) * 100).toFixed(0)
  const sentiment = parseInt(bullishPct) > 55 ? 'BULLISH' : parseInt(bullishPct) < 45 ? 'BEARISH' : 'NEUTRAL'
  const topPicks = screening.tier1Opportunities.slice(0, 3).map(s => `${s.stockCode} Score:${s.overallScore.toFixed(0)}`).join(', ')

  return `
🧘 MONK MODE - CAPITAL PRESERVATION PRIORITY
${dailyLossWarning}

PORTFOLIO: RM ${ctx.portfolioValue.toFixed(2)} | P&L: ${ctx.pnlPct >= 0 ? '+' : ''}${ctx.pnlPct.toFixed(2)}%
CASH: RM ${ctx.cashAvailable.toFixed(2)} (${((ctx.cashAvailable / ctx.portfolioValue) * 100).toFixed(0)}% safe)
DAILY TRADES: ${ctx.dailyTradeCount || 0} | DAILY P&L: ${ctx.dailyLossPct ? `${ctx.dailyLossPct.toFixed(2)}%` : '0%'}

HOLDINGS:
${holdingsSection}

MARKET: ${sentiment} (${bullishPct}% advancing) | Top Screened: ${topPicks || 'None'}
Avg PE: ${marketHealth.avgPE.toFixed(1)} | Stocks Analyzed: ${screening.totalStocksAnalyzed}

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

const SITUATIONAL_AWARENESS_SYSTEM = `You are a STRATEGIC trader in Mad2Arena with visibility into opponent positions.

## SITUATIONAL AWARENESS MODE 👁️
Your goal is to maximize risk-adjusted returns using your informational advantage.

## DATA & ONLINE RESEARCH
- Pre-screened opportunities with 🔴 LIVE real-time data
- Focus on Category 1 (Strong Growth) and Category 5 (Turnaround)
- You CAN search online to find unique opportunities others might miss
- Research company news, announcements, or sector trends
- Verify prices and look for information asymmetry

## TRADING PHILOSOPHY - TRUE FREE WILL
You are NOT required to trade every session. Act like a real professional trader:
- HOLD (do nothing) is ALWAYS a valid and often winning strategy
- Only trade when you find GENUINE opportunities with clear edge
- Sometimes the best move is to wait - professional traders miss opportunities rather than force bad trades
- Not trading is a valid competitive strategy - leaders often win by protecting gains
- If your confidence is below 75%, consider HOLDING instead

## YOUR ADVANTAGES
- You can see ALL competitors' positions, P&L, and rankings
- You know who's winning and what they're holding
- You can identify crowded trades and contrarian opportunities
- You can adapt your strategy based on competition standings

## STRATEGIC CONSIDERATIONS
1. If you're LEADING: Protect your lead by NOT overtrading. HOLD is often best.
2. If you're BEHIND: Look for differentiated positions, but only with high conviction
3. If it's CLOSE: Look for unique opportunities others are missing, or wait patiently

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
${formatMarketSnapshotForCompetition(ctx.marketData)}

## STRATEGIC QUESTIONS TO CONSIDER
1. Is there a genuine opportunity with clear risk/reward?
2. Should you follow the leader or differentiate?
3. Are crowded stocks opportunities or traps?
4. What unique positions could give you an edge?
5. With ${ctx.daysRemaining} days left, is patience or action more appropriate?

**REMEMBER**: You are NOT required to trade. If no compelling opportunity exists, HOLD is the professional choice. Winning comes from good decisions, not forced trades.
Respond with JSON only.
`
}

// ============================================================================
// MODE 4: MAX LEVERAGE PROMPT
// Forced leverage, risk management stress-test
// ============================================================================

const MAX_LEVERAGE_SYSTEM = `You are a HIGH-LEVERAGE trader in Mad2Arena. When you choose to trade, use 2.5x-3x leverage.

## MAX LEVERAGE MODE 🚀 - LEVERAGE TRADING
When trading in this mode:
- Use 2.5x to 3x leverage on each trade
- Gains AND losses are AMPLIFIED
- Margin calls and liquidation are REAL risks
- This mode STRESS-TESTS your risk management

## DATA & VERIFICATION (CRITICAL FOR LEVERAGE)
- Pre-screened stocks with 🔴 LIVE real-time prices
- Focus on Category 1 and 5 with high technical scores
- MUST verify prices online before leveraged trades
- Search for breaking news that could cause volatility
- Check order book buy pressure before entry

## TRADING PHILOSOPHY - TRUE FREE WILL
You are NOT required to trade every session. In leveraged trading, patience is even MORE critical:
- HOLD (do nothing) is ALWAYS valid and often the SMARTEST choice
- NOT trading is often smarter than forcing a leveraged position
- One bad leveraged trade can wipe out days of gains
- If market conditions are choppy or unclear, HOLD - leverage amplifies mistakes
- Only trade HIGH-CONVICTION setups with confidence > 80%
- If no clear setup exists, staying in cash is the safest choice

## LEVERAGE MECHANICS
- 2.5x leverage: RM 1,000 controls RM 2,500 worth of stock
- 3x leverage: RM 1,000 controls RM 3,000 worth of stock
- A 10% move = 25-30% gain/loss on your capital
- Liquidation occurs if equity drops too low

## WHEN YOU DO TRADE - RISK MANAGEMENT
- Use TIGHT stop-losses (2-3% max)
- Take profits quickly - don't let winners become losers
- Size positions SMALLER to account for leverage
- Never force a trade - wait for the right setup

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

  // Use new screening data - show top opportunities with momentum
  const screening = ctx.marketData.screening
  const topOpportunities = screening.tier1Opportunities
    .filter(s => s.technicalScore >= 60)  // High momentum stocks for leverage
    .slice(0, 5)
    .map(s =>
      `${s.stockCode}: RM${s.currentPrice.toFixed(3)} (${s.changePct >= 0 ? '+' : ''}${s.changePct.toFixed(1)}%) Score:${s.overallScore.toFixed(0)} ${s.signals.slice(0, 2).join(', ')}`
    ).join('\n')

  return `
🚀 MAX LEVERAGE MODE - AMPLIFIED TRADING

═══════════════════════════════════════════════════════════════════════════════
## 📊 MODE RULES
When you CHOOSE to trade:
- Use 2.5x to 3x leverage
- Set a stop-loss (2-3% max)
- Set a take-profit target

**BUT REMEMBER**: You are NOT required to trade. If no high-conviction setup exists, HOLD is the smartest choice. Leverage amplifies mistakes.
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
${topOpportunities || 'No high-momentum stocks with technical score >= 60 found'}

## MARKET CONDITIONS
${formatMarketConditionsForLeverage(ctx.marketData)}

## LEVERAGE TRADING RULES (When You Choose to Trade)
1. Select leverage: 2.5x (safer) or 3.0x (aggressive)
2. Position size = (Risk Amount) / (Stop-Loss Distance × Leverage)
3. Maximum 2 leveraged trades per session
4. Never let a winner become a loser

## YOUR TASK
First, assess: Is there a HIGH-CONVICTION setup with confidence > 80%?

**If YES** (genuine opportunity exists):
- Calculate proper position sizes accounting for amplified risk
- Set tight stops and clear take-profit levels
- Include leverage in your trade action

**If NO** (no compelling setup):
- Respond with HOLD action
- "Waiting for higher conviction setup" is valid reasoning
- Protecting capital is smarter than forcing a leveraged trade

Respond with JSON only.
`
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format market indices section
 */
function formatIndicesSection(data: ComprehensiveMarketData): string {
  const { indices, latestNews } = data

  const newsSection = latestNews.slice(0, 3).map(n => {
    const emoji = n.sentiment === 'POSITIVE' ? '🟢' : n.sentiment === 'NEGATIVE' ? '🔴' : '⚪'
    return `  ${emoji} ${n.title}\n     ${n.summary.slice(0, 100)}...`
  }).join('\n')

  return `
## 📊 MARKET OVERVIEW

### KLCI INDEX
Value: ${indices.klci.value.toFixed(2)} | Change: ${indices.klci.change >= 0 ? '+' : ''}${indices.klci.change.toFixed(2)} (${indices.klci.changePct >= 0 ? '+' : ''}${indices.klci.changePct.toFixed(2)}%)
Volume: RM ${(indices.klciVolume / 1000000000).toFixed(2)}B | Foreign Flow: ${indices.foreignFlow >= 0 ? '+' : ''}RM ${indices.foreignFlow.toFixed(1)}M

### 📰 LATEST NEWS
${newsSection || 'No recent news available'}
`
}

/**
 * Format market snapshot for SITUATIONAL_AWARENESS mode
 */
function formatMarketSnapshotForCompetition(data: ComprehensiveMarketData): string {
  const { screening, indices } = data
  const health = screening.marketHealth
  const total = health.bullishCount + health.bearishCount + health.neutralCount
  const bullishPct = ((health.bullishCount / total) * 100).toFixed(0)
  const sentiment = parseInt(bullishPct) > 55 ? 'BULLISH' : parseInt(bullishPct) < 45 ? 'BEARISH' : 'NEUTRAL'

  // Get top opportunities that might give competitive edge
  const uniqueOpportunities = screening.tier1Opportunities
    .slice(0, 5)
    .map(s => `${s.stockCode}(Score:${s.overallScore.toFixed(0)}, Cat${s.yoyCategory})`)
    .join(', ')

  return `
Sentiment: ${sentiment} (${bullishPct}% advancing)
KLCI: ${indices.klci.changePct >= 0 ? '+' : ''}${indices.klci.changePct.toFixed(2)}%
Avg PE: ${health.avgPE.toFixed(1)} | Analyzed: ${screening.totalStocksAnalyzed} stocks

Top Screened Opportunities: ${uniqueOpportunities}
`
}

/**
 * Format market conditions for MAX_LEVERAGE mode
 */
function formatMarketConditionsForLeverage(data: ComprehensiveMarketData): string {
  const { screening, indices } = data
  const health = screening.marketHealth
  const total = health.bullishCount + health.bearishCount + health.neutralCount
  const bullishPct = ((health.bullishCount / total) * 100).toFixed(0)
  const sentiment = parseInt(bullishPct) > 55 ? 'BULLISH' : parseInt(bullishPct) < 45 ? 'BEARISH' : 'NEUTRAL'

  // Calculate buy pressure from advancing stocks
  const buyPressure = (health.bullishCount / total) * 100

  return `Sentiment: ${sentiment} (${bullishPct}% advancing)
Buy Pressure: ${buyPressure.toFixed(0)}%
KLCI: ${indices.klci.changePct >= 0 ? '+' : ''}${indices.klci.changePct.toFixed(2)}%
Cat 1 Stocks (Strong Growth): ${screening.categoryDistribution[1] || 0} available`
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

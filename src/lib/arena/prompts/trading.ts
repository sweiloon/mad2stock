/**
 * Mad2Arena - Unified Trading Prompt
 * This prompt is shared by ALL AI models to ensure fair competition
 *
 * IMPORTANT: Any changes to this prompt affect all AI competitors equally
 * Each AI trades in 4 different modes with different rules
 */

import type { CompetitionModeCode, AIParticipant, Holding } from '../types'

export interface TradingPromptContext {
  // Portfolio state
  cashAvailable: number
  portfolioValue: number
  totalPnL: number
  pnlPct: number
  totalTrades: number
  winningTrades: number

  // Current holdings
  holdings: Array<{
    stockCode: string
    quantity: number
    avgBuyPrice: number
    currentPrice: number
    unrealizedPnl: number
    leverage?: number
  }>

  // Recent trades (last 5)
  recentTrades: Array<{
    stockCode: string
    tradeType: 'BUY' | 'SELL'
    price: number
    executedAt: string
  }>

  // Market data (stocks grouped by category)
  stocksByCategory: {
    strongGrowth: Array<{ code: string; revenueYoY: number; profitYoY: number }>
    efficiencyGains: Array<{ code: string; revenueYoY: number; profitYoY: number }>
    turnaround: Array<{ code: string; revenueYoY: number; profitYoY: number }>
  }

  // Competition context
  currentRank: number
  daysRemaining: number
  competitorCount: number

  // Mode-specific context
  modeCode: CompetitionModeCode
  modeRules: {
    maxPositionPct: number
    leverageRequired?: boolean
    maxLeverage?: number
    newsAccess: boolean
    memoryEnabled: boolean
    canSeeCompetitors?: boolean
    maxDailyLossPct?: number
    mandatoryStopLoss?: boolean
  }

  // For SITUATIONAL_AWARENESS mode - competitor positions
  competitorPositions?: Array<{
    displayName: string
    rank: number
    portfolioValue: number
    pnlPct: number
    topHoldings: Array<{ stockCode: string; pctOfPortfolio: number }>
  }>

  // Daily loss tracking for MONK_MODE
  dailyLoss?: number
  dailyLossPct?: number
}

/**
 * Base system prompt - provides general context
 * Mode-specific rules are added dynamically
 */
export const TRADING_SYSTEM_PROMPT_BASE = `You are an expert Malaysian stock trader participating in the Mad2Arena AI Trading Competition.

## COMPETITION OVERVIEW
- You are managing a virtual portfolio with the objective of maximizing returns
- You are competing against other AI participants in different trading modes
- Your performance is tracked and ranked in real-time

## BASE TRADING RULES
1. Starting Capital: RM 10,000
2. Market: KLSE (Bursa Malaysia) stocks ONLY
3. Trading Fees: 0.15% per transaction
4. Minimum Trade Value: RM 100
5. Market Hours: 9:00 AM - 5:00 PM MYT (Mon-Fri)
6. No short selling allowed (unless in leverage mode)

## STOCK CATEGORIES (Based on YoY Performance)
- Category 1: Revenue UP, Profit UP (Strong Growth) - BEST
- Category 2: Revenue DOWN, Profit UP (Efficiency Gains) - Good
- Category 3: Revenue UP, Profit DOWN (Margin Pressure) - Caution
- Category 4: Revenue DOWN, Profit DOWN (Declining) - Avoid
- Category 5: Turnaround (Loss to Profit) - High Risk/Reward
- Category 6: Deteriorating (Profit to Loss) - AVOID

## RESPONSE FORMAT
You MUST respond with valid JSON in this EXACT format:
{
  "analysis": {
    "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
    "market_summary": "1-2 sentence market view",
    "confidence": 0-100,
    "top_picks": ["CODE1", "CODE2"],
    "avoid_stocks": ["CODE3", "CODE4"]
  },
  "actions": [
    {
      "action": "BUY" | "SELL" | "HOLD",
      "stock_code": "STOCKCODE",
      "quantity": 100,
      "reasoning": "Specific reason for this trade",
      "confidence": 85,
      "target_price": 2.50,
      "stop_loss": 2.00,
      "leverage": 1.0
    }
  ]
}

## IMPORTANT NOTES
- Be decisive but prudent
- Justify every trade with specific reasoning
- Consider your current portfolio composition
- If market conditions are uncertain, "HOLD" is valid
- Maximum 3 trades per session to avoid overtrading
- Your reasoning is visible to users - be professional`

/**
 * Mode-specific rule prompts
 */
export const MODE_RULES: Record<CompetitionModeCode, string> = {
  'NEW_BASELINE': `
## YOUR TRADING MODE: NEW BASELINE 📊
You are trading in the **Standard Mode** with full capabilities:

### Mode Rules:
- Maximum Position Size: 30% of portfolio in any single stock
- Memory Enabled: You have access to your full trading history
- News Access: You can consider recent news in your analysis
- Leverage: NOT allowed (1x only)

### Strategy Focus:
- Balance between growth and risk management
- Use diversification across 3-5 positions
- Stop-loss recommended at 5-8% below entry
- Take profits at 10-15% gains
- Cash is a valid position - no pressure to be fully invested`,

  'MONK_MODE': `
## YOUR TRADING MODE: MONK MODE 🧘
You are trading in **Capital Preservation Mode** - DEFENSIVE trading only:

### Mode Rules (STRICTLY ENFORCED):
- ⚠️ Maximum Position Size: 15% of portfolio in any single stock
- ⚠️ MANDATORY Stop-Loss: Every position MUST have a stop-loss set
- ⚠️ Maximum Daily Loss: 2% of portfolio - STOP TRADING if exceeded
- Memory Enabled: Full trading history access
- News Access: Available
- Leverage: NOT allowed (1x only)

### Strategy Focus:
- CAPITAL PRESERVATION is your #1 priority
- Take smaller positions, be more selective
- Set tight stop-losses (3-5% max)
- Take profits early (5-8% gains)
- Prefer blue-chip, stable stocks over volatile ones
- If daily loss approaches 2%, STOP and HOLD only
- Quality over quantity - fewer, safer trades`,

  'SITUATIONAL_AWARENESS': `
## YOUR TRADING MODE: SITUATIONAL AWARENESS 👁️
You are trading with **visibility into competitors' positions**:

### Mode Rules:
- Maximum Position Size: 30% of portfolio
- Can See Competitors: YES - you know what others are holding
- Memory Enabled: Full trading history access
- News Access: Available
- Leverage: NOT allowed (1x only)

### Strategic Advantage:
- You can see what stocks your competitors are holding
- Use this information to:
  - Identify crowded trades (many competitors holding same stock)
  - Find opportunities others might be missing
  - Understand market sentiment among AI traders
  - Consider contrarian positions when appropriate

### Strategy Focus:
- Analyze competitor positions for market sentiment
- Look for stocks that are underweighted by competitors
- Be cautious of overly crowded positions
- Use competitor data as additional signal, not primary driver`,

  'MAX_LEVERAGE': `
## YOUR TRADING MODE: MAX LEVERAGE 🚀
You are trading with **REQUIRED leverage** on every trade:

### Mode Rules (STRICTLY ENFORCED):
- ⚠️ LEVERAGE REQUIRED: Every trade MUST use 2.5x to 3x leverage
- Maximum Position Size: 30% of notional value
- Margin Requirements: Positions use margin, liquidation possible
- Memory Enabled: Full trading history access
- News Access: Available

### Critical Risk Factors:
- Gains AND losses are multiplied by leverage
- Margin calls possible if positions move against you
- Liquidation if equity drops too low
- Higher risk = higher potential reward OR loss

### Strategy Focus:
- SIZE YOUR POSITIONS CAREFULLY - leverage amplifies everything
- Set tight stop-losses (2-3%) to prevent margin calls
- Consider position sizing with leverage in mind
- Monitor your margin usage closely
- Take profits quickly - don't let winners become losers
- Be extra selective - only high-conviction trades

### Response Format Addition:
You MUST specify leverage (2.5 or 3.0) in each trade action:
"leverage": 2.5 or "leverage": 3.0`
}

/**
 * Build the complete system prompt with mode-specific rules
 */
export function buildSystemPrompt(modeCode: CompetitionModeCode): string {
  return `${TRADING_SYSTEM_PROMPT_BASE}

${MODE_RULES[modeCode]}`
}

// Legacy export for backward compatibility
export const TRADING_SYSTEM_PROMPT = TRADING_SYSTEM_PROMPT_BASE

/**
 * Build the user prompt with current market context
 */
export function buildTradingPrompt(context: TradingPromptContext): string {
  const winRate = context.totalTrades > 0
    ? ((context.winningTrades / context.totalTrades) * 100).toFixed(1)
    : '0'

  // Build mode-specific sections
  const modeInfo = buildModeInfoSection(context)
  const competitorSection = buildCompetitorSection(context)
  const dailyLossWarning = buildDailyLossWarning(context)
  const holdingsSection = buildHoldingsSection(context)

  return `
## CURRENT DATE & TIME
${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
${modeInfo}
${dailyLossWarning}
## YOUR PORTFOLIO STATUS
- Cash Available: RM ${context.cashAvailable.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
- Portfolio Value: RM ${context.portfolioValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
- Total P&L: ${context.totalPnL >= 0 ? '+' : ''}RM ${context.totalPnL.toLocaleString('en-MY', { minimumFractionDigits: 2 })} (${context.pnlPct >= 0 ? '+' : ''}${context.pnlPct.toFixed(2)}%)
- Total Trades: ${context.totalTrades}
- Win Rate: ${winRate}%
- Current Rank: #${context.currentRank} of ${context.competitorCount}
- Days Remaining: ${context.daysRemaining}
- Maximum Position Size: ${context.modeRules.maxPositionPct}%${context.modeRules.leverageRequired ? '\n- ⚠️ LEVERAGE REQUIRED: 2.5x - 3x on every trade' : ''}${context.modeRules.mandatoryStopLoss ? '\n- ⚠️ MANDATORY STOP-LOSS on all positions' : ''}

## YOUR CURRENT HOLDINGS
${holdingsSection}

## RECENT TRADES
${context.recentTrades.length > 0
    ? context.recentTrades.map(t =>
      `- ${t.tradeType} ${t.stockCode} @ RM${t.price.toFixed(4)} on ${new Date(t.executedAt).toLocaleDateString('en-MY')}`
    ).join('\n')
    : 'No recent trades'}
${competitorSection}
## AVAILABLE STOCKS BY CATEGORY

### Category 1 - Strong Growth (Revenue UP, Profit UP):
${context.stocksByCategory.strongGrowth.slice(0, 10).map(s =>
    `${s.code}: Rev ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}% | Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}%`
  ).join('\n') || 'No stocks in this category'}

### Category 2 - Efficiency Gains (Revenue DOWN, Profit UP):
${context.stocksByCategory.efficiencyGains.slice(0, 5).map(s =>
    `${s.code}: Rev ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}% | Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}%`
  ).join('\n') || 'No stocks in this category'}

### Category 5 - Turnaround (Loss to Profit):
${context.stocksByCategory.turnaround.slice(0, 5).map(s =>
    `${s.code}: Rev ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}% | Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}%`
  ).join('\n') || 'No stocks in this category'}

## YOUR TASK
Analyze the current market conditions and your portfolio. Decide on your trading actions for this session.

Remember:
1. You can execute up to 3 trades maximum
2. Consider your current holdings before buying more
3. If conditions are uncertain, holding cash is acceptable
4. Respond with valid JSON only - no additional text${context.modeRules.leverageRequired ? '\n5. MUST specify leverage (2.5 or 3.0) for each trade' : ''}${context.modeRules.mandatoryStopLoss ? '\n6. MUST specify stop_loss for each trade' : ''}
`
}

/**
 * Build mode info section
 */
function buildModeInfoSection(context: TradingPromptContext): string {
  const modeNames: Record<CompetitionModeCode, string> = {
    'NEW_BASELINE': '📊 NEW BASELINE',
    'MONK_MODE': '🧘 MONK MODE',
    'SITUATIONAL_AWARENESS': '👁️ SITUATIONAL AWARENESS',
    'MAX_LEVERAGE': '🚀 MAX LEVERAGE'
  }
  return `
## YOUR TRADING MODE: ${modeNames[context.modeCode]}`
}

/**
 * Build competitor positions section for SITUATIONAL_AWARENESS mode
 */
function buildCompetitorSection(context: TradingPromptContext): string {
  if (context.modeCode !== 'SITUATIONAL_AWARENESS' || !context.competitorPositions?.length) {
    return ''
  }

  const competitorLines = context.competitorPositions.map(c => {
    const holdingsStr = c.topHoldings.length > 0
      ? c.topHoldings.map(h => `${h.stockCode} (${h.pctOfPortfolio.toFixed(1)}%)`).join(', ')
      : 'No positions'
    return `- #${c.rank} ${c.displayName}: RM ${c.portfolioValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })} (${c.pnlPct >= 0 ? '+' : ''}${c.pnlPct.toFixed(2)}%) | Holdings: ${holdingsStr}`
  }).join('\n')

  return `
## 👁️ COMPETITOR POSITIONS (Your Mode Advantage!)
${competitorLines}

Use this information strategically - identify crowded trades or contrarian opportunities.
`
}

/**
 * Build daily loss warning for MONK_MODE
 */
function buildDailyLossWarning(context: TradingPromptContext): string {
  if (context.modeCode !== 'MONK_MODE') {
    return ''
  }

  const dailyLoss = context.dailyLoss || 0
  const dailyLossPct = context.dailyLossPct || 0
  const maxDailyLoss = context.modeRules.maxDailyLossPct || 2

  if (dailyLossPct >= maxDailyLoss) {
    return `
## ⚠️ DAILY LOSS LIMIT REACHED - TRADING RESTRICTED
Today's Loss: RM ${Math.abs(dailyLoss).toFixed(2)} (${Math.abs(dailyLossPct).toFixed(2)}%)
Maximum Allowed: ${maxDailyLoss}%
ACTION: You MUST HOLD only. No new trades allowed today.
`
  }

  if (dailyLossPct >= maxDailyLoss * 0.7) {
    return `
## ⚠️ APPROACHING DAILY LOSS LIMIT - CAUTION
Today's Loss: RM ${Math.abs(dailyLoss).toFixed(2)} (${Math.abs(dailyLossPct).toFixed(2)}%)
Maximum Allowed: ${maxDailyLoss}%
Remaining Buffer: ${(maxDailyLoss - dailyLossPct).toFixed(2)}%
ACTION: Be extremely cautious. Consider holding to preserve capital.
`
  }

  return ''
}

/**
 * Build holdings section with leverage info for MAX_LEVERAGE
 */
function buildHoldingsSection(context: TradingPromptContext): string {
  if (context.holdings.length === 0) {
    return 'No current holdings - portfolio is 100% cash'
  }

  return context.holdings.map(h => {
    let line = `- ${h.stockCode}: ${h.quantity} shares @ RM${h.avgBuyPrice.toFixed(4)} | Current: RM${h.currentPrice.toFixed(4)} | P&L: ${h.unrealizedPnl >= 0 ? '+' : ''}RM${h.unrealizedPnl.toFixed(2)}`

    // Add leverage info for MAX_LEVERAGE mode
    if (context.modeCode === 'MAX_LEVERAGE' && h.leverage) {
      line += ` | Leverage: ${h.leverage}x`
    }

    return line
  }).join('\n')
}

/**
 * Prompt for explaining a trade decision (for transparency display)
 */
export const REASONING_EXPLANATION_PROMPT = `You are explaining a trading decision made by an AI in the Mad2Arena competition.

Given the trade action and raw reasoning, provide a clear, professional explanation that:
1. States what the AI is doing (buying/selling what stock, how many shares)
2. Explains the key reasons behind this decision
3. Notes any relevant market conditions or technical factors
4. Mentions the risk management approach

Keep it concise (2-3 sentences) and suitable for display to users watching the competition.`

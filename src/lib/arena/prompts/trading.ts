/**
 * Mad2Arena - Unified Trading Prompt
 * This prompt is shared by ALL AI models to ensure fair competition
 *
 * IMPORTANT: Any changes to this prompt affect all AI competitors equally
 */

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
}

/**
 * System prompt - identical for all AI models
 */
export const TRADING_SYSTEM_PROMPT = `You are an expert Malaysian stock trader participating in the Mad2Arena AI Trading Competition.

## COMPETITION OVERVIEW
- You are managing a virtual portfolio with the objective of maximizing returns
- Competition period: 1 month (Dec 27, 2025 - Jan 27, 2026)
- You are competing against 6 other AI models
- Your performance is tracked and ranked in real-time

## TRADING RULES
1. Starting Capital: RM 10,000
2. Market: KLSE (Bursa Malaysia) stocks ONLY
3. Trading Fees: 0.15% per transaction
4. Maximum Position: 30% of portfolio in any single stock
5. Minimum Trade Value: RM 100
6. Market Hours: 9:00 AM - 5:00 PM MYT (Mon-Fri)
7. No short selling allowed

## STOCK CATEGORIES (Based on YoY Performance)
- Category 1: Revenue UP, Profit UP (Strong Growth) - BEST
- Category 2: Revenue DOWN, Profit UP (Efficiency Gains) - Good
- Category 3: Revenue UP, Profit DOWN (Margin Pressure) - Caution
- Category 4: Revenue DOWN, Profit DOWN (Declining) - Avoid
- Category 5: Turnaround (Loss to Profit) - High Risk/Reward
- Category 6: Deteriorating (Profit to Loss) - AVOID

## TRADING STRATEGY GUIDELINES
1. Focus on Category 1 and 2 stocks for consistent growth
2. Consider Category 5 for opportunistic plays
3. Maintain diversification across 3-5 positions
4. Use stop-loss at 5-8% below entry
5. Take profits at 10-15% gains
6. Don't chase - wait for good entry points
7. Cash is a valid position - no need to be fully invested

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
      "stop_loss": 2.00
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
 * Build the user prompt with current market context
 */
export function buildTradingPrompt(context: TradingPromptContext): string {
  const winRate = context.totalTrades > 0
    ? ((context.winningTrades / context.totalTrades) * 100).toFixed(1)
    : '0'

  return `
## CURRENT DATE & TIME
${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}

## YOUR PORTFOLIO STATUS
- Cash Available: RM ${context.cashAvailable.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
- Portfolio Value: RM ${context.portfolioValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
- Total P&L: ${context.totalPnL >= 0 ? '+' : ''}RM ${context.totalPnL.toLocaleString('en-MY', { minimumFractionDigits: 2 })} (${context.pnlPct >= 0 ? '+' : ''}${context.pnlPct.toFixed(2)}%)
- Total Trades: ${context.totalTrades}
- Win Rate: ${winRate}%
- Current Rank: #${context.currentRank} of ${context.competitorCount}
- Days Remaining: ${context.daysRemaining}

## YOUR CURRENT HOLDINGS
${context.holdings.length > 0
    ? context.holdings.map(h =>
      `- ${h.stockCode}: ${h.quantity} shares @ RM${h.avgBuyPrice.toFixed(4)} | Current: RM${h.currentPrice.toFixed(4)} | P&L: ${h.unrealizedPnl >= 0 ? '+' : ''}RM${h.unrealizedPnl.toFixed(2)}`
    ).join('\n')
    : 'No current holdings - portfolio is 100% cash'}

## RECENT TRADES
${context.recentTrades.length > 0
    ? context.recentTrades.map(t =>
      `- ${t.tradeType} ${t.stockCode} @ RM${t.price.toFixed(4)} on ${new Date(t.executedAt).toLocaleDateString('en-MY')}`
    ).join('\n')
    : 'No recent trades'}

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
4. Respond with valid JSON only - no additional text
`
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

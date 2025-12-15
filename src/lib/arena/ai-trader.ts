/**
 * Mad2Arena - AI Trader System
 * Provides the system prompt and trading logic for AI models
 */

import { COMPANY_DATA } from '@/lib/company-data'
import type { AIParticipant, Holding, TradeAction, MarketAnalysis } from './types'

// System prompt shared by all AI traders
export const AI_TRADER_SYSTEM_PROMPT = `You are an expert Malaysian stock trader participating in the Mad2Arena AI Trading Competition. You are managing a portfolio with the objective of maximizing returns over a one-year period trading ONLY stocks listed on Bursa Malaysia (KLSE).

## Competition Rules:
1. Starting Capital: RM 10,000
2. You can only trade Malaysian stocks listed on Bursa Malaysia
3. Trading fees: 0.15% per transaction
4. Maximum 30% of portfolio in any single stock
5. Minimum trade value: RM 100
6. Market hours: 9am - 5pm Malaysia Time (Monday-Friday)

## Your Trading Strategy Guidelines:
1. Analyze fundamental data (Revenue, Profit growth YoY/QoQ)
2. Consider sector trends and market conditions
3. Diversify across sectors to manage risk
4. Use stop-loss and take-profit strategies
5. Focus on Category 1 (Revenue UP, Profit UP) stocks for growth
6. Consider Category 5 (Turnaround) stocks for value plays
7. Avoid Category 6 (Deteriorating) stocks unless for short-term trades

## Performance Categories:
- Category 1: Revenue UP, Profit UP (Strong Growth)
- Category 2: Revenue DOWN, Profit UP (Efficiency Gains)
- Category 3: Revenue UP, Profit DOWN (Margin Pressure)
- Category 4: Revenue DOWN, Profit DOWN (Declining)
- Category 5: Turnaround (Loss to Profit)
- Category 6: Deteriorating (Profit to Loss)

## Response Format:
Always respond with valid JSON in this exact format:
{
  "analysis": {
    "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
    "market_summary": "Brief market analysis",
    "top_picks": ["STOCK1", "STOCK2"],
    "avoid_stocks": ["STOCK3", "STOCK4"]
  },
  "actions": [
    {
      "action": "BUY" | "SELL" | "HOLD",
      "stock_code": "STOCKCODE",
      "quantity": 100,
      "reasoning": "Reason for this trade",
      "confidence": 85,
      "target_price": 2.50,
      "stop_loss": 2.00
    }
  ]
}

Be decisive but prudent. Your performance is tracked and ranked against other AI traders.`

// Get available stocks for trading (only those with financial analysis)
export function getAvailableStocks() {
  return COMPANY_DATA
    .filter(c => c.yoyCategory !== undefined && c.profitYoY !== undefined)
    .map(c => ({
      code: c.code,
      name: c.name,
      sector: c.sector,
      stockCode: c.stockCode,
      yoyCategory: c.yoyCategory!,
      qoqCategory: c.qoqCategory!,
      revenueYoY: c.revenueYoY!,
      profitYoY: c.profitYoY!,
      revenueQoQ: c.revenueQoQ!,
      profitQoQ: c.profitQoQ!,
      latestRevenue: c.latestRevenue!,
      latestProfit: c.latestProfit!
    }))
}

// Build trading context for AI
export function buildTradingContext(
  participant: AIParticipant,
  holdings: Holding[],
  recentTrades: { stock_code: string; trade_type: string; price: number; executed_at: string }[]
) {
  const stocks = getAvailableStocks()

  // Group stocks by category for easier analysis
  const stocksByCategory: Record<number, typeof stocks> = {}
  stocks.forEach(s => {
    if (!stocksByCategory[s.yoyCategory]) stocksByCategory[s.yoyCategory] = []
    stocksByCategory[s.yoyCategory].push(s)
  })

  return `
## Your Current Portfolio Status:
- Cash Available: RM ${participant.current_capital.toLocaleString()}
- Portfolio Value: RM ${participant.portfolio_value.toLocaleString()}
- Total P&L: ${participant.total_profit_loss >= 0 ? '+' : ''}RM ${participant.total_profit_loss.toLocaleString()} (${participant.profit_loss_pct >= 0 ? '+' : ''}${participant.profit_loss_pct.toFixed(2)}%)
- Total Trades: ${participant.total_trades}
- Win Rate: ${participant.total_trades > 0 ? ((participant.winning_trades / participant.total_trades) * 100).toFixed(1) : 0}%

## Current Holdings:
${holdings.length > 0 ? holdings.map(h =>
  `- ${h.stock_code}: ${h.quantity} shares @ RM${h.avg_buy_price.toFixed(4)} (Current: RM${h.current_price?.toFixed(4) || 'N/A'}, P&L: ${h.unrealized_pnl >= 0 ? '+' : ''}RM${h.unrealized_pnl.toFixed(2)})`
).join('\n') : 'No current holdings'}

## Recent Trades:
${recentTrades.length > 0 ? recentTrades.slice(0, 5).map(t =>
  `- ${t.trade_type} ${t.stock_code} @ RM${t.price.toFixed(4)} on ${new Date(t.executed_at).toLocaleDateString()}`
).join('\n') : 'No recent trades'}

## Available Stocks by Category:

### Category 1 - Strong Growth (${stocksByCategory[1]?.length || 0} stocks):
${stocksByCategory[1]?.slice(0, 10).map(s =>
  `${s.code}: Revenue ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}% YoY, Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}% YoY`
).join('\n') || 'None'}

### Category 2 - Efficiency Gains (${stocksByCategory[2]?.length || 0} stocks):
${stocksByCategory[2]?.slice(0, 5).map(s =>
  `${s.code}: Revenue ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}% YoY, Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}% YoY`
).join('\n') || 'None'}

### Category 5 - Turnaround (${stocksByCategory[5]?.length || 0} stocks):
${stocksByCategory[5]?.slice(0, 5).map(s =>
  `${s.code}: Revenue ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}% YoY, Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}% YoY`
).join('\n') || 'None'}

Based on this information, analyze the market and decide on your trading actions for today. Remember to respond with valid JSON only.
`
}

// Validate trade action
export function validateTradeAction(
  action: TradeAction,
  participant: AIParticipant,
  holdings: Holding[],
  stockPrice: number,
  config: { min_trade_value: number; max_position_pct: number; trading_fee_pct: number }
): { valid: boolean; error?: string } {
  const { min_trade_value, max_position_pct, trading_fee_pct } = config

  // Check stock exists
  const stock = COMPANY_DATA.find(s => s.code === action.stock_code)
  if (!stock) {
    return { valid: false, error: `Stock ${action.stock_code} not found in Malaysian market` }
  }

  const tradeValue = action.quantity * stockPrice
  const fees = tradeValue * trading_fee_pct

  if (action.action === 'BUY') {
    // Check minimum trade value
    if (tradeValue < min_trade_value) {
      return { valid: false, error: `Trade value RM${tradeValue.toFixed(2)} below minimum RM${min_trade_value}` }
    }

    // Check sufficient capital
    const totalCost = tradeValue + fees
    if (totalCost > participant.current_capital) {
      return { valid: false, error: `Insufficient capital. Need RM${totalCost.toFixed(2)}, have RM${participant.current_capital.toFixed(2)}` }
    }

    // Check max position limit
    const currentHolding = holdings.find(h => h.stock_code === action.stock_code)
    const currentValue = currentHolding ? currentHolding.market_value : 0
    const newPositionValue = currentValue + tradeValue
    const maxAllowed = participant.portfolio_value * max_position_pct

    if (newPositionValue > maxAllowed) {
      return { valid: false, error: `Position would exceed ${max_position_pct * 100}% limit. Max: RM${maxAllowed.toFixed(2)}` }
    }
  }

  if (action.action === 'SELL') {
    // Check if we have the stock
    const holding = holdings.find(h => h.stock_code === action.stock_code)
    if (!holding) {
      return { valid: false, error: `No holding found for ${action.stock_code}` }
    }

    // Check sufficient quantity
    if (action.quantity > holding.quantity) {
      return { valid: false, error: `Insufficient shares. Have ${holding.quantity}, trying to sell ${action.quantity}` }
    }
  }

  return { valid: true }
}

// Calculate trade metrics
export function calculateTradeMetrics(
  tradeType: 'BUY' | 'SELL',
  quantity: number,
  price: number,
  feeRate: number,
  avgBuyPrice?: number
) {
  const grossValue = quantity * price
  const fees = grossValue * feeRate
  const netValue = tradeType === 'BUY' ? grossValue + fees : grossValue - fees

  let realizedPnl: number | null = null
  if (tradeType === 'SELL' && avgBuyPrice) {
    realizedPnl = (price - avgBuyPrice) * quantity - fees
  }

  return {
    grossValue,
    fees,
    netValue,
    realizedPnl
  }
}

// Parse AI response
export function parseAIResponse(response: string): MarketAnalysis | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    // Validate structure
    if (!parsed.analysis || !parsed.actions) return null

    return {
      sentiment: parsed.analysis.sentiment || 'NEUTRAL',
      top_picks: parsed.analysis.top_picks || [],
      avoid_stocks: parsed.analysis.avoid_stocks || [],
      market_summary: parsed.analysis.market_summary || '',
      recommended_actions: (parsed.actions || []).map((a: any) => ({
        action: a.action || 'HOLD',
        stock_code: a.stock_code || '',
        quantity: a.quantity || 0,
        reasoning: a.reasoning || '',
        confidence: a.confidence || 50,
        target_price: a.target_price,
        stop_loss: a.stop_loss
      }))
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e)
    return null
  }
}

// Generate mock price (for demo - in production, use real API)
export function getMockStockPrice(stockCode: string): number {
  const stock = COMPANY_DATA.find(s => s.code === stockCode)
  if (!stock) return 0

  // Generate a reasonable price based on revenue scale
  const basePrice = Math.max(0.5, Math.min(50, (stock.latestRevenue ?? 100) / 100))
  // Add some randomness (+/- 5%)
  const variance = (Math.random() - 0.5) * 0.1
  return Number((basePrice * (1 + variance)).toFixed(4))
}

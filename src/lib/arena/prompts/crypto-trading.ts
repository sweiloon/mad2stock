/**
 * Mad2Arena - Crypto Trading Prompts
 *
 * Cryptocurrency trading mode for Mad2Arena
 * Adapted from stock trading prompts for crypto markets
 *
 * Key differences from stock trading:
 * - 24/7 market (no market hours restriction)
 * - Higher volatility tolerance
 * - Crypto-specific indicators (funding rates, on-chain data)
 * - Different liquidity considerations
 */

import type { CompetitionModeCode } from '../types'

// ============================================================================
// TYPES
// ============================================================================

export interface CryptoTradingContext {
  // Identity
  modelName: string
  participantId: string

  // Portfolio state
  cashBalance: number        // In USDT
  portfolioValue: number     // Total value in USDT
  totalPnL: number
  pnlPct: number
  totalTrades: number
  winningTrades: number
  initialCapital: number

  // Current crypto holdings
  holdings: CryptoHoldingContext[]

  // Recent trades (last 10)
  recentTrades: CryptoTradeContext[]

  // Market data
  marketData: CryptoMarketData

  // Competition context
  currentRank: number
  daysRemaining: number
  daysElapsed: number
  competitorCount: number

  // Mode-specific
  modeCode: CompetitionModeCode
}

export interface CryptoHoldingContext {
  symbol: string
  name: string
  quantity: number
  avgBuyPrice: number
  currentPrice: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  positionPct: number
  category: string  // Layer1, DeFi, Meme, etc.
}

export interface CryptoTradeContext {
  symbol: string
  tradeType: 'BUY' | 'SELL'
  price: number
  quantity: number
  pnl: number | null
  executedAt: string
  reasoning: string
}

export interface CryptoMarketData {
  // Market overview
  btcDominance: number
  totalMarketCap: number
  total24hVolume: number
  fearGreedIndex: number

  // Top movers
  topGainers: CryptoPriceData[]
  topLosers: CryptoPriceData[]

  // Tradeable universe
  tradingUniverse: CryptoPriceData[]

  // News/sentiment (if available)
  latestNews?: CryptoNewsItem[]

  timestamp: Date
}

export interface CryptoPriceData {
  symbol: string
  price: number
  change24h: number
  changePct24h: number
  volume24h: number
  high24h: number
  low24h: number
  category: string
  tier: 1 | 2 | 3
}

export interface CryptoNewsItem {
  title: string
  sentiment: 'positive' | 'negative' | 'neutral'
  symbols: string[]
  timestamp: string
}

// ============================================================================
// CRYPTO SYSTEM PROMPT
// ============================================================================

export function buildCryptoSystemPrompt(ctx: CryptoTradingContext): string {
  return `You are an expert cryptocurrency trader competing in the Mad2Arena Crypto Trading Competition.

## YOUR IDENTITY
You are ${ctx.modelName}, a sophisticated crypto trading AI with access to:
- Real-time crypto prices and volume data via Binance
- Market sentiment indicators and order flow analysis
- Technical analysis across multiple timeframes
- Historical trade memory and pattern recognition

## COMPETITION CONTEXT
- Market: Cryptocurrency (Top 100 coins via Binance)
- Quote Currency: USDT (Tether)
- Starting Capital: $10,000 USDT
- Duration: Competition period with hourly trading sessions
- Objective: Maximize risk-adjusted returns

## TRADING RULES
- Maximum Position: 25% of portfolio per coin
- Minimum Trade: $100 USDT
- Maximum Trade: $2,500 USDT
- Leverage: Not allowed (spot trading only)
- Available Coins: Top 20 by market cap (Tier 1)

## CRYPTO-SPECIFIC CONSIDERATIONS
- 24/7 Market: Crypto never sleeps, be mindful of your timing
- High Volatility: 5-10% daily moves are normal
- Correlation: Most altcoins correlate with BTC
- Liquidity: Stick to high-volume pairs
- News Impact: Crypto reacts strongly to news and sentiment

## TRADING PHILOSOPHY - TRUE FREE WILL
You are NOT required to trade every session. Act like a professional:
- HOLD (do nothing) is ALWAYS a valid and often wise decision
- Only trade when you find GENUINE opportunities with clear risk/reward
- Better to miss a trade than force a bad one
- USDT is a position - it protects capital during uncertainty
- Professional traders wait patiently for the right setup
- If your confidence is below 70%, consider HOLDING instead

## RESPONSE FORMAT
Respond with valid JSON only. No markdown, no code blocks.

For HOLD (no action):
{
  "action": "HOLD",
  "sentiment": "BULLISH|BEARISH|NEUTRAL",
  "reasoning": "Brief explanation why you're holding"
}

For BUY:
{
  "action": "BUY",
  "symbol": "BTC",
  "quantity": 0.001,
  "confidence": 85,
  "sentiment": "BULLISH",
  "reasoning": "Brief explanation for the trade"
}

For SELL:
{
  "action": "SELL",
  "symbol": "ETH",
  "quantity": 0.5,
  "confidence": 80,
  "sentiment": "BEARISH",
  "reasoning": "Brief explanation for the trade"
}

Remember: Quality over quantity. A well-reasoned HOLD beats a forced trade.`
}

// ============================================================================
// CRYPTO TRADING PROMPT (USER MESSAGE)
// ============================================================================

export function buildCryptoTradingPrompt(ctx: CryptoTradingContext): string {
  const { portfolioValue, cashBalance, holdings, recentTrades, marketData, currentRank, pnlPct, daysRemaining } = ctx

  let prompt = `## CURRENT SESSION - ${new Date().toISOString()}

## YOUR PORTFOLIO STATUS
- Total Value: $${portfolioValue.toFixed(2)} USDT
- Cash Available: $${cashBalance.toFixed(2)} USDT (${((cashBalance / portfolioValue) * 100).toFixed(1)}%)
- Total P&L: ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%
- Current Rank: #${currentRank}
- Days Remaining: ${daysRemaining}

`

  // Holdings section
  if (holdings.length > 0) {
    prompt += `## CURRENT POSITIONS
`
    holdings.forEach(h => {
      const pnlSign = h.unrealizedPnlPct >= 0 ? '+' : ''
      prompt += `- ${h.symbol} (${h.category}): ${h.quantity.toFixed(6)} @ $${h.avgBuyPrice.toFixed(2)} → $${h.currentPrice.toFixed(2)} (${pnlSign}${h.unrealizedPnlPct.toFixed(2)}%) [${h.positionPct.toFixed(1)}% of portfolio]
`
    })
    prompt += '\n'
  } else {
    prompt += `## CURRENT POSITIONS
No current holdings. 100% in USDT.

`
  }

  // Recent trades
  if (recentTrades.length > 0) {
    prompt += `## RECENT TRADES (last ${Math.min(recentTrades.length, 5)})
`
    recentTrades.slice(0, 5).forEach(t => {
      const pnlStr = t.pnl !== null ? ` P&L: $${t.pnl.toFixed(2)}` : ''
      prompt += `- ${t.tradeType} ${t.symbol}: ${t.quantity} @ $${t.price.toFixed(2)}${pnlStr}
`
    })
    prompt += '\n'
  }

  // Market data
  prompt += `## CRYPTO MARKET OVERVIEW
- BTC Dominance: ${marketData.btcDominance.toFixed(1)}%
- Fear & Greed Index: ${marketData.fearGreedIndex}/100
- 24h Market Volume: $${formatLargeNumber(marketData.total24hVolume)}

`

  // Top movers
  if (marketData.topGainers.length > 0) {
    prompt += `## TOP GAINERS (24h)
`
    marketData.topGainers.slice(0, 5).forEach(coin => {
      prompt += `- ${coin.symbol}: $${formatPrice(coin.price)} (+${coin.changePct24h.toFixed(2)}%) Vol: $${formatLargeNumber(coin.volume24h)}
`
    })
    prompt += '\n'
  }

  if (marketData.topLosers.length > 0) {
    prompt += `## TOP LOSERS (24h)
`
    marketData.topLosers.slice(0, 5).forEach(coin => {
      prompt += `- ${coin.symbol}: $${formatPrice(coin.price)} (${coin.changePct24h.toFixed(2)}%) Vol: $${formatLargeNumber(coin.volume24h)}
`
    })
    prompt += '\n'
  }

  // Trading universe
  prompt += `## TRADEABLE COINS (Tier 1 - Top 20)
`
  marketData.tradingUniverse.slice(0, 20).forEach(coin => {
    const changeSign = coin.changePct24h >= 0 ? '+' : ''
    prompt += `- ${coin.symbol} (${coin.category}): $${formatPrice(coin.price)} (${changeSign}${coin.changePct24h.toFixed(2)}%)
`
  })
  prompt += '\n'

  // News if available
  if (marketData.latestNews && marketData.latestNews.length > 0) {
    prompt += `## LATEST CRYPTO NEWS
`
    marketData.latestNews.slice(0, 3).forEach(news => {
      const sentimentEmoji = news.sentiment === 'positive' ? '📈' : news.sentiment === 'negative' ? '📉' : '➖'
      prompt += `${sentimentEmoji} ${news.title}
`
    })
    prompt += '\n'
  }

  prompt += `## YOUR DECISION
Analyze the market data and make your trading decision. Remember:
- You can HOLD if no clear opportunity exists
- Maximum 25% position size per coin
- Provide clear reasoning for your decision

Respond with JSON only.`

  return prompt
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (price >= 1) return price.toFixed(2)
  if (price >= 0.01) return price.toFixed(4)
  return price.toFixed(8)
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toFixed(2)
}

// ============================================================================
// PARSE AI RESPONSE
// ============================================================================

export interface CryptoTradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD'
  symbol?: string
  quantity?: number
  confidence?: number
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  reasoning: string
}

export function parseCryptoAIResponse(response: string): CryptoTradeDecision | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (!parsed.action || !['BUY', 'SELL', 'HOLD'].includes(parsed.action)) {
      return null
    }

    // For BUY/SELL, require symbol and quantity
    if (parsed.action !== 'HOLD') {
      if (!parsed.symbol || !parsed.quantity) {
        return null
      }
    }

    return {
      action: parsed.action,
      symbol: parsed.symbol?.toUpperCase(),
      quantity: parsed.quantity,
      confidence: parsed.confidence || 50,
      sentiment: parsed.sentiment || 'NEUTRAL',
      reasoning: parsed.reasoning || 'No reasoning provided',
    }
  } catch (err) {
    console.error('[CryptoTrading] Failed to parse AI response:', err)
    return null
  }
}

// ============================================================================
// AI SIGNAL AGENT - Expert Trading Signal Generator
// ============================================================================
// This is the core AI agent that monitors market data and generates
// professional trading signals with full transparency on data sources.
// ============================================================================

export const SIGNAL_AGENT_SYSTEM_PROMPT = `You are an expert trading signal analyst for Mad2Stock, a Malaysian stock market platform. Your role is to analyze multiple data sources and generate professional trading signals with FULL TRANSPARENCY.

## Your Core Responsibilities

1. **Analyze All Available Data**: You receive comprehensive data about a stock including:
   - Current price and recent price action
   - Technical indicators (RSI, MACD, Moving Averages, Volume)
   - Fundamental data (Revenue, Profit, P/E, Margins)
   - AI Insights (pre-generated daily analysis)
   - Recent news and market sentiment
   - Sector trends and market conditions

2. **Generate Actionable Signals**: Based on your analysis, you determine:
   - Signal Type: BUY, SELL, or HOLD
   - Confidence Level: 1-100%
   - Strength: Strong, Moderate, or Weak
   - Entry Price, Target Price, Stop Loss
   - Time Horizon: Intraday, Short-term (1-5 days), Medium-term (1-4 weeks), Long-term (1-3 months)

3. **Full Transparency**: For every signal, you MUST:
   - List ALL data sources used in your analysis
   - Explain HOW each source influenced your decision
   - Assign influence weight to each source (1-100%)
   - Acknowledge data limitations or gaps
   - Highlight key risks and catalysts

## Signal Generation Guidelines

### For BUY Signals:
- Strong technical support with bullish indicators
- Positive fundamental trends (revenue/profit growth)
- Favorable sector conditions
- Reasonable valuation or catalyst for re-rating
- Clear risk/reward ratio (minimum 2:1 for Strong signals)

### For SELL Signals:
- Technical breakdown or bearish patterns
- Deteriorating fundamentals
- Negative sector trends or macro headwinds
- Valuation concerns or loss of competitive advantage
- Clear downside targets with stop loss above entry

### For HOLD Signals:
- Mixed signals from different sources
- Awaiting catalyst or clarity
- Fair valuation without clear directional bias
- Recommend monitoring specific metrics

### Confidence Level Guide:
- **80-100%**: Strong conviction, multiple confirming sources, clear setup
- **60-79%**: Good setup but some uncertainty, most sources align
- **40-59%**: Mixed signals, proceed with caution
- **Below 40%**: Weak conviction, recommend smaller position or avoid

## Risk Assessment

For every signal, evaluate:
1. **Market Risk**: Overall market conditions and volatility
2. **Sector Risk**: Sector-specific headwinds or tailwinds
3. **Company Risk**: Execution risk, competitive threats, management
4. **Technical Risk**: Distance to stop loss, volatility
5. **Timing Risk**: Upcoming events, earnings, dividends

## Output Format

You MUST respond with a valid JSON object in this exact structure:

{
  "signal_type": "BUY" | "SELL" | "HOLD",
  "confidence_level": <number 1-100>,
  "strength": "Strong" | "Moderate" | "Weak",

  "entry_price": <number or null>,
  "target_price": <number or null>,
  "stop_loss": <number or null>,
  "potential_gain_pct": <number or null>,
  "risk_reward_ratio": <number or null>,

  "time_horizon": "Intraday" | "Short-term" | "Medium-term" | "Long-term",

  "summary": "<1-2 sentence overview of the signal and main thesis>",

  "reasoning": [
    "<Key reasoning point 1>",
    "<Key reasoning point 2>",
    "<Key reasoning point 3>"
  ],

  "key_catalysts": [
    "<Catalyst that could drive price movement>",
    "<Another catalyst>"
  ],

  "risks": [
    "<Key risk factor 1>",
    "<Key risk factor 2>"
  ],

  "sources": [
    {
      "type": "technical_indicator" | "fundamental_data" | "ai_insight" | "news" | "price_action" | "volume_analysis" | "sector_analysis" | "market_sentiment",
      "name": "<Source name, e.g., RSI, MACD, Revenue Growth>",
      "value": "<The actual data/value>",
      "interpretation": "<How you interpreted this data>",
      "influence_weight": <number 1-100>
    }
  ],

  "data_quality_score": <number 1-100>,
  "data_limitations": "<Note any missing or insufficient data>"
}

## Important Rules

1. **Never fabricate data** - Only use data provided to you
2. **Be honest about limitations** - If data is insufficient, acknowledge it
3. **Diversify reasoning** - Don't rely on single indicator
4. **Consider multiple timeframes** - Short-term noise vs long-term trend
5. **Risk-first approach** - Always define stop loss before target
6. **No emotional language** - Be objective and data-driven
7. **Malaysian market context** - Consider MYR, Bursa Malaysia regulations, local factors

## Disclaimer Awareness

Remember: Your signals will be displayed with this disclaimer:
"This is AI-generated analysis for educational purposes only. NOT investment advice. Always do your own research and consult a licensed financial advisor. Trading involves risk of capital loss."

Your job is to provide the best possible analysis given the data, while being transparent about uncertainty.`

// ============================================================================
// SIGNAL GENERATION USER PROMPT BUILDER
// ============================================================================

export interface SignalInputData {
  // Company basics
  stockCode: string
  companyName: string
  sector: string

  // Current price data
  currentPrice: number | null
  priceChange: number | null
  priceChangePercent: number | null
  volume: number | null
  avgVolume: number | null

  // Price history (for technical analysis)
  high52Week: number | null
  low52Week: number | null
  previousClose: number | null

  // Technical indicators (if available)
  rsi14?: number | null
  macd?: { value: number; signal: number; histogram: number } | null
  sma20?: number | null
  sma50?: number | null
  sma200?: number | null

  // Fundamental data
  revenue?: number | null
  profit?: number | null
  revenueYoY?: number | null
  profitYoY?: number | null
  revenueQoQ?: number | null
  profitQoQ?: number | null
  peRatio?: number | null
  pbRatio?: number | null
  dividendYield?: number | null
  marketCap?: number | null

  // AI Insights (from daily cache)
  aiInsight?: {
    summary: string
    insights: string[]
    outlook: string
    keyMetric: string | null
  } | null

  // YoY/QoQ category
  yoyCategory?: number | null
  qoqCategory?: number | null

  // News (if available)
  recentNews?: Array<{
    title: string
    summary?: string
    sentiment?: string
    date?: string
  }>

  // Market context
  marketSentiment?: string
  sectorTrend?: string
}

export function buildSignalPrompt(data: SignalInputData): string {
  const categoryLabels: Record<number, string> = {
    1: "Revenue UP, Profit UP (Growth)",
    2: "Revenue DOWN, Profit UP (Efficient)",
    3: "Revenue UP, Profit DOWN (Pressure)",
    4: "Revenue DOWN, Profit DOWN (Decline)",
    5: "Turnaround",
    6: "Deteriorating",
  }

  const formatPrice = (price: number | null | undefined) =>
    price ? `RM ${price.toFixed(4)}` : 'N/A'

  const formatPercent = (pct: number | null | undefined) =>
    pct !== null && pct !== undefined ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : 'N/A'

  const formatNumber = (num: number | null | undefined) =>
    num ? num.toLocaleString() : 'N/A'

  const formatMillions = (num: number | null | undefined) =>
    num ? `RM ${num.toFixed(1)}M` : 'N/A'

  let prompt = `Analyze this Malaysian stock and generate a trading signal:

## COMPANY INFORMATION
- Stock Code: ${data.stockCode}
- Company Name: ${data.companyName}
- Sector: ${data.sector}

## CURRENT PRICE DATA
- Current Price: ${formatPrice(data.currentPrice)}
- Price Change: ${formatPrice(data.priceChange)} (${formatPercent(data.priceChangePercent)})
- Previous Close: ${formatPrice(data.previousClose)}
- Volume: ${formatNumber(data.volume)}
- Average Volume: ${formatNumber(data.avgVolume)}
- 52-Week High: ${formatPrice(data.high52Week)}
- 52-Week Low: ${formatPrice(data.low52Week)}
`

  // Technical Indicators
  prompt += `
## TECHNICAL INDICATORS`

  if (data.rsi14 !== undefined && data.rsi14 !== null) {
    prompt += `
- RSI (14): ${data.rsi14.toFixed(2)} ${data.rsi14 > 70 ? '(Overbought)' : data.rsi14 < 30 ? '(Oversold)' : '(Neutral)'}`
  } else {
    prompt += `
- RSI (14): N/A`
  }

  if (data.macd) {
    prompt += `
- MACD: ${data.macd.value.toFixed(4)} (Signal: ${data.macd.signal.toFixed(4)}, Histogram: ${data.macd.histogram.toFixed(4)})`
  } else {
    prompt += `
- MACD: N/A`
  }

  prompt += `
- SMA 20: ${formatPrice(data.sma20)}
- SMA 50: ${formatPrice(data.sma50)}
- SMA 200: ${formatPrice(data.sma200)}
`

  // Moving Average Position
  if (data.currentPrice && data.sma20 && data.sma50 && data.sma200) {
    const above20 = data.currentPrice > data.sma20
    const above50 = data.currentPrice > data.sma50
    const above200 = data.currentPrice > data.sma200
    prompt += `- MA Position: Price is ${above20 ? 'ABOVE' : 'BELOW'} SMA20, ${above50 ? 'ABOVE' : 'BELOW'} SMA50, ${above200 ? 'ABOVE' : 'BELOW'} SMA200
`
  }

  // Fundamental Data
  prompt += `
## FUNDAMENTAL DATA
- Latest Revenue: ${formatMillions(data.revenue)}
- Latest Profit: ${formatMillions(data.profit)}
- Revenue YoY: ${formatPercent(data.revenueYoY)}
- Profit YoY: ${formatPercent(data.profitYoY)}
- Revenue QoQ: ${formatPercent(data.revenueQoQ)}
- Profit QoQ: ${formatPercent(data.profitQoQ)}
- P/E Ratio: ${data.peRatio ? data.peRatio.toFixed(2) : 'N/A'}
- P/B Ratio: ${data.pbRatio ? data.pbRatio.toFixed(2) : 'N/A'}
- Dividend Yield: ${data.dividendYield ? `${data.dividendYield.toFixed(2)}%` : 'N/A'}
- Market Cap: ${data.marketCap ? `RM ${(data.marketCap / 1000000000).toFixed(2)}B` : 'N/A'}
`

  // Performance Category
  if (data.yoyCategory || data.qoqCategory) {
    prompt += `
## PERFORMANCE CATEGORY
- YoY Category: ${data.yoyCategory ? categoryLabels[data.yoyCategory] || 'Unknown' : 'N/A'}
- QoQ Category: ${data.qoqCategory ? categoryLabels[data.qoqCategory] || 'Unknown' : 'N/A'}
`
  }

  // AI Insights (if available)
  if (data.aiInsight) {
    prompt += `
## AI INSIGHTS (Daily Analysis)
- Summary: ${data.aiInsight.summary}
- Outlook: ${data.aiInsight.outlook}
- Key Metric: ${data.aiInsight.keyMetric || 'N/A'}
- Insights:
${data.aiInsight.insights.map(i => `  • ${i}`).join('\n')}
`
  } else {
    prompt += `
## AI INSIGHTS
- Not yet generated for this company
`
  }

  // Recent News
  if (data.recentNews && data.recentNews.length > 0) {
    prompt += `
## RECENT NEWS
${data.recentNews.map((news, i) => `${i + 1}. [${news.sentiment || 'Unknown'}] ${news.title}${news.summary ? ` - ${news.summary}` : ''}${news.date ? ` (${news.date})` : ''}`).join('\n')}
`
  } else {
    prompt += `
## RECENT NEWS
- No recent news available
`
  }

  // Market Context
  prompt += `
## MARKET CONTEXT
- Overall Market Sentiment: ${data.marketSentiment || 'Neutral'}
- Sector Trend: ${data.sectorTrend || 'Unknown'}
`

  prompt += `
---
Based on ALL the above data, generate a comprehensive trading signal with full transparency on your sources and reasoning. Respond with JSON only.`

  return prompt
}

// ============================================================================
// SIGNAL CODE GENERATOR
// ============================================================================

export function generateSignalCode(stockCode: string): string {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `SIG-${stockCode}-${dateStr}-${random}`
}

// ============================================================================
// SIGNAL VALIDATION
// ============================================================================

export interface SignalOutput {
  signal_type: 'BUY' | 'SELL' | 'HOLD'
  confidence_level: number
  strength: 'Strong' | 'Moderate' | 'Weak'
  entry_price: number | null
  target_price: number | null
  stop_loss: number | null
  potential_gain_pct: number | null
  risk_reward_ratio: number | null
  time_horizon: 'Intraday' | 'Short-term' | 'Medium-term' | 'Long-term'
  summary: string
  reasoning: string[]
  key_catalysts: string[]
  risks: string[]
  sources: Array<{
    type: string
    name: string
    value: string
    interpretation: string
    influence_weight: number
  }>
  data_quality_score: number
  data_limitations: string
}

export function validateSignalOutput(output: any): SignalOutput | null {
  try {
    // Validate required fields
    if (!output.signal_type || !['BUY', 'SELL', 'HOLD'].includes(output.signal_type)) {
      console.error('Invalid signal_type')
      return null
    }

    if (typeof output.confidence_level !== 'number' || output.confidence_level < 1 || output.confidence_level > 100) {
      console.error('Invalid confidence_level')
      return null
    }

    if (!output.strength || !['Strong', 'Moderate', 'Weak'].includes(output.strength)) {
      console.error('Invalid strength')
      return null
    }

    if (!output.time_horizon || !['Intraday', 'Short-term', 'Medium-term', 'Long-term'].includes(output.time_horizon)) {
      console.error('Invalid time_horizon')
      return null
    }

    if (!output.summary || typeof output.summary !== 'string') {
      console.error('Invalid summary')
      return null
    }

    if (!Array.isArray(output.reasoning) || output.reasoning.length === 0) {
      console.error('Invalid reasoning')
      return null
    }

    if (!Array.isArray(output.sources) || output.sources.length === 0) {
      console.error('Invalid sources')
      return null
    }

    // Validate price targets for BUY/SELL signals
    if (output.signal_type === 'BUY') {
      if (output.target_price && output.entry_price && output.target_price <= output.entry_price) {
        console.warn('BUY signal target_price should be above entry_price')
      }
    }

    if (output.signal_type === 'SELL') {
      if (output.target_price && output.entry_price && output.target_price >= output.entry_price) {
        console.warn('SELL signal target_price should be below entry_price')
      }
    }

    return {
      signal_type: output.signal_type,
      confidence_level: Math.round(output.confidence_level),
      strength: output.strength,
      entry_price: output.entry_price || null,
      target_price: output.target_price || null,
      stop_loss: output.stop_loss || null,
      potential_gain_pct: output.potential_gain_pct || null,
      risk_reward_ratio: output.risk_reward_ratio || null,
      time_horizon: output.time_horizon,
      summary: output.summary,
      reasoning: output.reasoning || [],
      key_catalysts: output.key_catalysts || [],
      risks: output.risks || [],
      sources: output.sources || [],
      data_quality_score: output.data_quality_score || 50,
      data_limitations: output.data_limitations || '',
    }
  } catch (error) {
    console.error('Signal validation error:', error)
    return null
  }
}

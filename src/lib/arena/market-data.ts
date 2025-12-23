/**
 * Mad2Arena - Market Data Pipeline
 * Provides comprehensive real-time market data to AI models
 *
 * Data Sources:
 * - stock_prices table: Real-time prices, volume, change%
 * - News API: Market news and sentiment
 * - COMPANY_DATA: Fundamentals (YoY performance, financials)
 * - Order flow: Buy/sell pressure indicators
 */

import { createAdminClient } from '@/lib/supabase/server'
import { COMPANY_DATA } from '@/lib/company-data'

// ============================================================================
// TYPES
// ============================================================================

export interface StockPrice {
  stockCode: string
  stockName: string
  price: number
  previousClose: number
  change: number
  changePct: number
  volume: number
  avgVolume: number  // 20-day average
  volumeRatio: number  // Today's volume vs avg
  high: number
  low: number
  open: number
  bid: number
  ask: number
  bidSize: number
  askSize: number
  lastUpdated: string
}

export interface MarketMover {
  stockCode: string
  stockName: string
  price: number
  changePct: number
  volume: number
  sector: string
}

export interface MarketNews {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  relatedStocks: string[]
}

export interface MarketSentiment {
  overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  advanceDecline: { advances: number; declines: number; unchanged: number }
  buyPressure: number  // 0-100
  sectorSentiment: Record<string, 'BULLISH' | 'BEARISH' | 'NEUTRAL'>
}

export interface MarketIndices {
  klci: { value: number; change: number; changePct: number }
  klciVolume: number
  foreignFlow: number  // Net foreign buy/sell in RM millions
  retailFlow: number
}

export interface OrderBookData {
  stockCode: string
  bidDepth: Array<{ price: number; volume: number }>
  askDepth: Array<{ price: number; volume: number }>
  buyPressure: number  // 0-100
  imbalance: number  // Positive = more buyers, negative = more sellers
}

export interface StockFundamentals {
  stockCode: string
  stockName: string
  sector: string
  marketCap: number
  revenueYoY: number
  profitYoY: number
  yoyCategory: number  // 1-6
  latestRevenue: number
  latestProfit: number
}

export interface ComprehensiveMarketData {
  timestamp: string
  marketOpen: boolean

  // Market Overview
  indices: MarketIndices
  sentiment: MarketSentiment

  // Top Movers
  topGainers: MarketMover[]
  topLosers: MarketMover[]
  volumeLeaders: MarketMover[]

  // News
  latestNews: MarketNews[]

  // Available Stocks with Fundamentals
  stocksWithData: StockFundamentals[]

  // Real-time prices for specific stocks
  stockPrices: Record<string, StockPrice>
}

// ============================================================================
// MARKET DATA FETCHERS
// ============================================================================

/**
 * Fetch real-time stock prices from database
 */
export async function getStockPrices(stockCodes?: string[]): Promise<Record<string, StockPrice>> {
  const supabase = createAdminClient() as any

  let query = supabase
    .from('stock_prices')
    .select('*')
    .order('updated_at', { ascending: false })

  if (stockCodes && stockCodes.length > 0) {
    query = query.in('stock_code', stockCodes)
  }

  const { data, error } = await query.limit(200)

  if (error) {
    console.error('Error fetching stock prices:', error)
    return {}
  }

  const prices: Record<string, StockPrice> = {}

  for (const row of data || []) {
    const company = COMPANY_DATA.find(c => c.code === row.stock_code)
    const previousClose = row.previous_close || row.price
    const change = row.price - previousClose
    const changePct = previousClose > 0 ? (change / previousClose) * 100 : 0
    const avgVolume = row.avg_volume || row.volume || 100000

    prices[row.stock_code] = {
      stockCode: row.stock_code,
      stockName: company?.name || row.stock_code,
      price: row.price,
      previousClose,
      change,
      changePct,
      volume: row.volume || 0,
      avgVolume,
      volumeRatio: avgVolume > 0 ? (row.volume || 0) / avgVolume : 1,
      high: row.high || row.price,
      low: row.low || row.price,
      open: row.open || row.price,
      bid: row.bid || row.price * 0.999,
      ask: row.ask || row.price * 1.001,
      bidSize: row.bid_size || 10000,
      askSize: row.ask_size || 10000,
      lastUpdated: row.updated_at
    }
  }

  return prices
}

/**
 * Get top market movers (gainers/losers/volume leaders)
 */
export async function getMarketMovers(): Promise<{
  gainers: MarketMover[]
  losers: MarketMover[]
  volumeLeaders: MarketMover[]
}> {
  const supabase = createAdminClient() as any

  // Fetch all prices
  const { data: pricesData } = await supabase
    .from('stock_prices')
    .select('stock_code, price, previous_close, volume, change_pct')
    .order('updated_at', { ascending: false })
    .limit(500)

  const movers = (pricesData || []).map((p: any) => {
    const company = COMPANY_DATA.find(c => c.code === p.stock_code)
    const previousClose = p.previous_close || p.price
    const changePct = p.change_pct || (previousClose > 0 ? ((p.price - previousClose) / previousClose) * 100 : 0)

    return {
      stockCode: p.stock_code,
      stockName: company?.name || p.stock_code,
      price: p.price,
      changePct,
      volume: p.volume || 0,
      sector: company?.sector || 'Unknown'
    }
  })

  // Sort for gainers (top positive changes)
  const gainers = [...movers]
    .filter(m => m.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 10)

  // Sort for losers (most negative changes)
  const losers = [...movers]
    .filter(m => m.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, 10)

  // Sort for volume leaders
  const volumeLeaders = [...movers]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10)

  return { gainers, losers, volumeLeaders }
}

/**
 * Get market sentiment indicators
 */
export async function getMarketSentiment(): Promise<MarketSentiment> {
  const supabase = createAdminClient() as any

  const { data: pricesData } = await supabase
    .from('stock_prices')
    .select('stock_code, price, previous_close, volume, bid_size, ask_size')

  let advances = 0
  let declines = 0
  let unchanged = 0
  let totalBidSize = 0
  let totalAskSize = 0

  for (const p of pricesData || []) {
    const previousClose = p.previous_close || p.price
    const change = p.price - previousClose

    if (change > 0) advances++
    else if (change < 0) declines++
    else unchanged++

    totalBidSize += p.bid_size || 0
    totalAskSize += p.ask_size || 0
  }

  const totalStocks = advances + declines + unchanged
  const buyPressure = totalBidSize + totalAskSize > 0
    ? (totalBidSize / (totalBidSize + totalAskSize)) * 100
    : 50

  // Determine overall sentiment
  let overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
  if (totalStocks > 0) {
    const advanceRatio = advances / totalStocks
    if (advanceRatio > 0.6) overall = 'BULLISH'
    else if (advanceRatio < 0.4) overall = 'BEARISH'
  }

  // Sector sentiment (simplified)
  const sectors = ['Technology', 'Finance', 'Consumer', 'Healthcare', 'Industrial', 'Property', 'Plantation']
  const sectorSentiment: Record<string, 'BULLISH' | 'BEARISH' | 'NEUTRAL'> = {}

  for (const sector of sectors) {
    const sectorStocks = (pricesData || []).filter((p: any) => {
      const company = COMPANY_DATA.find(c => c.code === p.stock_code)
      return company?.sector === sector
    })

    let sectorAdvances = 0
    let sectorDeclines = 0

    for (const p of sectorStocks) {
      const previousClose = p.previous_close || p.price
      if (p.price > previousClose) sectorAdvances++
      else if (p.price < previousClose) sectorDeclines++
    }

    const total = sectorAdvances + sectorDeclines
    if (total > 0) {
      const ratio = sectorAdvances / total
      sectorSentiment[sector] = ratio > 0.6 ? 'BULLISH' : ratio < 0.4 ? 'BEARISH' : 'NEUTRAL'
    } else {
      sectorSentiment[sector] = 'NEUTRAL'
    }
  }

  return {
    overall,
    advanceDecline: { advances, declines, unchanged },
    buyPressure,
    sectorSentiment
  }
}

/**
 * Get KLCI index data
 */
export async function getMarketIndices(): Promise<MarketIndices> {
  const supabase = createAdminClient() as any

  // Try to get KLCI data from database
  const { data: klciData } = await supabase
    .from('market_indices')
    .select('*')
    .eq('index_code', 'KLCI')
    .single()

  // Default values if not available
  const klci = klciData || { value: 1580, change: 0, change_pct: 0 }

  return {
    klci: {
      value: klci.value || 1580,
      change: klci.change || 0,
      changePct: klci.change_pct || 0
    },
    klciVolume: klci.volume || 1500000000,
    foreignFlow: klci.foreign_flow || 0,
    retailFlow: klci.retail_flow || 0
  }
}

/**
 * Get market news (from database or generate summary)
 */
export async function getMarketNews(limit: number = 5): Promise<MarketNews[]> {
  const supabase = createAdminClient() as any

  // Try to get news from database
  const { data: newsData } = await supabase
    .from('market_news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (newsData && newsData.length > 0) {
    return newsData.map((n: any) => ({
      id: n.id,
      title: n.title,
      summary: n.summary,
      source: n.source,
      publishedAt: n.published_at,
      sentiment: n.sentiment || 'NEUTRAL',
      relatedStocks: n.related_stocks || []
    }))
  }

  // Return market context news as fallback
  const now = new Date()
  return [
    {
      id: '1',
      title: 'KLSE Market Update',
      summary: 'Malaysian market trading mixed amid regional volatility. Technology and banking sectors in focus.',
      source: 'Market Analysis',
      publishedAt: now.toISOString(),
      sentiment: 'NEUTRAL',
      relatedStocks: ['MAYBANK', 'CIMB', 'TENAGA']
    },
    {
      id: '2',
      title: 'Regional Markets Overview',
      summary: 'Asian markets showing resilience. Key focus on China economic data and Fed policy outlook.',
      source: 'Regional Analysis',
      publishedAt: now.toISOString(),
      sentiment: 'NEUTRAL',
      relatedStocks: []
    }
  ]
}

/**
 * Get order book data for a stock (simulated from bid/ask)
 */
export async function getOrderBook(stockCode: string): Promise<OrderBookData> {
  const supabase = createAdminClient() as any

  const { data: priceData } = await supabase
    .from('stock_prices')
    .select('price, bid, ask, bid_size, ask_size')
    .eq('stock_code', stockCode)
    .single()

  const price = priceData?.price || 1
  const bid = priceData?.bid || price * 0.999
  const ask = priceData?.ask || price * 1.001
  const bidSize = priceData?.bid_size || 10000
  const askSize = priceData?.ask_size || 10000

  // Generate depth levels
  const bidDepth = [
    { price: bid, volume: bidSize },
    { price: bid * 0.998, volume: bidSize * 0.8 },
    { price: bid * 0.996, volume: bidSize * 0.6 },
    { price: bid * 0.994, volume: bidSize * 0.4 },
    { price: bid * 0.992, volume: bidSize * 0.3 }
  ]

  const askDepth = [
    { price: ask, volume: askSize },
    { price: ask * 1.002, volume: askSize * 0.8 },
    { price: ask * 1.004, volume: askSize * 0.6 },
    { price: ask * 1.006, volume: askSize * 0.4 },
    { price: ask * 1.008, volume: askSize * 0.3 }
  ]

  const totalBid = bidDepth.reduce((sum, b) => sum + b.volume, 0)
  const totalAsk = askDepth.reduce((sum, a) => sum + a.volume, 0)
  const buyPressure = totalBid + totalAsk > 0 ? (totalBid / (totalBid + totalAsk)) * 100 : 50
  const imbalance = totalBid - totalAsk

  return {
    stockCode,
    bidDepth,
    askDepth,
    buyPressure,
    imbalance
  }
}

/**
 * Get stock fundamentals from COMPANY_DATA
 */
export function getStockFundamentals(): StockFundamentals[] {
  return COMPANY_DATA.map(company => ({
    stockCode: company.code,
    stockName: company.name,
    sector: company.sector || 'Unknown',
    marketCap: company.marketCap || 0,
    revenueYoY: company.revenueYoY || 0,
    profitYoY: company.profitYoY || 0,
    yoyCategory: company.yoyCategory || 4,
    latestRevenue: company.latestRevenue || 0,
    latestProfit: company.latestProfit || 0
  }))
}

// ============================================================================
// COMPREHENSIVE DATA BUILDER
// ============================================================================

/**
 * Build comprehensive market data for AI trading decisions
 * This is the main function that provides ALL data to the AI models
 */
export async function buildComprehensiveMarketData(
  specificStocks?: string[]
): Promise<ComprehensiveMarketData> {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()
  const marketOpen = day !== 0 && day !== 6 && hour >= 9 && hour < 17

  // Fetch all data in parallel
  const [
    stockPrices,
    movers,
    sentiment,
    indices,
    news
  ] = await Promise.all([
    getStockPrices(specificStocks),
    getMarketMovers(),
    getMarketSentiment(),
    getMarketIndices(),
    getMarketNews(5)
  ])

  const fundamentals = getStockFundamentals()

  return {
    timestamp: now.toISOString(),
    marketOpen,
    indices,
    sentiment,
    topGainers: movers.gainers,
    topLosers: movers.losers,
    volumeLeaders: movers.volumeLeaders,
    latestNews: news,
    stocksWithData: fundamentals.slice(0, 100),  // Top 100 for context
    stockPrices
  }
}

/**
 * Format market data for prompt injection
 */
export function formatMarketDataForPrompt(data: ComprehensiveMarketData): string {
  const { indices, sentiment, topGainers, topLosers, volumeLeaders, latestNews } = data

  const sections: string[] = []

  // Market Status
  sections.push(`## 📊 MARKET STATUS (${new Date(data.timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })})`)
  sections.push(`Market: ${data.marketOpen ? '🟢 OPEN' : '🔴 CLOSED'}`)

  // KLCI Index
  sections.push(`
### KLCI Index
- Value: ${indices.klci.value.toFixed(2)}
- Change: ${indices.klci.change >= 0 ? '+' : ''}${indices.klci.change.toFixed(2)} (${indices.klci.changePct >= 0 ? '+' : ''}${indices.klci.changePct.toFixed(2)}%)
- Volume: RM ${(indices.klciVolume / 1000000).toFixed(1)}M
- Foreign Flow: ${indices.foreignFlow >= 0 ? '+' : ''}RM ${indices.foreignFlow.toFixed(1)}M`)

  // Market Sentiment
  sections.push(`
### Market Sentiment: ${sentiment.overall}
- Advances: ${sentiment.advanceDecline.advances} | Declines: ${sentiment.advanceDecline.declines} | Unchanged: ${sentiment.advanceDecline.unchanged}
- Buy Pressure: ${sentiment.buyPressure.toFixed(1)}%`)

  // Top Gainers
  if (topGainers.length > 0) {
    sections.push(`
### 🚀 Top Gainers`)
    topGainers.slice(0, 5).forEach(g => {
      sections.push(`- ${g.stockCode}: RM${g.price.toFixed(3)} (+${g.changePct.toFixed(2)}%) Vol: ${(g.volume / 1000).toFixed(0)}K`)
    })
  }

  // Top Losers
  if (topLosers.length > 0) {
    sections.push(`
### 📉 Top Losers`)
    topLosers.slice(0, 5).forEach(l => {
      sections.push(`- ${l.stockCode}: RM${l.price.toFixed(3)} (${l.changePct.toFixed(2)}%) Vol: ${(l.volume / 1000).toFixed(0)}K`)
    })
  }

  // Volume Leaders
  if (volumeLeaders.length > 0) {
    sections.push(`
### 📊 Volume Leaders`)
    volumeLeaders.slice(0, 5).forEach(v => {
      sections.push(`- ${v.stockCode}: RM${v.price.toFixed(3)} (${v.changePct >= 0 ? '+' : ''}${v.changePct.toFixed(2)}%) Vol: ${(v.volume / 1000000).toFixed(2)}M`)
    })
  }

  // News Headlines
  if (latestNews.length > 0) {
    sections.push(`
### 📰 Latest News`)
    latestNews.forEach(n => {
      const sentimentEmoji = n.sentiment === 'POSITIVE' ? '🟢' : n.sentiment === 'NEGATIVE' ? '🔴' : '⚪'
      sections.push(`${sentimentEmoji} ${n.title}`)
      sections.push(`   ${n.summary}`)
    })
  }

  return sections.join('\n')
}

/**
 * Format stock fundamentals for prompt
 */
export function formatFundamentalsForPrompt(stocks: StockFundamentals[]): string {
  const byCategory: Record<number, StockFundamentals[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  }

  stocks.forEach(s => {
    const cat = s.yoyCategory || 4
    if (byCategory[cat]) byCategory[cat].push(s)
  })

  const sections: string[] = []

  // Category 1 - Strong Growth
  if (byCategory[1].length > 0) {
    sections.push(`
### Category 1 - Strong Growth (Revenue UP, Profit UP) - BEST
Best stocks with both revenue and profit growth:`)
    byCategory[1].slice(0, 10).forEach(s => {
      sections.push(`- ${s.stockCode} (${s.sector}): Rev ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}%, Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}%`)
    })
  }

  // Category 2 - Efficiency Gains
  if (byCategory[2].length > 0) {
    sections.push(`
### Category 2 - Efficiency Gains (Revenue DOWN, Profit UP)
Companies improving margins despite lower revenue:`)
    byCategory[2].slice(0, 5).forEach(s => {
      sections.push(`- ${s.stockCode} (${s.sector}): Rev ${s.revenueYoY.toFixed(1)}%, Profit +${s.profitYoY.toFixed(1)}%`)
    })
  }

  // Category 5 - Turnaround
  if (byCategory[5].length > 0) {
    sections.push(`
### Category 5 - Turnaround (Loss to Profit) - HIGH RISK/REWARD
Companies that turned profitable:`)
    byCategory[5].slice(0, 5).forEach(s => {
      sections.push(`- ${s.stockCode} (${s.sector}): Rev ${s.revenueYoY >= 0 ? '+' : ''}${s.revenueYoY.toFixed(1)}%, Profit ${s.profitYoY >= 0 ? '+' : ''}${s.profitYoY.toFixed(1)}%`)
    })
  }

  return sections.join('\n')
}

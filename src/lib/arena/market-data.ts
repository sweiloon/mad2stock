/**
 * Mad2Arena - Market Data Pipeline (v2)
 *
 * COMPLETELY REDESIGNED:
 * - Uses intelligent screening system instead of random top gainers/losers
 * - Pre-screens ALL stocks using fundamental criteria
 * - Presents tiered opportunities based on Malaysia market priorities:
 *   1. PE Ratio (value)
 *   2. YoY Category (growth pattern)
 *   3. Profitability (not loss-making)
 *   4. Dividend Yield (income)
 *   5. 52-Week Position (technical)
 *   6. Volume Activity (liquidity)
 */

import { createAdminClient } from '@/lib/supabase/server'
import { screenAllStocks, formatScreeningForPrompt, type ScreeningResult, type ScreenedStock } from './screening'

// ============================================================================
// TYPES
// ============================================================================

export interface MarketIndices {
  klci: { value: number; change: number; changePct: number }
  klciVolume: number
  foreignFlow: number
  retailFlow: number
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

export interface ComprehensiveMarketData {
  timestamp: string
  marketOpen: boolean

  // NEW: Intelligent Screening Results
  screening: ScreeningResult

  // Market Overview
  indices: MarketIndices

  // News (if available)
  latestNews: MarketNews[]

  // Formatted prompt section (ready to inject into AI prompt)
  formattedPrompt: string
}

// Re-export screening types for convenience
export type { ScreeningResult, ScreenedStock }

// ============================================================================
// MARKET DATA FETCHERS
// ============================================================================

/**
 * Get KLCI index data
 */
async function getMarketIndices(): Promise<MarketIndices> {
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
 * Get market news
 */
async function getMarketNews(limit: number = 5): Promise<MarketNews[]> {
  const supabase = createAdminClient() as any

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
      summary: 'Malaysian market trading mixed. Focus on fundamentals: PE ratio, YoY growth, and dividend yield.',
      source: 'Market Analysis',
      publishedAt: now.toISOString(),
      sentiment: 'NEUTRAL',
      relatedStocks: []
    }
  ]
}

// ============================================================================
// COMPREHENSIVE DATA BUILDER (v2)
// ============================================================================

/**
 * Build comprehensive market data for AI trading decisions
 * This is the main function that provides ALL data to the AI models
 *
 * NEW APPROACH:
 * - Screens ALL 763 stocks using fundamental criteria
 * - Presents tiered opportunities (Top 20, Watchlist 30, Universe 50)
 * - Includes sector leaders and market health indicators
 */
export async function buildComprehensiveMarketData(): Promise<ComprehensiveMarketData> {
  const now = new Date()
  const myt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }))
  const hour = myt.getHours()
  const day = myt.getDay()
  const marketOpen = day !== 0 && day !== 6 && hour >= 9 && hour < 17 &&
    !(hour === 12 && myt.getMinutes() >= 30) && hour !== 13 && !(hour === 14 && myt.getMinutes() < 30)

  console.log('📊 Running intelligent stock screening...')

  // Run comprehensive screening of ALL stocks
  const screening = await screenAllStocks()

  console.log(`✅ Screened ${screening.totalStocksAnalyzed} stocks`)
  console.log(`   Tier 1: ${screening.tier1Opportunities.length} top opportunities`)
  console.log(`   Tier 2: ${screening.tier2Watchlist.length} watchlist`)
  console.log(`   Tier 3: ${screening.tier3Universe.length} universe`)

  // Fetch additional data in parallel
  const [indices, news] = await Promise.all([
    getMarketIndices(),
    getMarketNews(5)
  ])

  // Format the screening results for AI prompt
  const formattedPrompt = formatScreeningForPrompt(screening)

  return {
    timestamp: now.toISOString(),
    marketOpen,
    screening,
    indices,
    latestNews: news,
    formattedPrompt
  }
}

/**
 * Format indices for prompt
 */
export function formatIndicesForPrompt(indices: MarketIndices): string {
  return `
## KLCI INDEX
Value: ${indices.klci.value.toFixed(2)} | Change: ${indices.klci.change >= 0 ? '+' : ''}${indices.klci.change.toFixed(2)} (${indices.klci.changePct >= 0 ? '+' : ''}${indices.klci.changePct.toFixed(2)}%)
Volume: RM ${(indices.klciVolume / 1000000000).toFixed(2)}B | Foreign Flow: ${indices.foreignFlow >= 0 ? '+' : ''}RM ${indices.foreignFlow.toFixed(1)}M
`
}

/**
 * Format news for prompt
 */
export function formatNewsForPrompt(news: MarketNews[]): string {
  if (news.length === 0) return ''

  const newsLines = news.map(n => {
    const emoji = n.sentiment === 'POSITIVE' ? '🟢' : n.sentiment === 'NEGATIVE' ? '🔴' : '⚪'
    return `${emoji} ${n.title}\n   ${n.summary}`
  }).join('\n')

  return `
## 📰 LATEST NEWS
${newsLines}
`
}

/**
 * Get quick stock lookup for AI (when it wants to check a specific stock)
 */
export async function getStockQuickLookup(stockCode: string): Promise<ScreenedStock | null> {
  const result = await screenAllStocks()
  const allStocks = [
    ...result.tier1Opportunities,
    ...result.tier2Watchlist,
    ...result.tier3Universe
  ]
  return allStocks.find(s => s.stockCode.toUpperCase() === stockCode.toUpperCase()) || null
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// These are deprecated but kept for any code that might still use them
export interface StockPrice {
  stockCode: string
  stockName: string
  price: number
  previousClose: number
  change: number
  changePct: number
  volume: number
  avgVolume: number
  volumeRatio: number
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

export interface MarketSentiment {
  overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  advanceDecline: { advances: number; declines: number; unchanged: number }
  buyPressure: number
  sectorSentiment: Record<string, 'BULLISH' | 'BEARISH' | 'NEUTRAL'>
}

export interface StockFundamentals {
  stockCode: string
  stockName: string
  sector: string
  marketCap: number
  revenueYoY: number
  profitYoY: number
  yoyCategory: number
  latestRevenue: number
  latestProfit: number
}

export interface OrderBookData {
  stockCode: string
  bidDepth: Array<{ price: number; volume: number }>
  askDepth: Array<{ price: number; volume: number }>
  buyPressure: number
  imbalance: number
}

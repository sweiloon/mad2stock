/**
 * Mad2Arena - Intelligent Stock Screening System
 *
 * HYBRID APPROACH:
 * - Database for fundamentals (YoY category, PE, revenue, profit - quarterly data)
 * - Real-time API for prices, volume, momentum (EODHD/Yahoo)
 *
 * Key Malaysia Market Factors (Priority Order):
 * 1. YoY Category 1 - Revenue UP, Profit UP (BEST)
 * 2. YoY Category 5 - Turnaround (Loss to Profit) - HIGH POTENTIAL
 * 3. PE Ratio - Value indicator
 * 4. Volume Activity - Liquidity and interest
 * 5. 52-Week Position - Technical levels
 * 6. All other categories - Lower priority but still opportunities
 */

import { createAdminClient } from '@/lib/supabase/server'
import { fetchBatchQuotes, type RealTimeQuote } from './realtime-data'

// ============================================================================
// TYPES
// ============================================================================

export interface ScreenedStock {
  // Identity
  stockCode: string
  stockName: string
  sector: string

  // Price Data
  currentPrice: number
  previousClose: number
  changePct: number
  volume: number
  avgVolume: number
  volumeRatio: number  // volume / avgVolume

  // Valuation
  peRatio: number | null
  eps: number | null
  dividendYield: number | null
  marketCap: number

  // 52-Week Analysis
  week52High: number
  week52Low: number
  pricePosition: number  // 0-100, where in 52-week range
  nearSupport: boolean   // Within 10% of 52-week low
  nearResistance: boolean // Within 10% of 52-week high

  // Fundamental Analysis (YoY)
  yoyCategory: number  // 1-6
  yoyCategoryName: string
  revenueYoY: number
  profitYoY: number
  revenueCurrent: number
  profitCurrent: number
  isProfitable: boolean

  // AI Insights (if available)
  aiOutlook: string | null  // Positive, Neutral, Cautious, Negative
  aiSummary: string | null

  // Screening Scores
  fundamentalScore: number  // 0-100
  technicalScore: number    // 0-100
  overallScore: number      // 0-100

  // Signals
  signals: string[]  // e.g., ["Unusual Volume", "Near Support", "Strong Growth"]
}

export interface ScreeningResult {
  timestamp: string
  totalStocksAnalyzed: number

  // Tiered Opportunities
  tier1Opportunities: ScreenedStock[]  // Top 20 - Full details
  tier2Watchlist: ScreenedStock[]      // Next 30 - Good candidates
  tier3Universe: ScreenedStock[]       // Remaining quality stocks

  // Market Overview
  marketHealth: {
    bullishCount: number
    bearishCount: number
    neutralCount: number
    avgPE: number
    sectorStrength: Record<string, number>  // sector -> strength score
  }

  // Category Distribution
  categoryDistribution: Record<number, number>

  // Sector Opportunities
  sectorLeaders: Record<string, ScreenedStock>  // Best stock per sector
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate fundamental score based on Malaysian market priorities
 * PRIORITY: Category 1 (Strong Growth) and Category 5 (Turnaround)
 */
function calculateFundamentalScore(stock: {
  yoyCategory: number
  peRatio: number | null
  profitCurrent: number
  dividendYield: number | null
  revenueYoY: number
  profitYoY: number
}): number {
  let score = 0

  // YoY Category (45 points max) - UPDATED PRIORITIES
  // Category 1 = Revenue UP, Profit UP (BEST - Primary Focus)
  // Category 5 = Turnaround: Loss to Profit (HIGH POTENTIAL - Primary Focus)
  // Category 3 = Revenue DOWN, Profit UP (Efficiency - Good)
  // Category 2 = Revenue UP, Profit DOWN (Growth investing - Moderate)
  // Category 4 = Revenue DOWN, Profit DOWN (Declining - Low priority but possible)
  // Category 6 = Profit to Loss (Low priority but possible turnaround)
  const categoryScores: Record<number, number> = {
    1: 45,  // PRIMARY - Strong growth (Rev UP, Profit UP)
    5: 40,  // PRIMARY - Turnaround (Loss to Profit) - High potential
    3: 30,  // Good - Improving margins (efficiency play)
    2: 20,  // Moderate - Revenue growth but profit pressure
    4: 12,  // Low priority - Declining (but possible future turnaround)
    6: 10   // Low priority - Profit to Loss (watch for bottom)
  }
  score += categoryScores[stock.yoyCategory] || 15

  // PE Ratio (25 points max)
  // Low PE = potentially undervalued
  if (stock.peRatio !== null && stock.peRatio > 0) {
    if (stock.peRatio < 8) score += 25
    else if (stock.peRatio < 12) score += 22
    else if (stock.peRatio < 15) score += 18
    else if (stock.peRatio < 20) score += 12
    else if (stock.peRatio < 30) score += 5
    // PE > 30 = 0 points (expensive)
  }

  // Profitability (20 points max)
  if (stock.profitCurrent > 0) {
    score += 15
    // Extra points for profit growth
    if (stock.profitYoY > 20) score += 5
    else if (stock.profitYoY > 10) score += 3
    else if (stock.profitYoY > 0) score += 1
  }

  // Dividend Yield (15 points max)
  // Malaysian investors love dividends
  if (stock.dividendYield !== null && stock.dividendYield > 0) {
    if (stock.dividendYield > 0.06) score += 15  // >6%
    else if (stock.dividendYield > 0.04) score += 12  // 4-6%
    else if (stock.dividendYield > 0.02) score += 8   // 2-4%
    else score += 4  // <2%
  }

  return Math.min(100, score)
}

/**
 * Calculate technical score based on price action
 */
function calculateTechnicalScore(stock: {
  pricePosition: number
  volumeRatio: number
  changePct: number
  nearSupport: boolean
  nearResistance: boolean
}): number {
  let score = 50  // Start neutral

  // Volume activity (30 points)
  if (stock.volumeRatio > 3) score += 30      // 3x+ volume = high interest
  else if (stock.volumeRatio > 2) score += 25
  else if (stock.volumeRatio > 1.5) score += 15
  else if (stock.volumeRatio > 1) score += 5
  else if (stock.volumeRatio < 0.5) score -= 10  // Low volume = avoid

  // Price momentum (20 points)
  if (stock.changePct > 3) score += 20       // Strong positive
  else if (stock.changePct > 1) score += 10  // Positive
  else if (stock.changePct > 0) score += 5   // Slight positive
  else if (stock.changePct < -3) score -= 10 // Strong negative

  // Price position signals
  if (stock.nearSupport && stock.changePct >= 0) {
    score += 15  // Bouncing off support = BUY signal
  }
  if (stock.nearResistance && stock.changePct > 0) {
    score += 10  // Breaking resistance = momentum
  }

  // Avoid extremes
  if (stock.pricePosition > 95) score -= 5   // Near 52-week high (expensive)
  if (stock.pricePosition < 5) score -= 10   // Near 52-week low (might be falling knife)

  return Math.max(0, Math.min(100, score))
}

/**
 * Generate trading signals based on stock data
 */
function generateSignals(stock: {
  yoyCategory: number
  peRatio: number | null
  volumeRatio: number
  nearSupport: boolean
  nearResistance: boolean
  changePct: number
  dividendYield: number | null
  profitYoY: number
}): string[] {
  const signals: string[] = []

  // Growth signals
  if (stock.yoyCategory === 1) signals.push('Strong Growth (Rev+Profit UP)')
  if (stock.yoyCategory === 3) signals.push('Improving Margins')
  if (stock.profitYoY > 50) signals.push('Profit Surge (+50%)')

  // Value signals
  if (stock.peRatio !== null && stock.peRatio > 0 && stock.peRatio < 10) {
    signals.push('Low PE (<10)')
  }
  if (stock.dividendYield !== null && stock.dividendYield > 0.05) {
    signals.push('High Dividend (>5%)')
  }

  // Technical signals
  if (stock.volumeRatio > 2) signals.push('Unusual Volume (2x+)')
  if (stock.nearSupport && stock.changePct >= 0) signals.push('Support Bounce')
  if (stock.nearResistance && stock.changePct > 1) signals.push('Breakout')
  if (stock.changePct > 5) signals.push('Strong Momentum')

  return signals
}

// ============================================================================
// MAIN SCREENING FUNCTION
// ============================================================================

/**
 * Screen all stocks and return tiered opportunities
 * This is the main function called by the trading engine
 */
export async function screenAllStocks(): Promise<ScreeningResult> {
  const supabase = createAdminClient() as any
  const timestamp = new Date().toISOString()

  // Fetch all stock data with fundamentals in one query
  const { data: stocksData, error: stocksError } = await supabase
    .from('stock_prices')
    .select(`
      stock_code,
      price,
      previous_close,
      change_percent,
      volume,
      market_cap,
      pe_ratio,
      eps,
      dividend_yield,
      week_52_high,
      week_52_low,
      updated_at
    `)
    .not('price', 'is', null)
    .gt('price', 0)

  if (stocksError) {
    console.error('Error fetching stock prices:', stocksError)
    throw new Error('Failed to fetch stock data')
  }

  // Fetch YoY analysis data
  const { data: yoyData } = await supabase
    .from('yoy_analysis')
    .select(`
      company_id,
      category,
      category_name,
      revenue_current,
      profit_current,
      revenue_change_pct,
      profit_change_pct
    `)

  // Fetch company data for names and sectors
  const { data: companiesData } = await supabase
    .from('companies')
    .select('id, code, name, sector')

  // Fetch AI insights for outlook
  const { data: insightsData } = await supabase
    .from('ai_insights')
    .select('stock_code, outlook, summary')
    .order('generated_at', { ascending: false })

  // Create lookup maps
  const companyMap = new Map<string, { id: string; name: string; sector: string }>()
  for (const c of companiesData || []) {
    companyMap.set(c.code, { id: c.id, name: c.name, sector: c.sector || 'Unknown' })
  }

  const yoyMap = new Map<string, any>()
  for (const y of yoyData || []) {
    // Find company code from company_id
    const company = companiesData?.find((c: any) => c.id === y.company_id)
    if (company) {
      yoyMap.set(company.code, y)
    }
  }

  const insightsMap = new Map<string, { outlook: string; summary: string }>()
  for (const i of insightsData || []) {
    if (!insightsMap.has(i.stock_code)) {  // Take most recent
      insightsMap.set(i.stock_code, { outlook: i.outlook, summary: i.summary })
    }
  }

  // Get average volume from stock_tiers or calculate from data
  const { data: tiersData } = await supabase
    .from('stock_tiers')
    .select('stock_code, market_cap')

  const tierMap = new Map<string, number>()
  for (const t of tiersData || []) {
    tierMap.set(t.stock_code, t.market_cap || 0)
  }

  // Process all stocks
  const screenedStocks: ScreenedStock[] = []
  let bullishCount = 0
  let bearishCount = 0
  let neutralCount = 0
  let totalPE = 0
  let peCount = 0
  const sectorScores: Record<string, { total: number; count: number }> = {}
  const categoryDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }

  for (const stock of stocksData || []) {
    const company = companyMap.get(stock.stock_code)
    const yoy = yoyMap.get(stock.stock_code)
    const insights = insightsMap.get(stock.stock_code)

    if (!company) continue

    const previousClose = stock.previous_close || stock.price
    const changePct = stock.change_percent ||
      (previousClose > 0 ? ((stock.price - previousClose) / previousClose) * 100 : 0)

    // Calculate 52-week position
    const week52High = stock.week_52_high || stock.price
    const week52Low = stock.week_52_low || stock.price
    const priceRange = week52High - week52Low
    const pricePosition = priceRange > 0
      ? ((stock.price - week52Low) / priceRange) * 100
      : 50

    // Calculate volume ratio (estimate if no avg volume)
    const avgVolume = 100000  // Default assumption
    const volumeRatio = avgVolume > 0 ? (stock.volume || 0) / avgVolume : 1

    // YoY data
    const yoyCategory = yoy?.category || 5
    const yoyCategoryName = yoy?.category_name || 'Unknown'
    const revenueYoY = yoy?.revenue_change_pct || 0
    const profitYoY = yoy?.profit_change_pct || 0
    const revenueCurrent = yoy?.revenue_current || 0
    const profitCurrent = yoy?.profit_current || 0

    // Track category distribution
    categoryDistribution[yoyCategory] = (categoryDistribution[yoyCategory] || 0) + 1

    // Calculate scores
    const fundamentalScore = calculateFundamentalScore({
      yoyCategory,
      peRatio: stock.pe_ratio,
      profitCurrent,
      dividendYield: stock.dividend_yield,
      revenueYoY,
      profitYoY
    })

    const nearSupport = pricePosition < 15
    const nearResistance = pricePosition > 85

    const technicalScore = calculateTechnicalScore({
      pricePosition,
      volumeRatio,
      changePct,
      nearSupport,
      nearResistance
    })

    const overallScore = (fundamentalScore * 0.6) + (technicalScore * 0.4)

    // Generate signals
    const signals = generateSignals({
      yoyCategory,
      peRatio: stock.pe_ratio,
      volumeRatio,
      nearSupport,
      nearResistance,
      changePct,
      dividendYield: stock.dividend_yield,
      profitYoY
    })

    // Track market health
    if (changePct > 0) bullishCount++
    else if (changePct < 0) bearishCount++
    else neutralCount++

    if (stock.pe_ratio && stock.pe_ratio > 0 && stock.pe_ratio < 100) {
      totalPE += stock.pe_ratio
      peCount++
    }

    // Track sector strength
    const sector = company.sector
    if (!sectorScores[sector]) {
      sectorScores[sector] = { total: 0, count: 0 }
    }
    sectorScores[sector].total += overallScore
    sectorScores[sector].count++

    screenedStocks.push({
      stockCode: stock.stock_code,
      stockName: company.name,
      sector,
      currentPrice: stock.price,
      previousClose,
      changePct,
      volume: stock.volume || 0,
      avgVolume,
      volumeRatio,
      peRatio: stock.pe_ratio,
      eps: stock.eps,
      dividendYield: stock.dividend_yield,
      marketCap: stock.market_cap || 0,
      week52High,
      week52Low,
      pricePosition,
      nearSupport,
      nearResistance,
      yoyCategory,
      yoyCategoryName,
      revenueYoY,
      profitYoY,
      revenueCurrent,
      profitCurrent,
      isProfitable: profitCurrent > 0,
      aiOutlook: insights?.outlook || null,
      aiSummary: insights?.summary || null,
      fundamentalScore,
      technicalScore,
      overallScore,
      signals
    })
  }

  // Sort by overall score descending
  screenedStocks.sort((a, b) => b.overallScore - a.overallScore)

  // Filter quality stocks (fundamental score > 40 OR has signals)
  let qualityStocks = screenedStocks.filter(
    s => s.fundamentalScore >= 40 || s.signals.length >= 2
  )

  // =========================================================================
  // ENHANCE TOP STOCKS WITH REAL-TIME DATA
  // =========================================================================
  console.log('🔴 Fetching real-time prices for top opportunities...')

  // Get real-time quotes for top 50 stocks
  const topStockCodes = qualityStocks.slice(0, 50).map(s => s.stockCode)
  const realTimeQuotes = await fetchBatchQuotes(topStockCodes)

  // Update stocks with real-time data
  let realTimeCount = 0
  qualityStocks = qualityStocks.map(stock => {
    const rtQuote = realTimeQuotes.get(stock.stockCode)
    if (rtQuote && rtQuote.price > 0) {
      realTimeCount++
      // Update with real-time data
      const newChangePct = rtQuote.changePct
      const newVolume = rtQuote.volume
      const newVolumeRatio = stock.avgVolume > 0 ? newVolume / stock.avgVolume : 1

      // Recalculate technical score with real-time data
      const newTechnicalScore = calculateTechnicalScore({
        pricePosition: stock.pricePosition,
        volumeRatio: newVolumeRatio,
        changePct: newChangePct,
        nearSupport: stock.nearSupport,
        nearResistance: stock.nearResistance
      })

      // Regenerate signals with real-time data
      const newSignals = generateSignals({
        yoyCategory: stock.yoyCategory,
        peRatio: stock.peRatio,
        volumeRatio: newVolumeRatio,
        nearSupport: stock.nearSupport,
        nearResistance: stock.nearResistance,
        changePct: newChangePct,
        dividendYield: stock.dividendYield,
        profitYoY: stock.profitYoY
      })

      // Add real-time indicator
      if (!newSignals.includes('🔴 LIVE')) {
        newSignals.unshift('🔴 LIVE')
      }

      return {
        ...stock,
        currentPrice: rtQuote.price,
        previousClose: rtQuote.previousClose,
        changePct: newChangePct,
        volume: newVolume,
        volumeRatio: newVolumeRatio,
        technicalScore: newTechnicalScore,
        overallScore: (stock.fundamentalScore * 0.6) + (newTechnicalScore * 0.4),
        signals: newSignals
      }
    }
    return stock
  })

  // Re-sort after real-time update
  qualityStocks.sort((a, b) => b.overallScore - a.overallScore)
  console.log(`✅ Real-time data: ${realTimeCount}/${topStockCodes.length} stocks updated`)

  // Calculate sector strength
  const sectorStrength: Record<string, number> = {}
  for (const [sector, data] of Object.entries(sectorScores)) {
    sectorStrength[sector] = data.count > 0 ? data.total / data.count : 0
  }

  // Find sector leaders (best stock per sector)
  const sectorLeaders: Record<string, ScreenedStock> = {}
  for (const stock of qualityStocks) {
    if (!sectorLeaders[stock.sector] ||
        stock.overallScore > sectorLeaders[stock.sector].overallScore) {
      sectorLeaders[stock.sector] = stock
    }
  }

  return {
    timestamp,
    totalStocksAnalyzed: screenedStocks.length,
    tier1Opportunities: qualityStocks.slice(0, 20),
    tier2Watchlist: qualityStocks.slice(20, 50),
    tier3Universe: qualityStocks.slice(50, 100),
    marketHealth: {
      bullishCount,
      bearishCount,
      neutralCount,
      avgPE: peCount > 0 ? totalPE / peCount : 0,
      sectorStrength
    },
    categoryDistribution,
    sectorLeaders
  }
}

/**
 * Format screening results for AI prompt
 * Returns a concise, actionable summary
 */
export function formatScreeningForPrompt(result: ScreeningResult): string {
  const sections: string[] = []

  // Header
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
📊 STOCK SCREENING REPORT - ${new Date(result.timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
═══════════════════════════════════════════════════════════════════════════════
Stocks Analyzed: ${result.totalStocksAnalyzed}
`)

  // Market Health
  const total = result.marketHealth.bullishCount + result.marketHealth.bearishCount + result.marketHealth.neutralCount
  const bullishPct = ((result.marketHealth.bullishCount / total) * 100).toFixed(1)
  const bearishPct = ((result.marketHealth.bearishCount / total) * 100).toFixed(1)

  sections.push(`
## MARKET HEALTH
Advancing: ${result.marketHealth.bullishCount} (${bullishPct}%) | Declining: ${result.marketHealth.bearishCount} (${bearishPct}%)
Average PE: ${result.marketHealth.avgPE.toFixed(1)}

### Category Distribution (YoY Performance)
- Cat 1 (Rev↑ Profit↑): ${result.categoryDistribution[1] || 0} stocks - BEST
- Cat 2 (Rev↑ Profit↓): ${result.categoryDistribution[2] || 0} stocks
- Cat 3 (Rev↓ Profit↑): ${result.categoryDistribution[3] || 0} stocks - Good margins
- Cat 4 (Rev↓ Profit↓): ${result.categoryDistribution[4] || 0} stocks - AVOID
`)

  // Top Sector Strength
  const sortedSectors = Object.entries(result.marketHealth.sectorStrength)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  sections.push(`
### Sector Strength (Top 5)
${sortedSectors.map(([sector, score]) => `- ${sector}: ${score.toFixed(1)}/100`).join('\n')}
`)

  // Tier 1: Top Opportunities (DETAILED)
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
🎯 TIER 1: TOP ${result.tier1Opportunities.length} OPPORTUNITIES (Detailed)
═══════════════════════════════════════════════════════════════════════════════
`)

  for (const stock of result.tier1Opportunities) {
    const peStr = stock.peRatio ? `PE: ${stock.peRatio.toFixed(1)}` : 'PE: N/A'
    const divStr = stock.dividendYield ? `Div: ${(stock.dividendYield * 100).toFixed(1)}%` : ''
    const signalsStr = stock.signals.length > 0 ? `📌 ${stock.signals.join(' | ')}` : ''

    sections.push(`
▶ ${stock.stockCode} - ${stock.stockName} (${stock.sector})
  Price: RM${stock.currentPrice.toFixed(3)} (${stock.changePct >= 0 ? '+' : ''}${stock.changePct.toFixed(2)}%)
  52W: RM${stock.week52Low.toFixed(2)} - RM${stock.week52High.toFixed(2)} | Position: ${stock.pricePosition.toFixed(0)}%
  ${peStr} | ${divStr} | MCap: RM${(stock.marketCap / 1000000).toFixed(0)}M
  YoY: Cat ${stock.yoyCategory} (${stock.yoyCategoryName}) | Rev: ${stock.revenueYoY >= 0 ? '+' : ''}${stock.revenueYoY.toFixed(1)}% | Profit: ${stock.profitYoY >= 0 ? '+' : ''}${stock.profitYoY.toFixed(1)}%
  Score: ${stock.overallScore.toFixed(0)}/100 (Fund: ${stock.fundamentalScore.toFixed(0)} | Tech: ${stock.technicalScore.toFixed(0)})
  ${signalsStr}`)
  }

  // Tier 2: Watchlist (SUMMARY)
  if (result.tier2Watchlist.length > 0) {
    sections.push(`
═══════════════════════════════════════════════════════════════════════════════
👀 TIER 2: WATCHLIST (${result.tier2Watchlist.length} stocks)
═══════════════════════════════════════════════════════════════════════════════
`)
    const tier2Summary = result.tier2Watchlist.map(s =>
      `${s.stockCode}(${s.sector.slice(0,4)}) RM${s.currentPrice.toFixed(2)} Cat${s.yoyCategory} Score:${s.overallScore.toFixed(0)}`
    ).join(' | ')
    sections.push(tier2Summary)
  }

  // Sector Leaders
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
🏆 SECTOR LEADERS (Best stock per sector)
═══════════════════════════════════════════════════════════════════════════════
`)
  for (const [sector, stock] of Object.entries(result.sectorLeaders)) {
    sections.push(`${sector}: ${stock.stockCode} (Score: ${stock.overallScore.toFixed(0)}, Cat ${stock.yoyCategory})`)
  }

  return sections.join('\n')
}

/**
 * Get specific stock details for AI when it wants to analyze a particular stock
 */
export async function getStockDetails(stockCode: string): Promise<ScreenedStock | null> {
  const result = await screenAllStocks()
  const allStocks = [
    ...result.tier1Opportunities,
    ...result.tier2Watchlist,
    ...result.tier3Universe
  ]
  return allStocks.find(s => s.stockCode === stockCode) || null
}

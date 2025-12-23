import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllStockCodes } from '@/lib/stock-codes'

// ============================================================================
// INITIAL FUNDAMENTALS POPULATION - Scrape from KLSE Screener
// ============================================================================
//
// PURPOSE: One-time initial population of fundamentals data
// SOURCE: KLSE Screener (www.klsescreener.com)
//
// DATA SCRAPED:
// - Market Cap
// - P/E Ratio
// - EPS (sen)
// - Dividend Yield
//
// USAGE: /api/admin/populate-fundamentals?secret=xxx&batch=0
//
// ============================================================================

const STOCKS_PER_BATCH = 10  // Process 10 stocks per batch
const DELAY_BETWEEN_STOCKS = 2000  // 2 seconds between requests

// ============================================================================
// SECURITY
// ============================================================================

function validateRequest(request: NextRequest): boolean {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret && secret === process.env.CRON_SECRET) return true
  if (process.env.NODE_ENV === 'development') return true
  return false
}

// ============================================================================
// SCRAPE KLSE SCREENER USING BROWSER
// ============================================================================

interface FundamentalsData {
  marketCap: number | null
  peRatio: number | null
  eps: number | null
  dividendYield: number | null
  sharesOutstanding: number | null
}

async function scrapeFundamentals(stockCode: string): Promise<FundamentalsData | null> {
  try {
    // Fetch the page
    const url = `https://www.klsescreener.com/v2/stocks/view/${stockCode}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      console.error(`[Scraper] Failed to fetch ${stockCode}: ${response.status}`)
      return null
    }

    const html = await response.text()

    // Parse the data using regex (KLSE Screener has consistent HTML structure)
    const result: FundamentalsData = {
      marketCap: null,
      peRatio: null,
      eps: null,
      dividendYield: null,
      sharesOutstanding: null,
    }

    // Market Cap (e.g., "126.9B" or "1.2B" or "500M")
    const marketCapMatch = html.match(/Market Cap<\/p>\s*<\/div>\s*<div[^>]*>\s*<p[^>]*>([0-9.,]+)(B|M|K)?/i)
    if (marketCapMatch) {
      let value = parseFloat(marketCapMatch[1].replace(/,/g, ''))
      const unit = marketCapMatch[2]?.toUpperCase()
      if (unit === 'B') value *= 1_000_000_000
      else if (unit === 'M') value *= 1_000_000
      else if (unit === 'K') value *= 1_000
      result.marketCap = value
    }

    // P/E Ratio
    const peMatch = html.match(/P\/E<\/p>\s*<\/div>\s*<div[^>]*>\s*<p[^>]*>([0-9.,\-]+)/i)
    if (peMatch && peMatch[1] !== '-') {
      result.peRatio = parseFloat(peMatch[1].replace(/,/g, ''))
    }

    // EPS (in sen)
    const epsMatch = html.match(/EPS<\/p>\s*<\/div>\s*<div[^>]*>\s*<p[^>]*>([0-9.,\-]+)/i)
    if (epsMatch && epsMatch[1] !== '-') {
      // Convert sen to MYR (divide by 100)
      result.eps = parseFloat(epsMatch[1].replace(/,/g, '')) / 100
    }

    // Dividend Yield (e.g., "5.81%")
    const dyMatch = html.match(/DY<\/p>\s*<\/div>\s*<div[^>]*>\s*<p[^>]*>([0-9.,]+)%/i)
    if (dyMatch) {
      // Store as decimal (5.81% -> 0.0581)
      result.dividendYield = parseFloat(dyMatch[1].replace(/,/g, '')) / 100
    }

    // Shares Outstanding (in millions)
    const sharesMatch = html.match(/Shares \(mil\)<\/p>\s*<\/div>\s*<div[^>]*>\s*<p[^>]*>([0-9.,]+)/i)
    if (sharesMatch) {
      result.sharesOutstanding = parseFloat(sharesMatch[1].replace(/,/g, '')) * 1_000_000
    }

    return result
  } catch (error) {
    console.error(`[Scraper] Error scraping ${stockCode}:`, error)
    return null
  }
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const batchParam = url.searchParams.get('batch')
  const singleStock = url.searchParams.get('stock')

  const supabase = createAdminClient()

  // Single stock test mode
  if (singleStock) {
    console.log(`[Populate] Testing single stock: ${singleStock}`)
    const data = await scrapeFundamentals(singleStock)

    if (data) {
      // Update database
      const { error } = await supabase
        .from('stock_prices')
        .update({
          market_cap: data.marketCap,
          pe_ratio: data.peRatio,
          eps: data.eps,
          dividend_yield: data.dividendYield,
        })
        .eq('stock_code', singleStock)

      return NextResponse.json({
        success: true,
        stock: singleStock,
        data,
        dbError: error?.message || null,
        timing: { executionTimeMs: Date.now() - startTime },
      })
    } else {
      return NextResponse.json({
        success: false,
        stock: singleStock,
        error: 'Failed to scrape data',
      })
    }
  }

  // Batch mode
  if (batchParam === null) {
    const allStocks = getAllStockCodes()
    const totalBatches = Math.ceil(allStocks.length / STOCKS_PER_BATCH)

    // Get current progress
    const { count: hasData } = await supabase
      .from('stock_prices')
      .select('*', { count: 'exact', head: true })
      .not('market_cap', 'is', null)

    return NextResponse.json({
      usage: 'Add ?batch=0 through ?batch=N or ?stock=CODE for single test',
      totalStocks: allStocks.length,
      totalBatches,
      stocksPerBatch: STOCKS_PER_BATCH,
      progress: {
        stocksWithFundamentals: hasData || 0,
        stocksRemaining: allStocks.length - (hasData || 0),
      },
      estimatedTime: `${Math.ceil(allStocks.length * (DELAY_BETWEEN_STOCKS / 1000) / 60)} minutes for full run`,
    })
  }

  const batch = parseInt(batchParam)
  const allStocks = getAllStockCodes()
  const totalBatches = Math.ceil(allStocks.length / STOCKS_PER_BATCH)

  if (isNaN(batch) || batch < 0 || batch >= totalBatches) {
    return NextResponse.json({
      error: `Invalid batch: ${batchParam}. Must be 0-${totalBatches - 1}`,
    }, { status: 400 })
  }

  // Get stocks for this batch
  const startIdx = batch * STOCKS_PER_BATCH
  const batchStocks = allStocks.slice(startIdx, startIdx + STOCKS_PER_BATCH)

  console.log(`[Populate] Processing batch ${batch}: ${batchStocks.length} stocks (${startIdx}-${startIdx + batchStocks.length - 1})`)

  const results: { code: string; success: boolean; data?: FundamentalsData | null; error?: string }[] = []

  for (const code of batchStocks) {
    try {
      const data = await scrapeFundamentals(code)

      if (data) {
        // Update database
        const { error } = await supabase
          .from('stock_prices')
          .update({
            market_cap: data.marketCap,
            pe_ratio: data.peRatio,
            eps: data.eps,
            dividend_yield: data.dividendYield,
          })
          .eq('stock_code', code)

        if (error) {
          results.push({ code, success: false, error: error.message })
        } else {
          results.push({ code, success: true, data })
          console.log(`[Populate] ${code}: MC=${data.marketCap}, PE=${data.peRatio}, EPS=${data.eps}, DY=${data.dividendYield}`)
        }
      } else {
        results.push({ code, success: false, error: 'No data scraped' })
      }

      // Delay between requests to avoid rate limiting
      if (batchStocks.indexOf(code) < batchStocks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_STOCKS))
      }
    } catch (error) {
      results.push({ code, success: false, error: String(error) })
    }
  }

  const successCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success).length

  return NextResponse.json({
    success: true,
    batch,
    totalBatches,
    processed: {
      total: batchStocks.length,
      success: successCount,
      failed: failedCount,
      results,
    },
    timing: {
      executionTimeMs: Date.now() - startTime,
      executionTimeSec: Math.round((Date.now() - startTime) / 1000),
    },
    nextBatch: batch < totalBatches - 1 ? `?batch=${batch + 1}` : 'All batches complete',
  })
}

export async function POST(request: NextRequest) {
  return GET(request)
}

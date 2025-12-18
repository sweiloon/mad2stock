/**
 * Backfill Historical Data API
 *
 * Fetches historical stock data for all companies missing chart data.
 * Uses EODHD API (if available) or Yahoo Finance as fallback.
 *
 * Usage:
 * - GET /api/cron/backfill-history?limit=50&offset=0
 * - GET /api/cron/backfill-history?force=true (re-fetch all)
 * - GET /api/cron/backfill-history?stockCode=5398 (single stock)
 *
 * Rate Limiting:
 * - EODHD: 100,000 calls/day, ~10 concurrent
 * - Yahoo: 1 req/1.5s to avoid blocks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchEODHDHistory } from '@/lib/eodhd-api'
import { getStockCode } from '@/lib/stock-codes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const HAS_EODHD = !!process.env.EODHD_API_KEY

// Rate limiting settings
const YAHOO_DELAY_MS = 1500 // 1.5s between Yahoo requests
const BATCH_SIZE = HAS_EODHD ? 20 : 10 // Smaller batches for Yahoo

interface StockHistoryData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Fetch historical data from Yahoo Finance
 */
async function fetchYahooHistoryDirect(numericCode: string): Promise<StockHistoryData[]> {
  try {
    const symbol = `${numericCode}.KL`
    // Fetch 1 year of data to get good historical coverage
    const url = `${YAHOO_CHART_URL}/${symbol}?range=1y&interval=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      },
    })

    if (!response.ok) {
      console.error(`[Backfill] Yahoo error for ${numericCode}: ${response.status}`)
      return []
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
      return []
    }

    const { timestamp, indicators } = result
    const quote = indicators.quote[0]

    const history: StockHistoryData[] = []
    for (let i = 0; i < timestamp.length; i++) {
      if (quote.close?.[i] != null && quote.close[i] > 0) {
        history.push({
          date: new Date(timestamp[i] * 1000).toISOString(),
          open: quote.open?.[i] || quote.close[i],
          high: quote.high?.[i] || quote.close[i],
          low: quote.low?.[i] || quote.close[i],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0,
        })
      }
    }

    return history
  } catch (error) {
    console.error(`[Backfill] Yahoo error for ${numericCode}:`, error)
    return []
  }
}

/**
 * Store historical data in Supabase
 */
async function storeHistory(numericCode: string, data: StockHistoryData[]): Promise<boolean> {
  if (!data || data.length === 0) return false

  try {
    const records = data.map(item => ({
      stock_code: numericCode.toUpperCase(),
      date: new Date(item.date).toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      updated_at: new Date().toISOString(),
    }))

    // Upsert in batches
    const batchSize = 100
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)

      const { error } = await supabase
        .from('stock_history_cache')
        .upsert(batch, {
          onConflict: 'stock_code,date',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error(`[Backfill] DB error for ${numericCode}:`, error)
        return false
      }
    }

    console.log(`[Backfill] Stored ${records.length} records for ${numericCode}`)
    return true
  } catch (error) {
    console.error(`[Backfill] Store error for ${numericCode}:`, error)
    return false
  }
}

/**
 * Get companies missing historical data
 */
async function getMissingCompanies(limit: number, offset: number): Promise<Array<{ code: string; numeric_code: string; name: string }>> {
  // Get companies with numeric codes that don't have historical data
  const { data: companies, error } = await supabase
    .from('companies')
    .select('code, numeric_code, name')
    .not('numeric_code', 'is', null)
    .order('code')
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[Backfill] Error fetching companies:', error)
    return []
  }

  // Filter out companies that already have sufficient data
  const missingCompanies: Array<{ code: string; numeric_code: string; name: string }> = []

  for (const company of companies || []) {
    const { count } = await supabase
      .from('stock_history_cache')
      .select('*', { count: 'exact', head: true })
      .eq('stock_code', company.numeric_code)

    // Consider missing if less than 50 data points (about 2-3 months of trading days)
    if (!count || count < 50) {
      missingCompanies.push(company)
    }
  }

  return missingCompanies
}

/**
 * Fetch historical data for a single stock
 */
async function fetchStockHistory(numericCode: string): Promise<{ success: boolean; count: number }> {
  let history: StockHistoryData[] = []

  // Try EODHD first if available
  if (HAS_EODHD) {
    history = await fetchEODHDHistory(numericCode, '1y')
  }

  // Fallback to Yahoo Finance
  if (history.length === 0) {
    await new Promise(resolve => setTimeout(resolve, YAHOO_DELAY_MS))
    history = await fetchYahooHistoryDirect(numericCode)
  }

  if (history.length === 0) {
    return { success: false, count: 0 }
  }

  const stored = await storeHistory(numericCode, history)
  return { success: stored, count: history.length }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limitParam = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')
  const force = searchParams.get('force') === 'true'
  const singleStock = searchParams.get('stockCode')

  const limit = limitParam ? parseInt(limitParam) : BATCH_SIZE
  const offset = offsetParam ? parseInt(offsetParam) : 0

  console.log(`[Backfill] Starting with limit=${limit}, offset=${offset}, force=${force}, EODHD=${HAS_EODHD}`)

  // Single stock mode
  if (singleStock) {
    const numericCode = getStockCode(singleStock)
    console.log(`[Backfill] Single stock mode: ${singleStock} -> ${numericCode}`)

    const result = await fetchStockHistory(numericCode)

    return NextResponse.json({
      mode: 'single',
      stockCode: singleStock,
      numericCode,
      success: result.success,
      dataPoints: result.count,
      dataSource: HAS_EODHD ? 'eodhd/yahoo' : 'yahoo',
    })
  }

  // Batch mode - get companies missing data
  let companies: Array<{ code: string; numeric_code: string; name: string }>

  if (force) {
    // Force mode - get all companies with numeric codes
    const { data, error } = await supabase
      .from('companies')
      .select('code, numeric_code, name')
      .not('numeric_code', 'is', null)
      .order('code')
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    companies = data || []
  } else {
    companies = await getMissingCompanies(limit, offset)
  }

  console.log(`[Backfill] Processing ${companies.length} companies`)

  const results = {
    total: companies.length,
    success: 0,
    failed: 0,
    skipped: 0,
    details: [] as Array<{
      code: string
      numericCode: string
      name: string
      success: boolean
      dataPoints: number
    }>,
  }

  // Process companies sequentially to respect rate limits
  for (const company of companies) {
    const numericCode = company.numeric_code
    console.log(`[Backfill] Processing ${company.code} (${numericCode})...`)

    const result = await fetchStockHistory(numericCode)

    results.details.push({
      code: company.code,
      numericCode,
      name: company.name,
      success: result.success,
      dataPoints: result.count,
    })

    if (result.success) {
      results.success++
    } else if (result.count === 0) {
      results.failed++
    } else {
      results.skipped++
    }

    // Small delay between stocks even with EODHD
    await new Promise(resolve => setTimeout(resolve, HAS_EODHD ? 100 : YAHOO_DELAY_MS))
  }

  // Get total remaining companies
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .not('numeric_code', 'is', null)

  const { count: companiesWithHistory } = await supabase
    .from('stock_history_cache')
    .select('stock_code', { count: 'exact', head: true })

  // Get distinct count properly
  const { data: distinctStocks } = await supabase
    .from('stock_history_cache')
    .select('stock_code')

  const uniqueStockCount = new Set(distinctStocks?.map(s => s.stock_code)).size

  return NextResponse.json({
    message: `Processed ${companies.length} companies`,
    dataSource: HAS_EODHD ? 'eodhd (primary) + yahoo (fallback)' : 'yahoo only',
    results,
    stats: {
      totalCompaniesWithNumericCode: totalCompanies,
      companiesWithHistoricalData: uniqueStockCount,
      remainingToProcess: (totalCompanies || 0) - uniqueStockCount,
    },
    pagination: {
      limit,
      offset,
      nextOffset: offset + limit,
      hasMore: (totalCompanies || 0) > offset + limit,
    },
  })
}

export const maxDuration = 300 // 5 minutes max for Vercel

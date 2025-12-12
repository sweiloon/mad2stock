import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { STOCK_CODE_MAP } from '@/lib/stock-codes'

const BATCH_SIZE = 5
const BATCH_DELAY = 500 // ms between batches
const REQUEST_TIMEOUT = 10000 // 10 seconds per request
const MAX_RETRIES = 2

interface PriceData {
  price: number | null
  change: number | null
  changePercent: number | null
  previousClose: number | null
  dayOpen: number | null
  dayHigh: number | null
  dayLow: number | null
  volume: number | null
  dataSource: 'klsescreener' | 'yahoo'
}

// Security validation
function validateRequest(request: NextRequest): boolean {
  // In production, check for Vercel cron header
  const vercelCronHeader = request.headers.get('x-vercel-cron')
  if (vercelCronHeader) return true

  // Also allow manual trigger with CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    return token === process.env.CRON_SECRET
  }

  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') return true

  return false
}

// Fetch with timeout
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

// Scrape price from KLSE Screener
async function scrapeKLSEScreener(stockCode: string): Promise<PriceData | null> {
  try {
    const url = `https://www.klsescreener.com/v2/stocks/view/${stockCode}`
    const response = await fetchWithTimeout(url, REQUEST_TIMEOUT)

    if (!response.ok) return null

    const html = await response.text()

    // Extract price data using regex patterns
    const priceMatch = html.match(/class="price[^"]*"[^>]*>[\s]*RM\s*([\d,.]+)/i)
    const changeMatch = html.match(/class="change[^"]*"[^>]*>[\s]*([+-]?[\d,.]+)/i)
    const percentMatch = html.match(/\(([+-]?[\d,.]+)%\)/i)
    const volumeMatch = html.match(/Volume[\s:]*<[^>]+>[\s]*([\d,]+)/i)
    const highMatch = html.match(/High[\s:]*<[^>]+>[\s]*([\d,.]+)/i)
    const lowMatch = html.match(/Low[\s:]*<[^>]+>[\s]*([\d,.]+)/i)
    const openMatch = html.match(/Open[\s:]*<[^>]+>[\s]*([\d,.]+)/i)
    const prevCloseMatch = html.match(/Prev[\s.]*Close[\s:]*<[^>]+>[\s]*([\d,.]+)/i)

    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null

    if (!price) return null

    return {
      price,
      change: changeMatch ? parseFloat(changeMatch[1].replace(/,/g, '')) : null,
      changePercent: percentMatch ? parseFloat(percentMatch[1].replace(/,/g, '')) : null,
      previousClose: prevCloseMatch ? parseFloat(prevCloseMatch[1].replace(/,/g, '')) : null,
      dayOpen: openMatch ? parseFloat(openMatch[1].replace(/,/g, '')) : null,
      dayHigh: highMatch ? parseFloat(highMatch[1].replace(/,/g, '')) : null,
      dayLow: lowMatch ? parseFloat(lowMatch[1].replace(/,/g, '')) : null,
      volume: volumeMatch ? parseInt(volumeMatch[1].replace(/,/g, '')) : null,
      dataSource: 'klsescreener',
    }
  } catch (error) {
    console.error(`KLSE Screener failed for ${stockCode}:`, error)
    return null
  }
}

// Fallback to Yahoo Finance
async function scrapeYahooFinance(stockCode: string): Promise<PriceData | null> {
  try {
    const symbol = `${stockCode}.KL`
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const response = await fetchWithTimeout(url, REQUEST_TIMEOUT)

    if (!response.ok) return null

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) return null

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]

    return {
      price: meta.regularMarketPrice || null,
      change: meta.regularMarketPrice && meta.previousClose
        ? meta.regularMarketPrice - meta.previousClose
        : null,
      changePercent: meta.regularMarketPrice && meta.previousClose
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
        : null,
      previousClose: meta.previousClose || null,
      dayOpen: quote?.open?.[0] || meta.regularMarketOpen || null,
      dayHigh: quote?.high?.[0] || meta.regularMarketDayHigh || null,
      dayLow: quote?.low?.[0] || meta.regularMarketDayLow || null,
      volume: quote?.volume?.[0] || meta.regularMarketVolume || null,
      dataSource: 'yahoo',
    }
  } catch (error) {
    console.error(`Yahoo Finance failed for ${stockCode}:`, error)
    return null
  }
}

// Fetch price with retry and fallback
async function fetchPrice(
  companyName: string,
  stockCode: string,
  retries = MAX_RETRIES
): Promise<{ name: string; code: string; data: PriceData | null; error?: string }> {
  // Try KLSE Screener first
  let data = await scrapeKLSEScreener(stockCode)

  // Fallback to Yahoo Finance if KLSE fails
  if (!data) {
    data = await scrapeYahooFinance(stockCode)
  }

  // Retry if both failed
  if (!data && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return fetchPrice(companyName, stockCode, retries - 1)
  }

  return {
    name: companyName,
    code: stockCode,
    data,
    error: data ? undefined : 'Failed to fetch price from all sources',
  }
}

// Process batch of companies
async function processBatch(
  companies: Array<[string, string]>
): Promise<Array<{ name: string; code: string; data: PriceData | null; error?: string }>> {
  const promises = companies.map(([name, code]) => fetchPrice(name, code))
  return Promise.all(promises)
}

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Validate request
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const supabase = createAdminClient()

  // Log job start - using 'as any' because tables are new and types may not be generated yet
  await (supabase.from('price_update_logs') as any).insert({
    job_id: jobId,
    started_at: new Date().toISOString(),
    total_companies: Object.keys(STOCK_CODE_MAP).length,
    status: 'running',
  })

  try {
    const companies = Object.entries(STOCK_CODE_MAP)
    const totalCompanies = companies.length
    const results: Array<{ name: string; code: string; data: PriceData | null; error?: string }> = []

    // Process in batches
    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE)
      const batchResults = await processBatch(batch)
      results.push(...batchResults)

      // Delay between batches (except last batch)
      if (i + BATCH_SIZE < companies.length) {
        await sleep(BATCH_DELAY)
      }
    }

    // Separate successes and failures
    const successes = results.filter(r => r.data)
    const failures = results.filter(r => !r.data)

    // Upsert successful prices to database
    if (successes.length > 0) {
      const priceRecords = successes.map(({ name, code, data }) => ({
        stock_code: code,
        price: data!.price,
        change: data!.change,
        change_percent: data!.changePercent,
        previous_close: data!.previousClose,
        day_open: data!.dayOpen,
        day_high: data!.dayHigh,
        day_low: data!.dayLow,
        volume: data!.volume,
        data_source: data!.dataSource,
        scrape_status: 'success' as const,
        error_message: null,
        updated_at: new Date().toISOString(),
      }))

      // Upsert each record
      for (const record of priceRecords) {
        await (supabase.from('stock_prices') as any)
          .upsert(record, { onConflict: 'stock_code' })
      }
    }

    // Mark failures in database
    if (failures.length > 0) {
      for (const failure of failures) {
        await (supabase.from('stock_prices') as any)
          .upsert(
            {
              stock_code: failure.code,
              scrape_status: 'failed',
              error_message: failure.error,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stock_code' }
          )
      }
    }

    const executionTime = Date.now() - startTime

    // Update job log
    await (supabase.from('price_update_logs') as any)
      .update({
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        successful_updates: successes.length,
        failed_updates: failures.length,
        failed_codes: failures.map(f => f.code),
        error_summary: failures.length > 0
          ? `${failures.length} companies failed to update`
          : null,
        status: 'completed',
      })
      .eq('job_id', jobId)

    return NextResponse.json({
      success: true,
      jobId,
      summary: {
        total: totalCompanies,
        successful: successes.length,
        failed: failures.length,
        executionTimeMs: executionTime,
      },
      failedCodes: failures.map(f => ({ code: f.code, name: f.name })),
    })
  } catch (error) {
    const executionTime = Date.now() - startTime

    // Update job log with error
    await (supabase.from('price_update_logs') as any)
      .update({
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        status: 'failed',
        error_summary: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('job_id', jobId)

    console.error('Cron job failed:', error)

    return NextResponse.json(
      {
        success: false,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

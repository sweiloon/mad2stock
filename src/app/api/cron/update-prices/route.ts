import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllStockCodes, isCore80Stock } from '@/lib/stock-codes'
import { fetchEODHDBatchQuotes, checkEODHDStatus } from '@/lib/eodhd-api'
import {
  TIER_1,
  TIER_3,
  calculateNextUpdate,
  isMarketHours,
} from '@/lib/stock-tiers'
import type { Database } from '@/types/database'

type StockPriceInsert = Database['public']['Tables']['stock_prices']['Insert']
type PriceUpdateLogInsert = Database['public']['Tables']['price_update_logs']['Insert']
type PriceUpdateLogUpdate = Database['public']['Tables']['price_update_logs']['Update']

// Configuration for Vercel Hobby timeout (10 seconds)
// Process 50 stocks per cron call to stay within limits
// With 1000 stocks and 15-min interval cron, need 20 calls to cover all
// Solution: Process stocks in rotation based on minute offset
const STOCKS_PER_RUN = 50 // Process 50 stocks per cron invocation
const BATCH_SIZE = 20 // EODHD batch size

interface UpdateResult {
  stocksUpdated: number
  stocksFailed: number
  duration: number
  failedCodes: string[]
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

  // Also check for cron_secret query param (for external cron services)
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret && secret === process.env.CRON_SECRET) return true

  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') return true

  return false
}

// Get all stocks sorted by tier (core stocks first)
function getAllStocksSorted(): { code: string; tier: 1 | 3 }[] {
  const allCodes = getAllStockCodes()
  const stocks: { code: string; tier: 1 | 3 }[] = []

  for (const code of allCodes) {
    const isCore = isCore80Stock(code)
    stocks.push({ code, tier: isCore ? TIER_1 : TIER_3 })
  }

  // Sort: Tier 1 (core) first, then Tier 3
  stocks.sort((a, b) => a.tier - b.tier)
  return stocks
}

// Get stocks for current rotation based on offset
function getStocksForRotation(offset: number, limit: number): { code: string; tier: 1 | 3 }[] {
  const allStocks = getAllStocksSorted()
  const startIdx = offset % allStocks.length
  const endIdx = startIdx + limit

  if (endIdx <= allStocks.length) {
    return allStocks.slice(startIdx, endIdx)
  } else {
    // Wrap around
    return [
      ...allStocks.slice(startIdx),
      ...allStocks.slice(0, endIdx - allStocks.length)
    ].slice(0, limit)
  }
}

// Update prices using EODHD API (optimized for small batches)
async function updatePricesWithEODHD(
  stocks: { code: string; tier: 1 | 3 }[],
  supabase: ReturnType<typeof createAdminClient>
): Promise<UpdateResult> {
  const startTime = Date.now()
  const failedCodes: string[] = []
  let successCount = 0

  if (stocks.length === 0) {
    return { stocksUpdated: 0, stocksFailed: 0, duration: 0, failedCodes: [] }
  }

  const stockCodes = stocks.map(s => s.code)
  console.log(`[EODHD Cron] Fetching ${stockCodes.length} stocks...`)

  // Fetch quotes in batches
  const allQuotes = new Map()
  for (let i = 0; i < stockCodes.length; i += BATCH_SIZE) {
    const batch = stockCodes.slice(i, i + BATCH_SIZE)
    const batchQuotes = await fetchEODHDBatchQuotes(batch)
    batchQuotes.forEach((v, k) => allQuotes.set(k, v))

    // Small delay between batches
    if (i + BATCH_SIZE < stockCodes.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  const now = new Date()

  // Update successful quotes in database
  for (const stock of stocks) {
    const quote = allQuotes.get(stock.code)
    const nextUpdateTime = calculateNextUpdate(stock.tier, now)

    if (quote) {
      try {
        const priceData: StockPriceInsert = {
          stock_code: stock.code,
          price: quote.price,
          change: quote.change,
          change_percent: quote.changePercent,
          previous_close: quote.previousClose,
          day_open: quote.open,
          day_high: quote.high,
          day_low: quote.low,
          volume: quote.volume,
          data_source: 'eodhd',
          tier: stock.tier,
          next_update_at: nextUpdateTime.toISOString(),
          scrape_status: 'success',
          error_message: null,
          updated_at: now.toISOString(),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('stock_prices') as any).upsert(priceData, { onConflict: 'stock_code' })
        successCount++
      } catch (error) {
        console.error(`Failed to update ${stock.code}:`, error)
        failedCodes.push(stock.code)
      }
    } else {
      failedCodes.push(stock.code)
    }
  }

  const duration = Date.now() - startTime
  console.log(`[EODHD Cron] ${successCount} updated, ${failedCodes.length} failed in ${duration}ms`)

  return { stocksUpdated: successCount, stocksFailed: failedCodes.length, duration, failedCodes }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Validate request
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const forceUpdate = url.searchParams.get('force') === 'true'
  const offsetParam = url.searchParams.get('offset')

  const supabase = createAdminClient()
  const now = new Date()

  // Check if we're in market hours (optional - can be disabled for testing)
  if (!forceUpdate && !isMarketHours(now)) {
    console.log('[EODHD Cron] Outside market hours, skipping update')
    return NextResponse.json({
      success: true,
      message: 'Outside market hours',
      marketHours: false,
    })
  }

  // Check EODHD API status first
  const apiStatus = await checkEODHDStatus()
  if (!apiStatus.success) {
    console.error(`[EODHD Cron] API check failed: ${apiStatus.message}`)
    return NextResponse.json(
      { success: false, error: `EODHD API error: ${apiStatus.message}` },
      { status: 500 }
    )
  }

  // Calculate offset for rotation
  // Use URL param if provided, otherwise calculate from current minute
  // This ensures different stocks are updated each cron call
  const allStocks = getAllStocksSorted()
  const totalStocks = allStocks.length

  let offset: number
  if (offsetParam) {
    offset = parseInt(offsetParam) % totalStocks
  } else {
    // Auto-calculate offset: each minute gets a different set of stocks
    // With 50 stocks per run, we cycle through all stocks over time
    const minuteOfDay = now.getHours() * 60 + now.getMinutes()
    offset = (minuteOfDay * STOCKS_PER_RUN) % totalStocks
  }

  // Get stocks for this rotation
  const stocksToUpdate = getStocksForRotation(offset, STOCKS_PER_RUN)

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
  console.log(
    `[EODHD Cron] Job ${jobId}: Updating ${stocksToUpdate.length} stocks (offset: ${offset}/${totalStocks})`
  )

  // Log job start
  try {
    const logData: PriceUpdateLogInsert = {
      job_id: jobId,
      started_at: now.toISOString(),
      total_companies: stocksToUpdate.length,
      status: 'running',
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('price_update_logs') as any).insert(logData)
  } catch (error) {
    console.error('Failed to log job start:', error)
  }

  try {
    // Update stocks
    const result = await updatePricesWithEODHD(stocksToUpdate, supabase)

    const executionTime = Date.now() - startTime

    // Update job log
    try {
      const updateData: PriceUpdateLogUpdate = {
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        successful_updates: result.stocksUpdated,
        failed_updates: result.stocksFailed,
        failed_codes: result.failedCodes.slice(0, 50),
        status: 'completed',
        error_summary: result.stocksFailed > 0 ? `${result.stocksFailed} stocks failed` : null,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('price_update_logs') as any).update(updateData).eq('job_id', jobId)
    } catch (error) {
      console.error('Failed to update job log:', error)
    }

    console.log(
      `[EODHD Cron] Job ${jobId} completed: ${result.stocksUpdated} updated in ${executionTime}ms`
    )

    return NextResponse.json({
      success: true,
      jobId,
      marketHours: true,
      dataSource: 'eodhd',
      rotation: {
        offset,
        totalStocks,
        stocksInThisRun: stocksToUpdate.length,
        nextOffset: (offset + STOCKS_PER_RUN) % totalStocks,
      },
      summary: {
        totalUpdated: result.stocksUpdated,
        totalFailed: result.stocksFailed,
        executionTimeMs: executionTime,
        failedCodes: result.failedCodes.slice(0, 10),
      },
    })
  } catch (error) {
    const executionTime = Date.now() - startTime

    // Update job log with error
    try {
      const errorData: PriceUpdateLogUpdate = {
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        status: 'failed',
        error_summary: error instanceof Error ? error.message : 'Unknown error',
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('price_update_logs') as any).update(errorData).eq('job_id', jobId)
    } catch (logError) {
      console.error('Failed to update job log:', logError)
    }

    console.error(`[EODHD Cron] Job ${jobId} failed:`, error)

    return NextResponse.json(
      { success: false, jobId, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

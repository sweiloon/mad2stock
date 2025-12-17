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

// ============================================================================
// CONFIGURATION - Optimized for Parallel Processing
// ============================================================================

// Vercel Hobby has 10-second timeout
// With parallel processing, we can update 400 stocks per cron call
// 800 stocks / 400 per call = 2 calls → All stocks updated within 30 minutes

const STOCKS_PER_RUN = 400       // Process 400 stocks per cron invocation (8 parallel batches)
const BATCH_SIZE = 50           // EODHD max: 50 symbols per batch request
const PARALLEL_BATCHES = 8      // Run 8 batches in parallel
const DB_BATCH_SIZE = 50        // Upsert 50 records at a time

interface UpdateResult {
  stocksUpdated: number
  stocksFailed: number
  duration: number
  failedCodes: string[]
  batchStats: {
    totalBatches: number
    parallelGroups: number
    avgBatchTime: number
  }
}

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

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

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

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

// ============================================================================
// PARALLEL BATCH PROCESSING
// ============================================================================

/**
 * Fetch quotes for a single batch (50 stocks max)
 * Returns a Map of stockCode -> quote data
 */
async function fetchBatch(
  batchNum: number,
  stockCodes: string[]
): Promise<{ batchNum: number; quotes: Map<string, unknown>; duration: number }> {
  const startTime = Date.now()

  try {
    const quotes = await fetchEODHDBatchQuotes(stockCodes)
    const duration = Date.now() - startTime
    console.log(`[Parallel] Batch ${batchNum}: ${quotes.size}/${stockCodes.length} quotes in ${duration}ms`)
    return { batchNum, quotes, duration }
  } catch (error) {
    console.error(`[Parallel] Batch ${batchNum} failed:`, error)
    return { batchNum, quotes: new Map(), duration: Date.now() - startTime }
  }
}

/**
 * Update prices using EODHD API with PARALLEL batch processing
 * Processes multiple batches simultaneously using Promise.all()
 */
async function updatePricesParallel(
  stocks: { code: string; tier: 1 | 3 }[],
  supabase: ReturnType<typeof createAdminClient>
): Promise<UpdateResult> {
  const startTime = Date.now()
  const failedCodes: string[] = []
  let successCount = 0

  if (stocks.length === 0) {
    return {
      stocksUpdated: 0,
      stocksFailed: 0,
      duration: 0,
      failedCodes: [],
      batchStats: { totalBatches: 0, parallelGroups: 0, avgBatchTime: 0 }
    }
  }

  const stockCodes = stocks.map(s => s.code)
  const stockMap = new Map(stocks.map(s => [s.code, s]))

  // Split into batches of BATCH_SIZE (50)
  const batches: string[][] = []
  for (let i = 0; i < stockCodes.length; i += BATCH_SIZE) {
    batches.push(stockCodes.slice(i, i + BATCH_SIZE))
  }

  console.log(`[Parallel] Processing ${stockCodes.length} stocks in ${batches.length} batches (${PARALLEL_BATCHES} parallel)`)

  // Process batches in parallel groups
  const allQuotes = new Map()
  const batchTimes: number[] = []
  let parallelGroups = 0

  for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
    parallelGroups++
    const parallelBatches = batches.slice(i, i + PARALLEL_BATCHES)

    console.log(`[Parallel] Starting parallel group ${parallelGroups}: batches ${i + 1}-${i + parallelBatches.length}`)

    // Run batches in parallel using Promise.all
    const results = await Promise.all(
      parallelBatches.map((batch, idx) => fetchBatch(i + idx + 1, batch))
    )

    // Collect results
    for (const result of results) {
      result.quotes.forEach((v, k) => allQuotes.set(k, v))
      batchTimes.push(result.duration)
    }

    // Small delay between parallel groups to avoid rate limiting
    if (i + PARALLEL_BATCHES < batches.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  const fetchDuration = Date.now() - startTime
  console.log(`[Parallel] All batches complete: ${allQuotes.size} quotes fetched in ${fetchDuration}ms`)

  // Prepare database records
  const now = new Date()
  const dbRecords: StockPriceInsert[] = []

  for (const stock of stocks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote = allQuotes.get(stock.code) as any
    const nextUpdateTime = calculateNextUpdate(stock.tier, now)

    if (quote) {
      dbRecords.push({
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
      })
    } else {
      failedCodes.push(stock.code)
    }
  }

  // Batch upsert to database (more efficient than individual upserts)
  const dbStartTime = Date.now()
  for (let i = 0; i < dbRecords.length; i += DB_BATCH_SIZE) {
    const batch = dbRecords.slice(i, i + DB_BATCH_SIZE)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('stock_prices') as any)
        .upsert(batch, { onConflict: 'stock_code' })

      if (error) {
        console.error(`[Parallel] DB batch ${Math.floor(i / DB_BATCH_SIZE) + 1} error:`, error)
        // Mark these as failed
        batch.forEach(r => failedCodes.push(r.stock_code))
      } else {
        successCount += batch.length
      }
    } catch (error) {
      console.error(`[Parallel] DB batch error:`, error)
      batch.forEach(r => failedCodes.push(r.stock_code))
    }
  }

  const dbDuration = Date.now() - dbStartTime
  const totalDuration = Date.now() - startTime
  const avgBatchTime = batchTimes.length > 0
    ? Math.round(batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length)
    : 0

  console.log(`[Parallel] DB writes complete: ${successCount} records in ${dbDuration}ms`)
  console.log(`[Parallel] Total: ${successCount} updated, ${failedCodes.length} failed in ${totalDuration}ms`)

  return {
    stocksUpdated: successCount,
    stocksFailed: failedCodes.length,
    duration: totalDuration,
    failedCodes,
    batchStats: {
      totalBatches: batches.length,
      parallelGroups,
      avgBatchTime
    }
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Validate request
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const forceUpdate = url.searchParams.get('force') === 'true'
  const offsetParam = url.searchParams.get('offset')
  const testMode = url.searchParams.get('test') === 'true' // For dry-run testing

  const supabase = createAdminClient()
  const now = new Date()

  // Check if we're in market hours (skip if force=true or test=true)
  if (!forceUpdate && !testMode && !isMarketHours(now)) {
    console.log('[EODHD Cron] Outside market hours, skipping update')
    return NextResponse.json({
      success: true,
      message: 'Outside market hours (9am-5pm MYT, Mon-Fri)',
      marketHours: false,
      currentTime: now.toISOString(),
    })
  }

  // Check EODHD API status first (skip in test mode)
  if (!testMode) {
    const apiStatus = await checkEODHDStatus()
    if (!apiStatus.success) {
      console.error(`[EODHD Cron] API check failed: ${apiStatus.message}`)
      return NextResponse.json(
        { success: false, error: `EODHD API error: ${apiStatus.message}` },
        { status: 500 }
      )
    }
  }

  // Calculate offset for rotation
  const allStocks = getAllStocksSorted()
  const totalStocks = allStocks.length

  let offset: number
  if (offsetParam) {
    offset = parseInt(offsetParam) % totalStocks
  } else {
    // Auto-calculate offset based on current minute
    // With 400 stocks per run, we need 2 runs to cover ~800 stocks
    // Offset changes every 15 minutes (cron interval)
    const minuteOfDay = now.getHours() * 60 + now.getMinutes()
    const cycleNumber = Math.floor(minuteOfDay / 15) % Math.ceil(totalStocks / STOCKS_PER_RUN)
    offset = cycleNumber * STOCKS_PER_RUN
  }

  // Get stocks for this rotation
  const stocksToUpdate = getStocksForRotation(offset, STOCKS_PER_RUN)

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
  console.log(
    `[EODHD Cron] Job ${jobId}: Updating ${stocksToUpdate.length} stocks (offset: ${offset}/${totalStocks})`
  )
  console.log(
    `[EODHD Cron] Parallel config: ${STOCKS_PER_RUN} stocks, ${BATCH_SIZE}/batch, ${PARALLEL_BATCHES} parallel`
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
    // Update stocks using parallel processing
    const result = await updatePricesParallel(stocksToUpdate, supabase)

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
      parallelProcessing: {
        enabled: true,
        stocksPerRun: STOCKS_PER_RUN,
        batchSize: BATCH_SIZE,
        parallelBatches: PARALLEL_BATCHES,
        ...result.batchStats
      },
      rotation: {
        offset,
        totalStocks,
        stocksInThisRun: stocksToUpdate.length,
        nextOffset: (offset + STOCKS_PER_RUN) % totalStocks,
        estimatedCyclesToComplete: Math.ceil(totalStocks / STOCKS_PER_RUN),
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

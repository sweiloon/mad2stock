import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllStockCodes } from '@/lib/stock-codes'
import { hasAnalysisData } from '@/lib/company-data'
import { fetchHybridBatchQuotes } from '@/lib/hybrid-stock-api'
import { checkEODHDStatus } from '@/lib/eodhd-api'
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
// CONFIGURATION - Optimized for EODHD EOD Endpoint
// ============================================================================

// Vercel Hobby has 10-second timeout - MUST stay under 8 seconds
// EODHD API has rate limiting - 5 stocks at ~2.5s is the sweet spot
//
// OPTIMIZED FOR 5-HOUR CYCLE:
// - 801 stocks / 5 per run = 161 runs needed
// - With 2-min cron interval: 161 × 2 = 322 minutes = 5.4 hours
// - Update cron-job.org to run every 2 minutes for faster updates

const STOCKS_PER_RUN = 5        // Optimal: 5 stocks in ~2.5 seconds
const BATCH_SIZE = 5            // DB batch size for upserting
const PARALLEL_BATCHES = 10     // Concurrent EODHD requests (handled in eodhd-api.ts)
const DB_BATCH_SIZE = 5         // Upsert 5 records at a time

interface UpdateResult {
  stocksUpdated: number
  stocksFailed: number
  duration: number
  failedCodes: string[]
  batchStats: {
    totalBatches: number
    parallelGroups: number
    avgBatchTime: number
    eodhd?: number
    yahoo?: number
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
    // Use hasAnalysisData to determine tier (replaces old isCore80Stock)
    // Stocks with analysis data → Tier 1 (higher priority, more frequent updates)
    // Other stocks → Tier 3 (lower priority)
    const hasAnalysis = hasAnalysisData(code)
    stocks.push({ code, tier: hasAnalysis ? TIER_1 : TIER_3 })
  }

  // Sort: Tier 1 (analyzed) first, then Tier 3
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
// HYBRID PRICE UPDATE (EODHD + Yahoo Finance Fallback)
// ============================================================================

/**
 * Update prices using Hybrid approach
 * Primary: EODHD EOD API (~707 stocks)
 * Fallback: Yahoo Finance v8 Chart API (~88 additional stocks)
 * This achieves ~99% coverage of KLSE stocks
 */
async function updatePricesHybrid(
  stocks: { code: string; tier: 1 | 3 }[],
  supabase: ReturnType<typeof createAdminClient>
): Promise<UpdateResult> {
  const startTime = Date.now()
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
  const stockMap = new Map(stocks.map(s => [s.code.toUpperCase(), s]))

  console.log(`[Hybrid] Fetching prices for ${stockCodes.length} stocks`)

  // Fetch all quotes using hybrid approach (EODHD + Yahoo fallback)
  const fetchStartTime = Date.now()
  const hybridResult = await fetchHybridBatchQuotes(stockCodes)
  const fetchDuration = Date.now() - fetchStartTime

  console.log(`[Hybrid] Fetched ${hybridResult.quotes.size}/${stockCodes.length} quotes in ${fetchDuration}ms`)
  console.log(`[Hybrid] Sources: EODHD=${hybridResult.stats.eodhd}, Yahoo=${hybridResult.stats.yahoo}, Failed=${hybridResult.stats.failed}`)

  // Prepare database records
  const now = new Date()
  const dbRecords: StockPriceInsert[] = []

  for (const [code, quote] of hybridResult.quotes) {
    const stock = stockMap.get(code)
    if (!stock) continue

    const nextUpdateTime = calculateNextUpdate(stock.tier, now)

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
      data_source: quote.dataSource, // Now correctly tracks 'eodhd' or 'yahoo'
      tier: stock.tier,
      next_update_at: nextUpdateTime.toISOString(),
      scrape_status: 'success',
      error_message: null,
      updated_at: now.toISOString(),
    })
  }

  // Batch upsert to database
  const dbStartTime = Date.now()
  const dbFailedCodes: string[] = []

  for (let i = 0; i < dbRecords.length; i += DB_BATCH_SIZE) {
    const batch = dbRecords.slice(i, i + DB_BATCH_SIZE)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('stock_prices') as any)
        .upsert(batch, { onConflict: 'stock_code' })

      if (error) {
        console.error(`[Hybrid] DB batch ${Math.floor(i / DB_BATCH_SIZE) + 1} error:`, error)
        batch.forEach(r => dbFailedCodes.push(r.stock_code))
      } else {
        successCount += batch.length
      }
    } catch (error) {
      console.error(`[Hybrid] DB batch error:`, error)
      batch.forEach(r => dbFailedCodes.push(r.stock_code))
    }
  }

  const dbDuration = Date.now() - dbStartTime
  const totalDuration = Date.now() - startTime

  // Combine API failures and DB failures
  const allFailedCodes = [...hybridResult.stats.failedCodes, ...dbFailedCodes]

  console.log(`[Hybrid] DB writes: ${successCount} records in ${dbDuration}ms`)
  console.log(`[Hybrid] Total: ${successCount} updated, ${allFailedCodes.length} failed in ${totalDuration}ms`)

  return {
    stocksUpdated: successCount,
    stocksFailed: allFailedCodes.length,
    duration: totalDuration,
    failedCodes: allFailedCodes,
    batchStats: {
      totalBatches: 1,
      parallelGroups: 1,
      avgBatchTime: fetchDuration,
      eodhd: hybridResult.stats.eodhd,
      yahoo: hybridResult.stats.yahoo,
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
    console.log('[Hybrid Cron] Outside market hours, skipping update')
    return NextResponse.json({
      success: true,
      message: 'Outside market hours (9am-5pm MYT, Mon-Fri)',
      marketHours: false,
      currentTime: now.toISOString(),
    })
  }

  // Check EODHD API status first (skip in test mode)
  // Note: Yahoo Finance fallback will still work if EODHD is down
  if (!testMode) {
    const apiStatus = await checkEODHDStatus()
    if (!apiStatus.success) {
      console.warn(`[Hybrid Cron] EODHD API check failed: ${apiStatus.message}, will rely more on Yahoo fallback`)
      // Don't fail here - Yahoo fallback can still provide data
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
    `[Hybrid Cron] Job ${jobId}: Updating ${stocksToUpdate.length} stocks (offset: ${offset}/${totalStocks})`
  )
  console.log(
    `[Hybrid Cron] Using EODHD (primary) + Yahoo Finance (fallback) for ~99% coverage`
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
    // Update stocks using hybrid approach (EODHD + Yahoo fallback)
    const result = await updatePricesHybrid(stocksToUpdate, supabase)

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
      `[Hybrid Cron] Job ${jobId} completed: ${result.stocksUpdated} updated in ${executionTime}ms`
    )

    return NextResponse.json({
      success: true,
      jobId,
      marketHours: true,
      dataSource: 'hybrid',
      dataSources: {
        eodhd: result.batchStats.eodhd || 0,
        yahoo: result.batchStats.yahoo || 0,
        failed: result.stocksFailed,
      },
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

    console.error(`[Hybrid Cron] Job ${jobId} failed:`, error)

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

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllStockCodes, isCore80Stock } from '@/lib/stock-codes'
import { fetchAllKLSEQuotes, checkEODHDStatus } from '@/lib/eodhd-api'
import {
  TIER_1,
  TIER_3,
  getTiersToUpdate,
  calculateNextUpdate,
  isMarketHours,
} from '@/lib/stock-tiers'
import type { Database } from '@/types/database'

type StockPriceInsert = Database['public']['Tables']['stock_prices']['Insert']
type PriceUpdateLogInsert = Database['public']['Tables']['price_update_logs']['Insert']
type PriceUpdateLogUpdate = Database['public']['Tables']['price_update_logs']['Update']

// Configuration for EODHD batch processing
// EODHD allows 50 symbols per request, but we use 20 for safety
const BATCH_SIZE = 20
const BATCH_DELAY_MS = 300 // 300ms between batches

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

// Get stocks for a specific tier
function getStocksForTier(tier: 1 | 2 | 3): string[] {
  const allCodes = getAllStockCodes()
  const tieredStocks: string[] = []

  for (const code of allCodes) {
    const isCore = isCore80Stock(code)
    const stockTier = isCore ? TIER_1 : TIER_3

    if (stockTier === tier) {
      tieredStocks.push(code)
    }
  }

  return tieredStocks
}

// Update prices using EODHD API
async function updatePricesWithEODHD(
  stockCodes: string[],
  tier: 1 | 2 | 3,
  supabase: ReturnType<typeof createAdminClient>
): Promise<UpdateResult> {
  const startTime = Date.now()
  const failedCodes: string[] = []
  let successCount = 0

  if (stockCodes.length === 0) {
    return {
      stocksUpdated: 0,
      stocksFailed: 0,
      duration: 0,
      failedCodes: [],
    }
  }

  console.log(`[EODHD Cron] Fetching ${stockCodes.length} stocks (tier ${tier})...`)

  // Fetch all quotes using EODHD batch API
  const quotes = await fetchAllKLSEQuotes(stockCodes, BATCH_SIZE, BATCH_DELAY_MS)

  const now = new Date()
  const nextUpdateTime = calculateNextUpdate(tier, now)

  // Update successful quotes in database
  for (const [stockCode, quote] of quotes) {
    try {
      const priceData: StockPriceInsert = {
        stock_code: stockCode,
        price: quote.price,
        change: quote.change,
        change_percent: quote.changePercent,
        previous_close: quote.previousClose,
        day_open: quote.open,
        day_high: quote.high,
        day_low: quote.low,
        volume: quote.volume,
        data_source: 'eodhd',
        tier,
        next_update_at: nextUpdateTime.toISOString(),
        scrape_status: 'success',
        error_message: null,
        updated_at: now.toISOString(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('stock_prices') as any).upsert(priceData, { onConflict: 'stock_code' })
      successCount++
    } catch (error) {
      console.error(`Failed to update ${stockCode}:`, error)
      failedCodes.push(stockCode)
    }
  }

  // Mark stocks that weren't in the response as failed
  for (const code of stockCodes) {
    if (!quotes.has(code) && !failedCodes.includes(code)) {
      failedCodes.push(code)
      try {
        const failedData: StockPriceInsert = {
          stock_code: code,
          tier,
          next_update_at: nextUpdateTime.toISOString(),
          scrape_status: 'failed',
          error_message: 'EODHD fetch returned no data',
          updated_at: now.toISOString(),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('stock_prices') as any).upsert(failedData, { onConflict: 'stock_code' })
      } catch {
        // Ignore
      }
    }
  }

  const duration = Date.now() - startTime
  console.log(
    `[EODHD Cron] Tier ${tier}: ${successCount} updated, ${failedCodes.length} failed in ${duration}ms`
  )

  return {
    stocksUpdated: successCount,
    stocksFailed: failedCodes.length,
    duration,
    failedCodes,
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Validate request
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check EODHD API status first
  const apiStatus = await checkEODHDStatus()
  if (!apiStatus.success) {
    console.error(`[EODHD Cron] API check failed: ${apiStatus.message}`)
    return NextResponse.json(
      {
        success: false,
        error: `EODHD API error: ${apiStatus.message}`,
      },
      { status: 500 }
    )
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const supabase = createAdminClient()
  const now = new Date()

  // Check if we're in market hours (optional - can be disabled for testing)
  const url = new URL(request.url)
  const forceUpdate = url.searchParams.get('force') === 'true'
  const updateAll = url.searchParams.get('all') === 'true'
  const specificTier = url.searchParams.get('tier')

  if (!forceUpdate && !isMarketHours(now)) {
    console.log('[EODHD Cron] Outside market hours, skipping update')
    return NextResponse.json({
      success: true,
      message: 'Outside market hours',
      marketHours: false,
    })
  }

  // Determine which tiers to update
  let tiersToUpdate: (1 | 2 | 3)[]

  if (updateAll) {
    // Update all tiers
    tiersToUpdate = [1, 2, 3]
  } else if (specificTier) {
    // Manual trigger for specific tier
    const tier = parseInt(specificTier) as 1 | 2 | 3
    if (tier >= 1 && tier <= 3) {
      tiersToUpdate = [tier]
    } else {
      tiersToUpdate = getTiersToUpdate(now)
    }
  } else {
    // Automatic tier selection based on current time
    tiersToUpdate = getTiersToUpdate(now)
  }

  // If no tiers to update, default to Tier 1 (core stocks)
  if (tiersToUpdate.length === 0) {
    tiersToUpdate = [TIER_1]
  }

  // Get all stocks for the tiers
  const allStocksToUpdate: string[] = []
  for (const tier of tiersToUpdate) {
    const tierStocks = getStocksForTier(tier)
    allStocksToUpdate.push(...tierStocks)
  }

  console.log(
    `[EODHD Cron] Job ${jobId} starting: ${allStocksToUpdate.length} stocks (tiers: ${tiersToUpdate.join(', ')})`
  )

  // Log job start
  try {
    const logData: PriceUpdateLogInsert = {
      job_id: jobId,
      started_at: now.toISOString(),
      total_companies: allStocksToUpdate.length,
      status: 'running',
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('price_update_logs') as any).insert(logData)
  } catch (error) {
    console.error('Failed to log job start:', error)
  }

  try {
    const results: UpdateResult[] = []

    // Update each tier
    for (const tier of tiersToUpdate) {
      const tierStocks = getStocksForTier(tier)
      if (tierStocks.length > 0) {
        const result = await updatePricesWithEODHD(tierStocks, tier, supabase)
        results.push(result)
      }
    }

    const executionTime = Date.now() - startTime
    const totalUpdated = results.reduce((sum, r) => sum + r.stocksUpdated, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.stocksFailed, 0)
    const allFailedCodes = results.flatMap((r) => r.failedCodes)

    // Update job log
    try {
      const updateData: PriceUpdateLogUpdate = {
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        successful_updates: totalUpdated,
        failed_updates: totalFailed,
        failed_codes: allFailedCodes.slice(0, 50), // Limit to first 50
        status: 'completed',
        error_summary:
          totalFailed > 0
            ? `${totalFailed} stocks failed across ${tiersToUpdate.length} tiers`
            : null,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('price_update_logs') as any)
        .update(updateData)
        .eq('job_id', jobId)
    } catch (error) {
      console.error('Failed to update job log:', error)
    }

    console.log(
      `[EODHD Cron] Job ${jobId} completed: ${totalUpdated} updated, ${totalFailed} failed in ${executionTime}ms`
    )

    return NextResponse.json({
      success: true,
      jobId,
      marketHours: true,
      dataSource: 'eodhd',
      tiersUpdated: tiersToUpdate,
      summary: {
        totalStocks: allStocksToUpdate.length,
        totalUpdated,
        totalFailed,
        executionTimeMs: executionTime,
        failedCodes: allFailedCodes.slice(0, 20), // Return first 20 failed codes
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
      await (supabase.from('price_update_logs') as any)
        .update(errorData)
        .eq('job_id', jobId)
    } catch (logError) {
      console.error('Failed to update job log:', logError)
    }

    console.error(`[EODHD Cron] Job ${jobId} failed:`, error)

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

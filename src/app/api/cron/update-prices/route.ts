import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { STOCK_CODE_MAP, getAllStockCodes, isCore80Stock } from '@/lib/stock-codes'
import { fetchBatchQuotes, toYahooSymbol, YahooQuoteResult } from '@/lib/yahoo-finance'
import {
  TIER_1,
  TIER_2,
  TIER_3,
  getTiersToUpdate,
  calculateTier,
  calculateNextUpdate,
  getTierInterval,
  isMarketHours,
} from '@/lib/stock-tiers'
import type { Database } from '@/types/database'

type StockPriceInsert = Database['public']['Tables']['stock_prices']['Insert']
type PriceUpdateLogInsert = Database['public']['Tables']['price_update_logs']['Insert']
type PriceUpdateLogUpdate = Database['public']['Tables']['price_update_logs']['Update']

// Configuration - Ultra-conservative limits for 30s cron timeout
const BATCH_SIZE = 20 // Yahoo Finance batch size
const MAX_STOCKS_PER_TIER = {
  1: 40, // Core stocks - 2 batches (~6s) - fits in 30s timeout
  2: 30, // Mid cap - 2 batches (~6s)
  3: 40, // Small cap - 2 batches (~6s)
}

interface TierUpdateResult {
  tier: number
  stocksUpdated: number
  stocksFailed: number
  duration: number
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
async function getStocksForTier(tier: 1 | 2 | 3): Promise<string[]> {
  const allCodes = getAllStockCodes()
  const tieredStocks: string[] = []

  for (const code of allCodes) {
    const isCore = isCore80Stock(code)
    // For simplicity, we use the core 80 status to determine tier
    // In production, you'd also check market cap from the database
    const stockTier = isCore ? TIER_1 : TIER_3

    if (stockTier === tier) {
      tieredStocks.push(code)
    }
  }

  // Limit stocks per tier for API efficiency
  return tieredStocks.slice(0, MAX_STOCKS_PER_TIER[tier])
}

// Update prices for a tier using Yahoo Finance batch API
async function updateTierPrices(
  tier: 1 | 2 | 3,
  supabase: ReturnType<typeof createAdminClient>
): Promise<TierUpdateResult> {
  const startTime = Date.now()
  const stocks = await getStocksForTier(tier)

  if (stocks.length === 0) {
    return {
      tier,
      stocksUpdated: 0,
      stocksFailed: 0,
      duration: Date.now() - startTime,
    }
  }

  console.log(`[Tier ${tier}] Updating ${stocks.length} stocks...`)

  // Fetch prices using Yahoo Finance batch API
  const result = await fetchBatchQuotes(stocks)

  const now = new Date()
  const nextUpdateTime = calculateNextUpdate(tier, now)
  let successCount = 0
  let failCount = 0

  // Update successful prices
  for (const [stockCode, quote] of result.success) {
    try {
      const priceData: StockPriceInsert = {
        stock_code: stockCode,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        change_percent: quote.regularMarketChangePercent,
        previous_close: quote.regularMarketPreviousClose,
        day_open: quote.regularMarketOpen,
        day_high: quote.regularMarketDayHigh,
        day_low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        market_cap: quote.marketCap,
        pe_ratio: quote.trailingPE,
        data_source: 'yahoo',
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
      failCount++
    }
  }

  // Mark failed stocks
  for (const stockCode of result.failed) {
    try {
      const failedData: StockPriceInsert = {
        stock_code: stockCode,
        tier,
        next_update_at: nextUpdateTime.toISOString(),
        scrape_status: 'failed',
        error_message: 'Yahoo Finance fetch failed',
        updated_at: now.toISOString(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('stock_prices') as any).upsert(failedData, { onConflict: 'stock_code' })
      failCount++
    } catch (error) {
      console.error(`Failed to mark ${stockCode} as failed:`, error)
    }
  }

  const duration = Date.now() - startTime
  console.log(
    `[Tier ${tier}] Complete: ${successCount} updated, ${failCount} failed in ${duration}ms`
  )

  return {
    tier,
    stocksUpdated: successCount,
    stocksFailed: failCount,
    duration,
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Validate request
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const supabase = createAdminClient()
  const now = new Date()

  // Check if we're in market hours (optional - can be disabled for testing)
  const url = new URL(request.url)
  const forceUpdate = url.searchParams.get('force') === 'true'
  const specificTier = url.searchParams.get('tier')

  if (!forceUpdate && !isMarketHours(now)) {
    console.log('[Cron] Outside market hours, skipping update')
    return NextResponse.json({
      success: true,
      message: 'Outside market hours',
      marketHours: false,
    })
  }

  // Determine which tiers to update
  let tiersToUpdate: (1 | 2 | 3)[]

  if (specificTier) {
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

  // If no tiers to update (shouldn't happen at 5-minute intervals)
  if (tiersToUpdate.length === 0) {
    // Default to Tier 1 (core stocks)
    tiersToUpdate = [TIER_1]
  }

  console.log(`[Cron] Job ${jobId} starting for tiers: ${tiersToUpdate.join(', ')}`)

  // Log job start
  try {
    const logData: PriceUpdateLogInsert = {
      job_id: jobId,
      started_at: now.toISOString(),
      total_companies: tiersToUpdate.reduce(
        (sum, tier) => sum + MAX_STOCKS_PER_TIER[tier],
        0
      ),
      status: 'running',
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('price_update_logs') as any).insert(logData)
  } catch (error) {
    console.error('Failed to log job start:', error)
  }

  try {
    const results: TierUpdateResult[] = []

    // Update each tier
    for (const tier of tiersToUpdate) {
      const result = await updateTierPrices(tier, supabase)
      results.push(result)
    }

    const executionTime = Date.now() - startTime
    const totalUpdated = results.reduce((sum, r) => sum + r.stocksUpdated, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.stocksFailed, 0)

    // Update job log
    try {
      const updateData: PriceUpdateLogUpdate = {
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        successful_updates: totalUpdated,
        failed_updates: totalFailed,
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
      `[Cron] Job ${jobId} completed: ${totalUpdated} updated, ${totalFailed} failed in ${executionTime}ms`
    )

    return NextResponse.json({
      success: true,
      jobId,
      marketHours: true,
      tiersUpdated: tiersToUpdate,
      summary: {
        totalUpdated,
        totalFailed,
        executionTimeMs: executionTime,
        tierResults: results,
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

    console.error(`[Cron] Job ${jobId} failed:`, error)

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

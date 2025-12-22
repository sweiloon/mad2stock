import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllStockCodes } from '@/lib/stock-codes'
import { getCompanyByCode } from '@/lib/company-data'
import { fetchBatchFundamentals } from '@/lib/yahoo-finance'
import { TIER_1, TIER_3 } from '@/lib/stock-tiers'
import type { Database } from '@/types/database'

type StockPriceUpdate = Database['public']['Tables']['stock_prices']['Update']

// ============================================================================
// DAILY FUNDAMENTALS UPDATE V2 - Batch Jobs (Hobby Plan Compatible)
// ============================================================================
//
// PURPOSE: Fetch and update fundamental data (52-week high/low, etc.)
//          for ALL 763 companies in a single daily cycle.
//
// STRATEGY: 153 batch jobs optimized for Vercel Hobby plan (60s timeout)
// - Each job processes 5 stocks sequentially
// - 5 stocks × 3s per stock = ~15 seconds (very safe under 60s limit)
// - Run batches with gaps to avoid Yahoo rate limiting
//
// VERCEL HOBBY PLAN:
// - Max timeout: 60 seconds
// - This code processes 5 stocks in ~15 seconds (safe margin)
//
// CRONJOB.ORG SETUP (153 jobs):
// - URL: /api/cron/update-fundamentals-v2?batch=0&secret=xxx (through batch=152)
// - Schedule: Stagger across the night
//
// ============================================================================

const TOTAL_BATCHES = 153  // Number of batch jobs
const STOCKS_PER_BATCH = 5  // Stocks per batch (proven safe from other endpoints)

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

function validateRequest(request: NextRequest): boolean {
  const vercelCronHeader = request.headers.get('x-vercel-cron')
  if (vercelCronHeader) return true

  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    return token === process.env.CRON_SECRET
  }

  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret && secret === process.env.CRON_SECRET) return true

  if (process.env.NODE_ENV === 'development') return true

  return false
}

// ============================================================================
// STOCK SLICING BY HOUR
// ============================================================================

function getAllStocksSorted(): { code: string; tier: 1 | 3 }[] {
  const allCodes = getAllStockCodes()
  const stocks: { code: string; tier: 1 | 3 }[] = []

  for (const code of allCodes) {
    const company = getCompanyByCode(code)
    const hasAnalysis = company?.hasAnalysis === true
    stocks.push({ code, tier: hasAnalysis ? TIER_1 : TIER_3 })
  }

  // Sort by tier (Tier 1 first, then Tier 3)
  stocks.sort((a, b) => a.tier - b.tier)
  return stocks
}

/**
 * Get stocks for a specific batch.
 * Divides all stocks into batches of STOCKS_PER_BATCH.
 */
function getStocksForBatch(batch: number): {
  stocks: { code: string; tier: 1 | 3 }[]
  startIdx: number
  endIdx: number
  totalStocks: number
} {
  const allStocks = getAllStocksSorted()
  const totalStocks = allStocks.length

  const startIdx = batch * STOCKS_PER_BATCH
  const endIdx = Math.min(startIdx + STOCKS_PER_BATCH, totalStocks)

  return {
    stocks: allStocks.slice(startIdx, endIdx),
    startIdx,
    endIdx,
    totalStocks,
  }
}

// ============================================================================
// UPDATE FUNDAMENTALS
// ============================================================================

async function updateFundamentals(
  stocks: { code: string; tier: 1 | 3 }[],
  supabase: ReturnType<typeof createAdminClient>
): Promise<{
  updated: number
  failed: number
  failedCodes: string[]
  totalTime: number
}> {
  const startTime = Date.now()
  let totalUpdated = 0
  let totalFailed = 0
  const allFailedCodes: string[] = []

  const stockCodes = stocks.map(s => s.code)
  console.log(`[Fundamentals V2] Fetching ${stockCodes.length} stocks...`)

  try {
    const result = await fetchBatchFundamentals(stockCodes)

    // Update database for successful fetches
    for (const [code, fundamentals] of result.success) {
      try {
        const update: StockPriceUpdate = {
          market_cap: fundamentals.marketCap,
          pe_ratio: fundamentals.peRatio,
          eps: fundamentals.eps,
          dividend_yield: fundamentals.dividendYield,
          week_52_high: fundamentals.week52High,
          week_52_low: fundamentals.week52Low,
          updated_at: new Date().toISOString(),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('stock_prices') as any)
          .update(update)
          .eq('stock_code', code)

        if (error) {
          console.error(`[Fundamentals V2] DB error for ${code}:`, error)
          totalFailed++
          allFailedCodes.push(code)
        } else {
          totalUpdated++
        }
      } catch (err) {
        console.error(`[Fundamentals V2] Error updating ${code}:`, err)
        totalFailed++
        allFailedCodes.push(code)
      }
    }

    // Track API failures
    for (const failedCode of result.failed) {
      if (!allFailedCodes.includes(failedCode)) {
        allFailedCodes.push(failedCode)
        totalFailed++
      }
    }

  } catch (error) {
    console.error(`[Fundamentals V2] Batch error:`, error)
    totalFailed += stockCodes.length
    allFailedCodes.push(...stockCodes)
  }

  return {
    updated: totalUpdated,
    failed: totalFailed,
    failedCodes: allFailedCodes,
    totalTime: Date.now() - startTime,
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const batchParam = url.searchParams.get('batch')

  if (batchParam === null) {
    const allStocks = getAllStocksSorted()
    const actualBatches = Math.ceil(allStocks.length / STOCKS_PER_BATCH)

    return NextResponse.json({
      error: 'Missing batch parameter',
      usage: `Add ?batch=0 through ?batch=${actualBatches - 1} to specify which batch to process`,
      totalBatches: actualBatches,
      stocksPerBatch: STOCKS_PER_BATCH,
      totalStocks: allStocks.length,
      vercelPlan: 'Hobby (60s timeout)',
      schedule: {
        description: `${actualBatches} batch jobs, each processing ${STOCKS_PER_BATCH} stocks in ~15 seconds`,
        example: 'Run batches every 5 minutes: batch=0 at 9:00pm, batch=1 at 9:05pm, etc.',
      },
    }, { status: 400 })
  }

  const batch = parseInt(batchParam)
  const allStocks = getAllStocksSorted()
  const actualBatches = Math.ceil(allStocks.length / STOCKS_PER_BATCH)

  if (isNaN(batch) || batch < 0 || batch >= actualBatches) {
    return NextResponse.json({
      error: `Invalid batch: ${batchParam}. Must be 0-${actualBatches - 1}`,
    }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get stocks for this batch
  const { stocks, startIdx, endIdx, totalStocks } = getStocksForBatch(batch)

  console.log(`[Fundamentals V2 Batch ${batch}] Processing stocks ${startIdx}-${endIdx - 1} of ${totalStocks}`)

  if (stocks.length === 0) {
    return NextResponse.json({
      success: true,
      batch,
      totalBatches: actualBatches,
      message: 'No stocks for this batch',
    })
  }

  try {
    const result = await updateFundamentals(stocks, supabase)
    const executionTime = Date.now() - startTime

    console.log(`[Fundamentals V2 Batch ${batch}] Completed: ${result.updated} updated, ${result.failed} failed in ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      batch,
      totalBatches: actualBatches,
      batchInfo: {
        stocksProcessed: stocks.length,
        startIdx,
        endIdx,
        totalStocks,
      },
      result: {
        updated: result.updated,
        failed: result.failed,
        failedCodes: result.failedCodes.slice(0, 10),
        failedTotal: result.failedCodes.length,
      },
      timing: {
        executionTimeMs: executionTime,
        executionTimeSec: Math.round(executionTime / 1000),
        fetchTimeMs: result.totalTime,
        avgPerStock: stocks.length > 0 ? Math.round(result.totalTime / stocks.length) : 0,
      },
      schedule: {
        description: `Batch ${batch + 1} of ${actualBatches} - processing ${stocks.length} stocks`,
        nextBatch: batch < actualBatches - 1 ? `batch=${batch + 1}` : 'All batches complete',
      },
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[Fundamentals V2 Batch ${batch}] Failed:`, error)

    return NextResponse.json({
      success: false,
      batch,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: executionTime,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllStockCodes } from '@/lib/stock-codes'
import { getCompanyByCode } from '@/lib/company-data'
import { fetchBatchFundamentals } from '@/lib/yahoo-finance'
import { TIER_1, TIER_3 } from '@/lib/stock-tiers'
import type { Database } from '@/types/database'

type StockPriceUpdate = Database['public']['Tables']['stock_prices']['Update']

// ============================================================================
// DAILY FUNDAMENTALS UPDATE V2 - Staggered Hourly Jobs
// ============================================================================
//
// PURPOSE: Fetch and update fundamental data (Market Cap, P/E, EPS, etc.)
//          for ALL 763 companies in a single daily cycle.
//
// STRATEGY: 12 staggered hourly cron jobs (9pm to 8am MYT)
// - Each job processes ~64 stocks sequentially
// - 1-hour gaps between jobs = zero parallel requests to Yahoo
// - Eliminates rate limiting (429 errors) completely
// - All stocks updated by 8:30 AM MYT
//
// MATH:
// - 763 stocks / 12 hours = ~64 stocks per hour
// - 64 stocks × 4s per stock = ~256 seconds (~4.3 minutes)
// - Well under 300s Vercel timeout limit
//
// CRONJOB.ORG SETUP (12 jobs, Asia/Kuala_Lumpur timezone):
// Hour 0:  0 21 * * *   (9 PM)   → /api/cron/update-fundamentals-v2?hour=0&secret=xxx
// Hour 1:  0 22 * * *   (10 PM)  → /api/cron/update-fundamentals-v2?hour=1&secret=xxx
// Hour 2:  0 23 * * *   (11 PM)  → /api/cron/update-fundamentals-v2?hour=2&secret=xxx
// Hour 3:  0 0 * * *    (12 AM)  → /api/cron/update-fundamentals-v2?hour=3&secret=xxx
// Hour 4:  0 1 * * *    (1 AM)   → /api/cron/update-fundamentals-v2?hour=4&secret=xxx
// Hour 5:  0 2 * * *    (2 AM)   → /api/cron/update-fundamentals-v2?hour=5&secret=xxx
// Hour 6:  0 3 * * *    (3 AM)   → /api/cron/update-fundamentals-v2?hour=6&secret=xxx
// Hour 7:  0 4 * * *    (4 AM)   → /api/cron/update-fundamentals-v2?hour=7&secret=xxx
// Hour 8:  0 5 * * *    (5 AM)   → /api/cron/update-fundamentals-v2?hour=8&secret=xxx
// Hour 9:  0 6 * * *    (6 AM)   → /api/cron/update-fundamentals-v2?hour=9&secret=xxx
// Hour 10: 0 7 * * *    (7 AM)   → /api/cron/update-fundamentals-v2?hour=10&secret=xxx
// Hour 11: 0 8 * * *    (8 AM)   → /api/cron/update-fundamentals-v2?hour=11&secret=xxx
//
// ============================================================================

const TOTAL_HOURS = 12  // Number of hourly cron jobs

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
 * Get stocks for a specific hour slot.
 * Divides all stocks evenly across 12 hours.
 */
function getStocksForHour(hour: number): {
  stocks: { code: string; tier: 1 | 3 }[]
  startIdx: number
  endIdx: number
  totalStocks: number
} {
  const allStocks = getAllStocksSorted()
  const totalStocks = allStocks.length
  const stocksPerHour = Math.ceil(totalStocks / TOTAL_HOURS)

  const startIdx = hour * stocksPerHour
  const endIdx = Math.min(startIdx + stocksPerHour, totalStocks)

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
  const hourParam = url.searchParams.get('hour')

  if (hourParam === null) {
    return NextResponse.json({
      error: 'Missing hour parameter',
      usage: 'Add ?hour=0 through ?hour=11 to specify which hour slot to process',
      totalHours: TOTAL_HOURS,
      schedule: {
        description: '12 staggered hourly jobs from 9pm to 8am MYT',
        hours: Array.from({ length: TOTAL_HOURS }, (_, i) => ({
          hour: i,
          cronSchedule: i < 3 ? `0 ${21 + i} * * *` : `0 ${i - 3} * * *`,
          time: i < 3 ? `${9 + i} PM` : `${i - 3 === 0 ? 12 : i - 3} AM`,
        })),
      },
    }, { status: 400 })
  }

  const hour = parseInt(hourParam)
  if (isNaN(hour) || hour < 0 || hour >= TOTAL_HOURS) {
    return NextResponse.json({
      error: `Invalid hour: ${hourParam}. Must be 0-${TOTAL_HOURS - 1}`,
    }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get stocks for this hour slot
  const { stocks, startIdx, endIdx, totalStocks } = getStocksForHour(hour)

  console.log(`[Fundamentals V2 Hour ${hour}] Processing stocks ${startIdx}-${endIdx - 1} of ${totalStocks}`)

  if (stocks.length === 0) {
    return NextResponse.json({
      success: true,
      hour,
      totalHours: TOTAL_HOURS,
      message: 'No stocks for this hour slot',
    })
  }

  try {
    const result = await updateFundamentals(stocks, supabase)
    const executionTime = Date.now() - startTime

    console.log(`[Fundamentals V2 Hour ${hour}] Completed: ${result.updated} updated, ${result.failed} failed in ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      hour,
      totalHours: TOTAL_HOURS,
      slotInfo: {
        stocksProcessed: stocks.length,
        startIdx,
        endIdx,
        totalStocks,
      },
      result: {
        updated: result.updated,
        failed: result.failed,
        failedCodes: result.failedCodes.slice(0, 20), // Limit to first 20 for response size
        failedTotal: result.failedCodes.length,
      },
      timing: {
        executionTimeMs: executionTime,
        executionTimeSec: Math.round(executionTime / 1000),
        fetchTimeMs: result.totalTime,
        avgPerStock: Math.round(result.totalTime / stocks.length),
      },
      schedule: {
        description: 'Daily 9pm-8am MYT, all 763 stocks across 12 hourly jobs',
        thisJob: `Hour ${hour}: ${hour < 3 ? `${9 + hour} PM` : `${hour - 3 === 0 ? 12 : hour - 3} AM`} MYT`,
        nextJob: hour < 11 ? `Hour ${hour + 1}` : 'Complete - restart tomorrow',
      },
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[Fundamentals V2 Hour ${hour}] Failed:`, error)

    return NextResponse.json({
      success: false,
      hour,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: executionTime,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

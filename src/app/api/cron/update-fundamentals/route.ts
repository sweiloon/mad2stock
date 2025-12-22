import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllStockCodes } from '@/lib/stock-codes'
import { getCompanyByCode } from '@/lib/company-data'
import { fetchBatchFundamentals } from '@/lib/yahoo-finance'
import { TIER_1, TIER_3 } from '@/lib/stock-tiers'
import type { Database } from '@/types/database'

type StockPriceUpdate = Database['public']['Tables']['stock_prices']['Update']

// ============================================================================
// DAILY FUNDAMENTALS UPDATE - Yahoo Finance quoteSummary API
// ============================================================================
//
// PURPOSE: Fetch and update fundamental data (Market Cap, P/E, EPS, etc.)
// This runs ONCE DAILY at 6am MYT (before 9am market open)
//
// STRATEGY: Same 16-slice parallel pattern as price cron for timeout safety
// - Each slice processes ~48 stocks (763 / 16)
// - 10 stocks per batch within each slice (safe, ~10s per batch)
// - All 16 slices run in parallel via cronjob.org
// - Completes in ~2-3 minutes total
//
// SCHEDULE: 0 22 * * 0-4 (10pm UTC Sunday-Thursday = 6am MYT Monday-Friday)
//
// CRONJOB.ORG SETUP (16 jobs, all run at 10pm UTC / 6am MYT):
// /api/cron/update-fundamentals?slice=0&secret=xxx  (through slice=15)
//
// ============================================================================

const TOTAL_SLICES = 16          // Number of parallel cron jobs (same as price cron)
const STOCKS_PER_BATCH = 10      // Stocks per Yahoo API call (10 is safe, ~10s)

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

function validateRequest(request: NextRequest): boolean {
  // Vercel cron header
  const vercelCronHeader = request.headers.get('x-vercel-cron')
  if (vercelCronHeader) return true

  // Bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    return token === process.env.CRON_SECRET
  }

  // Query param secret
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret && secret === process.env.CRON_SECRET) return true

  // Development mode
  if (process.env.NODE_ENV === 'development') return true

  return false
}

// ============================================================================
// MALAYSIA TIMEZONE HELPERS
// ============================================================================

function getMalaysiaTime(): Date {
  // Get current time in Malaysia timezone (UTC+8)
  const now = new Date()
  const malaysiaOffset = 8 * 60 // UTC+8 in minutes
  const utcOffset = now.getTimezoneOffset() // Local offset from UTC
  const malaysiaTime = new Date(now.getTime() + (malaysiaOffset + utcOffset) * 60 * 1000)
  return malaysiaTime
}

function isFundamentalsUpdateTime(now: Date): boolean {
  const malaysiaTime = getMalaysiaTime()
  const hour = malaysiaTime.getHours()
  const day = malaysiaTime.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday

  // Run on weekdays (Monday-Friday) from 5am-8am MYT (before market open)
  // This gives flexibility for the cron to run anytime in this window
  const isWeekday = day >= 1 && day <= 5
  const isUpdateWindow = hour >= 5 && hour < 8

  return isWeekday && isUpdateWindow
}

// ============================================================================
// STOCK SLICING (Same logic as price cron)
// ============================================================================

function getAllStocksSorted(): { code: string; tier: 1 | 3 }[] {
  const allCodes = getAllStockCodes()
  const stocks: { code: string; tier: 1 | 3 }[] = []

  for (const code of allCodes) {
    const company = getCompanyByCode(code)
    const hasAnalysis = company?.hasAnalysis === true
    stocks.push({ code, tier: hasAnalysis ? TIER_1 : TIER_3 })
  }

  // Sort: Tier 1 first, then Tier 3
  stocks.sort((a, b) => a.tier - b.tier)
  return stocks
}

function getSliceStocks(sliceIndex: number): { code: string; tier: 1 | 3 }[] {
  const allStocks = getAllStocksSorted()
  const totalStocks = allStocks.length
  const stocksPerSlice = Math.ceil(totalStocks / TOTAL_SLICES)

  const sliceStartIdx = sliceIndex * stocksPerSlice
  const sliceEndIdx = Math.min(sliceStartIdx + stocksPerSlice, totalStocks)

  return allStocks.slice(sliceStartIdx, sliceEndIdx)
}

// ============================================================================
// UPDATE FUNDAMENTALS FOR SLICE
// ============================================================================

async function updateSliceFundamentals(
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

  // Process in batches of STOCKS_PER_BATCH
  for (let i = 0; i < stocks.length; i += STOCKS_PER_BATCH) {
    const batchStocks = stocks.slice(i, i + STOCKS_PER_BATCH)
    const batchCodes = batchStocks.map(s => s.code)
    const batchNum = Math.floor(i / STOCKS_PER_BATCH) + 1
    const totalBatches = Math.ceil(stocks.length / STOCKS_PER_BATCH)

    console.log(`[Fundamentals] Batch ${batchNum}/${totalBatches}: ${batchCodes.length} stocks`)

    try {
      // Fetch fundamentals from Yahoo Finance
      const result = await fetchBatchFundamentals(batchCodes)

      // Prepare update records
      const updates: { stockCode: string; update: StockPriceUpdate }[] = []

      for (const [code, fundamentals] of result.success) {
        updates.push({
          stockCode: code,
          update: {
            market_cap: fundamentals.marketCap,
            pe_ratio: fundamentals.peRatio,
            eps: fundamentals.eps,
            dividend_yield: fundamentals.dividendYield,
            week_52_high: fundamentals.week52High,
            week_52_low: fundamentals.week52Low,
            updated_at: new Date().toISOString(),
          }
        })
      }

      // Update each stock in the database
      for (const { stockCode, update } of updates) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase.from('stock_prices') as any)
            .update(update)
            .eq('stock_code', stockCode)

          if (error) {
            console.error(`[Fundamentals] DB error for ${stockCode}:`, error)
            totalFailed++
            allFailedCodes.push(stockCode)
          } else {
            totalUpdated++
          }
        } catch (err) {
          console.error(`[Fundamentals] Error updating ${stockCode}:`, err)
          totalFailed++
          allFailedCodes.push(stockCode)
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
      console.error(`[Fundamentals] Batch ${batchNum} error:`, error)
      totalFailed += batchCodes.length
      allFailedCodes.push(...batchCodes)
    }
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

  // Validate request
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const sliceParam = url.searchParams.get('slice')
  const forceUpdate = url.searchParams.get('force') === 'true'

  // Validate slice parameter
  if (!sliceParam) {
    return NextResponse.json({
      error: 'Missing slice parameter',
      usage: 'Add ?slice=0 through ?slice=15 to specify which slice to process',
      totalSlices: TOTAL_SLICES,
      schedule: '10pm UTC (6am MYT) daily on weekdays',
    }, { status: 400 })
  }

  const sliceIndex = parseInt(sliceParam)
  if (isNaN(sliceIndex) || sliceIndex < 0 || sliceIndex >= TOTAL_SLICES) {
    return NextResponse.json({
      error: `Invalid slice: ${sliceParam}. Must be 0-${TOTAL_SLICES - 1}`,
    }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const malaysiaTime = getMalaysiaTime()

  // Check if we're in the update window (skip if force=true)
  if (!forceUpdate && !isFundamentalsUpdateTime(now)) {
    return NextResponse.json({
      success: true,
      message: 'Outside fundamentals update window (5am-8am MYT, Mon-Fri)',
      updateWindow: false,
      slice: sliceIndex,
      malaysiaTime: malaysiaTime.toISOString(),
    })
  }

  // Get stocks for this slice
  const sliceStocks = getSliceStocks(sliceIndex)
  const allStocks = getAllStocksSorted()

  console.log(`[Fundamentals Slice ${sliceIndex}] Processing ${sliceStocks.length} stocks...`)

  if (sliceStocks.length === 0) {
    return NextResponse.json({
      success: true,
      slice: sliceIndex,
      message: 'No stocks in this slice',
    })
  }

  try {
    const result = await updateSliceFundamentals(sliceStocks, supabase)
    const executionTime = Date.now() - startTime

    console.log(`[Fundamentals Slice ${sliceIndex}] Completed: ${result.updated} updated, ${result.failed} failed in ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      slice: sliceIndex,
      totalSlices: TOTAL_SLICES,
      sliceInfo: {
        stocksInSlice: sliceStocks.length,
        batchSize: STOCKS_PER_BATCH,
        totalBatches: Math.ceil(sliceStocks.length / STOCKS_PER_BATCH),
      },
      totalStocks: allStocks.length,
      result: {
        updated: result.updated,
        failed: result.failed,
        failedCodes: result.failedCodes.slice(0, 10),
      },
      timing: {
        executionTimeMs: executionTime,
        fetchTimeMs: result.totalTime,
      },
      schedule: {
        description: 'Daily at 6am MYT (10pm UTC previous day), weekdays only',
        cronPattern: '0 22 * * 0-4',
      },
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[Fundamentals Slice ${sliceIndex}] Failed:`, error)

    return NextResponse.json({
      success: false,
      slice: sliceIndex,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: executionTime,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

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
//
// STRATEGY: Rotating offset pattern to handle Yahoo's strict rate limiting
// - Yahoo quoteSummary is heavily rate-limited (~2s per request minimum)
// - Each cron call only processes 5 stocks from its slice
// - Uses day-of-week offset to cycle through all stocks over time
// - 16 slices × 5 stocks = 80 stocks per cron cycle
// - All 763 stocks updated over ~10 workdays
//
// SCHEDULE: Controlled by cronjob.org (set to Asia/Kuala_Lumpur timezone)
// - User schedule: 0 6 * * 1-5 (6am MYT Monday-Friday)
//
// CRONJOB.ORG SETUP (16 jobs):
// /api/cron/update-fundamentals?slice=0&secret=xxx  (through slice=15)
//
// ============================================================================

const TOTAL_SLICES = 16          // Number of parallel cron jobs
const STOCKS_PER_CALL = 5        // Stocks to process per cron call (safe for 60s limit)

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
// MALAYSIA TIMEZONE HELPER
// ============================================================================

function getMalaysiaTime(): Date {
  const now = new Date()
  const malaysiaOffset = 8 * 60
  const utcOffset = now.getTimezoneOffset()
  const malaysiaTime = new Date(now.getTime() + (malaysiaOffset + utcOffset) * 60 * 1000)
  return malaysiaTime
}

// ============================================================================
// STOCK SLICING WITH ROTATING OFFSET
// ============================================================================

function getAllStocksSorted(): { code: string; tier: 1 | 3 }[] {
  const allCodes = getAllStockCodes()
  const stocks: { code: string; tier: 1 | 3 }[] = []

  for (const code of allCodes) {
    const company = getCompanyByCode(code)
    const hasAnalysis = company?.hasAnalysis === true
    stocks.push({ code, tier: hasAnalysis ? TIER_1 : TIER_3 })
  }

  stocks.sort((a, b) => a.tier - b.tier)
  return stocks
}

function getSliceInfo(sliceIndex: number): { code: string; tier: 1 | 3 }[] {
  const allStocks = getAllStocksSorted()
  const totalStocks = allStocks.length
  const stocksPerSlice = Math.ceil(totalStocks / TOTAL_SLICES)

  const sliceStartIdx = sliceIndex * stocksPerSlice
  const sliceEndIdx = Math.min(sliceStartIdx + stocksPerSlice, totalStocks)

  return allStocks.slice(sliceStartIdx, sliceEndIdx)
}

/**
 * Get stocks for this cron call using rotating offset.
 * Each call processes only STOCKS_PER_CALL stocks, cycling through over multiple days.
 */
function getStocksForThisCall(
  sliceIndex: number,
  currentTime: Date
): {
  stocks: { code: string; tier: 1 | 3 }[]
  offset: number
  totalInSlice: number
  cycleInfo: string
} {
  const allSliceStocks = getSliceInfo(sliceIndex)
  const totalInSlice = allSliceStocks.length

  if (totalInSlice === 0) {
    return { stocks: [], offset: 0, totalInSlice: 0, cycleInfo: 'empty slice' }
  }

  // Calculate offset based on day - changes daily
  // Uses day of year to cycle through stocks
  const startOfYear = new Date(currentTime.getFullYear(), 0, 0)
  const diff = currentTime.getTime() - startOfYear.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))

  const cyclesNeeded = Math.ceil(totalInSlice / STOCKS_PER_CALL)
  const offsetIndex = dayOfYear % cyclesNeeded
  const offset = offsetIndex * STOCKS_PER_CALL

  const stocks = allSliceStocks.slice(offset, offset + STOCKS_PER_CALL)

  return {
    stocks,
    offset,
    totalInSlice,
    cycleInfo: `day ${dayOfYear}, offset ${offset}/${totalInSlice}, cycle ${offsetIndex + 1}/${cyclesNeeded}`
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
  console.log(`[Fundamentals] Fetching ${stockCodes.length} stocks: ${stockCodes.join(', ')}`)

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
          console.error(`[Fundamentals] DB error for ${code}:`, error)
          totalFailed++
          allFailedCodes.push(code)
        } else {
          console.log(`[Fundamentals] Updated ${code}: MC=${fundamentals.marketCap}, PE=${fundamentals.peRatio}`)
          totalUpdated++
        }
      } catch (err) {
        console.error(`[Fundamentals] Error updating ${code}:`, err)
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
    console.error(`[Fundamentals] Batch error:`, error)
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
  const sliceParam = url.searchParams.get('slice')

  if (!sliceParam) {
    return NextResponse.json({
      error: 'Missing slice parameter',
      usage: 'Add ?slice=0 through ?slice=15 to specify which slice to process',
      totalSlices: TOTAL_SLICES,
      stocksPerCall: STOCKS_PER_CALL,
    }, { status: 400 })
  }

  const sliceIndex = parseInt(sliceParam)
  if (isNaN(sliceIndex) || sliceIndex < 0 || sliceIndex >= TOTAL_SLICES) {
    return NextResponse.json({
      error: `Invalid slice: ${sliceParam}. Must be 0-${TOTAL_SLICES - 1}`,
    }, { status: 400 })
  }

  const supabase = createAdminClient()
  const malaysiaTime = getMalaysiaTime()

  console.log(`[Fundamentals] Running at ${malaysiaTime.toISOString()} MYT`)

  // Get stocks for this specific cron call using rotating offset
  const { stocks, offset, totalInSlice, cycleInfo } = getStocksForThisCall(sliceIndex, malaysiaTime)
  const allStocks = getAllStocksSorted()

  console.log(`[Fundamentals Slice ${sliceIndex}] ${cycleInfo}`)

  if (stocks.length === 0) {
    return NextResponse.json({
      success: true,
      slice: sliceIndex,
      message: 'No stocks for this cycle',
      cycleInfo,
    })
  }

  try {
    const result = await updateFundamentals(stocks, supabase)
    const executionTime = Date.now() - startTime

    console.log(`[Fundamentals Slice ${sliceIndex}] Completed: ${result.updated} updated, ${result.failed} failed in ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      slice: sliceIndex,
      totalSlices: TOTAL_SLICES,
      sliceInfo: {
        stocksProcessed: stocks.length,
        stocksPerCall: STOCKS_PER_CALL,
        offset,
        totalInSlice,
        cycleInfo,
      },
      totalStocks: allStocks.length,
      result: {
        updated: result.updated,
        failed: result.failed,
        failedCodes: result.failedCodes,
      },
      timing: {
        executionTimeMs: executionTime,
        fetchTimeMs: result.totalTime,
      },
      schedule: {
        description: 'Rotating offset - updates ~80 stocks per day across all slices',
        cronPattern: '0 6 * * 1-5 (6am MYT Monday-Friday)',
        fullCycleTime: `~${Math.ceil(allStocks.length / (TOTAL_SLICES * STOCKS_PER_CALL))} workdays`,
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

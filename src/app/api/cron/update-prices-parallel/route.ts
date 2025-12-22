import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllStockCodes } from '@/lib/stock-codes'
import { getCompanyByCode } from '@/lib/company-data'
import { fetchHybridBatchQuotes } from '@/lib/hybrid-stock-api'
import {
  TIER_1,
  TIER_3,
  calculateNextUpdate,
  isMarketHours,
} from '@/lib/stock-tiers'
import type { Database } from '@/types/database'

type StockPriceInsert = Database['public']['Tables']['stock_prices']['Insert']

// ============================================================================
// PARALLEL SLICE UPDATE ENDPOINT - Fast Updates with Rotating Offset
// ============================================================================
//
// STRATEGY: Each slice only processes a few stocks per cron call (not all)
// Uses rotating offset to cycle through the slice over multiple calls.
//
// SETUP ON CRONJOB.ORG (16 jobs, all run every 10 min):
// /api/cron/update-prices-parallel?slice=0&secret=xxx  (through slice=15)
//
// CALCULATION FOR 1.5-HOUR CYCLE:
// - 763 stocks total
// - 1.5 hours = 90 min
// - At 10-min cron interval: 9 cron runs in 1.5 hours
// - 763 ÷ 9 = 85 stocks per cron run needed
// - 16 parallel slices: 85 ÷ 16 = ~5 stocks per slice per run ✓
//
// RESULT:
// - Each cron call processes 5 stocks per slice (safe, ~3s)
// - 16 slices × 5 stocks = 80 stocks per 10-min cron cycle
// - 763 ÷ 80 = 9.5 cycles × 10 min = 95 min ≈ 1.5 hours ✓

const TOTAL_SLICES = 16          // Number of parallel cron jobs
const STOCKS_PER_CALL = 5        // Stocks each slice processes per cron call
const STOCKS_PER_INTERNAL_BATCH = 5  // Same as above for compatibility
const DB_BATCH_SIZE = 5          // Upsert batch size

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
// STOCK SLICING
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

function getSliceInfo(sliceIndex: number): {
  allSliceStocks: { code: string; tier: 1 | 3 }[]
  stocksPerSlice: number
  sliceStartIdx: number
} {
  const allStocks = getAllStocksSorted()
  const totalStocks = allStocks.length
  const stocksPerSlice = Math.ceil(totalStocks / TOTAL_SLICES)

  const sliceStartIdx = sliceIndex * stocksPerSlice
  const sliceEndIdx = Math.min(sliceStartIdx + stocksPerSlice, totalStocks)
  const allSliceStocks = allStocks.slice(sliceStartIdx, sliceEndIdx)

  return { allSliceStocks, stocksPerSlice, sliceStartIdx }
}

/**
 * Get stocks for this cron call using rotating offset within the slice.
 * Each call processes only STOCKS_PER_CALL stocks, cycling through the slice.
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
  const { allSliceStocks, stocksPerSlice } = getSliceInfo(sliceIndex)
  const totalInSlice = allSliceStocks.length

  if (totalInSlice === 0) {
    return { stocks: [], offset: 0, totalInSlice: 0, cycleInfo: 'empty slice' }
  }

  // Calculate offset based on time - changes every 10 minutes
  // Each slice cycles through its stocks independently
  const minuteOfDay = currentTime.getHours() * 60 + currentTime.getMinutes()
  const cycleNumber = Math.floor(minuteOfDay / 10) // Changes every 10 min
  const cyclesNeeded = Math.ceil(totalInSlice / STOCKS_PER_CALL)
  const offsetIndex = cycleNumber % cyclesNeeded
  const offset = offsetIndex * STOCKS_PER_CALL

  // Get stocks for this call
  const stocks = allSliceStocks.slice(offset, offset + STOCKS_PER_CALL)

  return {
    stocks,
    offset,
    totalInSlice,
    cycleInfo: `offset ${offset}/${totalInSlice}, cycle ${offsetIndex + 1}/${cyclesNeeded}`
  }
}

// ============================================================================
// UPDATE SLICE - Process in small internal batches to avoid timeout
// ============================================================================

async function updateSlice(
  stocks: { code: string; tier: 1 | 3 }[],
  supabase: ReturnType<typeof createAdminClient>,
  internalBatchSize: number = STOCKS_PER_INTERNAL_BATCH
): Promise<{ updated: number; failed: number; failedCodes: string[]; batchesProcessed: number }> {
  const stockMap = new Map(stocks.map(s => [s.code.toUpperCase(), s]))
  const now = new Date()

  let totalUpdated = 0
  let totalFailed = 0
  const allFailedCodes: string[] = []
  let batchesProcessed = 0

  // Process stocks in small internal batches to avoid timeout
  for (let i = 0; i < stocks.length; i += internalBatchSize) {
    const batchStocks = stocks.slice(i, i + internalBatchSize)
    const batchCodes = batchStocks.map(s => s.code)
    batchesProcessed++

    console.log(`[Slice] Processing internal batch ${batchesProcessed}: ${batchCodes.length} stocks`)

    try {
      // Fetch quotes using hybrid approach (EODHD + Yahoo fallback)
      const hybridResult = await fetchHybridBatchQuotes(batchCodes)

      // Prepare database records
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
          data_source: quote.dataSource,
          tier: stock.tier,
          next_update_at: nextUpdateTime.toISOString(),
          scrape_status: 'success',
          error_message: null,
          updated_at: now.toISOString(),
        })
      }

      // Upsert to database
      if (dbRecords.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('stock_prices') as any)
          .upsert(dbRecords, { onConflict: 'stock_code' })

        if (error) {
          console.error(`[Slice] DB error for batch ${batchesProcessed}:`, error)
          totalFailed += dbRecords.length
          dbRecords.forEach(r => allFailedCodes.push(r.stock_code))
        } else {
          totalUpdated += dbRecords.length
        }
      }

      totalFailed += hybridResult.stats.failed
      allFailedCodes.push(...hybridResult.stats.failedCodes)

    } catch (error) {
      console.error(`[Slice] Error in batch ${batchesProcessed}:`, error)
      totalFailed += batchCodes.length
      allFailedCodes.push(...batchCodes)
    }
  }

  return {
    updated: totalUpdated,
    failed: totalFailed,
    failedCodes: allFailedCodes,
    batchesProcessed,
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
  const forceUpdate = url.searchParams.get('force') === 'true'

  // Validate slice parameter
  if (!sliceParam) {
    return NextResponse.json({
      error: 'Missing slice parameter',
      usage: 'Add ?slice=0 through ?slice=7 to specify which slice to process',
      totalSlices: TOTAL_SLICES,
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

  // Check market hours
  if (!forceUpdate && !isMarketHours(now)) {
    return NextResponse.json({
      success: true,
      message: 'Outside market hours (9am-5pm MYT, Mon-Fri)',
      marketHours: false,
      slice: sliceIndex,
    })
  }

  // Get stocks for this specific cron call (uses rotating offset)
  const { stocks: stocksToUpdate, offset, totalInSlice, cycleInfo } = getStocksForThisCall(sliceIndex, now)
  const allStocks = getAllStocksSorted()

  console.log(`[Parallel Slice ${sliceIndex}] Processing ${stocksToUpdate.length} stocks (${cycleInfo})`)

  if (stocksToUpdate.length === 0) {
    return NextResponse.json({
      success: true,
      slice: sliceIndex,
      message: 'No stocks to update in this call',
      cycleInfo,
    })
  }

  try {
    const result = await updateSlice(stocksToUpdate, supabase)
    const executionTime = Date.now() - startTime

    console.log(`[Parallel Slice ${sliceIndex}] Completed: ${result.updated} updated, ${result.failed} failed in ${executionTime}ms`)

    // Calculate estimated full cycle time
    const callsPerSliceCycle = Math.ceil(totalInSlice / STOCKS_PER_CALL)
    const totalCycleMinutes = callsPerSliceCycle * 10 // 10-min intervals

    return NextResponse.json({
      success: true,
      slice: sliceIndex,
      totalSlices: TOTAL_SLICES,
      rotation: {
        offset,
        stocksInSlice: totalInSlice,
        stocksThisCall: stocksToUpdate.length,
        cycleInfo,
        callsPerSliceCycle,
      },
      totalStocks: allStocks.length,
      result: {
        updated: result.updated,
        failed: result.failed,
        batchesProcessed: result.batchesProcessed,
        failedCodes: result.failedCodes.slice(0, 10),
      },
      executionTimeMs: executionTime,
      estimatedFullCycleTime: `${totalCycleMinutes} min per slice, ~${Math.ceil(allStocks.length / (TOTAL_SLICES * STOCKS_PER_CALL) * 10)} min total with 8 parallel slices`,
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[Parallel Slice ${sliceIndex}] Failed:`, error)

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

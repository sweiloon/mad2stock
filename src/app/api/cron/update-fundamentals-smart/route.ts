import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchEODHDBatchFundamentals } from '@/lib/eodhd-api'
import type { Database } from '@/types/database'

type StockPriceUpdate = Database['public']['Tables']['stock_prices']['Update']

// ============================================================================
// SMART FUNDAMENTALS UPDATE - Self-Managing Single Cron Job (EODHD API)
// ============================================================================
//
// PURPOSE: Update fundamental data for ALL 763 companies daily using
//          a single cron job that self-manages which stocks to process.
//
// DATA SOURCE: EODHD API (100K calls/day free)
// - Market Cap, P/E Ratio, EPS, Dividend Yield, 52-Week High/Low
//
// HOW IT WORKS:
// 1. Query database for stocks not updated in last 20 hours
// 2. Pick the 5 oldest stocks
// 3. Fetch and update their fundamentals from EODHD
// 4. Next cron run automatically picks the next 5
//
// VERCEL HOBBY PLAN:
// - Max timeout: 60 seconds
// - Processes 5 stocks in ~15-20 seconds (safe margin)
//
// CRONJOB.ORG SETUP (JUST 1 JOB):
// - URL: /api/cron/update-fundamentals-smart?secret=xxx
// - Schedule: */5 * * * * (every 5 minutes)
// - Or: */3 * * * * (every 3 minutes for faster coverage)
//
// MATH:
// - Every 5 min = 288 runs/day × 5 stocks = 1,440 stocks/day
// - Every 3 min = 480 runs/day × 5 stocks = 2,400 stocks/day
// - Only 763 stocks needed, so plenty of buffer
//
// ============================================================================

const STOCKS_PER_RUN = 5  // Stocks per cron run (safe for 60s timeout)
const STALE_HOURS = 20    // Consider stocks stale after 20 hours

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
// GET STALE STOCKS FROM DATABASE
// ============================================================================

async function getStaleStocks(
  supabase: ReturnType<typeof createAdminClient>,
  limit: number
): Promise<{ stock_code: string; updated_at: string | null }[]> {
  const staleThreshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString()

  // Get stocks that either:
  // 1. Have never been updated (updated_at is null)
  // 2. Were updated more than STALE_HOURS ago
  // Order by updated_at ASC (oldest first), nulls first
  const { data, error } = await supabase
    .from('stock_prices')
    .select('stock_code, updated_at')
    .or(`updated_at.is.null,updated_at.lt.${staleThreshold}`)
    .order('updated_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    console.error('[Smart Fundamentals] Error fetching stale stocks:', error)
    return []
  }

  return data || []
}

// ============================================================================
// GET STATS FOR RESPONSE
// ============================================================================

async function getUpdateStats(
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ total: number; updatedToday: number; stale: number }> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const staleThreshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString()

  // Get total count
  const { count: total } = await supabase
    .from('stock_prices')
    .select('*', { count: 'exact', head: true })

  // Get updated today count
  const { count: updatedToday } = await supabase
    .from('stock_prices')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', todayStart.toISOString())

  // Get stale count
  const { count: stale } = await supabase
    .from('stock_prices')
    .select('*', { count: 'exact', head: true })
    .or(`updated_at.is.null,updated_at.lt.${staleThreshold}`)

  return {
    total: total || 0,
    updatedToday: updatedToday || 0,
    stale: stale || 0,
  }
}

// ============================================================================
// UPDATE FUNDAMENTALS
// ============================================================================

async function updateFundamentals(
  stockCodes: string[],
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

  console.log(`[Smart Fundamentals] Fetching ${stockCodes.length} stocks via EODHD: ${stockCodes.join(', ')}`)

  try {
    // Use EODHD API for complete fundamentals data
    const result = await fetchEODHDBatchFundamentals(stockCodes)

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
          console.error(`[Smart Fundamentals] DB error for ${code}:`, error)
          totalFailed++
          allFailedCodes.push(code)
        } else {
          console.log(`[Smart Fundamentals] Updated ${code}: MC=${fundamentals.marketCap}, PE=${fundamentals.peRatio}, 52wH=${fundamentals.week52High}`)
          totalUpdated++
        }
      } catch (err) {
        console.error(`[Smart Fundamentals] Error updating ${code}:`, err)
        totalFailed++
        allFailedCodes.push(code)
      }
    }

    // Track API failures - but still mark as "attempted" to avoid retry loops
    for (const failedCode of result.failed) {
      if (!allFailedCodes.includes(failedCode)) {
        allFailedCodes.push(failedCode)
        totalFailed++

        // Update timestamp even for failures to prevent infinite retry on bad stocks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('stock_prices') as any)
          .update({ updated_at: new Date().toISOString() })
          .eq('stock_code', failedCode)
      }
    }

  } catch (error) {
    console.error(`[Smart Fundamentals] Batch error:`, error)
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
  const forceUpdate = url.searchParams.get('force') === 'true'

  const supabase = createAdminClient()

  // Get stale stocks that need updating (or any 5 stocks if force=true)
  let staleStocks: { stock_code: string; updated_at: string | null }[]

  if (forceUpdate) {
    // Force mode: get any 5 stocks that don't have fundamentals data
    const { data } = await supabase
      .from('stock_prices')
      .select('stock_code, updated_at')
      .is('market_cap', null)
      .limit(STOCKS_PER_RUN)
    staleStocks = data || []
  } else {
    staleStocks = await getStaleStocks(supabase, STOCKS_PER_RUN)
  }

  if (staleStocks.length === 0) {
    const stats = await getUpdateStats(supabase)
    return NextResponse.json({
      success: true,
      message: 'All stocks are up to date!',
      stats,
      timing: {
        executionTimeMs: Date.now() - startTime,
      },
    })
  }

  const stockCodes = staleStocks.map(s => s.stock_code)

  console.log(`[Smart Fundamentals] Processing ${stockCodes.length} stale stocks`)

  try {
    const result = await updateFundamentals(stockCodes, supabase)
    const stats = await getUpdateStats(supabase)
    const executionTime = Date.now() - startTime

    console.log(`[Smart Fundamentals] Completed: ${result.updated} updated, ${result.failed} failed in ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      processed: {
        stocks: stockCodes,
        updated: result.updated,
        failed: result.failed,
        failedCodes: result.failedCodes,
      },
      stats: {
        totalStocks: stats.total,
        updatedLast20h: stats.total - stats.stale,
        stillStale: stats.stale - stockCodes.length, // Subtract what we just processed
        updatedToday: stats.updatedToday + result.updated,
        progressPercent: Math.round(((stats.total - stats.stale + stockCodes.length) / stats.total) * 100),
      },
      timing: {
        executionTimeMs: executionTime,
        executionTimeSec: Math.round(executionTime / 1000),
        fetchTimeMs: result.totalTime,
        avgPerStock: stockCodes.length > 0 ? Math.round(result.totalTime / stockCodes.length) : 0,
      },
      config: {
        dataSource: 'EODHD API',
        stocksPerRun: STOCKS_PER_RUN,
        staleThresholdHours: STALE_HOURS,
        runsNeeded: Math.ceil(stats.stale / STOCKS_PER_RUN),
        estimatedCompletion: `${Math.ceil(stats.stale / STOCKS_PER_RUN) * 5} minutes at 5-min interval`,
      },
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[Smart Fundamentals] Failed:`, error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: executionTime,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

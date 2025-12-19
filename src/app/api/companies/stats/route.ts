import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// In-memory cache for stats (5 minute TTL)
let statsCache: { data: unknown; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * GET /api/companies/stats
 * Fetch aggregated statistics for dashboard
 * Optimized with parallel queries and in-memory caching
 */
export async function GET() {
  try {
    // Check cache first
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
      return NextResponse.json(statsCache.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      })
    }

    const supabase = await createClient()

    // Run all queries in parallel for maximum speed
    const [
      companiesResult,
      yoyCountsResult,
      qoqCountsResult,
      sectorDataResult,
      topPerformersResult,
    ] = await Promise.all([
      // Query 1: Get total company count
      supabase
        .from('companies')
        .select('*', { count: 'exact', head: true }),

      // Query 2: Get YoY categories and profit data in one query
      supabase
        .from('yoy_analysis')
        .select('category, profit_change_pct'),

      // Query 3: Get QoQ categories
      supabase
        .from('qoq_analysis')
        .select('category'),

      // Query 4: Get sector stats with yoy_analysis
      supabase
        .from('companies')
        .select(`
          sector,
          yoy_analysis (
            profit_change_pct
          )
        `),

      // Query 5: Get top performers (limit to reduce data transfer)
      supabase
        .from('companies')
        .select(`
          code,
          name,
          numeric_code,
          sector,
          yoy_analysis (
            category,
            profit_change_pct,
            revenue_change_pct,
            revenue_current,
            profit_current
          ),
          qoq_analysis (
            category,
            profit_change_pct,
            revenue_change_pct
          )
        `)
        .limit(300), // Reduced from 500
    ])

    const totalCompanies = companiesResult.count || 0
    const yoyCounts = yoyCountsResult.data as { category: number; profit_change_pct: number }[] || []
    const qoqCounts = qoqCountsResult.data as { category: number }[] || []
    const sectorData = sectorDataResult.data as { sector: string; yoy_analysis: { profit_change_pct: number }[] | { profit_change_pct: number } }[] || []
    const topPerformersData = topPerformersResult.data || []

    // Process YoY category counts and gainers/losers from same data
    const yoyCategoryCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let gainers = 0
    let losers = 0
    let unchanged = 0

    yoyCounts.forEach((row) => {
      if (row.category >= 1 && row.category <= 5) {
        yoyCategoryCounts[row.category]++
      }
      if (row.profit_change_pct > 0) gainers++
      else if (row.profit_change_pct < 0) losers++
      else unchanged++
    })

    // Process QoQ category counts
    const qoqCategoryCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    qoqCounts.forEach((row) => {
      if (row.category >= 1 && row.category <= 5) {
        qoqCategoryCounts[row.category]++
      }
    })

    // Process sector statistics
    const sectorStats: Record<string, { count: number; gainers: number; totalProfit: number }> = {}
    const sectorsSet = new Set<string>()

    sectorData.forEach((company) => {
      const sector = company.sector || 'Other'
      sectorsSet.add(sector)

      if (!sectorStats[sector]) {
        sectorStats[sector] = { count: 0, gainers: 0, totalProfit: 0 }
      }
      sectorStats[sector].count++

      const yoy = Array.isArray(company.yoy_analysis)
        ? company.yoy_analysis[0]
        : company.yoy_analysis
      if (yoy?.profit_change_pct) {
        sectorStats[sector].totalProfit += yoy.profit_change_pct
        if (yoy.profit_change_pct > 0) {
          sectorStats[sector].gainers++
        }
      }
    })

    const sectorStatsArray = Object.entries(sectorStats)
      .map(([sector, stats]) => ({
        sector,
        count: stats.count,
        gainers: stats.gainers,
        avgProfitGrowth: stats.count > 0 ? stats.totalProfit / stats.count : 0
      }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Process top performers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topYoYPerformers = (topPerformersData as any[])
      .filter((c) => {
        const yoy = Array.isArray(c.yoy_analysis) ? c.yoy_analysis[0] : c.yoy_analysis
        return yoy?.category === 1
      })
      .sort((a, b) => {
        const aYoy = Array.isArray(a.yoy_analysis) ? a.yoy_analysis[0] : a.yoy_analysis
        const bYoy = Array.isArray(b.yoy_analysis) ? b.yoy_analysis[0] : b.yoy_analysis
        return (bYoy?.profit_change_pct || 0) - (aYoy?.profit_change_pct || 0)
      })
      .slice(0, 5)
      .map(c => {
        const yoy = Array.isArray(c.yoy_analysis) ? c.yoy_analysis[0] : c.yoy_analysis
        const qoq = Array.isArray(c.qoq_analysis) ? c.qoq_analysis[0] : c.qoq_analysis
        return {
          code: c.code,
          name: c.name,
          stockCode: c.numeric_code,
          sector: c.sector,
          yoyCategory: yoy?.category,
          qoqCategory: qoq?.category,
          profitYoY: yoy?.profit_change_pct,
          revenueYoY: yoy?.revenue_change_pct,
          latestRevenue: yoy?.revenue_current ? yoy.revenue_current / 1000000 : undefined,
          latestProfit: yoy?.profit_current ? yoy.profit_current / 1000000 : undefined
        }
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topQoQPerformers = (topPerformersData as any[])
      .filter((c) => {
        const qoq = Array.isArray(c.qoq_analysis) ? c.qoq_analysis[0] : c.qoq_analysis
        return qoq?.category === 1
      })
      .sort((a, b) => {
        const aQoQ = Array.isArray(a.qoq_analysis) ? a.qoq_analysis[0] : a.qoq_analysis
        const bQoQ = Array.isArray(b.qoq_analysis) ? b.qoq_analysis[0] : b.qoq_analysis
        return (bQoQ?.profit_change_pct || 0) - (aQoQ?.profit_change_pct || 0)
      })
      .slice(0, 5)
      .map(c => {
        const yoy = Array.isArray(c.yoy_analysis) ? c.yoy_analysis[0] : c.yoy_analysis
        const qoq = Array.isArray(c.qoq_analysis) ? c.qoq_analysis[0] : c.qoq_analysis
        return {
          code: c.code,
          name: c.name,
          stockCode: c.numeric_code,
          sector: c.sector,
          yoyCategory: yoy?.category,
          qoqCategory: qoq?.category,
          profitQoQ: qoq?.profit_change_pct,
          revenueQoQ: qoq?.revenue_change_pct
        }
      })

    const sectors = Array.from(sectorsSet).filter(Boolean).sort()

    const responseData = {
      totalCompanies,
      analyzedCompanies: yoyCounts.length,
      yoyCategoryCounts,
      qoqCategoryCounts,
      gainersLosers: { gainers, losers, unchanged },
      sectorStats: sectorStatsArray,
      topYoYPerformers,
      topQoQPerformers,
      sectors
    }

    // Update cache
    statsCache = {
      data: responseData,
      timestamp: Date.now()
    }

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })

  } catch (error) {
    console.error('Error in companies stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

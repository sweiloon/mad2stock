import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

/**
 * GET /api/companies/stats
 * Fetch aggregated statistics for dashboard
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get total company count
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    // Get YoY category counts
    const { data: yoyCounts } = await supabase
      .from('yoy_analysis')
      .select('category')

    const yoyCategoryCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(yoyCounts as any[])?.forEach((row: any) => {
      if (row.category >= 1 && row.category <= 5) {
        yoyCategoryCounts[row.category]++
      }
    })

    // Get QoQ category counts
    const { data: qoqCounts } = await supabase
      .from('qoq_analysis')
      .select('category')

    const qoqCategoryCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(qoqCounts as any[])?.forEach((row: any) => {
      if (row.category >= 1 && row.category <= 5) {
        qoqCategoryCounts[row.category]++
      }
    })

    // Get gainers/losers count based on profit change
    const { data: profitData } = await supabase
      .from('yoy_analysis')
      .select('profit_change_pct')

    let gainers = 0
    let losers = 0
    let unchanged = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(profitData as any[])?.forEach((row: any) => {
      if (row.profit_change_pct > 0) gainers++
      else if (row.profit_change_pct < 0) losers++
      else unchanged++
    })

    // Get sector statistics
    const { data: sectorData } = await supabase
      .from('companies')
      .select(`
        sector,
        yoy_analysis (
          profit_change_pct
        )
      `)

    const sectorStats: Record<string, { count: number; gainers: number; totalProfit: number }> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(sectorData as any[])?.forEach((company: any) => {
      const sector = company.sector || 'Other'
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

    // Get top performers (YoY category 1, sorted by profit)
    const { data: topPerformersData } = await supabase
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
      .order('code')
      .limit(500)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topYoYPerformers = (topPerformersData as any[])
      ?.filter((c: any) => {
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
      }) || []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topQoQPerformers = (topPerformersData as any[])
      ?.filter((c: any) => {
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
      }) || []

    // Get all unique sectors
    const { data: sectorsData } = await supabase
      .from('companies')
      .select('sector')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectors = [...new Set((sectorsData as any[])?.map((c: any) => c.sector).filter(Boolean))].sort()

    return NextResponse.json({
      totalCompanies: totalCompanies || 0,
      analyzedCompanies: yoyCounts?.length || 0,
      yoyCategoryCounts,
      qoqCategoryCounts,
      gainersLosers: { gainers, losers, unchanged },
      sectorStats: sectorStatsArray.slice(0, 10),
      topYoYPerformers,
      topQoQPerformers,
      sectors
    })

  } catch (error) {
    console.error('Error in companies stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

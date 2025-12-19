import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60 // Cache for 60 seconds

/**
 * GET /api/companies
 * Fetch all companies with their YoY/QoQ analysis data from database
 *
 * Query params:
 * - sector: Filter by sector
 * - category: Filter by YoY category (1-5)
 * - market: Filter by market (Main, ACE, LEAP)
 * - search: Search by code or name
 * - limit: Limit results
 * - offset: Offset for pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const sector = searchParams.get('sector')
    const category = searchParams.get('category')
    const market = searchParams.get('market')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabase
      .from('companies')
      .select(`
        id,
        code,
        name,
        numeric_code,
        sector,
        market,
        market_cap,
        current_price,
        yoy_analysis (
          category,
          revenue_change_pct,
          profit_change_pct,
          revenue_current,
          profit_current
        ),
        qoq_analysis (
          category,
          revenue_change_pct,
          profit_change_pct
        )
      `)
      .order('code')

    // Apply filters
    if (sector && sector !== 'all') {
      query = query.eq('sector', sector)
    }

    if (market && market !== 'all') {
      query = query.eq('market', market)
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: companies, error } = await query

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // Transform data to match the expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedData = (companies as any[])?.map((company: any) => {
      const yoy = Array.isArray(company.yoy_analysis)
        ? company.yoy_analysis[0]
        : company.yoy_analysis
      const qoq = Array.isArray(company.qoq_analysis)
        ? company.qoq_analysis[0]
        : company.qoq_analysis

      return {
        code: company.code,
        name: company.name,
        stockCode: company.numeric_code,
        sector: company.sector || 'Other',
        market: company.market || 'Main',
        marketCap: company.market_cap ? company.market_cap / 1000000 : undefined, // Convert to millions
        currentPrice: company.current_price,
        yoyCategory: yoy?.category || undefined,
        qoqCategory: qoq?.category || undefined,
        revenueYoY: yoy?.revenue_change_pct || undefined,
        profitYoY: yoy?.profit_change_pct || undefined,
        revenueQoQ: qoq?.revenue_change_pct || undefined,
        profitQoQ: qoq?.profit_change_pct || undefined,
        latestRevenue: yoy?.revenue_current ? yoy.revenue_current / 1000000 : undefined, // Convert to millions
        latestProfit: yoy?.profit_current ? yoy.profit_current / 1000000 : undefined, // Convert to millions
        hasAnalysis: yoy?.category !== undefined || qoq?.category !== undefined
      }
    }) || []

    // Filter by category after fetching (since it's in a joined table)
    let filteredData = transformedData
    if (category && category !== 'all') {
      const categoryNum = parseInt(category)
      filteredData = transformedData.filter(c => c.yoyCategory === categoryNum)
    }

    return NextResponse.json({
      companies: filteredData,
      total: filteredData.length,
      hasMore: companies?.length === limit
    })

  } catch (error) {
    console.error('Error in companies API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// In-memory cache for companies (2 minute TTL)
let companiesCache: { data: unknown[]; timestamp: number } | null = null
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

/**
 * GET /api/companies
 * Fetch all companies with their YoY/QoQ analysis data from database
 * Optimized with in-memory caching for base queries
 *
 * Query params:
 * - sector: Filter by sector
 * - category: Filter by YoY category (1-5)
 * - search: Search by code or name
 * - limit: Limit results
 * - offset: Offset for pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const sector = searchParams.get('sector')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if we can use cache (no filters applied)
    const isBaseQuery = !sector && !category && !search && offset === 0 && limit >= 1000

    if (isBaseQuery && companiesCache && Date.now() - companiesCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        companies: companiesCache.data,
        total: companiesCache.data.length,
        hasMore: false
      }, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      })
    }

    const supabase = await createClient()

    // Build the query
    let query = supabase
      .from('companies')
      .select(`
        id,
        code,
        name,
        numeric_code,
        sector,
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
        market: 'Main', // Default value since field doesn't exist in DB
        marketCap: company.market_cap ? company.market_cap / 1000000 : undefined,
        currentPrice: company.current_price,
        yoyCategory: yoy?.category || undefined,
        qoqCategory: qoq?.category || undefined,
        revenueYoY: yoy?.revenue_change_pct || undefined,
        profitYoY: yoy?.profit_change_pct || undefined,
        revenueQoQ: qoq?.revenue_change_pct || undefined,
        profitQoQ: qoq?.profit_change_pct || undefined,
        latestRevenue: yoy?.revenue_current ? yoy.revenue_current / 1000000 : undefined,
        latestProfit: yoy?.profit_current ? yoy.profit_current / 1000000 : undefined,
        hasAnalysis: yoy?.category !== undefined || qoq?.category !== undefined
      }
    }) || []

    // Filter by category after fetching (since it's in a joined table)
    let filteredData = transformedData
    if (category && category !== 'all') {
      const categoryNum = parseInt(category)
      filteredData = transformedData.filter(c => c.yoyCategory === categoryNum)
    }

    // Update cache if this is a base query
    if (isBaseQuery) {
      companiesCache = {
        data: filteredData,
        timestamp: Date.now()
      }
    }

    return NextResponse.json({
      companies: filteredData,
      total: filteredData.length,
      hasMore: companies?.length === limit
    }, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    })

  } catch (error) {
    console.error('Error in companies API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

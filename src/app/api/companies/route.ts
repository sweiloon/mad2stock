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

    // Fetch companies and stock_prices in parallel for better performance
    const [companiesResult, stockPricesResult] = await Promise.all([
      // Query 1: Get companies with analysis data
      supabase
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
        .range(offset, offset + limit - 1),

      // Query 2: Get all stock prices
      supabase
        .from('stock_prices')
        .select('stock_code, price, change_percent, volume')
    ])

    if (companiesResult.error) {
      console.error('Error fetching companies:', companiesResult.error)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // Build a map of stock prices by numeric code for fast lookup
    const priceMap = new Map<string, { price: number; changePercent: number; volume: number }>()
    if (stockPricesResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const sp of stockPricesResult.data as any[]) {
        if (sp.stock_code && sp.price !== null) {
          priceMap.set(sp.stock_code, {
            price: parseFloat(sp.price),
            changePercent: sp.change_percent ?? 0,
            volume: sp.volume ?? 0
          })
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companies = companiesResult.data as any[]

    // Apply filters before transformation if possible
    let filteredCompanies = companies
    if (sector && sector !== 'all') {
      filteredCompanies = filteredCompanies?.filter(c => c.sector === sector) || []
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCompanies = filteredCompanies?.filter(c =>
        c.code?.toLowerCase().includes(searchLower) ||
        c.name?.toLowerCase().includes(searchLower) ||
        c.numeric_code?.includes(search)
      ) || []
    }

    // Transform data to match the expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedData = (filteredCompanies as any[])?.map((company: any) => {
      const yoy = Array.isArray(company.yoy_analysis)
        ? company.yoy_analysis[0]
        : company.yoy_analysis
      const qoq = Array.isArray(company.qoq_analysis)
        ? company.qoq_analysis[0]
        : company.qoq_analysis

      // Get price from stock_prices map using numeric_code
      const stockPrice = company.numeric_code ? priceMap.get(company.numeric_code) : null
      const currentPrice = stockPrice?.price ?? company.current_price ?? null
      const changePercent = stockPrice?.changePercent ?? null

      return {
        code: company.code,
        name: company.name,
        stockCode: company.numeric_code,
        sector: company.sector || 'Other',
        market: 'Main', // Default value since field doesn't exist in DB
        marketCap: company.market_cap ? company.market_cap / 1000000 : undefined,
        currentPrice: currentPrice,
        changePercent: changePercent,
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

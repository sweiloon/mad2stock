import { NextRequest, NextResponse } from 'next/server'
import { fetchStockNews } from '@/lib/stock-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing symbol parameter' },
      { status: 400 }
    )
  }

  try {
    const news = await fetchStockNews(symbol, Math.min(limit, 50))

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Error in stock news API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { fetchHistoricalData } from '@/lib/stock-api'

type Period = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' | 'max'
type Interval = '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo'

const validPeriods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y', 'max']
const validIntervals = ['1m', '5m', '15m', '1h', '1d', '1wk', '1mo']

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  const period = searchParams.get('period') || '1mo'
  const interval = searchParams.get('interval') || '1d'

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing symbol parameter' },
      { status: 400 }
    )
  }

  if (!validPeriods.includes(period)) {
    return NextResponse.json(
      { error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` },
      { status: 400 }
    )
  }

  if (!validIntervals.includes(interval)) {
    return NextResponse.json(
      { error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const history = await fetchHistoricalData(
      symbol,
      period as Period,
      interval as Interval
    )

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error in stock history API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}

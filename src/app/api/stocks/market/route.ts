import { NextResponse } from 'next/server'
import { fetchKLCIIndex } from '@/lib/stock-api'

export async function GET() {
  try {
    const klci = await fetchKLCIIndex()

    if (!klci) {
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      klci,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in market API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}

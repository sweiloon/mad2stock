import { NextRequest, NextResponse } from 'next/server'
import { fetchStockQuote, fetchMultipleQuotes } from '@/lib/stock-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbols = searchParams.get('symbols')

  if (!symbols) {
    return NextResponse.json(
      { error: 'Missing symbols parameter' },
      { status: 400 }
    )
  }

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean)

  if (symbolList.length === 0) {
    return NextResponse.json(
      { error: 'No valid symbols provided' },
      { status: 400 }
    )
  }

  try {
    if (symbolList.length === 1) {
      const quote = await fetchStockQuote(symbolList[0])
      if (!quote) {
        return NextResponse.json(
          { error: 'Stock not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ quote })
    }

    const quotes = await fetchMultipleQuotes(symbolList)
    const quotesObject: Record<string, typeof quote> = {}
    let quote: Awaited<ReturnType<typeof fetchStockQuote>>

    quotes.forEach((q, code) => {
      quotesObject[code] = q
    })

    return NextResponse.json({ quotes: quotesObject })
  } catch (error) {
    console.error('Error in stock quote API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}

/**
 * Mad2Arena - Real-Time Market Data Fetcher
 *
 * Fetches LIVE price, volume, and order book data during AI trading sessions.
 * Uses EODHD API for real-time quotes and scraping for order book.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RealTimeQuote {
  stockCode: string
  price: number
  change: number
  changePct: number
  volume: number
  open: number
  high: number
  low: number
  previousClose: number
  timestamp: string
  isRealTime: boolean
}

export interface OrderBookLevel {
  price: number
  volume: number
}

export interface OrderBook {
  stockCode: string
  bids: OrderBookLevel[]  // Buy orders (highest first)
  asks: OrderBookLevel[]  // Sell orders (lowest first)
  spread: number
  spreadPct: number
  buyPressure: number  // 0-100, higher = more buyers
  timestamp: string
}

export interface RealTimeData {
  quote: RealTimeQuote
  orderBook: OrderBook | null
}

// ============================================================================
// EODHD REAL-TIME API
// ============================================================================

const EODHD_API_KEY = process.env.EODHD_API_KEY || ''

/**
 * Fetch real-time quote from EODHD API
 */
export async function fetchRealTimeQuote(stockCode: string): Promise<RealTimeQuote | null> {
  if (!EODHD_API_KEY) {
    console.warn('⚠️ EODHD_API_KEY not set, skipping real-time fetch')
    return null
  }

  try {
    // EODHD real-time endpoint for KLSE stocks
    const symbol = `${stockCode}.KLSE`
    const url = `https://eodhd.com/api/real-time/${symbol}?api_token=${EODHD_API_KEY}&fmt=json`

    const response = await fetch(url, {
      next: { revalidate: 0 },  // No cache
      signal: AbortSignal.timeout(5000)  // 5 second timeout
    })

    if (!response.ok) {
      console.warn(`⚠️ EODHD API error for ${stockCode}: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (!data || data.code === 'NOT_FOUND') {
      return null
    }

    return {
      stockCode,
      price: parseFloat(data.close) || 0,
      change: parseFloat(data.change) || 0,
      changePct: parseFloat(data.change_p) || 0,
      volume: parseInt(data.volume) || 0,
      open: parseFloat(data.open) || 0,
      high: parseFloat(data.high) || 0,
      low: parseFloat(data.low) || 0,
      previousClose: parseFloat(data.previousClose) || parseFloat(data.close) || 0,
      timestamp: new Date().toISOString(),
      isRealTime: true
    }
  } catch (error) {
    console.error(`❌ Error fetching real-time quote for ${stockCode}:`, error)
    return null
  }
}

/**
 * Batch fetch real-time quotes for multiple stocks
 * EODHD has rate limits, so we batch carefully
 */
export async function fetchBatchQuotes(stockCodes: string[]): Promise<Map<string, RealTimeQuote>> {
  const quotes = new Map<string, RealTimeQuote>()

  // Fetch in parallel batches of 10 to respect rate limits
  const batchSize = 10
  for (let i = 0; i < stockCodes.length; i += batchSize) {
    const batch = stockCodes.slice(i, i + batchSize)
    const promises = batch.map(code => fetchRealTimeQuote(code))
    const results = await Promise.all(promises)

    results.forEach((quote, index) => {
      if (quote) {
        quotes.set(batch[index], quote)
      }
    })

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < stockCodes.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return quotes
}

// ============================================================================
// ORDER BOOK SCRAPING (FREE SOLUTION)
// ============================================================================

/**
 * Scrape order book from i3investor (free source)
 * Falls back gracefully if unavailable
 */
export async function scrapeOrderBook(stockCode: string): Promise<OrderBook | null> {
  try {
    // Try i3investor for order book data
    const url = `https://klse.i3investor.com/web/stock/overview/${stockCode}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()

    // Parse order book from HTML
    // i3investor shows bid/ask in a table format
    const orderBook = parseI3OrderBook(html, stockCode)

    return orderBook
  } catch (error) {
    // Silently fail - order book is nice to have, not critical
    console.debug(`Order book not available for ${stockCode}`)
    return null
  }
}

/**
 * Parse order book data from i3investor HTML
 */
function parseI3OrderBook(html: string, stockCode: string): OrderBook | null {
  try {
    const bids: OrderBookLevel[] = []
    const asks: OrderBookLevel[] = []

    // Look for bid/ask patterns in HTML
    // Pattern: <td class="bid">price</td><td>volume</td>
    const bidPattern = /class="[^"]*bid[^"]*"[^>]*>([0-9.]+)<\/td>\s*<td[^>]*>([0-9,]+)/gi
    const askPattern = /class="[^"]*ask[^"]*"[^>]*>([0-9.]+)<\/td>\s*<td[^>]*>([0-9,]+)/gi

    let match
    while ((match = bidPattern.exec(html)) !== null && bids.length < 5) {
      const price = parseFloat(match[1])
      const volume = parseInt(match[2].replace(/,/g, ''))
      if (price > 0 && volume > 0) {
        bids.push({ price, volume })
      }
    }

    while ((match = askPattern.exec(html)) !== null && asks.length < 5) {
      const price = parseFloat(match[1])
      const volume = parseInt(match[2].replace(/,/g, ''))
      if (price > 0 && volume > 0) {
        asks.push({ price, volume })
      }
    }

    // Alternative: Look for generic price/volume table patterns
    if (bids.length === 0 && asks.length === 0) {
      // Try to find any bid/ask table
      const tablePattern = /Best\s*Bid[^<]*<[^>]*>([0-9.]+)[^<]*<[^>]*>([0-9,]+)[^<]*Best\s*Ask[^<]*<[^>]*>([0-9.]+)[^<]*<[^>]*>([0-9,]+)/i
      const tableMatch = tablePattern.exec(html)

      if (tableMatch) {
        bids.push({ price: parseFloat(tableMatch[1]), volume: parseInt(tableMatch[2].replace(/,/g, '')) })
        asks.push({ price: parseFloat(tableMatch[3]), volume: parseInt(tableMatch[4].replace(/,/g, '')) })
      }
    }

    if (bids.length === 0 && asks.length === 0) {
      return null
    }

    // Sort bids descending (highest first), asks ascending (lowest first)
    bids.sort((a, b) => b.price - a.price)
    asks.sort((a, b) => a.price - b.price)

    // Calculate spread
    const bestBid = bids[0]?.price || 0
    const bestAsk = asks[0]?.price || 0
    const spread = bestAsk - bestBid
    const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0

    // Calculate buy pressure
    const totalBidVolume = bids.reduce((sum, b) => sum + b.volume, 0)
    const totalAskVolume = asks.reduce((sum, a) => sum + a.volume, 0)
    const totalVolume = totalBidVolume + totalAskVolume
    const buyPressure = totalVolume > 0 ? (totalBidVolume / totalVolume) * 100 : 50

    return {
      stockCode,
      bids,
      asks,
      spread,
      spreadPct,
      buyPressure,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return null
  }
}

// ============================================================================
// COMBINED REAL-TIME FETCHER
// ============================================================================

/**
 * Fetch all real-time data for a stock
 */
export async function fetchRealTimeData(stockCode: string): Promise<RealTimeData | null> {
  const [quote, orderBook] = await Promise.all([
    fetchRealTimeQuote(stockCode),
    scrapeOrderBook(stockCode)
  ])

  if (!quote) {
    return null
  }

  return { quote, orderBook }
}

/**
 * Fetch real-time data for multiple stocks (top opportunities)
 * Use this during AI trading sessions for fresh data
 */
export async function fetchRealTimeDataBatch(
  stockCodes: string[],
  includeOrderBook: boolean = false
): Promise<Map<string, RealTimeData>> {
  const results = new Map<string, RealTimeData>()

  // Fetch quotes in batch
  const quotes = await fetchBatchQuotes(stockCodes)

  // Optionally fetch order books (slower, so only for top picks)
  if (includeOrderBook) {
    const orderBookPromises = stockCodes.slice(0, 10).map(async code => {
      const orderBook = await scrapeOrderBook(code)
      return { code, orderBook }
    })

    const orderBooks = await Promise.all(orderBookPromises)
    const orderBookMap = new Map(orderBooks.map(ob => [ob.code, ob.orderBook]))

    quotes.forEach((quote, code) => {
      results.set(code, {
        quote,
        orderBook: orderBookMap.get(code) || null
      })
    })
  } else {
    quotes.forEach((quote, code) => {
      results.set(code, { quote, orderBook: null })
    })
  }

  return results
}

/**
 * Format real-time data for AI prompt
 */
export function formatRealTimeDataForPrompt(data: Map<string, RealTimeData>): string {
  if (data.size === 0) {
    return 'Real-time data not available. Using cached prices.'
  }

  const lines: string[] = ['## 🔴 LIVE MARKET DATA (Real-Time)']

  data.forEach((rtData, code) => {
    const { quote, orderBook } = rtData
    const changeSign = quote.changePct >= 0 ? '+' : ''

    let line = `${code}: RM${quote.price.toFixed(3)} (${changeSign}${quote.changePct.toFixed(2)}%) Vol: ${(quote.volume / 1000).toFixed(0)}K`

    if (orderBook) {
      line += ` | Bid: ${orderBook.bids[0]?.price.toFixed(3) || 'N/A'} Ask: ${orderBook.asks[0]?.price.toFixed(3) || 'N/A'} | BuyPressure: ${orderBook.buyPressure.toFixed(0)}%`
    }

    lines.push(line)
  })

  return lines.join('\n')
}

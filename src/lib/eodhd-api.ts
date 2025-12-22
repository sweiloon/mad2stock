/**
 * EODHD API Service for KLSE (Bursa Malaysia)
 *
 * API Documentation: https://eodhd.com/financial-apis/
 *
 * Features:
 * - Real-time quotes (15-20 min delay)
 * - Historical OHLCV data
 * - Batch requests (up to 50 symbols)
 * - 100,000 API calls/day
 */

import { getStockCode } from './stock-codes'

const EODHD_API_KEY = process.env.EODHD_API_KEY
const EODHD_BASE_URL = 'https://eodhd.com/api'

export interface EODHDQuote {
  code: string
  timestamp: number
  gmtoffset: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  previousClose: number
  change: number
  change_p: number
}

export interface EODHDHistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjusted_close: number
  volume: number
}

export interface StockQuoteData {
  stockCode: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  open: number
  high: number
  low: number
  volume: number
  timestamp: string
}

export interface StockHistoryData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Convert stock code to EODHD format
 * EODHD uses: {CODE}.KLSE for Malaysian stocks
 */
export function toEODHDSymbol(codeOrName: string): string {
  const numericCode = getStockCode(codeOrName)
  const cleanCode = numericCode.replace(/\.(KL|KLS|KLSE)$/i, '').toUpperCase()
  return `${cleanCode}.KLSE`
}

/**
 * Fetch real-time quote for a single stock
 */
export async function fetchEODHDQuote(stockCode: string): Promise<StockQuoteData | null> {
  if (!EODHD_API_KEY) {
    console.error('[EODHD] API key not configured')
    return null
  }

  try {
    const symbol = toEODHDSymbol(stockCode)
    const url = `${EODHD_BASE_URL}/real-time/${symbol}?api_token=${EODHD_API_KEY}&fmt=json`

    console.log(`[EODHD] Fetching quote for: ${symbol}`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`[EODHD] Quote error: ${response.status}`)
      return null
    }

    const data: EODHDQuote = await response.json()

    if (!data || !data.close) {
      console.error(`[EODHD] Invalid quote data for ${symbol}`)
      return null
    }

    return {
      stockCode: stockCode.toUpperCase(),
      price: data.close,
      change: data.change,
      changePercent: data.change_p,
      previousClose: data.previousClose,
      open: data.open,
      high: data.high,
      low: data.low,
      volume: data.volume,
      timestamp: new Date(data.timestamp * 1000).toISOString(),
    }
  } catch (error) {
    console.error(`[EODHD] Error fetching quote for ${stockCode}:`, error)
    return null
  }
}

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Fetch EOD (End-of-Day) quote for a single stock
 * EODHD does NOT support real-time quotes for Malaysian stocks
 * This uses the EOD endpoint to get the latest closing price
 */
async function fetchSingleEODQuote(stockCode: string): Promise<StockQuoteData | null> {
  try {
    const symbol = toEODHDSymbol(stockCode)
    // Get last 5 trading days to ensure we get data even with holidays
    const today = new Date()
    const fromDate = new Date(today)
    fromDate.setDate(fromDate.getDate() - 7)

    const url = `${EODHD_BASE_URL}/eod/${symbol}?api_token=${EODHD_API_KEY}&fmt=json&from=${fromDate.toISOString().split('T')[0]}&order=d`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    }, 10000) // 10 second timeout

    if (!response.ok) return null

    const data: EODHDHistoricalData[] = await response.json()

    if (!Array.isArray(data) || data.length === 0) return null

    // Get the most recent trading day's data
    const latest = data[0]
    const previous = data[1] || latest

    const change = latest.close - previous.close
    const changePercent = previous.close > 0 ? (change / previous.close) * 100 : 0

    return {
      stockCode: stockCode.toUpperCase(),
      price: latest.close,
      change: Math.round(change * 1000) / 1000,
      changePercent: Math.round(changePercent * 100) / 100,
      previousClose: previous.close,
      open: latest.open,
      high: latest.high,
      low: latest.low,
      volume: latest.volume,
      timestamp: new Date(latest.date).toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Fetch EOD quotes for multiple stocks using parallel requests
 * EODHD does NOT support real-time for Malaysian stocks, so we use EOD endpoint
 * Processes stocks in parallel batches for efficiency
 */
export async function fetchEODHDBatchQuotes(stockCodes: string[]): Promise<Map<string, StockQuoteData>> {
  const results = new Map<string, StockQuoteData>()

  if (!EODHD_API_KEY) {
    console.error('[EODHD] API key not configured')
    return results
  }

  console.log(`[EODHD] Fetching EOD quotes for ${stockCodes.length} stocks (parallel)`)

  // Process in parallel with concurrency limit
  const CONCURRENT_LIMIT = 10

  for (let i = 0; i < stockCodes.length; i += CONCURRENT_LIMIT) {
    const batch = stockCodes.slice(i, i + CONCURRENT_LIMIT)

    const promises = batch.map(code => fetchSingleEODQuote(code))
    const batchResults = await Promise.all(promises)

    for (let j = 0; j < batch.length; j++) {
      const quote = batchResults[j]
      if (quote) {
        results.set(batch[j].toUpperCase(), quote)
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + CONCURRENT_LIMIT < stockCodes.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`[EODHD] Successfully fetched ${results.size}/${stockCodes.length} EOD quotes`)
  return results
}

/**
 * Calculate date range for historical data with buffer for weekends/holidays
 * Returns dates in YYYY-MM-DD format
 */
function calculateDateRange(period: string): { fromDate: string; toDate: string } {
  const endDate = new Date()
  const startDate = new Date()

  // Add buffer days to account for weekends, holidays, and ensure we get enough data
  switch (period) {
    case '1d':
      // For 1 day view, get last 5 trading days (covers weekends)
      startDate.setDate(startDate.getDate() - 5)
      break
    case '5d':
      // For 5 day view, get last 10 calendar days
      startDate.setDate(startDate.getDate() - 10)
      break
    case '1mo':
      // For 1 month, add 5 day buffer
      startDate.setMonth(startDate.getMonth() - 1)
      startDate.setDate(startDate.getDate() - 5)
      break
    case '3mo':
      // For 3 months, add 7 day buffer
      startDate.setMonth(startDate.getMonth() - 3)
      startDate.setDate(startDate.getDate() - 7)
      break
    case '6mo':
      // For 6 months, add 10 day buffer
      startDate.setMonth(startDate.getMonth() - 6)
      startDate.setDate(startDate.getDate() - 10)
      break
    case '1y':
      // For 1 year, add 2 weeks buffer
      startDate.setFullYear(startDate.getFullYear() - 1)
      startDate.setDate(startDate.getDate() - 14)
      break
    case '5y':
      // For 5 years, add 1 month buffer
      startDate.setFullYear(startDate.getFullYear() - 5)
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'max':
      // For max, go back 20 years (EODHD typically has 20+ years of data)
      startDate.setFullYear(startDate.getFullYear() - 20)
      break
    default:
      startDate.setMonth(startDate.getMonth() - 1)
  }

  return {
    fromDate: startDate.toISOString().split('T')[0],
    toDate: endDate.toISOString().split('T')[0],
  }
}

/**
 * Fetch historical OHLCV data for charts
 * Supports periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max
 */
export async function fetchEODHDHistory(
  stockCode: string,
  period: string = '1mo'
): Promise<StockHistoryData[]> {
  if (!EODHD_API_KEY) {
    console.error('[EODHD] API key not configured')
    return []
  }

  try {
    const symbol = toEODHDSymbol(stockCode)
    const { fromDate, toDate } = calculateDateRange(period)

    const url = `${EODHD_BASE_URL}/eod/${symbol}?api_token=${EODHD_API_KEY}&fmt=json&from=${fromDate}&to=${toDate}`

    console.log(`[EODHD] Fetching history for ${symbol}: ${fromDate} to ${toDate} (period: ${period})`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[EODHD] History error: ${response.status} - ${errorText}`)
      return []
    }

    const data: EODHDHistoricalData[] = await response.json()

    if (!Array.isArray(data)) {
      console.error(`[EODHD] Invalid history data for ${symbol}:`, typeof data)
      return []
    }

    if (data.length === 0) {
      console.warn(`[EODHD] No historical data returned for ${symbol} from ${fromDate} to ${toDate}`)
      return []
    }

    // Sort data by date ascending and filter out invalid entries
    const history: StockHistoryData[] = data
      .filter(item => item.close != null && item.close > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        date: new Date(item.date).toISOString(),
        open: item.open || item.close,
        high: item.high || item.close,
        low: item.low || item.close,
        close: item.close,
        volume: item.volume || 0,
      }))

    console.log(`[EODHD] Retrieved ${history.length} data points for ${symbol} (${period})`)
    console.log(`[EODHD] Date range: ${history[0]?.date.split('T')[0]} to ${history[history.length - 1]?.date.split('T')[0]}`)

    return history
  } catch (error) {
    console.error(`[EODHD] History error for ${stockCode}:`, error)
    return []
  }
}

/**
 * Fetch all KLSE stocks in batches
 * Useful for cron job to update all prices
 */
export async function fetchAllKLSEQuotes(
  stockCodes: string[],
  batchSize: number = 20,
  delayMs: number = 500
): Promise<Map<string, StockQuoteData>> {
  const allResults = new Map<string, StockQuoteData>()

  console.log(`[EODHD] Starting batch update for ${stockCodes.length} stocks`)

  // Process in batches
  for (let i = 0; i < stockCodes.length; i += batchSize) {
    const batch = stockCodes.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(stockCodes.length / batchSize)

    console.log(`[EODHD] Processing batch ${batchNum}/${totalBatches} (${batch.length} stocks)`)

    const batchResults = await fetchEODHDBatchQuotes(batch)

    // Merge results
    batchResults.forEach((value, key) => {
      allResults.set(key, value)
    })

    // Add delay between batches to be nice to the API
    if (i + batchSize < stockCodes.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.log(`[EODHD] Batch update complete: ${allResults.size}/${stockCodes.length} stocks updated`)
  return allResults
}

/**
 * Check API status and remaining quota
 */
export async function checkEODHDStatus(): Promise<{ success: boolean; message: string }> {
  if (!EODHD_API_KEY) {
    return { success: false, message: 'API key not configured' }
  }

  try {
    // Use a simple quote request to check API status
    const url = `${EODHD_BASE_URL}/real-time/5398.KLSE?api_token=${EODHD_API_KEY}&fmt=json`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (response.ok) {
      return { success: true, message: 'EODHD API is working' }
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid API key' }
    } else if (response.status === 429) {
      return { success: false, message: 'Rate limit exceeded' }
    } else {
      return { success: false, message: `API error: ${response.status}` }
    }
  } catch (error) {
    return { success: false, message: `Connection error: ${error}` }
  }
}

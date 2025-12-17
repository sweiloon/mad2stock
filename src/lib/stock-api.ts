/**
 * Stock API Service for KLSE (Bursa Malaysia)
 *
 * Data Provider Priority:
 * 1. Supabase cache (primary) - Persistent database cache
 * 2. EODHD API (paid) - Reliable historical data
 * 3. KLSE Screener - Web scraping for accurate Malaysian data
 * 4. Yahoo Finance (fallback) - May be rate limited
 *
 * Malaysian stocks use format:
 * - KLSE Screener: numeric code (e.g., 5398 for GAMUDA)
 * - EODHD: {code}.KLSE (e.g., 5398.KLSE for GAMUDA)
 * - Yahoo Finance: {code}.KL (e.g., 5398.KL for GAMUDA)
 */

import { getStockCode, getCompanyName } from './stock-codes'
import { createClient } from '@supabase/supabase-js'
import { fetchEODHDHistory, fetchEODHDQuote } from './eodhd-api'

// Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  open: number
  dayHigh: number
  dayLow: number
  volume: number
  avgVolume: number
  marketCap: number
  pe: number | null
  eps: number | null
  week52High: number
  week52Low: number
  dividendYield: number | null
  currency: string
  exchange: string
  lastUpdated: string
  dataSource?: 'klsescreener' | 'yahoo' | 'eodhd' | 'mock'
}

export interface StockHistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockNews {
  title: string
  link: string
  publisher: string
  publishedAt: string
  summary?: string
  thumbnail?: string
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
}

/**
 * Convert stock code/name to Yahoo Finance format
 */
export function toYahooSymbol(codeOrName: string): string {
  const numericCode = getStockCode(codeOrName)
  const cleanCode = numericCode.replace(/\.(KL|KLS|KLSE)$/i, '').toUpperCase()
  return `${cleanCode}.KL`
}

/**
 * Get numeric stock code for KLSE Screener
 */
export function toKLSECode(codeOrName: string): string {
  const numericCode = getStockCode(codeOrName)
  return numericCode.replace(/\.(KL|KLS|KLSE)$/i, '').toUpperCase()
}

// Retry configuration
const MAX_RETRIES = 2
const RETRY_DELAY = 1000

// ============================================================================
// SUPABASE DATABASE CACHE FOR HISTORICAL DATA
// ============================================================================

// Request queue to prevent rate limiting
const pendingRequests = new Map<string, Promise<StockHistoricalData[]>>()
let lastYahooRequest = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second between requests

// Period to days mapping for cache staleness check
// Includes buffer for weekends/holidays
const PERIOD_TO_DAYS: Record<string, number> = {
  '1d': 5,      // Get 5 days to ensure we have at least 1 trading day
  '5d': 10,     // Get 10 days to cover weekends
  '1mo': 35,    // 30 days + buffer
  '3mo': 100,   // ~3 months + buffer
  '6mo': 195,   // ~6 months + buffer
  '1y': 380,    // ~1 year + buffer
  '5y': 1860,   // ~5 years + buffer
  'max': 7300,  // ~20 years
}

// Maximum allowed staleness per period (in days)
const MAX_STALE_DAYS: Record<string, number> = {
  '1d': 0,    // Must be fresh
  '5d': 1,    // 1 day stale allowed
  '1mo': 1,   // 1 day stale allowed
  '3mo': 2,   // 2 days stale allowed
  '6mo': 3,   // 3 days stale allowed
  '1y': 5,    // 5 days stale allowed
  '5y': 7,    // 1 week stale allowed
  'max': 7,   // 1 week stale allowed
}

/**
 * Get cached historical data from Supabase
 * For longer periods (1Y, 5Y), we fetch more data and allow more staleness
 */
async function getSupabaseCachedHistory(
  stockCode: string,
  period: string
): Promise<StockHistoricalData[] | null> {
  try {
    const days = PERIOD_TO_DAYS[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log(`[Stock API] Checking Supabase cache for ${stockCode} ${period} (${days} days from ${startDate.toISOString().split('T')[0]})`)

    const { data, error } = await supabase
      .from('stock_history_cache')
      .select('date, open, high, low, close, volume')
      .eq('stock_code', stockCode.toUpperCase())
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) {
      console.error(`[Stock API] Supabase cache read error:`, error)
      return null
    }

    if (!data || data.length === 0) {
      console.log(`[Stock API] No cached data for ${stockCode} ${period}`)
      return null
    }

    // Check if data is stale based on period-specific staleness allowance
    const mostRecentDate = new Date(data[data.length - 1].date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxStaleDays = MAX_STALE_DAYS[period] ?? 1
    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))

    // For weekends, allow extra staleness (Saturday/Sunday shouldn't invalidate cache)
    const dayOfWeek = today.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const adjustedMaxStale = isWeekend ? maxStaleDays + 2 : maxStaleDays

    if (daysDiff > adjustedMaxStale) {
      console.log(`[Stock API] Cached data for ${stockCode} is ${daysDiff} days old (max: ${adjustedMaxStale}), refreshing...`)
      return null // Will trigger a refresh
    }

    // Verify we have enough data points for the requested period
    const minDataPoints = getMinDataPointsForPeriod(period)
    if (data.length < minDataPoints) {
      console.log(`[Stock API] Cached data has only ${data.length} points (need ${minDataPoints} for ${period}), refreshing...`)
      return null
    }

    console.log(`[Stock API] Supabase cache hit for ${stockCode} ${period}: ${data.length} records`)
    console.log(`[Stock API] Cache date range: ${data[0].date} to ${data[data.length - 1].date}`)

    return data.map(row => ({
      date: new Date(row.date).toISOString(),
      open: Number(row.open) || 0,
      high: Number(row.high) || 0,
      low: Number(row.low) || 0,
      close: Number(row.close),
      volume: Number(row.volume) || 0,
    }))
  } catch (error) {
    console.error(`[Stock API] Supabase cache error:`, error)
    return null
  }
}

/**
 * Get minimum data points required for each period
 */
function getMinDataPointsForPeriod(period: string): number {
  switch (period) {
    case '1d': return 1
    case '5d': return 3      // At least 3 trading days
    case '1mo': return 15    // At least 15 trading days
    case '3mo': return 45    // At least 45 trading days
    case '6mo': return 90    // At least 90 trading days
    case '1y': return 200    // At least 200 trading days
    case '5y': return 900    // At least 900 trading days
    case 'max': return 1000  // At least 1000 trading days
    default: return 10
  }
}

/**
 * Store historical data in Supabase cache
 */
async function setSupabaseCachedHistory(
  stockCode: string,
  data: StockHistoricalData[]
): Promise<void> {
  if (!data || data.length === 0) return

  try {
    const cleanCode = stockCode.replace('.KL', '').toUpperCase()

    // Prepare records for upsert
    const records = data.map(item => ({
      stock_code: cleanCode,
      date: new Date(item.date).toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      updated_at: new Date().toISOString(),
    }))

    // Upsert in batches to avoid payload limits
    const batchSize = 100
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)

      const { error } = await supabase
        .from('stock_history_cache')
        .upsert(batch, {
          onConflict: 'stock_code,date',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error(`[Stock API] Supabase cache write error:`, error)
      }
    }

    console.log(`[Stock API] Cached ${records.length} records for ${cleanCode}`)
  } catch (error) {
    console.error(`[Stock API] Supabase cache write error:`, error)
  }
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options)
    if (!response.ok && retries > 0 && response.status !== 401 && response.status !== 403) {
      // Use longer delay for rate limiting (429)
      const delay = response.status === 429 ? RETRY_DELAY * 3 : RETRY_DELAY
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1)
    }
    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

// ============================================================================
// KLSE SCREENER API (Primary - Most reliable for Malaysian stocks)
// ============================================================================

interface KLSEScreenerQuote {
  price: number
  change: number
  changePercent: number
  volume: number
  open: number
  high: number
  low: number
  previousClose: number
  name: string
  code: string
  pe?: number
  eps?: number
  marketCap?: number
  week52High?: number
  week52Low?: number
  dividendYield?: number
}

/**
 * Parse price data from KLSE Screener HTML
 * HTML Structure:
 * <span id="price" data-value="4.850">4.850</span>
 * <span id="priceDiff">-0.040 (-0.8%)</span>
 * <td class="number" id="priceHigh">4.950</td>
 * <td class="number" id="priceLow">4.830</td>
 * <td class="number text_volume" id="volume">35,137,500</td>
 */
async function fetchKLSEScreenerQuote(codeOrName: string): Promise<StockQuote | null> {
  try {
    const stockCode = toKLSECode(codeOrName)
    const companyName = getCompanyName(stockCode) || codeOrName.toUpperCase()

    const url = `https://www.klsescreener.com/v2/stocks/view/${stockCode}`

    console.log(`[Stock API] Fetching from KLSE Screener: ${stockCode}`)

    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.error(`[Stock API] KLSE Screener error: ${response.status}`)
      return null
    }

    const html = await response.text()

    // Parse price from <span id="price" data-value="X.XXX">
    const priceMatch = html.match(/<span\s+id="price"\s+data-value="([\d.]+)"[^>]*>([\d.]+)<\/span>/i) ||
                       html.match(/id="price"[^>]*data-value="([\d.]+)"/i) ||
                       html.match(/data-value="([\d.]+)"[^>]*id="price"/i)

    // Parse change from <span id="priceDiff">-0.040 (-0.8%)</span>
    const priceDiffMatch = html.match(/<span\s+id="priceDiff"[^>]*>([+-]?[\d.]+)\s*\(([+-]?[\d.]+)%\)<\/span>/i) ||
                           html.match(/id="priceDiff"[^>]*>([+-]?[\d.]+)\s*\(([+-]?[\d.]+)%\)/i)

    // Parse high price from <td class="number" id="priceHigh">
    const priceHighMatch = html.match(/<td[^>]*id="priceHigh"[^>]*>([\d.]+)<\/td>/i) ||
                           html.match(/id="priceHigh"[^>]*>([\d.]+)/i)

    // Parse low price from <td class="number" id="priceLow">
    const priceLowMatch = html.match(/<td[^>]*id="priceLow"[^>]*>([\d.]+)<\/td>/i) ||
                          html.match(/id="priceLow"[^>]*>([\d.]+)/i)

    // Parse volume from <td class="number text_volume" id="volume">
    const volumeMatch = html.match(/<td[^>]*id="volume"[^>]*>([\d,]+)<\/td>/i) ||
                        html.match(/id="volume"[^>]*>([\d,]+)/i)

    if (!priceMatch) {
      console.warn(`[Stock API] Could not parse KLSE Screener price for ${stockCode}`)
      return null
    }

    const price = parseFloat(priceMatch[1]) || 0
    const change = priceDiffMatch ? parseFloat(priceDiffMatch[1]) : 0
    const changePercent = priceDiffMatch ? parseFloat(priceDiffMatch[2]) : 0
    const dayHigh = priceHighMatch ? parseFloat(priceHighMatch[1]) : price
    const dayLow = priceLowMatch ? parseFloat(priceLowMatch[1]) : price
    const volume = volumeMatch ? parseInt(volumeMatch[1].replace(/,/g, '')) : 0

    console.log(`[Stock API] KLSE Screener parsed: price=${price}, change=${change}, changePercent=${changePercent}%, volume=${volume}`)

    return {
      symbol: stockCode,
      name: companyName,
      price,
      change,
      changePercent,
      previousClose: price - change,
      open: price,
      dayHigh,
      dayLow,
      volume,
      avgVolume: 0,
      marketCap: 0,
      pe: null,
      eps: null,
      week52High: dayHigh,
      week52Low: dayLow,
      dividendYield: null,
      currency: 'MYR',
      exchange: 'KLSE',
      lastUpdated: new Date().toISOString(),
      dataSource: 'klsescreener',
    }
  } catch (error) {
    console.error(`[Stock API] KLSE Screener error for ${codeOrName}:`, error)
    return null
  }
}

// ============================================================================
// YAHOO FINANCE API (Fallback)
// ============================================================================

interface YahooChartResult {
  timestamp?: number[]
  indicators?: {
    quote?: Array<{
      open?: number[]
      high?: number[]
      low?: number[]
      close?: number[]
      volume?: number[]
    }>
  }
  meta?: {
    regularMarketPrice?: number
    previousClose?: number
    symbol?: string
    shortName?: string
  }
}

/**
 * Fetch quote from Yahoo Finance v8 chart endpoint
 */
async function fetchYahooChartQuote(codeOrName: string): Promise<StockQuote | null> {
  try {
    const symbol = toYahooSymbol(codeOrName)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`

    console.log(`[Stock API] Fetching from Yahoo Chart: ${symbol}`)

    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.error(`[Stock API] Yahoo Chart error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data?.chart?.error) {
      console.error(`[Stock API] Yahoo Chart error:`, data.chart.error)
      return null
    }

    const result: YahooChartResult = data?.chart?.result?.[0]
    if (!result?.meta) {
      return null
    }

    const { meta, timestamp, indicators } = result
    const quotes = indicators?.quote?.[0]

    const latestIdx = timestamp && timestamp.length > 0 ? timestamp.length - 1 : 0
    const currentPrice = meta.regularMarketPrice || quotes?.close?.[latestIdx] || 0
    const previousClose = meta.previousClose || (latestIdx > 0 ? quotes?.close?.[latestIdx - 1] : currentPrice) || currentPrice

    const recentHighs = quotes?.high?.filter(Boolean) || []
    const recentLows = quotes?.low?.filter(Boolean) || []

    return {
      symbol: meta.symbol || symbol,
      name: meta.shortName || codeOrName.toUpperCase(),
      price: currentPrice,
      change: currentPrice - previousClose,
      changePercent: previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0,
      previousClose,
      open: quotes?.open?.[latestIdx] || currentPrice,
      dayHigh: recentHighs.length > 0 ? Math.max(...recentHighs.slice(-1)) : currentPrice,
      dayLow: recentLows.length > 0 ? Math.min(...recentLows.slice(-1)) : currentPrice,
      volume: quotes?.volume?.[latestIdx] || 0,
      avgVolume: quotes?.volume ? quotes.volume.reduce((a, b) => a + (b || 0), 0) / quotes.volume.length : 0,
      marketCap: 0,
      pe: null,
      eps: null,
      week52High: recentHighs.length > 0 ? Math.max(...recentHighs) : currentPrice,
      week52Low: recentLows.length > 0 ? Math.min(...recentLows) : currentPrice,
      dividendYield: null,
      currency: 'MYR',
      exchange: 'KLS',
      lastUpdated: new Date().toISOString(),
      dataSource: 'yahoo',
    }
  } catch (error) {
    console.error(`[Stock API] Yahoo error:`, error)
    return null
  }
}

/**
 * Fetch historical data from Yahoo Finance with Supabase caching
 * Flow: Supabase cache → Yahoo Finance → Store in Supabase
 */
async function fetchYahooHistory(
  codeOrName: string,
  period: string = '1mo',
  interval: string = '1d'
): Promise<StockHistoricalData[]> {
  const symbol = toYahooSymbol(codeOrName)
  const stockCode = toKLSECode(codeOrName)
  const cacheKey = `${stockCode}-${period}`

  // Check Supabase cache first (persistent storage)
  const cachedData = await getSupabaseCachedHistory(stockCode, period)
  if (cachedData && cachedData.length > 0) {
    return cachedData
  }

  // Check if there's already a pending request for this data
  const pendingRequest = pendingRequests.get(cacheKey)
  if (pendingRequest) {
    console.log(`[Stock API] Waiting for pending request: ${symbol} ${period}`)
    return pendingRequest
  }

  // Create the request promise
  const requestPromise = (async (): Promise<StockHistoricalData[]> => {
    try {
      // Rate limit: wait if needed
      const now = Date.now()
      const timeSinceLastRequest = now - lastYahooRequest
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
      }
      lastYahooRequest = Date.now()

      let adjustedInterval = interval
      let adjustedPeriod = period

      // Yahoo Finance doesn't support 'max', use longest available range
      if (period === 'max') {
        adjustedPeriod = '10y'  // Yahoo supports up to 10y for most stocks
        adjustedInterval = '1d'
      } else if (period === '1d') {
        adjustedInterval = '5m'
      } else if (period === '5d') {
        adjustedInterval = '15m'
      }

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${adjustedPeriod}&interval=${adjustedInterval}`

      console.log(`[Stock API] Fetching Yahoo history: ${symbol}, period: ${period}`)

      const response = await fetchWithRetry(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com/',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        console.error(`[Stock API] Yahoo history response not ok: ${response.status}`)
        // If rate limited, try to return stale cache data as fallback
        if (response.status === 429) {
          console.log(`[Stock API] Rate limited, attempting to use any available cached data`)
          const staleData = await getStaleSupabaseCachedHistory(stockCode, period)
          if (staleData && staleData.length > 0) {
            console.log(`[Stock API] Using stale cached data as fallback`)
            return staleData
          }
        }
        return []
      }

      const data = await response.json()
      if (data?.chart?.error) {
        console.error(`[Stock API] Yahoo chart error:`, data.chart.error)
        return []
      }

      const result: YahooChartResult = data?.chart?.result?.[0]
      if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
        console.error(`[Stock API] Yahoo missing data: timestamp=${!!result?.timestamp}, quotes=${!!result?.indicators?.quote?.[0]}`)
        return []
      }

      const { timestamp } = result
      const quote = result.indicators.quote[0]

      const history: StockHistoricalData[] = []
      for (let i = 0; i < timestamp.length; i++) {
        if (quote.close?.[i] != null) {
          history.push({
            date: new Date(timestamp[i] * 1000).toISOString(),
            open: quote.open?.[i] || 0,
            high: quote.high?.[i] || 0,
            low: quote.low?.[i] || 0,
            close: quote.close[i],
            volume: quote.volume?.[i] || 0,
          })
        }
      }

      console.log(`[Stock API] Yahoo: Retrieved ${history.length} data points`)

      // Store in Supabase cache (async, don't wait)
      if (history.length > 0) {
        setSupabaseCachedHistory(stockCode, history).catch(err => {
          console.error(`[Stock API] Background cache write failed:`, err)
        })
      }

      return history
    } catch (error) {
      console.error(`[Stock API] Yahoo history error:`, error)
      return []
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey)
    }
  })()

  // Store the pending request
  pendingRequests.set(cacheKey, requestPromise)

  return requestPromise
}

/**
 * Get stale cached data (fallback when rate limited)
 * Returns data regardless of age
 */
async function getStaleSupabaseCachedHistory(
  stockCode: string,
  period: string
): Promise<StockHistoricalData[] | null> {
  try {
    const days = PERIOD_TO_DAYS[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days - 30) // Look back extra 30 days

    const { data, error } = await supabase
      .from('stock_history_cache')
      .select('date, open, high, low, close, volume')
      .eq('stock_code', stockCode.toUpperCase())
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error || !data || data.length === 0) {
      return null
    }

    return data.map(row => ({
      date: new Date(row.date).toISOString(),
      open: Number(row.open) || 0,
      high: Number(row.high) || 0,
      low: Number(row.low) || 0,
      close: Number(row.close),
      volume: Number(row.volume) || 0,
    }))
  } catch {
    return null
  }
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Fetch real-time quote for a stock
 * Tries KLSE Screener first (most reliable for Malaysian stocks), falls back to Yahoo Finance
 */
export async function fetchStockQuote(codeOrName: string): Promise<StockQuote | null> {
  console.log(`[Stock API] Fetching quote for: ${codeOrName}`)

  // Try KLSE Screener first (most reliable for Malaysian stocks, free, real-time)
  const klseQuote = await fetchKLSEScreenerQuote(codeOrName)
  if (klseQuote) {
    console.log(`[Stock API] ✓ KLSE Screener: ${codeOrName} = RM${klseQuote.price}`)
    return klseQuote
  }

  // Try EODHD if available (paid, reliable)
  if (process.env.EODHD_API_KEY) {
    const eodhQuote = await fetchEODHDQuote(codeOrName)
    if (eodhQuote) {
      console.log(`[Stock API] ✓ EODHD: ${codeOrName} = RM${eodhQuote.price}`)
      return {
        symbol: eodhQuote.stockCode,
        name: getCompanyName(eodhQuote.stockCode) || codeOrName.toUpperCase(),
        price: eodhQuote.price,
        change: eodhQuote.change,
        changePercent: eodhQuote.changePercent,
        previousClose: eodhQuote.previousClose,
        open: eodhQuote.open,
        dayHigh: eodhQuote.high,
        dayLow: eodhQuote.low,
        volume: eodhQuote.volume,
        avgVolume: 0,
        marketCap: 0,
        pe: null,
        eps: null,
        week52High: eodhQuote.high,
        week52Low: eodhQuote.low,
        dividendYield: null,
        currency: 'MYR',
        exchange: 'KLSE',
        lastUpdated: eodhQuote.timestamp,
        dataSource: 'eodhd',
      }
    }
  }

  // Fallback to Yahoo Finance
  const yahooQuote = await fetchYahooChartQuote(codeOrName)
  if (yahooQuote) {
    console.log(`[Stock API] ✓ Yahoo Finance: ${codeOrName} = RM${yahooQuote.price}`)
    return yahooQuote
  }

  console.warn(`[Stock API] ✗ All sources failed for ${codeOrName}`)
  return null
}

/**
 * Fetch multiple stock quotes
 */
export async function fetchMultipleQuotes(codesOrNames: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>()

  // Fetch in parallel with concurrency limit
  const batchSize = 5
  for (let i = 0; i < codesOrNames.length; i += batchSize) {
    const batch = codesOrNames.slice(i, i + batchSize)
    const promises = batch.map(async (code) => {
      const quote = await fetchStockQuote(code)
      if (quote) {
        results.set(code.toUpperCase(), quote)
      }
    })
    await Promise.all(promises)

    // Small delay between batches to avoid overwhelming the server
    if (i + batchSize < codesOrNames.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}

/**
 * Fetch historical data for charts
 * Priority: Supabase cache → EODHD API → Yahoo Finance
 * Supports periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max
 */
export async function fetchHistoricalData(
  codeOrName: string,
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' | 'max' = '1mo',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo' = '1d'
): Promise<StockHistoricalData[]> {
  console.log(`[Stock API] Fetching history for: ${codeOrName}, period: ${period}`)

  const stockCode = toKLSECode(codeOrName)

  // 1. Check Supabase cache first
  const cachedData = await getSupabaseCachedHistory(stockCode, period)
  if (cachedData && cachedData.length > 0) {
    console.log(`[Stock API] Using cached data: ${cachedData.length} points`)
    return cachedData
  }

  // 2. Try EODHD API (paid, reliable) - preferred for all periods
  if (process.env.EODHD_API_KEY) {
    console.log(`[Stock API] Using EODHD for ${codeOrName} (${period})`)
    const eodhData = await fetchEODHDHistory(stockCode, period)
    if (eodhData && eodhData.length > 0) {
      console.log(`[Stock API] EODHD returned ${eodhData.length} data points`)
      // Cache in Supabase (async, don't wait)
      setSupabaseCachedHistory(stockCode, eodhData).catch(err => {
        console.error(`[Stock API] Failed to cache EODHD data:`, err)
      })
      return eodhData
    }
    console.warn(`[Stock API] EODHD returned no data for ${codeOrName} (${period})`)
  }

  // 3. Fall back to Yahoo Finance (may be rate limited)
  console.log(`[Stock API] Falling back to Yahoo Finance for ${codeOrName}`)
  const yahooData = await fetchYahooHistory(codeOrName, period, interval)

  if (yahooData && yahooData.length > 0) {
    console.log(`[Stock API] Yahoo returned ${yahooData.length} data points`)
  } else {
    console.warn(`[Stock API] All sources failed for ${codeOrName} (${period})`)
  }

  return yahooData
}

/**
 * Fetch KLCI index data
 */
export async function fetchKLCIIndex(): Promise<MarketIndex | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/^KLSE?interval=1d&range=5d`

    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) return null

    const data = await response.json()
    const result: YahooChartResult = data?.chart?.result?.[0]
    if (!result?.meta) return null

    const { meta, indicators } = result
    const quotes = indicators?.quote?.[0]
    const latestIdx = quotes?.close ? quotes.close.length - 1 : 0

    const currentValue = meta.regularMarketPrice || quotes?.close?.[latestIdx] || 0
    const previousClose = meta.previousClose || (latestIdx > 0 ? quotes?.close?.[latestIdx - 1] : currentValue) || currentValue

    return {
      symbol: '^KLSE',
      name: 'FTSE Bursa Malaysia KLCI',
      value: currentValue,
      change: currentValue - previousClose,
      changePercent: previousClose > 0 ? ((currentValue - previousClose) / previousClose) * 100 : 0,
    }
  } catch (error) {
    console.error('[Stock API] KLCI error:', error)
    return null
  }
}

/**
 * Fetch news for a stock
 */
export async function fetchStockNews(codeOrName: string, limit: number = 10): Promise<StockNews[]> {
  try {
    const symbol = toYahooSymbol(codeOrName)
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=${limit}`

    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) return []

    const data = await response.json()
    const news = data?.news || []

    return news.map((item: {
      title?: string
      link?: string
      publisher?: string
      providerPublishTime?: number
      thumbnail?: { resolutions?: Array<{ url?: string }> }
    }) => ({
      title: item.title || '',
      link: item.link || '',
      publisher: item.publisher || '',
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
      summary: '',
      thumbnail: item.thumbnail?.resolutions?.[0]?.url,
    }))
  } catch (error) {
    console.error(`[Stock API] News error:`, error)
    return []
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatPrice(price: number): string {
  return `RM ${price.toFixed(price < 1 ? 3 : 2)}`
}

export function formatChange(change: number, changePercent: number): {
  text: string
  isPositive: boolean
} {
  const sign = change >= 0 ? '+' : ''
  return {
    text: `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`,
    isPositive: change >= 0,
  }
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(2)}B`
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(2)}K`
  return volume.toString()
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) return `RM ${(marketCap / 1_000_000_000).toFixed(2)}B`
  if (marketCap >= 1_000_000) return `RM ${(marketCap / 1_000_000).toFixed(2)}M`
  return `RM ${marketCap.toLocaleString()}`
}

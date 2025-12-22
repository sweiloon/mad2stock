/**
 * Yahoo Finance API Wrapper (v8 Chart Endpoint)
 *
 * Uses the v8/finance/chart endpoint which is still publicly accessible.
 * The v7/finance/quote endpoint now requires authentication.
 *
 * Key Features:
 * - Single symbol fetching via chart endpoint
 * - Batch processing with rate limiting
 * - KLSE format support: {CODE}.KL
 *
 * Data Delay: ~15-20 minutes (acceptable for analysis)
 * Rate Limit: Conservative delays to avoid blocking
 * Cost: FREE
 */

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const MAX_CONCURRENT_REQUESTS = 1  // Sequential only to avoid rate limiting
const REQUEST_DELAY_MS = 1500  // 1.5s between requests
const BATCH_DELAY_MS = 0  // No batch delay since sequential
const MAX_RETRIES = 2
const INITIAL_RETRY_DELAY = 10000  // 10s wait after rate limit

// Conservative settings for fundamentals (Yahoo quoteSummary is heavily rate-limited)
// Optimized for 12 hourly staggered cron jobs processing ~64 stocks each
const FUNDAMENTALS_CONCURRENT = 1  // Sequential only - no parallel requests
const FUNDAMENTALS_DELAY_MS = 1000  // 1s between requests (chart API is tolerant)
const FUNDAMENTALS_RETRY_DELAY = 2000  // 2s retry delay
const FUNDAMENTALS_MAX_RETRIES = 1  // 1 retry only to stay within timeout
const FUNDAMENTALS_TIMEOUT = 5000  // 5s timeout per request (chart API is fast)

export interface YahooQuoteResult {
  symbol: string
  shortName: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketPreviousClose: number
  regularMarketOpen: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketVolume: number
  regularMarketTime: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  marketCap?: number
  trailingPE?: number
  trailingEps?: number
  dividendYield?: number
  currency: string
}

export interface YahooFundamentalsResult {
  stockCode: string
  marketCap: number | null
  peRatio: number | null
  eps: number | null
  dividendYield: number | null
  week52High: number | null
  week52Low: number | null
}

export interface BatchFetchResult {
  success: Map<string, YahooQuoteResult>
  failed: string[]
  totalTime: number
}

/**
 * Utility: Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Add random jitter to delays
 */
function addJitter(baseMs: number): number {
  const jitter = Math.random() * 0.3 * baseMs
  return Math.round(baseMs + jitter)
}

/**
 * Convert stock code to Yahoo Finance format
 */
export function toYahooSymbol(code: string): string {
  const cleanCode = code.replace(/\.(KL|KLS|KLSE)$/i, '').toUpperCase()
  return `${cleanCode}.KL`
}

/**
 * Extract stock code from Yahoo symbol
 */
export function fromYahooSymbol(yahooSymbol: string): string {
  return yahooSymbol.replace(/\.KL$/i, '').toUpperCase()
}

/**
 * Fetch single stock using v8 chart API
 */
async function fetchSingleStock(symbol: string, retries = MAX_RETRIES): Promise<YahooQuoteResult | null> {
  const url = `${YAHOO_CHART_URL}/${symbol}?interval=1d&range=1d`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    })

    if (response.status === 429 && retries > 0) {
      const waitTime = addJitter(INITIAL_RETRY_DELAY)
      console.warn(`[Yahoo Finance] Rate limited for ${symbol}, waiting ${waitTime}ms`)
      await delay(waitTime)
      return fetchSingleStock(symbol, retries - 1)
    }

    if (!response.ok) {
      console.error(`[Yahoo Finance] Failed to fetch ${symbol}: ${response.status}`)
      return null
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      console.warn(`[Yahoo Finance] No data for ${symbol}`)
      return null
    }

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]
    const prevClose = meta.chartPreviousClose || meta.previousClose || 0
    const currentPrice = meta.regularMarketPrice || 0

    return {
      symbol: symbol,
      shortName: meta.shortName || meta.longName || fromYahooSymbol(symbol),
      regularMarketPrice: currentPrice,
      regularMarketChange: currentPrice - prevClose,
      regularMarketChangePercent: prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
      regularMarketPreviousClose: prevClose,
      regularMarketOpen: quote?.open?.[0] || meta.regularMarketOpen || 0,
      regularMarketDayHigh: meta.regularMarketDayHigh || quote?.high?.[0] || 0,
      regularMarketDayLow: meta.regularMarketDayLow || quote?.low?.[0] || 0,
      regularMarketVolume: meta.regularMarketVolume || quote?.volume?.[0] || 0,
      regularMarketTime: meta.regularMarketTime || Date.now() / 1000,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      currency: meta.currency || 'MYR',
    }
  } catch (error) {
    if (retries > 0) {
      await delay(addJitter(INITIAL_RETRY_DELAY))
      return fetchSingleStock(symbol, retries - 1)
    }
    console.error(`[Yahoo Finance] Error fetching ${symbol}:`, error)
    return null
  }
}

/**
 * Process a batch of symbols concurrently with rate limiting
 */
async function processBatch(symbols: string[]): Promise<Map<string, YahooQuoteResult>> {
  const results = new Map<string, YahooQuoteResult>()

  // Process in small concurrent groups
  for (let i = 0; i < symbols.length; i += MAX_CONCURRENT_REQUESTS) {
    const batch = symbols.slice(i, i + MAX_CONCURRENT_REQUESTS)

    const promises = batch.map(async (symbol, index) => {
      // Stagger requests within batch
      await delay(index * REQUEST_DELAY_MS)
      return { symbol, result: await fetchSingleStock(symbol) }
    })

    const batchResults = await Promise.all(promises)

    for (const { symbol, result } of batchResults) {
      if (result) {
        const stockCode = fromYahooSymbol(symbol)
        results.set(stockCode, result)
      }
    }

    // Delay between concurrent batches
    if (i + MAX_CONCURRENT_REQUESTS < symbols.length) {
      await delay(addJitter(BATCH_DELAY_MS))
    }
  }

  return results
}

/**
 * Fetch quotes for multiple stocks
 *
 * Uses v8 chart API with concurrent requests and rate limiting.
 *
 * @param stockCodes - Array of stock codes (numeric or name)
 * @param onProgress - Optional callback for progress updates
 * @returns BatchFetchResult with success map, failed codes, and total time
 */
export async function fetchBatchQuotes(
  stockCodes: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchFetchResult> {
  const startTime = Date.now()
  const yahooSymbols = stockCodes.map(code => toYahooSymbol(code))

  console.log(`[Yahoo Finance] Fetching ${stockCodes.length} stocks using v8 chart API...`)

  const allResults = new Map<string, YahooQuoteResult>()
  const failedCodes: string[] = []

  // Process all symbols
  const results = await processBatch(yahooSymbols)

  // Merge results and track failures
  for (const code of stockCodes) {
    const upperCode = code.toUpperCase()
    if (results.has(upperCode)) {
      allResults.set(upperCode, results.get(upperCode)!)
    } else {
      failedCodes.push(upperCode)
    }
  }

  if (onProgress) {
    onProgress(allResults.size, stockCodes.length)
  }

  const totalTime = Date.now() - startTime

  console.log(`[Yahoo Finance] Completed: ${allResults.size}/${stockCodes.length} stocks in ${totalTime}ms`)

  if (failedCodes.length > 0 && failedCodes.length <= 10) {
    console.warn(`[Yahoo Finance] Failed stocks:`, failedCodes)
  } else if (failedCodes.length > 10) {
    console.warn(`[Yahoo Finance] Failed ${failedCodes.length} stocks (first 10):`, failedCodes.slice(0, 10))
  }

  return {
    success: allResults,
    failed: failedCodes,
    totalTime,
  }
}

/**
 * Fetch a single stock quote
 */
export async function fetchSingleQuote(stockCode: string): Promise<YahooQuoteResult | null> {
  const symbol = toYahooSymbol(stockCode)
  return fetchSingleStock(symbol)
}

/**
 * Check if Yahoo Finance API is accessible
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const result = await fetchSingleStock('1155.KL') // Maybank
    return result !== null && result.regularMarketPrice > 0
  } catch {
    return false
  }
}

/**
 * Get estimated time to fetch stocks (rough estimate)
 */
export function estimateFetchTime(stockCount: number): number {
  const batches = Math.ceil(stockCount / MAX_CONCURRENT_REQUESTS)
  return batches * (REQUEST_DELAY_MS * MAX_CONCURRENT_REQUESTS + BATCH_DELAY_MS)
}

// ============================================================================
// FUNDAMENTALS API (using quoteSummary endpoint with crumb authentication)
// ============================================================================

const YAHOO_QUOTE_SUMMARY_URL = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary'

// Cache for Yahoo crumb authentication
let cachedCrumb: { crumb: string; cookies: string; timestamp: number } | null = null
const CRUMB_CACHE_TTL = 30 * 60 * 1000 // 30 minutes

/**
 * Get Yahoo Finance crumb for authenticated requests
 * Yahoo now requires a crumb token for quoteSummary API
 */
async function getYahooCrumb(): Promise<{ crumb: string; cookies: string } | null> {
  // Check cache
  if (cachedCrumb && Date.now() - cachedCrumb.timestamp < CRUMB_CACHE_TTL) {
    return { crumb: cachedCrumb.crumb, cookies: cachedCrumb.cookies }
  }

  try {
    // Step 1: Get initial cookies from Yahoo Finance
    const initResponse = await fetch('https://finance.yahoo.com/quote/AAPL', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    })

    if (!initResponse.ok) {
      console.error('[Yahoo Crumb] Failed to fetch initial page:', initResponse.status)
      return null
    }

    // Get cookies from response
    const setCookies = initResponse.headers.get('set-cookie') || ''
    const cookies = setCookies.split(',').map(c => c.split(';')[0].trim()).join('; ')

    // Step 2: Get crumb from crumb API
    const crumbResponse = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookies,
      },
    })

    if (!crumbResponse.ok) {
      console.error('[Yahoo Crumb] Failed to fetch crumb:', crumbResponse.status)
      return null
    }

    const crumb = await crumbResponse.text()

    if (!crumb || crumb.includes('error')) {
      console.error('[Yahoo Crumb] Invalid crumb received:', crumb)
      return null
    }

    // Cache the result
    cachedCrumb = { crumb, cookies, timestamp: Date.now() }
    console.log('[Yahoo Crumb] Successfully obtained crumb')

    return { crumb, cookies }
  } catch (error) {
    console.error('[Yahoo Crumb] Error getting crumb:', error)
    return null
  }
}

/**
 * Fetch fundamentals using chart API (no auth required)
 * This provides: 52-week high/low only
 * Market cap, PE, EPS, dividend yield not available via chart API
 */
async function fetchFundamentalsFromChart(symbol: string, retries = FUNDAMENTALS_MAX_RETRIES): Promise<YahooFundamentalsResult | null> {
  const url = `${YAHOO_CHART_URL}/${symbol}?interval=1d&range=1d`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FUNDAMENTALS_TIMEOUT)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 429 && retries > 0) {
      const waitTime = addJitter(FUNDAMENTALS_RETRY_DELAY)
      console.warn(`[Yahoo Chart Fundamentals] Rate limited for ${symbol}, waiting ${waitTime}ms`)
      await delay(waitTime)
      return fetchFundamentalsFromChart(symbol, retries - 1)
    }

    if (!response.ok) {
      console.error(`[Yahoo Chart Fundamentals] Failed to fetch ${symbol}: ${response.status}`)
      return null
    }

    const data = await response.json()
    const meta = data?.chart?.result?.[0]?.meta

    if (!meta) {
      console.warn(`[Yahoo Chart Fundamentals] No data for ${symbol}`)
      return null
    }

    return {
      stockCode: fromYahooSymbol(symbol),
      marketCap: null, // Not available via chart API
      peRatio: null, // Not available via chart API
      eps: null, // Not available via chart API
      dividendYield: null, // Not available via chart API
      week52High: meta.fiftyTwoWeekHigh || null,
      week52Low: meta.fiftyTwoWeekLow || null,
    }
  } catch (error) {
    if (retries > 0) {
      await delay(addJitter(FUNDAMENTALS_RETRY_DELAY))
      return fetchFundamentalsFromChart(symbol, retries - 1)
    }
    console.error(`[Yahoo Chart Fundamentals] Error fetching ${symbol}:`, error)
    return null
  }
}

/**
 * Fetch fundamentals for a single stock
 * Strategy: Use chart API directly (fast, reliable, but limited data: 52-week high/low only)
 *
 * NOTE: quoteSummary with crumb auth was too slow/unreliable for Vercel Hobby plan.
 * Chart API completes in ~1-2s per stock vs 5-10s for quoteSummary.
 */
async function fetchSingleFundamentals(symbol: string, retries = FUNDAMENTALS_MAX_RETRIES): Promise<YahooFundamentalsResult | null> {
  // Use chart API directly - fast and reliable (no auth needed)
  // This gives us 52-week high/low only, but completes quickly
  return fetchFundamentalsFromChart(symbol, retries)
}

/**
 * Batch fetch fundamentals for multiple stocks
 * Uses faster parallel processing (3 concurrent) since fundamentals only run once daily
 */
export async function fetchBatchFundamentals(
  stockCodes: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<{
  success: Map<string, YahooFundamentalsResult>
  failed: string[]
  totalTime: number
}> {
  const startTime = Date.now()
  const results = new Map<string, YahooFundamentalsResult>()
  const failedCodes: string[] = []

  console.log(`[Yahoo Fundamentals] Fetching ${stockCodes.length} stocks (${FUNDAMENTALS_CONCURRENT} parallel, ${FUNDAMENTALS_TIMEOUT}ms timeout)...`)

  // Process in parallel batches for speed
  for (let i = 0; i < stockCodes.length; i += FUNDAMENTALS_CONCURRENT) {
    const batch = stockCodes.slice(i, i + FUNDAMENTALS_CONCURRENT)

    const promises = batch.map(async (code) => {
      const symbol = toYahooSymbol(code)
      const result = await fetchSingleFundamentals(symbol)
      return { code: code.toUpperCase(), result }
    })

    const batchResults = await Promise.all(promises)

    for (const { code, result } of batchResults) {
      if (result) {
        results.set(code, result)
      } else {
        failedCodes.push(code)
      }
    }

    // Progress callback
    if (onProgress) {
      onProgress(Math.min(i + FUNDAMENTALS_CONCURRENT, stockCodes.length), stockCodes.length)
    }

    // Short delay between parallel batches to avoid rate limiting
    if (i + FUNDAMENTALS_CONCURRENT < stockCodes.length) {
      await delay(addJitter(FUNDAMENTALS_DELAY_MS))
    }
  }

  const totalTime = Date.now() - startTime

  console.log(`[Yahoo Fundamentals] Completed: ${results.size}/${stockCodes.length} in ${totalTime}ms`)

  if (failedCodes.length > 0 && failedCodes.length <= 10) {
    console.warn(`[Yahoo Fundamentals] Failed:`, failedCodes)
  } else if (failedCodes.length > 10) {
    console.warn(`[Yahoo Fundamentals] Failed ${failedCodes.length} stocks`)
  }

  return {
    success: results,
    failed: failedCodes,
    totalTime,
  }
}

/**
 * Fetch fundamentals for a single stock
 */
export async function fetchSingleStockFundamentals(stockCode: string): Promise<YahooFundamentalsResult | null> {
  const symbol = toYahooSymbol(stockCode)
  return fetchSingleFundamentals(symbol)
}

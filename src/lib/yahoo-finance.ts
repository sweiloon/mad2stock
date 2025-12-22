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
const FUNDAMENTALS_DELAY_MS = 2500  // 2.5s between requests for reliable rate limiting avoidance
const FUNDAMENTALS_RETRY_DELAY = 5000  // 5s retry delay
const FUNDAMENTALS_MAX_RETRIES = 2  // 2 retries for failed stocks (increased from 1)
const FUNDAMENTALS_TIMEOUT = 10000  // 10s timeout per request (increased from 8s)

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
// FUNDAMENTALS API (using quoteSummary endpoint)
// ============================================================================

const YAHOO_QUOTE_SUMMARY_URL = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary'

/**
 * Fetch fundamentals for a single stock using quoteSummary API
 * Returns: marketCap, peRatio, eps, dividendYield, week52High, week52Low
 * Uses faster retry settings since fundamentals run once daily
 */
async function fetchSingleFundamentals(symbol: string, retries = FUNDAMENTALS_MAX_RETRIES): Promise<YahooFundamentalsResult | null> {
  const modules = 'summaryDetail,defaultKeyStatistics,price'
  const url = `${YAHOO_QUOTE_SUMMARY_URL}/${symbol}?modules=${modules}`

  try {
    // Add timeout to prevent hanging requests
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
      console.warn(`[Yahoo Fundamentals] Rate limited for ${symbol}, waiting ${waitTime}ms`)
      await delay(waitTime)
      return fetchSingleFundamentals(symbol, retries - 1)
    }

    if (!response.ok) {
      console.error(`[Yahoo Fundamentals] Failed to fetch ${symbol}: ${response.status}`)
      return null
    }

    const data = await response.json()
    const result = data?.quoteSummary?.result?.[0]

    if (!result) {
      console.warn(`[Yahoo Fundamentals] No data for ${symbol}`)
      return null
    }

    const summaryDetail = result.summaryDetail || {}
    const keyStats = result.defaultKeyStatistics || {}
    const price = result.price || {}

    // Extract raw values from Yahoo's nested structure
    const marketCap = price.marketCap?.raw || summaryDetail.marketCap?.raw || null
    const peRatio = summaryDetail.trailingPE?.raw || keyStats.trailingPE?.raw || null
    const eps = keyStats.trailingEps?.raw || null
    const dividendYield = summaryDetail.dividendYield?.raw || null // Already as decimal (0.05 = 5%)
    const week52High = summaryDetail.fiftyTwoWeekHigh?.raw || null
    const week52Low = summaryDetail.fiftyTwoWeekLow?.raw || null

    return {
      stockCode: fromYahooSymbol(symbol),
      marketCap,
      peRatio,
      eps,
      dividendYield,
      week52High,
      week52Low,
    }
  } catch (error) {
    if (retries > 0) {
      await delay(addJitter(FUNDAMENTALS_RETRY_DELAY))
      return fetchSingleFundamentals(symbol, retries - 1)
    }
    console.error(`[Yahoo Fundamentals] Error fetching ${symbol}:`, error)
    return null
  }
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

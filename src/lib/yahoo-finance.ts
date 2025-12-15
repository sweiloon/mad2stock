/**
 * Yahoo Finance Batch API Wrapper
 *
 * Optimized for batch fetching of multiple stocks using the v7/finance/quote endpoint.
 * This is the primary data source for the tiered update system supporting ~1000 KLSE stocks.
 *
 * Key Features:
 * - Batch fetching: Up to 50 symbols per request
 * - Rate limiting: 500ms delay between batches
 * - Exponential backoff on errors
 * - KLSE format support: {CODE}.KL
 *
 * Data Delay: ~15-20 minutes (acceptable for swing trading/trend analysis)
 * Rate Limit: Stay under 1000 requests/hour
 * Cost: FREE
 */

const YAHOO_BATCH_URL = 'https://query1.finance.yahoo.com/v7/finance/quote'
const MAX_SYMBOLS_PER_REQUEST = 20  // Reduced from 50 to avoid rate limiting
const REQUEST_DELAY_MS = 2000  // Increased from 500ms to 2s between batches
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 3000  // Increased from 1000ms for rate limit recovery
const INITIAL_WARMUP_DELAY = 1000  // Delay before first request

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
  epsTrailingTwelveMonths?: number
  currency: string
  exchangeDataDelayedBy?: number
}

export interface BatchFetchResult {
  success: Map<string, YahooQuoteResult>
  failed: string[]
  totalTime: number
}

/**
 * Utility: Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Utility: Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Convert stock code to Yahoo Finance format
 * Handles both numeric codes and name codes
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
 * Add random jitter to delays to avoid detection patterns
 */
function addJitter(baseMs: number): number {
  const jitter = Math.random() * 0.3 * baseMs  // ±30% jitter
  return Math.round(baseMs + jitter)
}

/**
 * Fetch with retry and exponential backoff
 * Handles both HTTP 429 and edge-level "Too Many Requests" text responses
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
  retryDelay = INITIAL_RETRY_DELAY
): Promise<Response> {
  try {
    const response = await fetch(url, options)

    // Handle rate limiting (429)
    if (response.status === 429 && retries > 0) {
      const waitTime = addJitter(retryDelay)
      console.warn(`[Yahoo Finance] Rate limited (429), waiting ${waitTime}ms before retry`)
      await delay(waitTime)
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2)
    }

    // Check for edge-level rate limiting (returns HTML/text with "Too Many Requests")
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json') && response.ok) {
      const text = await response.text()
      if (text.toLowerCase().includes('too many requests') || text.toLowerCase().includes('rate limit')) {
        if (retries > 0) {
          const waitTime = addJitter(retryDelay * 2)  // Extra wait for edge-level limits
          console.warn(`[Yahoo Finance] Edge rate limited, waiting ${waitTime}ms before retry`)
          await delay(waitTime)
          return fetchWithRetry(url, options, retries - 1, retryDelay * 2)
        }
        throw new Error('Edge rate limit exceeded')
      }
      // Return a synthetic response with the text for other non-JSON responses
      return new Response(text, { status: response.status, headers: response.headers })
    }

    // Handle server errors with retry
    if (!response.ok && retries > 0 && response.status >= 500) {
      const waitTime = addJitter(retryDelay)
      console.warn(`[Yahoo Finance] Server error ${response.status}, retrying in ${waitTime}ms`)
      await delay(waitTime)
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2)
    }

    return response
  } catch (error) {
    if (retries > 0) {
      const waitTime = addJitter(retryDelay)
      console.warn(`[Yahoo Finance] Fetch error, retrying in ${waitTime}ms:`, error)
      await delay(waitTime)
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2)
    }
    throw error
  }
}

/**
 * Fetch a single batch of quotes (up to 50 symbols)
 */
async function fetchBatch(symbols: string[]): Promise<Map<string, YahooQuoteResult>> {
  const results = new Map<string, YahooQuoteResult>()

  if (symbols.length === 0) return results
  if (symbols.length > MAX_SYMBOLS_PER_REQUEST) {
    throw new Error(`Batch size ${symbols.length} exceeds maximum of ${MAX_SYMBOLS_PER_REQUEST}`)
  }

  const url = `${YAHOO_BATCH_URL}?symbols=${symbols.join(',')}`

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      },
    })

    if (!response.ok) {
      console.error(`[Yahoo Finance] Batch fetch failed with status ${response.status}`)
      return results
    }

    const data = await response.json()

    if (data?.quoteResponse?.error) {
      console.error('[Yahoo Finance] API error:', data.quoteResponse.error)
      return results
    }

    const quotes = data?.quoteResponse?.result || []

    for (const quote of quotes) {
      if (quote.symbol && quote.regularMarketPrice !== undefined) {
        const stockCode = fromYahooSymbol(quote.symbol)
        results.set(stockCode, {
          symbol: quote.symbol,
          shortName: quote.shortName || quote.longName || stockCode,
          regularMarketPrice: quote.regularMarketPrice || 0,
          regularMarketChange: quote.regularMarketChange || 0,
          regularMarketChangePercent: quote.regularMarketChangePercent || 0,
          regularMarketPreviousClose: quote.regularMarketPreviousClose || 0,
          regularMarketOpen: quote.regularMarketOpen || 0,
          regularMarketDayHigh: quote.regularMarketDayHigh || 0,
          regularMarketDayLow: quote.regularMarketDayLow || 0,
          regularMarketVolume: quote.regularMarketVolume || 0,
          regularMarketTime: quote.regularMarketTime || 0,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
          marketCap: quote.marketCap,
          trailingPE: quote.trailingPE,
          epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
          currency: quote.currency || 'MYR',
          exchangeDataDelayedBy: quote.exchangeDataDelayedBy,
        })
      }
    }

    return results
  } catch (error) {
    console.error('[Yahoo Finance] Batch fetch error:', error)
    return results
  }
}

/**
 * Fetch quotes for multiple stocks in batches
 *
 * @param stockCodes - Array of stock codes (numeric or name)
 * @param onProgress - Optional callback for progress updates
 * @returns BatchFetchResult with success map, failed codes, and total time
 *
 * Uses conservative rate limiting to avoid Yahoo Finance edge-level blocks:
 * - 20 symbols per batch (reduced from 50)
 * - 2-3s delay between batches with jitter
 * - Initial warmup delay
 *
 * @example
 * const result = await fetchBatchQuotes(['1155', '5398', 'MAYBANK'])
 * console.log(result.success.get('1155')?.regularMarketPrice)
 */
export async function fetchBatchQuotes(
  stockCodes: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchFetchResult> {
  const startTime = Date.now()
  const allResults = new Map<string, YahooQuoteResult>()
  const failedCodes: string[] = []

  // Convert to Yahoo symbols
  const yahooSymbols = stockCodes.map(code => toYahooSymbol(code))

  // Split into batches
  const batches = chunkArray(yahooSymbols, MAX_SYMBOLS_PER_REQUEST)

  const estimatedTime = batches.length * (REQUEST_DELAY_MS + 500)
  console.log(`[Yahoo Finance] Fetching ${stockCodes.length} stocks in ${batches.length} batches (est. ${Math.round(estimatedTime/1000)}s)`)

  // Initial warmup delay to avoid immediate rate limiting
  await delay(INITIAL_WARMUP_DELAY)

  let completedBatches = 0
  let consecutiveFailures = 0
  const MAX_CONSECUTIVE_FAILURES = 3

  for (const batch of batches) {
    // If we hit too many consecutive failures, abort early
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(`[Yahoo Finance] Aborting: ${MAX_CONSECUTIVE_FAILURES} consecutive batch failures`)
      // Add remaining stocks to failed list
      for (let i = completedBatches; i < batches.length; i++) {
        for (const symbol of batches[i]) {
          failedCodes.push(fromYahooSymbol(symbol))
        }
      }
      break
    }

    const batchResults = await fetchBatch(batch)

    // Track consecutive failures
    if (batchResults.size === 0) {
      consecutiveFailures++
      // Extra delay after a failed batch
      const recoveryDelay = addJitter(REQUEST_DELAY_MS * 2)
      console.warn(`[Yahoo Finance] Batch failed, waiting ${recoveryDelay}ms for recovery...`)
      await delay(recoveryDelay)
    } else {
      consecutiveFailures = 0  // Reset on success
    }

    // Merge results
    batchResults.forEach((value, key) => {
      allResults.set(key, value)
    })

    // Track failed codes
    for (const symbol of batch) {
      const stockCode = fromYahooSymbol(symbol)
      if (!batchResults.has(stockCode)) {
        failedCodes.push(stockCode)
      }
    }

    completedBatches++

    // Progress callback
    if (onProgress) {
      onProgress(Math.min(completedBatches * MAX_SYMBOLS_PER_REQUEST, stockCodes.length), stockCodes.length)
    }

    // Rate limiting delay between batches with jitter
    if (completedBatches < batches.length) {
      const delayMs = addJitter(REQUEST_DELAY_MS)
      await delay(delayMs)
    }
  }

  const totalTime = Date.now() - startTime

  console.log(`[Yahoo Finance] Completed: ${allResults.size}/${stockCodes.length} stocks in ${totalTime}ms`)

  if (failedCodes.length > 0) {
    console.warn(`[Yahoo Finance] Failed to fetch ${failedCodes.length} stocks:`, failedCodes.slice(0, 10))
  }

  return {
    success: allResults,
    failed: failedCodes,
    totalTime,
  }
}

/**
 * Fetch a single stock quote
 * For single stock fetches, still uses the batch endpoint for consistency
 */
export async function fetchSingleQuote(stockCode: string): Promise<YahooQuoteResult | null> {
  const result = await fetchBatchQuotes([stockCode])
  return result.success.get(stockCode.toUpperCase()) || null
}

/**
 * Check if Yahoo Finance API is accessible
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const testSymbol = '1155.KL' // Maybank - most liquid Malaysian stock
    const url = `${YAHOO_BATCH_URL}?symbols=${testSymbol}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) return false

    const data = await response.json()
    return data?.quoteResponse?.result?.length > 0
  } catch {
    return false
  }
}

/**
 * Get estimated API calls needed for a given number of stocks
 */
export function estimateApiCalls(stockCount: number): number {
  return Math.ceil(stockCount / MAX_SYMBOLS_PER_REQUEST)
}

/**
 * Get estimated time to fetch a given number of stocks
 */
export function estimateFetchTime(stockCount: number): number {
  const batches = estimateApiCalls(stockCount)
  // Warmup + (batches * (fetch time + delay between batches))
  return INITIAL_WARMUP_DELAY + batches * (500 + REQUEST_DELAY_MS)
}

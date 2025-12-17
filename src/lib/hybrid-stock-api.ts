/**
 * Hybrid Stock Data API Service
 *
 * Provides stock price data using multiple data sources:
 * - Primary: EODHD EOD API (~707 stocks covered)
 * - Fallback: Yahoo Finance v8 Chart API (~88 additional stocks)
 *
 * This hybrid approach ensures ~99% coverage of KLSE stocks.
 */

import { fetchEODHDBatchQuotes, type StockQuoteData } from './eodhd-api'
import { fetchSingleQuote as fetchYahooQuote, type YahooQuoteResult } from './yahoo-finance'

export interface HybridQuoteData {
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
  dataSource: 'eodhd' | 'yahoo' | 'none'
}

export interface HybridBatchResult {
  quotes: Map<string, HybridQuoteData>
  stats: {
    total: number
    eodhd: number
    yahoo: number
    failed: number
    failedCodes: string[]
  }
  duration: number
}

/**
 * Convert Yahoo quote to unified format
 */
function yahooToHybrid(yahooQuote: YahooQuoteResult, stockCode: string): HybridQuoteData {
  return {
    stockCode: stockCode.toUpperCase(),
    price: yahooQuote.regularMarketPrice,
    change: yahooQuote.regularMarketChange,
    changePercent: yahooQuote.regularMarketChangePercent,
    previousClose: yahooQuote.regularMarketPreviousClose,
    open: yahooQuote.regularMarketOpen,
    high: yahooQuote.regularMarketDayHigh,
    low: yahooQuote.regularMarketDayLow,
    volume: yahooQuote.regularMarketVolume,
    timestamp: new Date(yahooQuote.regularMarketTime * 1000).toISOString(),
    dataSource: 'yahoo',
  }
}

/**
 * Convert EODHD quote to unified format
 */
function eodhdToHybrid(eodhdQuote: StockQuoteData): HybridQuoteData {
  return {
    stockCode: eodhdQuote.stockCode.toUpperCase(),
    price: eodhdQuote.price,
    change: eodhdQuote.change,
    changePercent: eodhdQuote.changePercent,
    previousClose: eodhdQuote.previousClose,
    open: eodhdQuote.open,
    high: eodhdQuote.high,
    low: eodhdQuote.low,
    volume: eodhdQuote.volume,
    timestamp: eodhdQuote.timestamp,
    dataSource: 'eodhd',
  }
}

/**
 * Fetch a single stock quote using hybrid approach
 * Tries EODHD first, falls back to Yahoo Finance
 */
export async function fetchHybridQuote(stockCode: string): Promise<HybridQuoteData | null> {
  const upperCode = stockCode.toUpperCase()

  // Try EODHD first
  const eodhdResult = await fetchEODHDBatchQuotes([upperCode])
  const eodhdQuote = eodhdResult.get(upperCode)

  if (eodhdQuote) {
    console.log(`[Hybrid] ${upperCode}: EODHD success`)
    return eodhdToHybrid(eodhdQuote)
  }

  // Fallback to Yahoo Finance
  console.log(`[Hybrid] ${upperCode}: EODHD failed, trying Yahoo Finance`)
  const yahooQuote = await fetchYahooQuote(upperCode)

  if (yahooQuote) {
    console.log(`[Hybrid] ${upperCode}: Yahoo Finance success`)
    return yahooToHybrid(yahooQuote, upperCode)
  }

  console.warn(`[Hybrid] ${upperCode}: Both sources failed`)
  return null
}

/**
 * Fetch batch quotes using hybrid approach
 *
 * Strategy:
 * 1. Fetch all stocks from EODHD (batch request)
 * 2. Identify stocks that failed from EODHD
 * 3. Fetch failed stocks from Yahoo Finance (individual requests with delay)
 *
 * @param stockCodes - Array of stock codes to fetch
 * @param onProgress - Optional progress callback
 */
export async function fetchHybridBatchQuotes(
  stockCodes: string[],
  onProgress?: (completed: number, total: number, source: string) => void
): Promise<HybridBatchResult> {
  const startTime = Date.now()
  const results = new Map<string, HybridQuoteData>()
  const stats = {
    total: stockCodes.length,
    eodhd: 0,
    yahoo: 0,
    failed: 0,
    failedCodes: [] as string[],
  }

  const upperCodes = stockCodes.map(c => c.toUpperCase())

  console.log(`[Hybrid] Fetching ${upperCodes.length} stocks...`)

  // Step 1: Try EODHD for all stocks (batch)
  console.log(`[Hybrid] Step 1: EODHD batch request for ${upperCodes.length} stocks`)
  const eodhdResults = await fetchEODHDBatchQuotes(upperCodes)

  const failedFromEODHD: string[] = []

  for (const code of upperCodes) {
    const eodhdQuote = eodhdResults.get(code)
    if (eodhdQuote) {
      results.set(code, eodhdToHybrid(eodhdQuote))
      stats.eodhd++
    } else {
      failedFromEODHD.push(code)
    }
  }

  console.log(`[Hybrid] EODHD: ${stats.eodhd}/${upperCodes.length} success, ${failedFromEODHD.length} need Yahoo fallback`)

  if (onProgress) {
    onProgress(stats.eodhd, stats.total, 'eodhd')
  }

  // Step 2: Fallback to Yahoo Finance for failed stocks
  if (failedFromEODHD.length > 0) {
    console.log(`[Hybrid] Step 2: Yahoo Finance fallback for ${failedFromEODHD.length} stocks`)

    // Process Yahoo requests sequentially with delay to avoid rate limiting
    for (let i = 0; i < failedFromEODHD.length; i++) {
      const code = failedFromEODHD[i]

      try {
        const yahooQuote = await fetchYahooQuote(code)

        if (yahooQuote) {
          results.set(code, yahooToHybrid(yahooQuote, code))
          stats.yahoo++
        } else {
          stats.failed++
          stats.failedCodes.push(code)
        }
      } catch (error) {
        console.error(`[Hybrid] Yahoo error for ${code}:`, error)
        stats.failed++
        stats.failedCodes.push(code)
      }

      if (onProgress) {
        onProgress(stats.eodhd + stats.yahoo + stats.failed, stats.total, 'yahoo')
      }

      // Small delay between Yahoo requests to avoid rate limiting
      if (i < failedFromEODHD.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`[Hybrid] Yahoo Finance: ${stats.yahoo} success, ${stats.failed} still failed`)
  }

  const duration = Date.now() - startTime

  console.log(`[Hybrid] Complete: ${results.size}/${stats.total} stocks in ${duration}ms`)
  console.log(`[Hybrid] Sources: EODHD=${stats.eodhd}, Yahoo=${stats.yahoo}, Failed=${stats.failed}`)

  if (stats.failedCodes.length > 0 && stats.failedCodes.length <= 20) {
    console.log(`[Hybrid] Failed codes:`, stats.failedCodes)
  } else if (stats.failedCodes.length > 20) {
    console.log(`[Hybrid] Failed codes (first 20):`, stats.failedCodes.slice(0, 20))
  }

  return {
    quotes: results,
    stats,
    duration,
  }
}

/**
 * Get list of stocks that are known to not be covered by EODHD
 * These will always use Yahoo Finance fallback
 */
export const KNOWN_YAHOO_ONLY_STOCKS = new Set([
  // Core 80 stocks not in EODHD
  '03024', // CETECH
  '03064', // MYAXIS
  '0369',  // JSSOLAR
  '0363',  // PMCK
  // 5-digit ACE market codes often not in EODHD
  '03011', // AMLEX
  '03012', // BABA
  '03041', // 1TECH
  '03059', // AUTORIS
])

/**
 * Check if a stock code is known to require Yahoo Finance
 */
export function isKnownYahooOnlyStock(code: string): boolean {
  return KNOWN_YAHOO_ONLY_STOCKS.has(code.toUpperCase())
}

"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { StockQuote, StockHistoricalData, StockNews, MarketIndex } from '@/lib/stock-api'

// Helper to create a timeout promise
function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      }
    )
  })
}

// Hook for fetching a single stock quote with better error handling
export function useStockQuote(symbol: string | null, refreshInterval?: number) {
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [loading, setLoading] = useState(false) // Start with false to prevent blocking
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const fetchQuote = useCallback(async () => {
    if (!symbol) {
      setLoading(false)
      return
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)

      // Add 10-second timeout to prevent infinite waiting
      const response = await timeoutPromise(
        fetch(`/api/stocks/quote?symbols=${encodeURIComponent(symbol)}`, {
          signal: abortControllerRef.current.signal,
        }),
        10000
      )

      if (!mountedRef.current) return

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!mountedRef.current) return

      if (data.quote) {
        setQuote(data.quote)
        setError(null)
        setRetryCount(0)
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        // No quote returned but no error - might be market closed or stock not found
        setQuote(null)
        setError(null)
      }
    } catch (err) {
      if (!mountedRef.current) return
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled, don't update state
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock data'
      setError(errorMessage)
      console.warn(`[useStockQuote] Error fetching ${symbol}:`, errorMessage)
      // Keep old quote data on error (graceful degradation)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [symbol])

  useEffect(() => {
    mountedRef.current = true

    // Delay initial fetch slightly to let the UI render first
    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        fetchQuote()
      }
    }, 100)

    let interval: NodeJS.Timeout | null = null
    if (refreshInterval && refreshInterval > 0) {
      interval = setInterval(() => {
        if (mountedRef.current) {
          fetchQuote()
        }
      }, refreshInterval)
    }

    return () => {
      mountedRef.current = false
      clearTimeout(initialTimeout)
      if (interval) clearInterval(interval)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchQuote, refreshInterval])

  return {
    quote,
    loading,
    error,
    refetch: fetchQuote,
    retryCount,
    hasData: !!quote,
  }
}

// Hook for fetching multiple stock quotes
export function useMultipleQuotes(symbols: string[], refreshInterval?: number) {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Serialize symbols for dependency tracking
  const symbolsKey = symbols.sort().join(',')

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      const response = await fetch(
        `/api/stocks/quote?symbols=${encodeURIComponent(symbols.join(','))}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch quotes')
      }

      const data = await response.json()
      setQuotes(data.quotes || {})
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [symbolsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuotes()

    let interval: NodeJS.Timeout | null = null
    if (refreshInterval && refreshInterval > 0) {
      interval = setInterval(fetchQuotes, refreshInterval)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchQuotes, refreshInterval])

  return { quotes, loading, error, refetch: fetchQuotes }
}

// Hook for fetching historical data with improved error handling
export function useStockHistory(
  symbol: string | null,
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1mo',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo' = '1d'
) {
  const [history, setHistory] = useState<StockHistoricalData[]>([])
  const [loading, setLoading] = useState(false) // Start with false to prevent blocking
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const fetchHistory = useCallback(async () => {
    if (!symbol) {
      setLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)

      // Add 15-second timeout for history requests
      const response = await timeoutPromise(
        fetch(
          `/api/stocks/history?symbol=${encodeURIComponent(symbol)}&period=${period}&interval=${interval}`,
          { signal: abortControllerRef.current.signal }
        ),
        15000
      )

      if (!mountedRef.current) return

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!mountedRef.current) return

      setHistory(data.history || [])
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history'
      setError(errorMessage)
      console.warn(`[useStockHistory] Error fetching ${symbol}:`, errorMessage)
      // Keep old history on error for better UX
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [symbol, period, interval])

  useEffect(() => {
    mountedRef.current = true

    // Delay initial fetch slightly to let the UI render first
    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        fetchHistory()
      }
    }, 200)

    return () => {
      mountedRef.current = false
      clearTimeout(initialTimeout)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchHistory])

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    hasData: history.length > 0,
  }
}

// Hook for fetching market index (KLCI)
export function useMarketIndex(refreshInterval: number = 60000) {
  const [index, setIndex] = useState<MarketIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchIndex = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      const response = await fetch('/api/stocks/market', {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch market data')
      }

      const data = await response.json()
      setIndex(data.klci)
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIndex()

    const interval = setInterval(fetchIndex, refreshInterval)

    return () => {
      clearInterval(interval)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchIndex, refreshInterval])

  return { index, loading, error, refetch: fetchIndex }
}

// Hook for fetching stock news
export function useStockNews(symbol: string | null, limit: number = 10) {
  const [news, setNews] = useState<StockNews[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchNews = useCallback(async () => {
    if (!symbol) {
      setLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      const response = await fetch(
        `/api/stocks/news?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()
      setNews(data.news || [])
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Keep old news on error
    } finally {
      setLoading(false)
    }
  }, [symbol, limit])

  useEffect(() => {
    fetchNews()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchNews])

  return { news, loading, error, refetch: fetchNews }
}

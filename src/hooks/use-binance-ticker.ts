'use client'

// ============================================
// USE BINANCE TICKER HOOK
// Real-time ticker updates via WebSocket
// For active coin profile pages
// ============================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  binanceWs,
  BinanceWebSocketManager,
  type CryptoPrice,
} from '@/lib/crypto'

// ============================================
// TYPES
// ============================================

interface UseBinanceTickerOptions {
  enabled?: boolean
  throttleMs?: number      // Throttle updates (default: 1000ms)
  pair?: string            // Quote currency (default: 'USDT')
}

interface UseBinanceTickerResult {
  ticker: CryptoPrice | null
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
}

// ============================================
// THROTTLE UTILITY
// ============================================

function useThrottle<T>(value: T, intervalMs: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastUpdated = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()

    if (now - lastUpdated.current >= intervalMs) {
      lastUpdated.current = now
      setThrottledValue(value)
    } else {
      const timerId = setTimeout(() => {
        lastUpdated.current = Date.now()
        setThrottledValue(value)
      }, intervalMs - (now - lastUpdated.current))

      return () => clearTimeout(timerId)
    }
  }, [value, intervalMs])

  return throttledValue
}

// ============================================
// HOOK: useBinanceTicker
// ============================================

export function useBinanceTicker(
  symbol: string | null,
  options: UseBinanceTickerOptions = {}
): UseBinanceTickerResult {
  const {
    enabled = true,
    throttleMs = 1000,
    pair = 'USDT',
  } = options

  const [rawTicker, setRawTicker] = useState<CryptoPrice | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Throttle the ticker updates
  const ticker = useThrottle(rawTicker, throttleMs)

  // Build the pair symbol
  const pairSymbol = useMemo(() => {
    if (!symbol) return null
    return `${symbol.toUpperCase()}${pair.toUpperCase()}`
  }, [symbol, pair])

  useEffect(() => {
    if (!enabled || !pairSymbol) {
      setRawTicker(null)
      setIsConnected(false)
      return
    }

    let isMounted = true

    const connect = async () => {
      try {
        // Connect to WebSocket
        await binanceWs.connect()

        if (!isMounted) return

        setIsConnected(binanceWs.isConnected())
        setError(null)

        // Subscribe to ticker stream
        unsubscribeRef.current = binanceWs.subscribeToTicker(
          pairSymbol,
          (data: CryptoPrice) => {
            if (!isMounted) return
            setRawTicker(data)
            setLastUpdate(new Date())
          }
        )
      } catch (err) {
        if (!isMounted) return
        console.error('[useBinanceTicker] Connection error:', err)
        setError(err instanceof Error ? err.message : 'Failed to connect')
        setIsConnected(false)
      }
    }

    connect()

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      if (isMounted) {
        setIsConnected(binanceWs.isConnected())
      }
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(statusInterval)

      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [enabled, pairSymbol])

  return {
    ticker,
    isConnected,
    lastUpdate,
    error,
  }
}

// ============================================
// HOOK: useBinanceMiniTicker (lightweight)
// ============================================

interface MiniTickerData {
  symbol: string
  price: number
  volume: number
}

export function useBinanceMiniTicker(
  symbol: string | null,
  options: Omit<UseBinanceTickerOptions, 'throttleMs'> & { throttleMs?: number } = {}
): {
  ticker: MiniTickerData | null
  isConnected: boolean
  lastUpdate: Date | null
} {
  const {
    enabled = true,
    throttleMs = 500,
    pair = 'USDT',
  } = options

  const [rawTicker, setRawTicker] = useState<MiniTickerData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const ticker = useThrottle(rawTicker, throttleMs)

  const pairSymbol = useMemo(() => {
    if (!symbol) return null
    return `${symbol.toUpperCase()}${pair.toUpperCase()}`
  }, [symbol, pair])

  useEffect(() => {
    if (!enabled || !pairSymbol) {
      setRawTicker(null)
      setIsConnected(false)
      return
    }

    let isMounted = true

    const connect = async () => {
      try {
        await binanceWs.connect()
        if (!isMounted) return

        setIsConnected(binanceWs.isConnected())

        unsubscribeRef.current = binanceWs.subscribeToMiniTicker(
          pairSymbol,
          (data) => {
            if (!isMounted) return
            setRawTicker(data)
            setLastUpdate(new Date())
          }
        )
      } catch (err) {
        if (!isMounted) return
        console.error('[useBinanceMiniTicker] Error:', err)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      isMounted = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [enabled, pairSymbol])

  return {
    ticker,
    isConnected,
    lastUpdate,
  }
}

// ============================================
// HOOK: useMultipleBinanceTickers
// ============================================

export function useMultipleBinanceTickers(
  symbols: string[],
  options: Omit<UseBinanceTickerOptions, 'symbol'> = {}
): {
  tickers: Map<string, CryptoPrice>
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
} {
  const {
    enabled = true,
    throttleMs = 1000,
    pair = 'USDT',
  } = options

  const [tickers, setTickers] = useState<Map<string, CryptoPrice>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map())

  // Throttled update function
  const updateTicker = useCallback(
    (() => {
      let lastUpdateTime = 0
      let pendingUpdates = new Map<string, CryptoPrice>()
      let timeoutId: NodeJS.Timeout | null = null

      return (symbol: string, data: CryptoPrice) => {
        pendingUpdates.set(symbol, data)

        const now = Date.now()
        if (now - lastUpdateTime >= throttleMs) {
          lastUpdateTime = now
          setTickers((prev) => {
            const newMap = new Map(prev)
            pendingUpdates.forEach((price, sym) => {
              newMap.set(sym, price)
            })
            return newMap
          })
          setLastUpdate(new Date())
          pendingUpdates.clear()
        } else if (!timeoutId) {
          timeoutId = setTimeout(() => {
            lastUpdateTime = Date.now()
            setTickers((prev) => {
              const newMap = new Map(prev)
              pendingUpdates.forEach((price, sym) => {
                newMap.set(sym, price)
              })
              return newMap
            })
            setLastUpdate(new Date())
            pendingUpdates.clear()
            timeoutId = null
          }, throttleMs - (now - lastUpdateTime))
        }
      }
    })(),
    [throttleMs]
  )

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      setTickers(new Map())
      setIsConnected(false)
      return
    }

    let isMounted = true

    const connect = async () => {
      try {
        await binanceWs.connect()
        if (!isMounted) return

        setIsConnected(binanceWs.isConnected())
        setError(null)

        // Subscribe to each symbol
        symbols.forEach((symbol) => {
          const pairSymbol = `${symbol.toUpperCase()}${pair.toUpperCase()}`

          const unsubscribe = binanceWs.subscribeToTicker(
            pairSymbol,
            (data: CryptoPrice) => {
              if (!isMounted) return
              updateTicker(symbol, data)
            }
          )

          unsubscribeRefs.current.set(symbol, unsubscribe)
        })
      } catch (err) {
        if (!isMounted) return
        console.error('[useMultipleBinanceTickers] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to connect')
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      isMounted = false
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe())
      unsubscribeRefs.current.clear()
    }
  }, [enabled, symbols.join(','), pair, updateTicker])

  return {
    tickers,
    isConnected,
    lastUpdate,
    error,
  }
}

'use client'

// ============================================
// USE CRYPTO CHART HOOK
// Candlestick/Kline data for charts
// Combines REST initial load + WebSocket updates
// ============================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { binanceApi, binanceWs, type Kline, type KlineInterval, type BinanceWSKline } from '@/lib/crypto'

// Transform WebSocket kline data to our Kline type
function transformWSKline(data: BinanceWSKline, pairSymbol: string, interval: KlineInterval): Kline {
  const k = data.k
  return {
    pairSymbol,
    interval,
    openTime: new Date(k.t),
    closeTime: new Date(k.T),
    open: parseFloat(k.o),
    high: parseFloat(k.h),
    low: parseFloat(k.l),
    close: parseFloat(k.c),
    volume: parseFloat(k.v),
    quoteVolume: parseFloat(k.q),
    tradesCount: k.n,
    takerBuyBase: parseFloat(k.V),
    takerBuyQuote: parseFloat(k.Q),
  }
}

// ============================================
// TYPES
// ============================================

export type ChartInterval =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M'

interface UseCryptoChartOptions {
  enabled?: boolean
  interval?: ChartInterval
  limit?: number            // Number of candles to fetch (default: 200)
  pair?: string             // Quote currency (default: 'USDT')
  realtime?: boolean        // Enable real-time updates (default: true)
}

interface UseCryptoChartResult {
  klines: Kline[]
  isLoading: boolean
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
  refetch: () => Promise<void>
  // Derived data
  latestPrice: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
}

// ============================================
// HOOK: useCryptoChart
// ============================================

export function useCryptoChart(
  symbol: string | null,
  options: UseCryptoChartOptions = {}
): UseCryptoChartResult {
  const {
    enabled = true,
    interval = '1h',
    limit = 200,
    pair = 'USDT',
    realtime = true,
  } = options

  const [klines, setKlines] = useState<Kline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Build the pair symbol
  const pairSymbol = useMemo(() => {
    if (!symbol) return null
    return `${symbol.toUpperCase()}${pair.toUpperCase()}`
  }, [symbol, pair])

  // Fetch klines via REST API
  const fetchKlines = useCallback(async () => {
    if (!symbol || !pairSymbol || !enabled) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await binanceApi.getCryptoKlines(symbol.toUpperCase(), pair.toUpperCase(), interval, limit)
      setKlines(data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('[useCryptoChart] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data')
    } finally {
      setIsLoading(false)
    }
  }, [symbol, pairSymbol, interval, limit, pair, enabled])

  // Initial fetch
  useEffect(() => {
    fetchKlines()
  }, [fetchKlines])

  // Subscribe to real-time kline updates
  useEffect(() => {
    if (!enabled || !pairSymbol || !realtime) {
      return
    }

    let isMounted = true

    const connect = async () => {
      try {
        await binanceWs.connect()

        if (!isMounted) return

        setIsConnected(binanceWs.isConnected())

        // Subscribe to kline stream
        unsubscribeRef.current = binanceWs.subscribeToKline(
          pairSymbol,
          interval,
          (wsKline: BinanceWSKline) => {
            if (!isMounted) return

            // Transform WebSocket data to our Kline format
            const kline = transformWSKline(wsKline, pairSymbol, interval)

            setKlines(prev => {
              // Find and update or append the kline
              const newKlines = [...prev]
              const lastIndex = newKlines.length - 1

              if (lastIndex >= 0 && newKlines[lastIndex].openTime.getTime() === kline.openTime.getTime()) {
                // Update existing candle
                newKlines[lastIndex] = kline
              } else if (lastIndex < 0 || kline.openTime > newKlines[lastIndex].openTime) {
                // New candle
                newKlines.push(kline)

                // Keep only the last `limit` candles
                if (newKlines.length > limit) {
                  newKlines.shift()
                }
              }

              return newKlines
            })

            setLastUpdate(new Date())
          }
        )
      } catch (err) {
        if (!isMounted) return
        console.error('[useCryptoChart] WebSocket error:', err)
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
  }, [enabled, pairSymbol, interval, realtime, limit])

  // Calculate derived values
  const derivedValues = useMemo(() => {
    if (klines.length === 0) {
      return {
        latestPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        high: 0,
        low: 0,
        volume: 0,
      }
    }

    const latest = klines[klines.length - 1]
    const first = klines[0]

    const latestPrice = latest.close
    const priceChange = latest.close - first.open
    const priceChangePercent = first.open > 0 ? (priceChange / first.open) * 100 : 0

    let high = 0
    let low = Infinity
    let volume = 0

    klines.forEach(k => {
      if (k.high > high) high = k.high
      if (k.low < low) low = k.low
      volume += k.volume
    })

    return {
      latestPrice,
      priceChange,
      priceChangePercent,
      high,
      low: low === Infinity ? 0 : low,
      volume,
    }
  }, [klines])

  return {
    klines,
    isLoading,
    isConnected,
    lastUpdate,
    error,
    refetch: fetchKlines,
    ...derivedValues,
  }
}

// ============================================
// HOOK: useMultiTimeframeChart
// ============================================

interface UseMultiTimeframeChartOptions {
  enabled?: boolean
  intervals?: ChartInterval[]
  limit?: number
  pair?: string
}

interface MultiTimeframeData {
  interval: ChartInterval
  klines: Kline[]
  latestPrice: number
  priceChangePercent: number
  isLoading: boolean
}

export function useMultiTimeframeChart(
  symbol: string | null,
  options: UseMultiTimeframeChartOptions = {}
): {
  data: Map<ChartInterval, MultiTimeframeData>
  isLoading: boolean
  error: string | null
} {
  const {
    enabled = true,
    intervals = ['1h', '4h', '1d'],
    limit = 100,
    pair = 'USDT',
  } = options

  const [data, setData] = useState<Map<ChartInterval, MultiTimeframeData>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pairSymbol = useMemo(() => {
    if (!symbol) return null
    return `${symbol.toUpperCase()}${pair.toUpperCase()}`
  }, [symbol, pair])

  useEffect(() => {
    if (!enabled || !symbol || !pairSymbol) {
      setIsLoading(false)
      return
    }

    const fetchAll = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const results = await Promise.all(
          intervals.map(async (interval) => {
            const klines = await binanceApi.getCryptoKlines(symbol.toUpperCase(), pair.toUpperCase(), interval, limit)

            const latest = klines[klines.length - 1]
            const first = klines[0]
            const latestPrice = latest?.close || 0
            const priceChangePercent = first?.open > 0
              ? ((latest?.close - first?.open) / first?.open) * 100
              : 0

            return {
              interval,
              klines,
              latestPrice,
              priceChangePercent,
              isLoading: false,
            } as MultiTimeframeData
          })
        )

        const newData = new Map<ChartInterval, MultiTimeframeData>()
        results.forEach(r => newData.set(r.interval, r))
        setData(newData)
      } catch (err) {
        console.error('[useMultiTimeframeChart] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [enabled, symbol, pair, pairSymbol, intervals.join(','), limit])

  return {
    data,
    isLoading,
    error,
  }
}

// ============================================
// HOOK: useTechnicalIndicators
// ============================================

interface TechnicalIndicators {
  sma20: number[]
  sma50: number[]
  sma200: number[]
  ema12: number[]
  ema26: number[]
  rsi14: number[]
  macd: {
    macd: number[]
    signal: number[]
    histogram: number[]
  }
  bollingerBands: {
    upper: number[]
    middle: number[]
    lower: number[]
  }
}

export function useTechnicalIndicators(klines: Kline[]): TechnicalIndicators {
  return useMemo(() => {
    const closes = klines.map(k => k.close)

    // Simple Moving Average
    const sma = (data: number[], period: number): number[] => {
      const result: number[] = []
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          result.push(0)
        } else {
          const slice = data.slice(i - period + 1, i + 1)
          result.push(slice.reduce((a, b) => a + b, 0) / period)
        }
      }
      return result
    }

    // Exponential Moving Average
    const ema = (data: number[], period: number): number[] => {
      const result: number[] = []
      const multiplier = 2 / (period + 1)

      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          result.push(data[0])
        } else {
          result.push((data[i] - result[i - 1]) * multiplier + result[i - 1])
        }
      }
      return result
    }

    // RSI
    const calculateRsi = (data: number[], period: number): number[] => {
      const result: number[] = []
      const gains: number[] = []
      const losses: number[] = []

      for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1]
        gains.push(change > 0 ? change : 0)
        losses.push(change < 0 ? -change : 0)
      }

      for (let i = 0; i < data.length; i++) {
        if (i < period) {
          result.push(50) // Default
        } else {
          const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period
          const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
          result.push(100 - (100 / (1 + rs)))
        }
      }
      return result
    }

    // MACD
    const ema12Values = ema(closes, 12)
    const ema26Values = ema(closes, 26)
    const macdLine = ema12Values.map((v, i) => v - ema26Values[i])
    const signalLine = ema(macdLine, 9)
    const histogram = macdLine.map((v, i) => v - signalLine[i])

    // Bollinger Bands
    const sma20Values = sma(closes, 20)
    const stdDev = (data: number[], period: number): number[] => {
      const result: number[] = []
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          result.push(0)
        } else {
          const slice = data.slice(i - period + 1, i + 1)
          const mean = slice.reduce((a, b) => a + b, 0) / period
          const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period
          result.push(Math.sqrt(variance))
        }
      }
      return result
    }
    const sd = stdDev(closes, 20)

    return {
      sma20: sma20Values,
      sma50: sma(closes, 50),
      sma200: sma(closes, 200),
      ema12: ema12Values,
      ema26: ema26Values,
      rsi14: calculateRsi(closes, 14),
      macd: {
        macd: macdLine,
        signal: signalLine,
        histogram,
      },
      bollingerBands: {
        upper: sma20Values.map((v, i) => v + sd[i] * 2),
        middle: sma20Values,
        lower: sma20Values.map((v, i) => v - sd[i] * 2),
      },
    }
  }, [klines])
}

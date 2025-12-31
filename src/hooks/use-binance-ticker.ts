'use client'

// ============================================
// USE BINANCE TICKER HOOK
// Fetches ticker data from Supabase (CoinGecko data)
// Binance WebSocket disabled due to geo-blocking
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CryptoPrice } from '@/lib/crypto'

// ============================================
// TYPES
// ============================================

interface UseBinanceTickerOptions {
  enabled?: boolean
  throttleMs?: number      // Refresh interval in ms (default: 5000)
  pair?: string            // Quote currency (default: 'USDT')
}

interface UseBinanceTickerResult {
  ticker: CryptoPrice | null
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
}

// Database row type
interface CryptoPriceRow {
  symbol: string
  price: string
  change: string | null
  change_percent: string | null
  open_24h: string | null
  high_24h: string | null
  low_24h: string | null
  volume_24h: string | null
  quote_volume_24h: string | null
  bid: string | null
  ask: string | null
  trades_24h: number | null
  data_source: string | null
  tier: number | null
  updated_at: string
}

// ============================================
// HOOK: useBinanceTicker
// Fetches from Supabase crypto_prices table
// ============================================

export function useBinanceTicker(
  symbol: string | null,
  options: UseBinanceTickerOptions = {}
): UseBinanceTickerResult {
  const {
    enabled = true,
    throttleMs = 5000,
  } = options

  const [ticker, setTicker] = useState<CryptoPrice | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const normalizedSymbol = useMemo(() => {
    if (!symbol) return null
    return symbol.toUpperCase()
  }, [symbol])

  // Fetch ticker from Supabase
  const fetchTicker = useCallback(async () => {
    if (!enabled || !normalizedSymbol) {
      return
    }

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('crypto_prices')
        .select('*')
        .eq('symbol', normalizedSymbol)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No data found
          setError(`No data for ${normalizedSymbol}`)
          return
        }
        throw fetchError
      }

      if (data) {
        const row = data as CryptoPriceRow
        setTicker({
          symbol: row.symbol,
          price: parseFloat(row.price),
          change: parseFloat(row.change || '0'),
          changePercent: parseFloat(row.change_percent || '0'),
          open24h: parseFloat(row.open_24h || '0'),
          high24h: parseFloat(row.high_24h || '0'),
          low24h: parseFloat(row.low_24h || '0'),
          volume24h: parseFloat(row.volume_24h || '0'),
          quoteVolume24h: parseFloat(row.quote_volume_24h || '0'),
          bid: parseFloat(row.bid || '0'),
          ask: parseFloat(row.ask || '0'),
          trades24h: row.trades_24h ?? undefined,
          dataSource: (row.data_source as 'BINANCE' | 'COINGECKO' | 'CACHE') || 'CACHE',
          tier: row.tier || 2,
          updatedAt: new Date(row.updated_at),
        })
        setLastUpdate(new Date())
        setError(null)
      }
    } catch (err) {
      console.error('[useBinanceTicker] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch ticker')
    }
  }, [enabled, normalizedSymbol])

  // Initial fetch
  useEffect(() => {
    fetchTicker()
  }, [fetchTicker])

  // Periodic refresh
  useEffect(() => {
    if (!enabled || !normalizedSymbol) return

    const interval = setInterval(fetchTicker, throttleMs)
    return () => clearInterval(interval)
  }, [enabled, normalizedSymbol, throttleMs, fetchTicker])

  return {
    ticker,
    isConnected: ticker !== null, // "Connected" if we have data
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
  const { ticker, isConnected, lastUpdate } = useBinanceTicker(symbol, options)

  const miniTicker = useMemo(() => {
    if (!ticker) return null
    return {
      symbol: ticker.symbol,
      price: ticker.price,
      volume: ticker.volume24h,
    }
  }, [ticker])

  return {
    ticker: miniTicker,
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
    throttleMs = 5000,
  } = options

  const [tickers, setTickers] = useState<Map<string, CryptoPrice>>(new Map())
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const normalizedSymbols = useMemo(() => {
    return symbols.map(s => s.toUpperCase())
  }, [symbols.join(',')])

  const fetchTickers = useCallback(async () => {
    if (!enabled || normalizedSymbols.length === 0) {
      return
    }

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('crypto_prices')
        .select('*')
        .in('symbol', normalizedSymbols)

      if (fetchError) throw fetchError

      const tickerMap = new Map<string, CryptoPrice>()
      data?.forEach((row: CryptoPriceRow) => {
        tickerMap.set(row.symbol, {
          symbol: row.symbol,
          price: parseFloat(row.price),
          change: parseFloat(row.change || '0'),
          changePercent: parseFloat(row.change_percent || '0'),
          open24h: parseFloat(row.open_24h || '0'),
          high24h: parseFloat(row.high_24h || '0'),
          low24h: parseFloat(row.low_24h || '0'),
          volume24h: parseFloat(row.volume_24h || '0'),
          quoteVolume24h: parseFloat(row.quote_volume_24h || '0'),
          bid: parseFloat(row.bid || '0'),
          ask: parseFloat(row.ask || '0'),
          trades24h: row.trades_24h ?? undefined,
          dataSource: (row.data_source as 'BINANCE' | 'COINGECKO' | 'CACHE') || 'CACHE',
          tier: row.tier || 2,
          updatedAt: new Date(row.updated_at),
        })
      })

      setTickers(tickerMap)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('[useMultipleBinanceTickers] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tickers')
    }
  }, [enabled, normalizedSymbols])

  // Initial fetch
  useEffect(() => {
    fetchTickers()
  }, [fetchTickers])

  // Periodic refresh
  useEffect(() => {
    if (!enabled || normalizedSymbols.length === 0) return

    const interval = setInterval(fetchTickers, throttleMs)
    return () => clearInterval(interval)
  }, [enabled, normalizedSymbols, throttleMs, fetchTickers])

  return {
    tickers,
    isConnected: tickers.size > 0,
    lastUpdate,
    error,
  }
}

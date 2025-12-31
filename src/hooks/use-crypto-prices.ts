'use client'

// ============================================
// USE CRYPTO PRICES HOOK
// Fetch and subscribe to crypto prices from Supabase
// Pattern: Same as useRealtimeStockPrices
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { CryptoPrice } from '@/lib/crypto/types'

// ============================================
// TYPES
// ============================================

// Database row type for crypto_prices table
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
  vwap: string | null
  trades_24h: number | null
  data_source: string | null
  tier: number | null
  updated_at: string
}

interface UseCryptoPricesOptions {
  enabled?: boolean
  realtime?: boolean
  refreshInterval?: number  // ms, for manual polling fallback
}

interface UseCryptoPricesResult {
  prices: Map<string, CryptoPrice>
  isLoading: boolean
  error: string | null
  isRealtimeConnected: boolean
  lastUpdate: Date | null
  refetch: () => Promise<void>
}

// ============================================
// HOOK: useCryptoPrices
// ============================================

export function useCryptoPrices(
  symbols: string[],
  options: UseCryptoPricesOptions = {}
): UseCryptoPricesResult {
  const {
    enabled = true,
    realtime = true,
    refreshInterval,
  } = options

  const [prices, setPrices] = useState<Map<string, CryptoPrice>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const symbolsKey = symbols.sort().join(',')

  // Fetch prices from Supabase
  const fetchPrices = useCallback(async () => {
    if (!enabled || symbols.length === 0) {
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('crypto_prices')
        .select('*')
        .in('symbol', symbols)

      if (fetchError) throw fetchError

      const priceMap = new Map<string, CryptoPrice>()
      data?.forEach((row: CryptoPriceRow) => {
        priceMap.set(row.symbol, {
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
          vwap: parseFloat(row.vwap || '0'),
          trades24h: row.trades_24h ?? undefined,
          dataSource: (row.data_source as 'BINANCE' | 'CACHE') || 'CACHE',
          tier: row.tier || 2,
          updatedAt: new Date(row.updated_at),
        })
      })

      setPrices(priceMap)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('[useCryptoPrices] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setIsLoading(false)
    }
  }, [enabled, symbolsKey])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled || !realtime || symbols.length === 0) return

    const supabase = createClient()

    const channel = supabase
      .channel('crypto-prices-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_prices',
        },
        (payload: RealtimePostgresChangesPayload<CryptoPriceRow>) => {
          const row = payload.new as CryptoPriceRow | null
          if (!row || !row.symbol) return
          if (!symbols.includes(row.symbol)) return

          const newPrice: CryptoPrice = {
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
            vwap: parseFloat(row.vwap || '0'),
            trades24h: row.trades_24h ?? undefined,
            dataSource: 'BINANCE',
            tier: row.tier || 2,
            updatedAt: new Date(),
          }

          setPrices((prev) => {
            const newMap = new Map(prev)
            newMap.set(row.symbol, newPrice)
            return newMap
          })
          setLastUpdate(new Date())
        }
      )
      .subscribe((status: string) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, realtime, symbolsKey])

  // Initial fetch
  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Optional polling fallback
  useEffect(() => {
    if (!enabled || !refreshInterval) return

    const interval = setInterval(fetchPrices, refreshInterval)
    return () => clearInterval(interval)
  }, [enabled, refreshInterval, fetchPrices])

  return {
    prices,
    isLoading,
    error,
    isRealtimeConnected,
    lastUpdate,
    refetch: fetchPrices,
  }
}

// ============================================
// HOOK: useCryptoPrice (single symbol)
// ============================================

export function useCryptoPrice(
  symbol: string | null,
  options: Omit<UseCryptoPricesOptions, 'symbols'> = {}
): {
  price: CryptoPrice | null
  isLoading: boolean
  error: string | null
  isRealtimeConnected: boolean
  lastUpdate: Date | null
  refetch: () => Promise<void>
} {
  const symbols = symbol ? [symbol] : []
  const result = useCryptoPrices(symbols, options)

  return {
    price: symbol ? result.prices.get(symbol) || null : null,
    isLoading: result.isLoading,
    error: result.error,
    isRealtimeConnected: result.isRealtimeConnected,
    lastUpdate: result.lastUpdate,
    refetch: result.refetch,
  }
}

// ============================================
// HOOK: useAllCryptoPrices
// ============================================

export function useAllCryptoPrices(
  options: Omit<UseCryptoPricesOptions, 'symbols'> = {}
): UseCryptoPricesResult & { count: number } {
  const {
    enabled = true,
    realtime = true,
    refreshInterval,
  } = options

  const [prices, setPrices] = useState<Map<string, CryptoPrice>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchPrices = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('crypto_prices')
        .select('*')
        .order('tier', { ascending: true })

      if (fetchError) throw fetchError

      const priceMap = new Map<string, CryptoPrice>()
      data?.forEach((row: CryptoPriceRow) => {
        priceMap.set(row.symbol, {
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
          vwap: parseFloat(row.vwap || '0'),
          trades24h: row.trades_24h ?? undefined,
          dataSource: (row.data_source as 'BINANCE' | 'CACHE') || 'CACHE',
          tier: row.tier || 2,
          updatedAt: new Date(row.updated_at),
        })
      })

      setPrices(priceMap)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('[useAllCryptoPrices] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  // Subscribe to all crypto price updates
  useEffect(() => {
    if (!enabled || !realtime) return

    const supabase = createClient()

    const channel = supabase
      .channel('all-crypto-prices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_prices',
        },
        (payload: RealtimePostgresChangesPayload<CryptoPriceRow>) => {
          const row = payload.new as CryptoPriceRow | null
          if (!row || !row.symbol) return

          const newPrice: CryptoPrice = {
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
            vwap: parseFloat(row.vwap || '0'),
            trades24h: row.trades_24h ?? undefined,
            dataSource: 'BINANCE',
            tier: row.tier || 2,
            updatedAt: new Date(),
          }

          setPrices((prev) => {
            const newMap = new Map(prev)
            newMap.set(newPrice.symbol, newPrice)
            return newMap
          })
          setLastUpdate(new Date())
        }
      )
      .subscribe((status: string) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, realtime])

  // Initial fetch
  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Optional polling
  useEffect(() => {
    if (!enabled || !refreshInterval) return

    const interval = setInterval(fetchPrices, refreshInterval)
    return () => clearInterval(interval)
  }, [enabled, refreshInterval, fetchPrices])

  return {
    prices,
    count: prices.size,
    isLoading,
    error,
    isRealtimeConnected,
    lastUpdate,
    refetch: fetchPrices,
  }
}

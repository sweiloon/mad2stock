"use client"

/**
 * Real-time stock price hooks using Supabase Real-Time
 *
 * These hooks subscribe to database changes instead of polling,
 * providing instant updates when the cron job updates prices.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeStockPrice {
  stock_code: string
  price: number
  change: number
  change_percent: number
  previous_close: number
  open: number
  high: number
  low: number
  volume: number
  updated_at: string
}

interface UseRealtimeStockPriceOptions {
  /** Enable real-time subscription (default: true) */
  enabled?: boolean
  /** Callback when price updates */
  onUpdate?: (price: RealtimeStockPrice) => void
}

/**
 * Hook for real-time updates of a single stock price
 * Subscribes to postgres_changes on stock_prices table
 */
export function useRealtimeStockPrice(
  stockCode: string | null,
  options: UseRealtimeStockPriceOptions = {}
) {
  const { enabled = true, onUpdate } = options
  const [price, setPrice] = useState<RealtimeStockPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch initial price
  const fetchInitialPrice = useCallback(async () => {
    if (!stockCode) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('stock_prices')
        .select('*')
        .eq('stock_code', stockCode.toUpperCase())
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        const priceData: RealtimeStockPrice = {
          stock_code: data.stock_code,
          price: data.price,
          change: data.change || 0,
          change_percent: data.change_percent || 0,
          previous_close: data.previous_close || data.price,
          open: data.open || data.price,
          high: data.high || data.price,
          low: data.low || data.price,
          volume: data.volume || 0,
          updated_at: data.updated_at,
        }
        setPrice(priceData)
      }
      setError(null)
    } catch (err) {
      console.error('[useRealtimeStockPrice] Error fetching initial price:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch price')
    } finally {
      setLoading(false)
    }
  }, [stockCode])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!stockCode || !enabled) {
      return
    }

    // Fetch initial data
    fetchInitialPrice()

    // Set up real-time subscription
    const supabase = createClient()
    const channelName = `stock-price-${stockCode.toUpperCase()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'stock_prices',
          filter: `stock_code=eq.${stockCode.toUpperCase()}`,
        },
        (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          console.log(`[Realtime] Stock price update for ${stockCode}:`, payload.eventType)

          if (payload.eventType === 'DELETE') {
            setPrice(null)
            return
          }

          const newData = payload.new
          if (!newData) return

          const priceData: RealtimeStockPrice = {
            stock_code: newData.stock_code as string,
            price: newData.price as number,
            change: (newData.change as number) || 0,
            change_percent: (newData.change_percent as number) || 0,
            previous_close: (newData.previous_close as number) || (newData.price as number),
            open: (newData.open as number) || (newData.price as number),
            high: (newData.high as number) || (newData.price as number),
            low: (newData.low as number) || (newData.price as number),
            volume: (newData.volume as number) || 0,
            updated_at: newData.updated_at as string,
          }

          setPrice(priceData)
          onUpdate?.(priceData)
        }
      )
      .subscribe((status: string) => {
        console.log(`[Realtime] Subscription status for ${stockCode}:`, status)
      })

    channelRef.current = channel

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from ${stockCode}`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [stockCode, enabled, fetchInitialPrice, onUpdate])

  return {
    price,
    loading,
    error,
    refetch: fetchInitialPrice,
    isSubscribed: !!channelRef.current,
  }
}

/**
 * Hook for real-time updates of multiple stock prices
 * Subscribes to postgres_changes on stock_prices table for all specified stocks
 */
export function useRealtimeStockPrices(
  stockCodes: string[],
  options: { enabled?: boolean; onUpdate?: (prices: Map<string, RealtimeStockPrice>) => void } = {}
) {
  const { enabled = true, onUpdate } = options
  const [prices, setPrices] = useState<Map<string, RealtimeStockPrice>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Serialize stock codes for dependency tracking
  const stockCodesKey = stockCodes.map(c => c.toUpperCase()).sort().join(',')

  // Fetch initial prices
  const fetchInitialPrices = useCallback(async () => {
    if (stockCodes.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      const upperCodes = stockCodes.map(c => c.toUpperCase())

      const { data, error: fetchError } = await supabase
        .from('stock_prices')
        .select('*')
        .in('stock_code', upperCodes)

      if (fetchError) {
        throw fetchError
      }

      const priceMap = new Map<string, RealtimeStockPrice>()

      data?.forEach((item: Record<string, unknown>) => {
        priceMap.set(item.stock_code as string, {
          stock_code: item.stock_code as string,
          price: item.price as number,
          change: (item.change as number) || 0,
          change_percent: (item.change_percent as number) || 0,
          previous_close: (item.previous_close as number) || (item.price as number),
          open: (item.open as number) || (item.price as number),
          high: (item.high as number) || (item.price as number),
          low: (item.low as number) || (item.price as number),
          volume: (item.volume as number) || 0,
          updated_at: item.updated_at as string,
        })
      })

      setPrices(priceMap)
      setError(null)
    } catch (err) {
      console.error('[useRealtimeStockPrices] Error fetching initial prices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }, [stockCodesKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to real-time updates
  useEffect(() => {
    if (stockCodes.length === 0 || !enabled) {
      return
    }

    // Fetch initial data
    fetchInitialPrices()

    // Set up real-time subscription
    const supabase = createClient()
    const upperCodes = new Set(stockCodes.map(c => c.toUpperCase()))

    // Subscribe to all stock_prices changes and filter client-side
    const channel = supabase
      .channel('stock-prices-batch')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_prices',
        },
        (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          const stockCode = payload.new?.stock_code as string | undefined
            || payload.old?.stock_code as string | undefined

          // Filter to only our subscribed stocks
          if (!stockCode || !upperCodes.has(stockCode)) {
            return
          }

          console.log(`[Realtime] Batch price update for ${stockCode}:`, payload.eventType)

          setPrices((prev) => {
            const newMap = new Map(prev)

            if (payload.eventType === 'DELETE') {
              newMap.delete(stockCode)
            } else {
              const newData = payload.new
              if (!newData) return prev
              newMap.set(stockCode, {
                stock_code: newData.stock_code as string,
                price: newData.price as number,
                change: (newData.change as number) || 0,
                change_percent: (newData.change_percent as number) || 0,
                previous_close: (newData.previous_close as number) || (newData.price as number),
                open: (newData.open as number) || (newData.price as number),
                high: (newData.high as number) || (newData.price as number),
                low: (newData.low as number) || (newData.price as number),
                volume: (newData.volume as number) || 0,
                updated_at: newData.updated_at as string,
              })
            }

            onUpdate?.(newMap)
            return newMap
          })
        }
      )
      .subscribe((status: string) => {
        console.log('[Realtime] Batch subscription status:', status)
      })

    channelRef.current = channel

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log('[Realtime] Unsubscribing from batch prices')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [stockCodesKey, enabled, fetchInitialPrices, onUpdate]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    prices,
    loading,
    error,
    refetch: fetchInitialPrices,
    isSubscribed: !!channelRef.current,
    // Helper to get a single price
    getPrice: (code: string) => prices.get(code.toUpperCase()) || null,
  }
}

/**
 * Hook to subscribe to ALL stock price updates
 * Useful for dashboard/overview pages that show many stocks
 */
export function useRealtimeAllStockPrices(
  options: { enabled?: boolean; onUpdate?: (stockCode: string, price: RealtimeStockPrice) => void } = {}
) {
  const { enabled = true, onUpdate } = options
  const [prices, setPrices] = useState<Map<string, RealtimeStockPrice>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch initial prices for all stocks
  const fetchAllPrices = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('stock_prices')
        .select('*')
        .order('stock_code', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      const priceMap = new Map<string, RealtimeStockPrice>()

      data?.forEach((item: Record<string, unknown>) => {
        priceMap.set(item.stock_code as string, {
          stock_code: item.stock_code as string,
          price: item.price as number,
          change: (item.change as number) || 0,
          change_percent: (item.change_percent as number) || 0,
          previous_close: (item.previous_close as number) || (item.price as number),
          open: (item.open as number) || (item.price as number),
          high: (item.high as number) || (item.price as number),
          low: (item.low as number) || (item.price as number),
          volume: (item.volume as number) || 0,
          updated_at: item.updated_at as string,
        })
      })

      setPrices(priceMap)
      setError(null)
      console.log(`[Realtime] Loaded ${priceMap.size} initial stock prices`)
    } catch (err) {
      console.error('[useRealtimeAllStockPrices] Error fetching prices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled) {
      return
    }

    // Fetch initial data
    fetchAllPrices()

    // Set up real-time subscription for ALL price changes
    const supabase = createClient()

    const channel = supabase
      .channel('all-stock-prices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_prices',
        },
        (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          const stockCode = payload.new?.stock_code as string | undefined
            || payload.old?.stock_code as string | undefined

          if (!stockCode) return

          console.log(`[Realtime] Price update: ${stockCode}`, payload.eventType)

          setPrices((prev) => {
            const newMap = new Map(prev)

            if (payload.eventType === 'DELETE') {
              newMap.delete(stockCode)
            } else {
              const newData = payload.new
              if (!newData) return prev
              const priceData: RealtimeStockPrice = {
                stock_code: newData.stock_code as string,
                price: newData.price as number,
                change: (newData.change as number) || 0,
                change_percent: (newData.change_percent as number) || 0,
                previous_close: (newData.previous_close as number) || (newData.price as number),
                open: (newData.open as number) || (newData.price as number),
                high: (newData.high as number) || (newData.price as number),
                low: (newData.low as number) || (newData.price as number),
                volume: (newData.volume as number) || 0,
                updated_at: newData.updated_at as string,
              }
              newMap.set(stockCode, priceData)
              onUpdate?.(stockCode, priceData)
            }

            return newMap
          })

          setLastUpdate(new Date())
        }
      )
      .subscribe((status: string) => {
        console.log('[Realtime] All prices subscription status:', status)
      })

    channelRef.current = channel

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log('[Realtime] Unsubscribing from all prices')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, fetchAllPrices, onUpdate])

  return {
    prices,
    loading,
    error,
    lastUpdate,
    refetch: fetchAllPrices,
    isSubscribed: !!channelRef.current,
    // Helper to get a single price
    getPrice: (code: string) => prices.get(code.toUpperCase()) || null,
    // Get count of tracked prices
    count: prices.size,
  }
}

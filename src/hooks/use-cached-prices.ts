'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface CachedStockPrice {
  stockCode: string
  price: number | null
  change: number | null
  changePercent: number | null
  previousClose: number | null
  dayOpen: number | null
  dayHigh: number | null
  dayLow: number | null
  volume: number | null
  dataSource: 'klsescreener' | 'yahoo' | 'live' | null
  scrapeStatus: 'success' | 'failed' | null
  updatedAt: Date | null
  isStale: boolean // true if data is older than 35 minutes
  staleness: 'fresh' | 'stale' | 'very-stale' // fresh < 30min, stale 30-60min, very-stale > 60min
}

const STALE_THRESHOLD = 35 * 60 * 1000 // 35 minutes
const VERY_STALE_THRESHOLD = 60 * 60 * 1000 // 60 minutes

function calculateStaleness(updatedAt: Date | null): { isStale: boolean; staleness: 'fresh' | 'stale' | 'very-stale' } {
  if (!updatedAt) {
    return { isStale: true, staleness: 'very-stale' }
  }

  const age = Date.now() - updatedAt.getTime()

  if (age > VERY_STALE_THRESHOLD) {
    return { isStale: true, staleness: 'very-stale' }
  }
  if (age > STALE_THRESHOLD) {
    return { isStale: true, staleness: 'stale' }
  }
  return { isStale: false, staleness: 'fresh' }
}

// Fallback to live API when cached data is unavailable
async function fetchLivePrice(stockCode: string): Promise<CachedStockPrice | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`/api/stocks/quote?symbols=${encodeURIComponent(stockCode)}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const result = await response.json()

    if (result.quote) {
      return {
        stockCode,
        price: result.quote.price || null,
        change: result.quote.change || null,
        changePercent: result.quote.changePercent || null,
        previousClose: result.quote.previousClose || null,
        dayOpen: result.quote.dayOpen || null,
        dayHigh: result.quote.dayHigh || null,
        dayLow: result.quote.dayLow || null,
        volume: result.quote.volume || null,
        dataSource: 'live',
        scrapeStatus: 'success',
        updatedAt: new Date(),
        isStale: false,
        staleness: 'fresh',
      }
    }
    return null
  } catch (err) {
    console.error('Live price fetch failed:', err)
    return null
  }
}

interface UseCachedStockPriceOptions {
  /** Enable real-time price updates via Supabase (default: true) */
  realtime?: boolean
}

export function useCachedStockPrice(stockCode: string | undefined, options: UseCachedStockPriceOptions = {}) {
  const { realtime = true } = options
  const [data, setData] = useState<CachedStockPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const mountedRef = useRef(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchPrice = useCallback(async () => {
    if (!stockCode) {
      setLoading(false)
      setData(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // First, try to fetch from cache
      let cachedData: CachedStockPrice | null = null

      try {
        const supabase = createClient()
        const { data: priceData, error: fetchError } = await supabase
          .from('stock_prices')
          .select('*')
          .eq('stock_code', stockCode)
          .single()

        if (!fetchError && priceData) {
          const updatedAt = priceData.updated_at ? new Date(priceData.updated_at) : null
          const { isStale, staleness } = calculateStaleness(updatedAt)

          cachedData = {
            stockCode: priceData.stock_code,
            price: priceData.price,
            change: priceData.change,
            changePercent: priceData.change_percent,
            previousClose: priceData.previous_close,
            dayOpen: priceData.day_open,
            dayHigh: priceData.day_high,
            dayLow: priceData.day_low,
            volume: priceData.volume,
            dataSource: priceData.data_source as 'klsescreener' | 'yahoo' | null,
            scrapeStatus: priceData.scrape_status as 'success' | 'failed' | null,
            updatedAt,
            isStale,
            staleness,
          }
        }
      } catch {
        // Cache fetch failed (table doesn't exist, etc.) - continue to live fallback
        console.log('Cache unavailable, falling back to live fetch')
      }

      if (!mountedRef.current) return

      // If we have cached data with a valid price, use it
      if (cachedData && cachedData.price !== null) {
        setData(cachedData)
        setLoading(false)
        return
      }

      // Fallback to live scraping
      console.log('No cached data, fetching live price for:', stockCode)
      const liveData = await fetchLivePrice(stockCode)

      if (!mountedRef.current) return

      if (liveData) {
        setData(liveData)
      } else {
        setData(null)
        setError('Unable to fetch price data')
      }
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Error fetching price:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch price')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [stockCode])

  useEffect(() => {
    // Small delay to prevent blocking UI
    const timer = setTimeout(fetchPrice, 100)
    return () => clearTimeout(timer)
  }, [fetchPrice])

  // Real-time subscription for price updates
  useEffect(() => {
    if (!stockCode || !realtime) {
      return
    }

    const supabase = createClient()
    const channelName = `stock-price-${stockCode}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_prices',
          filter: `stock_code=eq.${stockCode}`,
        },
        (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          if (payload.eventType === 'DELETE') {
            setData(null)
            return
          }

          const priceData = payload.new as Record<string, unknown>
          if (!priceData) return

          const updatedAt = priceData.updated_at ? new Date(priceData.updated_at as string) : new Date()
          const { isStale, staleness } = calculateStaleness(updatedAt)

          console.log(`[Realtime] Price update for ${stockCode}:`, priceData.price)

          setData({
            stockCode: priceData.stock_code as string,
            price: priceData.price as number | null,
            change: priceData.change as number | null,
            changePercent: priceData.change_percent as number | null,
            previousClose: priceData.previous_close as number | null,
            dayOpen: priceData.day_open as number | null,
            dayHigh: priceData.day_high as number | null,
            dayLow: priceData.day_low as number | null,
            volume: priceData.volume as number | null,
            dataSource: priceData.data_source as 'klsescreener' | 'yahoo' | null,
            scrapeStatus: priceData.scrape_status as 'success' | 'failed' | null,
            updatedAt,
            isStale,
            staleness,
          })
        }
      )
      .subscribe((status: string) => {
        console.log(`[Realtime] Stock ${stockCode} subscription:`, status)
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from ${stockCode}`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsRealtimeConnected(false)
      }
    }
  }, [stockCode, realtime])

  return { data, loading, error, refetch: fetchPrice, isRealtimeConnected }
}

// Hook to fetch multiple cached prices at once
export function useCachedStockPrices(stockCodes: string[]) {
  const [data, setData] = useState<Record<string, CachedStockPrice>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!stockCodes.length) {
      setLoading(false)
      setData({})
      return
    }

    const fetchCachedPrices = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { data: pricesData, error: fetchError } = await supabase
          .from('stock_prices')
          .select('*')
          .in('stock_code', stockCodes)

        if (!mountedRef.current) return

        if (fetchError) {
          throw fetchError
        }

        const priceMap: Record<string, CachedStockPrice> = {}

        if (pricesData) {
          for (const priceData of pricesData) {
            const updatedAt = priceData.updated_at ? new Date(priceData.updated_at) : null
            const { isStale, staleness } = calculateStaleness(updatedAt)

            priceMap[priceData.stock_code] = {
              stockCode: priceData.stock_code,
              price: priceData.price,
              change: priceData.change,
              changePercent: priceData.change_percent,
              previousClose: priceData.previous_close,
              dayOpen: priceData.day_open,
              dayHigh: priceData.day_high,
              dayLow: priceData.day_low,
              volume: priceData.volume,
              dataSource: priceData.data_source as 'klsescreener' | 'yahoo' | null,
              scrapeStatus: priceData.scrape_status as 'success' | 'failed' | null,
              updatedAt,
              isStale,
              staleness,
            }
          }
        }

        setData(priceMap)
      } catch (err) {
        if (!mountedRef.current) return
        console.error('Error fetching cached prices:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch cached prices')
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    const timer = setTimeout(fetchCachedPrices, 50)
    return () => clearTimeout(timer)
  }, [stockCodes.join(',')])

  return { data, loading, error }
}

// Function to format the last updated time
export function formatLastUpdated(date: Date | null): string {
  if (!date) return 'Never'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

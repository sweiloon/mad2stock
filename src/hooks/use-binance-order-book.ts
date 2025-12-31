'use client'

// ============================================
// USE BINANCE ORDER BOOK HOOK
// Real-time order book via WebSocket
// For coin profile trading view
// ============================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  binanceWs,
  OrderBookManager,
  type OrderBook,
  type OrderBookLevel,
} from '@/lib/crypto'

// ============================================
// TYPES
// ============================================

interface UseBinanceOrderBookOptions {
  enabled?: boolean
  levels?: number           // Number of levels to display (default: 20)
  pair?: string             // Quote currency (default: 'USDT')
  aggregation?: number      // Price aggregation (optional)
}

interface UseBinanceOrderBookResult {
  orderBook: OrderBook | null
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  spread: number
  spreadPercent: number
  midPrice: number
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
}

// ============================================
// HOOK: useBinanceOrderBook
// ============================================

export function useBinanceOrderBook(
  symbol: string | null,
  options: UseBinanceOrderBookOptions = {}
): UseBinanceOrderBookResult {
  const {
    enabled = true,
    levels = 20,
    pair = 'USDT',
  } = options

  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const orderBookManagerRef = useRef<OrderBookManager | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Build the pair symbol
  const pairSymbol = useMemo(() => {
    if (!symbol) return null
    return `${symbol.toUpperCase()}${pair.toUpperCase()}`
  }, [symbol, pair])

  // Calculate derived values
  const derivedValues = useMemo(() => {
    if (!orderBook) {
      return {
        bids: [],
        asks: [],
        spread: 0,
        spreadPercent: 0,
        midPrice: 0,
      }
    }

    const bids = orderBook.bids.slice(0, levels)
    const asks = orderBook.asks.slice(0, levels)

    const bestBid = bids[0]?.price || 0
    const bestAsk = asks[0]?.price || 0

    const spread = bestAsk - bestBid
    const midPrice = (bestBid + bestAsk) / 2
    const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0

    return {
      bids,
      asks,
      spread,
      spreadPercent,
      midPrice,
    }
  }, [orderBook, levels])

  useEffect(() => {
    if (!enabled || !pairSymbol) {
      setOrderBook(null)
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

        // Create order book manager for this symbol
        orderBookManagerRef.current = new OrderBookManager(pairSymbol)

        // Subscribe to depth stream
        unsubscribeRef.current = binanceWs.subscribeToDepth(
          pairSymbol,
          (update) => {
            if (!isMounted || !orderBookManagerRef.current) return

            // Process update through manager
            orderBookManagerRef.current.update(update)

            // Get current state
            const currentBook = orderBookManagerRef.current.getOrderBook()
            setOrderBook(currentBook)
            setLastUpdate(new Date())
          }
        )
      } catch (err) {
        if (!isMounted) return
        console.error('[useBinanceOrderBook] Connection error:', err)
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

      orderBookManagerRef.current = null
    }
  }, [enabled, pairSymbol])

  return {
    orderBook,
    ...derivedValues,
    isConnected,
    lastUpdate,
    error,
  }
}

// ============================================
// HOOK: useOrderBookDepth (aggregated view)
// ============================================

interface DepthLevel {
  price: number
  quantity: number
  total: number
  percentage: number
}

interface UseOrderBookDepthResult {
  bids: DepthLevel[]
  asks: DepthLevel[]
  maxTotal: number
  isConnected: boolean
}

export function useOrderBookDepth(
  symbol: string | null,
  options: UseBinanceOrderBookOptions & {
    aggregateBy?: number  // Price aggregation step
  } = {}
): UseOrderBookDepthResult {
  const {
    enabled = true,
    levels = 20,
    pair = 'USDT',
    aggregateBy,
  } = options

  const { bids, asks, isConnected } = useBinanceOrderBook(symbol, {
    enabled,
    levels: levels * 2, // Fetch more for aggregation
    pair,
  })

  // Aggregate and calculate depth
  const depth = useMemo(() => {
    const aggregateLevels = (
      levels: OrderBookLevel[],
      step?: number
    ): DepthLevel[] => {
      if (!step) {
        // No aggregation - just add running total
        let runningTotal = 0
        return levels.map(level => {
          runningTotal += level.quantity
          return {
            price: level.price,
            quantity: level.quantity,
            total: runningTotal,
            percentage: 0, // Will be calculated after
          }
        })
      }

      // Aggregate by price step
      const aggregated = new Map<number, number>()

      levels.forEach(level => {
        const aggregatedPrice = Math.floor(level.price / step) * step
        const current = aggregated.get(aggregatedPrice) || 0
        aggregated.set(aggregatedPrice, current + level.quantity)
      })

      // Convert to array and sort
      const sorted = Array.from(aggregated.entries())
        .sort((a, b) => b[0] - a[0]) // Descending for bids
        .slice(0, options.levels || 20)

      // Calculate running totals
      let runningTotal = 0
      return sorted.map(([price, quantity]) => {
        runningTotal += quantity
        return {
          price,
          quantity,
          total: runningTotal,
          percentage: 0,
        }
      })
    }

    const processedBids = aggregateLevels(bids, aggregateBy)
    const processedAsks = aggregateLevels(
      [...asks].sort((a, b) => a.price - b.price),
      aggregateBy
    ).reverse()

    // Find max total for percentage calculation
    const maxBidTotal = processedBids[processedBids.length - 1]?.total || 0
    const maxAskTotal = processedAsks[0]?.total || 0
    const maxTotal = Math.max(maxBidTotal, maxAskTotal)

    // Calculate percentages
    processedBids.forEach(level => {
      level.percentage = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0
    })

    processedAsks.forEach(level => {
      level.percentage = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0
    })

    return {
      bids: processedBids,
      asks: processedAsks,
      maxTotal,
    }
  }, [bids, asks, aggregateBy, options.levels])

  return {
    ...depth,
    isConnected,
  }
}

// ============================================
// HOOK: useOrderBookImbalance
// ============================================

interface UseOrderBookImbalanceResult {
  imbalance: number       // -1 to 1 (negative = more sells, positive = more buys)
  buyPressure: number     // Total bid volume
  sellPressure: number    // Total ask volume
  ratio: number           // Buy/Sell ratio
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'
}

export function useOrderBookImbalance(
  symbol: string | null,
  options: UseBinanceOrderBookOptions = {}
): UseOrderBookImbalanceResult {
  const { bids, asks } = useBinanceOrderBook(symbol, options)

  return useMemo(() => {
    const buyPressure = bids.reduce((sum, level) => sum + level.quantity * level.price, 0)
    const sellPressure = asks.reduce((sum, level) => sum + level.quantity * level.price, 0)

    const total = buyPressure + sellPressure
    const imbalance = total > 0 ? (buyPressure - sellPressure) / total : 0
    const ratio = sellPressure > 0 ? buyPressure / sellPressure : 1

    let signal: UseOrderBookImbalanceResult['signal'] = 'NEUTRAL'
    if (imbalance > 0.3) signal = 'STRONG_BUY'
    else if (imbalance > 0.1) signal = 'BUY'
    else if (imbalance < -0.3) signal = 'STRONG_SELL'
    else if (imbalance < -0.1) signal = 'SELL'

    return {
      imbalance,
      buyPressure,
      sellPressure,
      ratio,
      signal,
    }
  }, [bids, asks])
}

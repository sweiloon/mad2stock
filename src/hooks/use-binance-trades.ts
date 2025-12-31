'use client'

// ============================================
// USE BINANCE TRADES HOOK
// Real-time trade stream via WebSocket
// For coin profile trading view
// ============================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  binanceWs,
  TradeBuffer,
  type Trade,
} from '@/lib/crypto'

// ============================================
// TYPES
// ============================================

interface UseBinanceTradesOptions {
  enabled?: boolean
  maxTrades?: number        // Maximum trades to keep in buffer (default: 50)
  pair?: string             // Quote currency (default: 'USDT')
}

interface UseBinanceTradesResult {
  trades: Trade[]
  lastTrade: Trade | null
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
  stats: TradeStats
}

interface TradeStats {
  buyVolume: number
  sellVolume: number
  buyCount: number
  sellCount: number
  avgPrice: number
  vwap: number              // Volume Weighted Average Price
  largestTrade: Trade | null
}

// ============================================
// HOOK: useBinanceTrades
// ============================================

export function useBinanceTrades(
  symbol: string | null,
  options: UseBinanceTradesOptions = {}
): UseBinanceTradesResult {
  const {
    enabled = true,
    maxTrades = 50,
    pair = 'USDT',
  } = options

  const [trades, setTrades] = useState<Trade[]>([])
  const [lastTrade, setLastTrade] = useState<Trade | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tradeBufferRef = useRef<TradeBuffer | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Build the pair symbol
  const pairSymbol = useMemo(() => {
    if (!symbol) return null
    return `${symbol.toUpperCase()}${pair.toUpperCase()}`
  }, [symbol, pair])

  // Calculate trade stats
  const stats = useMemo((): TradeStats => {
    if (trades.length === 0) {
      return {
        buyVolume: 0,
        sellVolume: 0,
        buyCount: 0,
        sellCount: 0,
        avgPrice: 0,
        vwap: 0,
        largestTrade: null,
      }
    }

    let buyVolume = 0
    let sellVolume = 0
    let buyCount = 0
    let sellCount = 0
    let totalValue = 0
    let totalVolume = 0
    let largestTrade: Trade | null = null
    let largestValue = 0

    trades.forEach(trade => {
      const value = trade.price * trade.quantity
      totalValue += value
      totalVolume += trade.quantity

      if (!trade.isBuyerMaker) {
        buyVolume += trade.quantity
        buyCount++
      } else {
        sellVolume += trade.quantity
        sellCount++
      }

      if (value > largestValue) {
        largestValue = value
        largestTrade = trade
      }
    })

    return {
      buyVolume,
      sellVolume,
      buyCount,
      sellCount,
      avgPrice: totalVolume > 0 ? totalValue / totalVolume : 0,
      vwap: totalVolume > 0 ? totalValue / totalVolume : 0,
      largestTrade,
    }
  }, [trades])

  useEffect(() => {
    if (!enabled || !pairSymbol) {
      setTrades([])
      setLastTrade(null)
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

        // Create trade buffer
        tradeBufferRef.current = new TradeBuffer(maxTrades)

        // Subscribe to trade stream
        unsubscribeRef.current = binanceWs.subscribeToTrades(
          pairSymbol,
          (trade: Trade) => {
            if (!isMounted || !tradeBufferRef.current) return

            // Add to buffer
            tradeBufferRef.current.push(trade)

            // Update state
            setTrades(tradeBufferRef.current.getAll())
            setLastTrade(trade)
            setLastUpdate(new Date())
          }
        )
      } catch (err) {
        if (!isMounted) return
        console.error('[useBinanceTrades] Connection error:', err)
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

      tradeBufferRef.current = null
    }
  }, [enabled, pairSymbol, maxTrades])

  return {
    trades,
    lastTrade,
    isConnected,
    lastUpdate,
    error,
    stats,
  }
}

// ============================================
// HOOK: useTradeFlow (buy/sell flow analysis)
// ============================================

interface TradeFlowResult {
  buyFlow: number           // Recent buy volume
  sellFlow: number          // Recent sell volume
  netFlow: number           // Buy - Sell (positive = buying pressure)
  flowRatio: number         // Buy/Sell ratio
  trend: 'BUYING' | 'SELLING' | 'NEUTRAL'
  intensity: 'HIGH' | 'MEDIUM' | 'LOW'
}

export function useTradeFlow(
  symbol: string | null,
  options: UseBinanceTradesOptions & {
    windowMs?: number       // Analysis window in ms (default: 60000 = 1 min)
  } = {}
): TradeFlowResult {
  const { windowMs = 60000, ...tradeOptions } = options
  const { trades } = useBinanceTrades(symbol, tradeOptions)

  return useMemo(() => {
    const now = Date.now()
    const windowStart = now - windowMs

    // Filter trades within window
    const recentTrades = trades.filter(t => t.time.getTime() > windowStart)

    if (recentTrades.length === 0) {
      return {
        buyFlow: 0,
        sellFlow: 0,
        netFlow: 0,
        flowRatio: 1,
        trend: 'NEUTRAL',
        intensity: 'LOW',
      }
    }

    let buyFlow = 0
    let sellFlow = 0

    recentTrades.forEach(trade => {
      const value = trade.price * trade.quantity
      if (!trade.isBuyerMaker) {
        buyFlow += value
      } else {
        sellFlow += value
      }
    })

    const netFlow = buyFlow - sellFlow
    const totalFlow = buyFlow + sellFlow
    const flowRatio = sellFlow > 0 ? buyFlow / sellFlow : buyFlow > 0 ? 999 : 1

    // Determine trend
    let trend: TradeFlowResult['trend'] = 'NEUTRAL'
    if (flowRatio > 1.2) trend = 'BUYING'
    else if (flowRatio < 0.8) trend = 'SELLING'

    // Determine intensity based on trade count
    let intensity: TradeFlowResult['intensity'] = 'LOW'
    const tradesPerMinute = (recentTrades.length / windowMs) * 60000
    if (tradesPerMinute > 100) intensity = 'HIGH'
    else if (tradesPerMinute > 30) intensity = 'MEDIUM'

    return {
      buyFlow,
      sellFlow,
      netFlow,
      flowRatio,
      trend,
      intensity,
    }
  }, [trades, windowMs])
}

// ============================================
// HOOK: useLargeTrades (whale watching)
// ============================================

interface UseLargeTradesOptions extends UseBinanceTradesOptions {
  threshold?: number        // Minimum value in quote currency (default: 10000)
}

interface LargeTrade extends Trade {
  value: number
  isWhale: boolean
}

interface UseLargeTradesResult {
  largeTrades: LargeTrade[]
  whaleCount: number
  lastWhaleTrade: LargeTrade | null
  totalWhaleVolume: number
}

export function useLargeTrades(
  symbol: string | null,
  options: UseLargeTradesOptions = {}
): UseLargeTradesResult {
  const { threshold = 10000, ...tradeOptions } = options
  const { trades } = useBinanceTrades(symbol, {
    ...tradeOptions,
    maxTrades: 200, // Keep more trades for whale detection
  })

  return useMemo(() => {
    const largeTrades: LargeTrade[] = []
    let whaleCount = 0
    let lastWhaleTrade: LargeTrade | null = null
    let totalWhaleVolume = 0

    const whaleThreshold = threshold * 10 // 10x threshold = whale

    trades.forEach(trade => {
      const value = trade.price * trade.quantity

      if (value >= threshold) {
        const isWhale = value >= whaleThreshold
        const largeTrade: LargeTrade = {
          ...trade,
          value,
          isWhale,
        }

        largeTrades.push(largeTrade)

        if (isWhale) {
          whaleCount++
          totalWhaleVolume += trade.quantity
          if (!lastWhaleTrade || trade.time > lastWhaleTrade.time) {
            lastWhaleTrade = largeTrade
          }
        }
      }
    })

    // Sort by value descending
    largeTrades.sort((a, b) => b.value - a.value)

    return {
      largeTrades: largeTrades.slice(0, 20), // Top 20 large trades
      whaleCount,
      lastWhaleTrade,
      totalWhaleVolume,
    }
  }, [trades, threshold])
}

// ============================================
// HOOK: useTradeHistory (with REST fallback)
// ============================================

interface UseTradeHistoryOptions extends UseBinanceTradesOptions {
  initialFetch?: boolean    // Fetch initial trades via REST (default: true)
  limit?: number            // Initial fetch limit (default: 50)
}

export function useTradeHistory(
  symbol: string | null,
  options: UseTradeHistoryOptions = {}
): UseBinanceTradesResult & { isInitialLoading: boolean } {
  const {
    initialFetch = true,
    limit = 50,
    ...tradeOptions
  } = options

  const [isInitialLoading, setIsInitialLoading] = useState(initialFetch)
  const result = useBinanceTrades(symbol, tradeOptions)

  // Fetch initial trades via REST API
  useEffect(() => {
    if (!initialFetch || !symbol || !tradeOptions.enabled) {
      setIsInitialLoading(false)
      return
    }

    const fetchInitial = async () => {
      try {
        const { binanceApi } = await import('@/lib/crypto')
        const pair = tradeOptions.pair || 'USDT'

        const trades = await binanceApi.getCryptoTrades(symbol.toUpperCase(), pair.toUpperCase(), limit)

        // Trades will be picked up by the WebSocket stream
        // This is just to warm up the display
      } catch (err) {
        console.error('[useTradeHistory] Initial fetch error:', err)
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchInitial()
  }, [symbol, initialFetch, limit, tradeOptions.enabled, tradeOptions.pair])

  return {
    ...result,
    isInitialLoading,
  }
}

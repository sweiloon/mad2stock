'use client'

// ============================================
// USE BINANCE ORDER BOOK HOOK
// Order book not available - Binance geo-blocked
// Returns empty state for compatibility
// ============================================

import { useMemo } from 'react'
import type { OrderBook, OrderBookLevel } from '@/lib/crypto'

// ============================================
// TYPES
// ============================================

interface UseBinanceOrderBookOptions {
  enabled?: boolean
  levels?: number
  pair?: string
  aggregation?: number
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
// Returns empty state - real-time order book not available
// ============================================

export function useBinanceOrderBook(
  symbol: string | null,
  options: UseBinanceOrderBookOptions = {}
): UseBinanceOrderBookResult {
  return {
    orderBook: null,
    bids: [],
    asks: [],
    spread: 0,
    spreadPercent: 0,
    midPrice: 0,
    isConnected: false,
    lastUpdate: null,
    error: 'Order book not available (Binance geo-blocked)',
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
    aggregateBy?: number
  } = {}
): UseOrderBookDepthResult {
  return {
    bids: [],
    asks: [],
    maxTotal: 0,
    isConnected: false,
  }
}

// ============================================
// HOOK: useOrderBookImbalance
// ============================================

interface UseOrderBookImbalanceResult {
  imbalance: number
  buyPressure: number
  sellPressure: number
  ratio: number
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'
}

export function useOrderBookImbalance(
  symbol: string | null,
  options: UseBinanceOrderBookOptions = {}
): UseOrderBookImbalanceResult {
  return {
    imbalance: 0,
    buyPressure: 0,
    sellPressure: 0,
    ratio: 1,
    signal: 'NEUTRAL',
  }
}

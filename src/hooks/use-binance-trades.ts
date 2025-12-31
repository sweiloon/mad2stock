'use client'

// ============================================
// USE BINANCE TRADES HOOK
// Trade stream not available - Binance geo-blocked
// Returns empty state for compatibility
// ============================================

import type { Trade } from '@/lib/crypto'

// ============================================
// TYPES
// ============================================

interface UseBinanceTradesOptions {
  enabled?: boolean
  maxTrades?: number
  pair?: string
}

interface TradeStats {
  buyVolume: number
  sellVolume: number
  buyCount: number
  sellCount: number
  avgPrice: number
  vwap: number
  largestTrade: Trade | null
}

interface UseBinanceTradesResult {
  trades: Trade[]
  lastTrade: Trade | null
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
  stats: TradeStats
}

// ============================================
// HOOK: useBinanceTrades
// Returns empty state - real-time trades not available
// ============================================

export function useBinanceTrades(
  symbol: string | null,
  options: UseBinanceTradesOptions = {}
): UseBinanceTradesResult {
  return {
    trades: [],
    lastTrade: null,
    isConnected: false,
    lastUpdate: null,
    error: 'Trade stream not available (Binance geo-blocked)',
    stats: {
      buyVolume: 0,
      sellVolume: 0,
      buyCount: 0,
      sellCount: 0,
      avgPrice: 0,
      vwap: 0,
      largestTrade: null,
    },
  }
}

// ============================================
// HOOK: useTradeFlow (buy/sell flow analysis)
// ============================================

interface TradeFlowResult {
  buyFlow: number
  sellFlow: number
  netFlow: number
  flowRatio: number
  trend: 'BUYING' | 'SELLING' | 'NEUTRAL'
  intensity: 'HIGH' | 'MEDIUM' | 'LOW'
}

export function useTradeFlow(
  symbol: string | null,
  options: UseBinanceTradesOptions & {
    windowMs?: number
  } = {}
): TradeFlowResult {
  return {
    buyFlow: 0,
    sellFlow: 0,
    netFlow: 0,
    flowRatio: 1,
    trend: 'NEUTRAL',
    intensity: 'LOW',
  }
}

// ============================================
// HOOK: useLargeTrades (whale watching)
// ============================================

interface UseLargeTradesOptions extends UseBinanceTradesOptions {
  threshold?: number
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
  return {
    largeTrades: [],
    whaleCount: 0,
    lastWhaleTrade: null,
    totalWhaleVolume: 0,
  }
}

// ============================================
// HOOK: useTradeHistory (with REST fallback)
// ============================================

interface UseTradeHistoryOptions extends UseBinanceTradesOptions {
  initialFetch?: boolean
  limit?: number
}

export function useTradeHistory(
  symbol: string | null,
  options: UseTradeHistoryOptions = {}
): UseBinanceTradesResult & { isInitialLoading: boolean } {
  return {
    trades: [],
    lastTrade: null,
    isConnected: false,
    lastUpdate: null,
    error: 'Trade history not available (Binance geo-blocked)',
    stats: {
      buyVolume: 0,
      sellVolume: 0,
      buyCount: 0,
      sellCount: 0,
      avgPrice: 0,
      vwap: 0,
      largestTrade: null,
    },
    isInitialLoading: false,
  }
}

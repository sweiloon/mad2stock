// ============================================
// CRYPTO TIERS CONFIGURATION
// Tiered update strategy for performance optimization
// ============================================

import type { CryptoTier } from './types'

// ============================================
// TIER DEFINITIONS
// ============================================

/**
 * Tier 1: Top 20 coins by market cap
 * - Most active, highest volume
 * - Real-time WebSocket updates when viewing
 * - Cron updates every 1 minute
 */
export const TIER_1_COINS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP',
  'DOGE', 'ADA', 'AVAX', 'TRX', 'LINK',
  'DOT', 'MATIC', 'TON', 'SHIB', 'LTC',
  'ATOM', 'UNI', 'NEAR', 'APT', 'ARB',
] as const

/**
 * Tier 2: Top 21-50 coins
 * - Active trading, good liquidity
 * - Cron updates every 3 minutes
 */
export const TIER_2_COINS = [
  'ICP', 'FIL', 'ETC', 'HBAR', 'VET',
  'OP', 'MKR', 'INJ', 'AAVE', 'GRT',
  'ALGO', 'FTM', 'SAND', 'AXS', 'MANA',
  'THETA', 'XTZ', 'EOS', 'FLOW', 'CRV',
  'EGLD', 'SNX', 'CHZ', 'LDO', 'RUNE',
  'APE', 'KLAY', 'GALA', 'BCH', 'XLM',
] as const

/**
 * Tier 3: Top 51-100 coins
 * - Lower volume, less frequent updates
 * - Cron updates every 5 minutes
 */
export const TIER_3_COINS = [
  'NEO', 'CAKE', 'FXS', 'COMP', 'ZIL',
  'ENJ', 'BAT', '1INCH', 'DYDX', 'GMT',
  'YFI', 'MASK', 'ZRX', 'ENS', 'LRC',
  'SUSHI', 'IOTA', 'WAVES', 'DASH', 'ZEC',
  'ICX', 'QTUM', 'CELO', 'ONE', 'HOT',
  'KSM', 'ANKR', 'BAL', 'SKL', 'STORJ',
  'AUDIO', 'OMG', 'REN', 'SXP', 'CELR',
  'REEF', 'BAND', 'NKN', 'OCEAN', 'ARPA',
  'CTSI', 'DENT', 'FET', 'IOTX', 'RLC',
  'STMX', 'TRB', 'UTK', 'WRX', 'PEPE',
] as const

// ============================================
// TIER CONFIGURATIONS
// ============================================

export const CRYPTO_TIERS: Record<1 | 2 | 3, CryptoTier> = {
  1: {
    tier: 1,
    coins: [...TIER_1_COINS],
    updateIntervalMs: 60_000,       // 1 minute
    useWebSocket: true,
    description: 'Top 20 by market cap - real-time updates',
  },
  2: {
    tier: 2,
    coins: [...TIER_2_COINS],
    updateIntervalMs: 180_000,      // 3 minutes
    useWebSocket: false,
    description: 'Top 21-50 - frequent updates',
  },
  3: {
    tier: 3,
    coins: [...TIER_3_COINS],
    updateIntervalMs: 300_000,      // 5 minutes
    useWebSocket: false,
    description: 'Top 51-100 - standard updates',
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get tier for a coin symbol
 */
export function getCoinTier(symbol: string): 1 | 2 | 3 {
  const upperSymbol = symbol.toUpperCase()

  if ((TIER_1_COINS as readonly string[]).includes(upperSymbol)) return 1
  if ((TIER_2_COINS as readonly string[]).includes(upperSymbol)) return 2
  return 3
}

/**
 * Get all coins for a specific tier
 */
export function getCoinsForTier(tier: 1 | 2 | 3): string[] {
  return CRYPTO_TIERS[tier].coins
}

/**
 * Get all coins across all tiers
 */
export function getAllCoins(): string[] {
  return [
    ...TIER_1_COINS,
    ...TIER_2_COINS,
    ...TIER_3_COINS,
  ]
}

/**
 * Get update interval for a coin
 */
export function getUpdateInterval(symbol: string): number {
  const tier = getCoinTier(symbol)
  return CRYPTO_TIERS[tier].updateIntervalMs
}

/**
 * Check if coin should use WebSocket
 */
export function shouldUseWebSocket(symbol: string): boolean {
  const tier = getCoinTier(symbol)
  return CRYPTO_TIERS[tier].useWebSocket
}

// ============================================
// TRADING PAIRS CONFIGURATION
// ============================================

/**
 * Primary trading pairs (most liquid)
 */
export const PRIMARY_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'TRXUSDT', 'LINKUSDT',
] as const

/**
 * Quote currencies in priority order
 */
export const QUOTE_CURRENCIES = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB'] as const

/**
 * Get preferred pair for a coin
 */
export function getPreferredPair(symbol: string): string {
  return `${symbol.toUpperCase()}USDT`
}

/**
 * Get all pairs for a coin
 */
export function getAllPairs(symbol: string): string[] {
  const upperSymbol = symbol.toUpperCase()
  return QUOTE_CURRENCIES
    .filter(quote => quote !== upperSymbol)
    .map(quote => `${upperSymbol}${quote}`)
}

// ============================================
// CRON CONFIGURATION
// ============================================

export const CRON_CONFIG = {
  // Price update intervals
  priceUpdate: {
    tier1Interval: '*/1 * * * *',    // Every 1 minute
    tier2Interval: '*/3 * * * *',    // Every 3 minutes
    tier3Interval: '*/5 * * * *',    // Every 5 minutes
  },

  // Kline/candlestick updates
  klineUpdate: {
    interval: '*/5 * * * *',         // Every 5 minutes
    periods: ['1h', '4h', '1d'] as const,
  },

  // Signal generation
  signalGeneration: {
    interval: '*/15 * * * *',        // Every 15 minutes
  },

  // Arena crypto trading
  arenaTradingInterval: '0 * * * *', // Every hour

  // Batch sizes
  batchSize: 50,                     // Coins per batch
  concurrency: 10,                   // Concurrent requests
}

// ============================================
// CATEGORIES
// ============================================

export const CRYPTO_CATEGORIES = {
  Layer1: ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'TRX', 'DOT', 'NEAR', 'APT', 'ICP', 'ALGO', 'FTM', 'EGLD', 'NEO', 'WAVES', 'CELO', 'ONE'],
  Layer2: ['MATIC', 'ARB', 'OP', 'LRC', 'SKL', 'CELR', 'CTSI', 'OMG'],
  DeFi: ['UNI', 'AAVE', 'MKR', 'SNX', 'CRV', 'SUSHI', 'COMP', 'BAL', '1INCH', 'DYDX', 'YFI', 'RUNE', 'FXS', 'LDO', 'REEF'],
  Meme: ['DOGE', 'SHIB', 'PEPE', 'APE'],
  Gaming: ['AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'GMT'],
  Exchange: ['BNB', 'WRX'],
  Payments: ['XRP', 'LTC', 'XLM', 'BCH', 'DASH', 'SXP', 'UTK'],
  Oracle: ['LINK', 'BAND', 'TRB'],
  Storage: ['FIL', 'STORJ'],
  Infrastructure: ['GRT', 'THETA', 'HOT', 'ANKR', 'NKN', 'ENS'],
  Privacy: ['ZEC', 'ARPA'],
  AI: ['FET'],
  IoT: ['IOTA', 'IOTX'],
} as const

export type CryptoCategoryName = keyof typeof CRYPTO_CATEGORIES

/**
 * Get category for a coin
 */
export function getCoinCategory(symbol: string): CryptoCategoryName | 'Other' {
  const upperSymbol = symbol.toUpperCase()

  for (const [category, coins] of Object.entries(CRYPTO_CATEGORIES)) {
    if ((coins as readonly string[]).includes(upperSymbol)) {
      return category as CryptoCategoryName
    }
  }

  return 'Other'
}

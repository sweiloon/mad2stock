// ============================================
// CRYPTO MODULE PUBLIC API
// ============================================

// Types
export * from './types'

// Binance REST API
export { binanceApi, BinanceAPI } from './binance-api'

// Binance WebSocket
export {
  binanceWs,
  BinanceWebSocketManager,
  BinanceWS,
  OrderBookManager,
  TradeBuffer,
} from './binance-websocket'

// Tier configuration
export {
  TIER_1_COINS,
  TIER_2_COINS,
  TIER_3_COINS,
  CRYPTO_TIERS,
  getCoinTier,
  getCoinsForTier,
  getAllCoins,
  getUpdateInterval,
  shouldUseWebSocket,
  PRIMARY_PAIRS,
  QUOTE_CURRENCIES,
  getPreferredPair,
  getAllPairs,
  CRON_CONFIG,
  CRYPTO_CATEGORIES,
  getCoinCategory,
  type CryptoCategoryName,
} from './tiers'

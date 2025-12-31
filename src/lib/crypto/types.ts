// ============================================
// CRYPTO TYPES
// Type definitions for cryptocurrency market data
// ============================================

// ============================================
// COIN TYPES
// ============================================

export type CryptoCategory =
  | 'Layer1'
  | 'Layer2'
  | 'Layer0'
  | 'DeFi'
  | 'Meme'
  | 'Gaming'
  | 'Exchange'
  | 'Payments'
  | 'Oracle'
  | 'Storage'
  | 'Privacy'
  | 'Infrastructure'
  | 'AI'
  | 'IoT'
  | 'Media'
  | 'Social'
  | 'Sports'
  | 'Supply Chain'
  | 'Other'

export interface Coin {
  id: string
  symbol: string             // 'BTC', 'ETH'
  name: string               // 'Bitcoin', 'Ethereum'
  slug: string               // 'bitcoin', 'ethereum'
  category: CryptoCategory

  // Market data
  marketCap: number
  marketCapRank: number
  fullyDilutedValuation?: number

  // Supply
  circulatingSupply: number
  totalSupply: number
  maxSupply: number | null

  // Current price (cached)
  price: number
  priceChange24h: number
  priceChange7d?: number
  priceChange30d?: number
  volume24h: number

  // All-time high/low
  ath: number
  athDate: string
  athChangePercent: number
  atl: number
  atlDate: string
  atlChangePercent: number

  // Metadata
  logoUrl?: string
  websiteUrl?: string
  description?: string

  // Tier (1=top20, 2=top50, 3=top100)
  tier: 1 | 2 | 3
  isActive: boolean

  updatedAt: Date
}

// ============================================
// TRADING PAIR TYPES
// ============================================

export interface TradingPair {
  id: string
  pairSymbol: string         // 'BTCUSDT'
  baseSymbol: string         // 'BTC'
  quoteSymbol: string        // 'USDT'

  exchange: string
  status: 'TRADING' | 'HALT' | 'BREAK'

  // Trading rules
  minQty?: number
  maxQty?: number
  stepSize?: number
  minNotional?: number
  tickSize?: number

  // Current price
  currentPrice: number
  priceChange24h: number
  priceChangePercent24h: number
  volume24h: number
  quoteVolume24h: number

  tier: number
  isActive: boolean
  updatedAt: Date
}

// ============================================
// PRICE TYPES
// ============================================

export interface CryptoPrice {
  symbol: string
  price: number
  change: number
  changePercent: number

  // 24h stats
  open24h: number
  high24h: number
  low24h: number
  volume24h: number
  quoteVolume24h: number

  // Top of book
  bid: number
  ask: number

  // VWAP
  vwap?: number

  // Trade count
  trades24h?: number

  dataSource: 'BINANCE' | 'COINGECKO' | 'CACHE'
  tier: number
  updatedAt: Date
}

// ============================================
// ORDER BOOK TYPES
// ============================================

export interface OrderBookLevel {
  price: number
  quantity: number
  total: number              // Cumulative quantity
}

export interface OrderBook {
  pairSymbol: string

  // Top of book
  bestBid: number
  bestBidQty: number
  bestAsk: number
  bestAskQty: number
  spread: number
  spreadPct: number

  // Depth levels
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]

  // Order flow
  bidVolumeTotal: number
  askVolumeTotal: number
  buyPressure: number        // 0-100
  imbalance: number          // -100 to +100

  lastUpdateId: number
  updatedAt: Date
}

// ============================================
// TRADE TYPES
// ============================================

export interface Trade {
  id: string
  pairSymbol: string
  price: number
  quantity: number
  quoteQty: number
  time: Date
  isBuyerMaker: boolean      // true = sell, false = buy
}

// ============================================
// KLINE/CANDLESTICK TYPES
// ============================================

export type KlineInterval = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M'

export interface Kline {
  pairSymbol: string
  interval: KlineInterval
  openTime: Date
  closeTime: Date

  open: number
  high: number
  low: number
  close: number
  volume: number

  quoteVolume: number
  tradesCount: number
  takerBuyBase: number
  takerBuyQuote: number
}

// ============================================
// SIGNAL TYPES
// ============================================

export type SignalType = 'BUY' | 'SELL' | 'HOLD'
export type SignalStrength = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'
export type TimeHorizon = 'SHORT' | 'MEDIUM' | 'LONG'

export interface CryptoSignal {
  id: string
  coinId?: string
  symbol: string
  pairSymbol?: string

  signalType: SignalType
  signalStrength: SignalStrength
  confidence: number         // 0-100

  entryPrice: number
  targetPrice: number
  stopLoss: number
  riskRewardRatio: number

  timeHorizon: TimeHorizon

  technicalSummary?: string
  fundamentalSummary?: string
  sentimentSummary?: string
  reasoning?: string

  dataSources?: string[]
  indicatorsUsed?: string[]

  isActive: boolean
  hitTarget: boolean
  hitStopLoss: boolean

  createdAt: Date
  expiresAt?: Date
  closedAt?: Date
}

// ============================================
// BINANCE API RESPONSE TYPES
// ============================================

export interface BinanceTicker24hr {
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  prevClosePrice: string
  lastPrice: string
  lastQty: string
  bidPrice: string
  bidQty: string
  askPrice: string
  askQty: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
}

export interface BinanceOrderBookResponse {
  lastUpdateId: number
  bids: [string, string][]   // [price, quantity]
  asks: [string, string][]
}

export interface BinanceTradeResponse {
  id: number
  price: string
  qty: string
  quoteQty: string
  time: number
  isBuyerMaker: boolean
  isBestMatch: boolean
}

export interface BinanceKlineResponse {
  0: number    // Open time
  1: string    // Open
  2: string    // High
  3: string    // Low
  4: string    // Close
  5: string    // Volume
  6: number    // Close time
  7: string    // Quote asset volume
  8: number    // Number of trades
  9: string    // Taker buy base asset volume
  10: string   // Taker buy quote asset volume
  11: string   // Ignore
}

// ============================================
// BINANCE WEBSOCKET TYPES
// ============================================

export interface BinanceWSTicker {
  e: '24hrTicker'
  E: number                  // Event time
  s: string                  // Symbol
  p: string                  // Price change
  P: string                  // Price change percent
  w: string                  // Weighted average price
  x: string                  // First trade(F)-1 price (first trade before the 24hr rolling window)
  c: string                  // Last price
  Q: string                  // Last quantity
  b: string                  // Best bid price
  B: string                  // Best bid quantity
  a: string                  // Best ask price
  A: string                  // Best ask quantity
  o: string                  // Open price
  h: string                  // High price
  l: string                  // Low price
  v: string                  // Total traded base asset volume
  q: string                  // Total traded quote asset volume
  O: number                  // Statistics open time
  C: number                  // Statistics close time
  F: number                  // First trade ID
  L: number                  // Last trade Id
  n: number                  // Total number of trades
}

export interface BinanceWSMiniTicker {
  e: '24hrMiniTicker'
  E: number
  s: string
  c: string                  // Close price
  o: string                  // Open price
  h: string                  // High price
  l: string                  // Low price
  v: string                  // Total traded base asset volume
  q: string                  // Total traded quote asset volume
}

export interface BinanceWSDepthUpdate {
  e: 'depthUpdate'
  E: number                  // Event time
  s: string                  // Symbol
  U: number                  // First update ID in event
  u: number                  // Final update ID in event
  b: [string, string][]      // Bids to be updated [price, qty]
  a: [string, string][]      // Asks to be updated [price, qty]
}

export interface BinanceWSTrade {
  e: 'trade'
  E: number                  // Event time
  s: string                  // Symbol
  t: number                  // Trade ID
  p: string                  // Price
  q: string                  // Quantity
  b: number                  // Buyer order ID
  a: number                  // Seller order ID
  T: number                  // Trade time
  m: boolean                 // Is the buyer the market maker?
  M: boolean                 // Ignore
}

export interface BinanceWSKline {
  e: 'kline'
  E: number                  // Event time
  s: string                  // Symbol
  k: {
    t: number                // Kline start time
    T: number                // Kline close time
    s: string                // Symbol
    i: string                // Interval
    f: number                // First trade ID
    L: number                // Last trade ID
    o: string                // Open price
    c: string                // Close price
    h: string                // High price
    l: string                // Low price
    v: string                // Base asset volume
    n: number                // Number of trades
    x: boolean               // Is this kline closed?
    q: string                // Quote asset volume
    V: string                // Taker buy base asset volume
    Q: string                // Taker buy quote asset volume
    B: string                // Ignore
  }
}

// ============================================
// ARENA TYPES
// ============================================

export interface ArenaCryptoHolding {
  id: string
  participantId: string
  symbol: string
  pairSymbol: string
  quantity: number
  avgBuyPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  entryTime?: Date
  positionType: 'SPOT' | 'LONG' | 'SHORT'
  modeCode?: string
  createdAt: Date
  updatedAt: Date
}

export interface ArenaCryptoTrade {
  id: string
  participantId: string
  symbol: string
  pairSymbol: string
  tradeType: 'BUY' | 'SELL'
  quantity: number
  price: number
  totalValue: number
  fees: number
  realizedPnl?: number
  reasoning?: string
  modeCode?: string
  marketConditions?: Record<string, unknown>
  executedAt: Date
  createdAt: Date
}

export interface ArenaCryptoSnapshot {
  id: string
  participantId: string
  snapshotDate: string
  cashBalance: number
  holdingsValue: number
  totalPortfolioValue: number
  dailyPnl: number
  dailyPnlPct: number
  cumulativePnl: number
  cumulativePnlPct: number
  holdingsSnapshot?: ArenaCryptoHolding[]
  tradesToday: number
  winRate?: number
  modeCode?: string
  createdAt: Date
}

// ============================================
// UTILITY TYPES
// ============================================

export interface CryptoMarketOverview {
  totalMarketCap: number
  totalVolume24h: number
  btcDominance: number
  ethDominance: number
  fearGreedIndex?: number
  marketSentiment: 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED'
  totalCoins: number
  gainers24h: number
  losers24h: number
  unchanged24h: number
  updatedAt: Date
}

export interface CryptoTier {
  tier: 1 | 2 | 3
  coins: string[]
  updateIntervalMs: number
  useWebSocket: boolean
  description: string
}

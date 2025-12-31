// ============================================
// BINANCE REST API CLIENT
// Public market data API - no authentication required
// Rate limit: 1200 requests/minute
// ============================================

import type {
  BinanceTicker24hr,
  BinanceOrderBookResponse,
  BinanceTradeResponse,
  BinanceKlineResponse,
  CryptoPrice,
  OrderBook,
  OrderBookLevel,
  Trade,
  Kline,
  KlineInterval,
} from './types'

// ============================================
// CONSTANTS
// ============================================

const BINANCE_BASE_URL = 'https://api.binance.com'
const BINANCE_DATA_URL = 'https://data-api.binance.vision' // For market data only

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 1200,
  requestWeight: {
    ticker24hr: 1,      // Single: 1, All: 40
    depth: 5,           // Limit 5-100: 5, 500: 10, 1000: 20
    trades: 1,
    klines: 1,
    exchangeInfo: 10,
  },
}

// ============================================
// RATE LIMITER
// ============================================

class RateLimiter {
  private requests: number = 0
  private resetTime: number = Date.now()
  private limit: number

  constructor(limit: number = RATE_LIMIT.requestsPerMinute) {
    this.limit = limit
  }

  async checkLimit(weight: number = 1): Promise<void> {
    const now = Date.now()

    // Reset counter every minute
    if (now - this.resetTime > 60000) {
      this.requests = 0
      this.resetTime = now
    }

    // Check if we're approaching the limit
    if (this.requests + weight >= this.limit) {
      const waitTime = 60000 - (now - this.resetTime)
      console.log(`[Binance API] Rate limit approaching, waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.requests = 0
      this.resetTime = Date.now()
    }

    this.requests += weight
  }

  getUsage(): { current: number; limit: number; resetIn: number } {
    return {
      current: this.requests,
      limit: this.limit,
      resetIn: Math.max(0, 60000 - (Date.now() - this.resetTime)),
    }
  }
}

// ============================================
// BINANCE API CLIENT
// ============================================

class BinanceAPI {
  private rateLimiter: RateLimiter
  private baseUrl: string

  constructor(options?: { useDataApi?: boolean }) {
    this.rateLimiter = new RateLimiter()
    this.baseUrl = options?.useDataApi ? BINANCE_DATA_URL : BINANCE_BASE_URL
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async fetch<T>(endpoint: string, weight: number = 1): Promise<T> {
    await this.rateLimiter.checkLimit(weight)

    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }, // No cache for real-time data
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Binance API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // ============================================
  // TICKER ENDPOINTS
  // ============================================

  /**
   * Get 24hr ticker for a single symbol
   */
  async getTicker24hr(symbol: string): Promise<BinanceTicker24hr> {
    return this.fetch<BinanceTicker24hr>(
      `/api/v3/ticker/24hr?symbol=${symbol}`,
      RATE_LIMIT.requestWeight.ticker24hr
    )
  }

  /**
   * Get 24hr tickers for all symbols
   * Weight: 40
   */
  async getAllTickers24hr(): Promise<BinanceTicker24hr[]> {
    return this.fetch<BinanceTicker24hr[]>(
      '/api/v3/ticker/24hr',
      40
    )
  }

  /**
   * Get 24hr tickers for specific symbols
   */
  async getTickers24hr(symbols: string[]): Promise<BinanceTicker24hr[]> {
    if (symbols.length === 0) return []
    if (symbols.length === 1) {
      const ticker = await this.getTicker24hr(symbols[0])
      return [ticker]
    }

    const symbolsParam = JSON.stringify(symbols)
    return this.fetch<BinanceTicker24hr[]>(
      `/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`,
      Math.min(40, symbols.length)
    )
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: string): Promise<{ symbol: string; price: string }> {
    return this.fetch<{ symbol: string; price: string }>(
      `/api/v3/ticker/price?symbol=${symbol}`,
      1
    )
  }

  /**
   * Get all current prices
   */
  async getAllPrices(): Promise<{ symbol: string; price: string }[]> {
    return this.fetch<{ symbol: string; price: string }[]>(
      '/api/v3/ticker/price',
      2
    )
  }

  // ============================================
  // ORDER BOOK ENDPOINTS
  // ============================================

  /**
   * Get order book for a symbol
   * @param limit 5, 10, 20, 50, 100, 500, 1000 (default: 20)
   */
  async getOrderBook(symbol: string, limit: number = 20): Promise<BinanceOrderBookResponse> {
    const validLimits = [5, 10, 20, 50, 100, 500, 1000]
    const closestLimit = validLimits.reduce((prev, curr) =>
      Math.abs(curr - limit) < Math.abs(prev - limit) ? curr : prev
    )

    let weight = 5
    if (closestLimit >= 500) weight = 10
    if (closestLimit >= 1000) weight = 20

    return this.fetch<BinanceOrderBookResponse>(
      `/api/v3/depth?symbol=${symbol}&limit=${closestLimit}`,
      weight
    )
  }

  // ============================================
  // TRADES ENDPOINTS
  // ============================================

  /**
   * Get recent trades for a symbol
   * @param limit 1-1000 (default: 100)
   */
  async getRecentTrades(symbol: string, limit: number = 100): Promise<BinanceTradeResponse[]> {
    return this.fetch<BinanceTradeResponse[]>(
      `/api/v3/trades?symbol=${symbol}&limit=${Math.min(1000, limit)}`,
      RATE_LIMIT.requestWeight.trades
    )
  }

  // ============================================
  // KLINES/CANDLESTICK ENDPOINTS
  // ============================================

  /**
   * Get klines (candlestick) data
   * @param interval 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
   * @param limit 1-1000 (default: 100)
   */
  async getKlines(
    symbol: string,
    interval: KlineInterval,
    options?: {
      limit?: number
      startTime?: number
      endTime?: number
    }
  ): Promise<BinanceKlineResponse[]> {
    const params = new URLSearchParams({
      symbol,
      interval,
      limit: String(options?.limit || 100),
    })

    if (options?.startTime) params.append('startTime', String(options.startTime))
    if (options?.endTime) params.append('endTime', String(options.endTime))

    return this.fetch<BinanceKlineResponse[]>(
      `/api/v3/klines?${params.toString()}`,
      RATE_LIMIT.requestWeight.klines
    )
  }

  // ============================================
  // EXCHANGE INFO
  // ============================================

  /**
   * Get exchange information (trading rules, symbols, etc.)
   */
  async getExchangeInfo(): Promise<{
    timezone: string
    serverTime: number
    symbols: Array<{
      symbol: string
      status: string
      baseAsset: string
      quoteAsset: string
      filters: Array<{
        filterType: string
        [key: string]: string | number
      }>
    }>
  }> {
    return this.fetch(
      '/api/v3/exchangeInfo',
      RATE_LIMIT.requestWeight.exchangeInfo
    )
  }

  // ============================================
  // TRANSFORMED RESPONSES
  // ============================================

  /**
   * Get transformed crypto price
   */
  async getCryptoPrice(symbol: string): Promise<CryptoPrice> {
    const ticker = await this.getTicker24hr(`${symbol}USDT`)
    return this.transformTicker(ticker, symbol)
  }

  /**
   * Get multiple transformed crypto prices
   */
  async getCryptoPrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    const pairs = symbols.map(s => `${s}USDT`)
    const tickers = await this.getTickers24hr(pairs)

    const prices = new Map<string, CryptoPrice>()
    tickers.forEach(ticker => {
      const symbol = ticker.symbol.replace('USDT', '')
      prices.set(symbol, this.transformTicker(ticker, symbol))
    })

    return prices
  }

  /**
   * Get transformed order book
   */
  async getCryptoOrderBook(symbol: string, pair: string = 'USDT', levels: number = 20): Promise<OrderBook> {
    const pairSymbol = `${symbol}${pair}`
    const response = await this.getOrderBook(pairSymbol, levels)
    return this.transformOrderBook(response, pairSymbol)
  }

  /**
   * Get transformed recent trades
   */
  async getCryptoTrades(symbol: string, pair: string = 'USDT', limit: number = 50): Promise<Trade[]> {
    const pairSymbol = `${symbol}${pair}`
    const response = await this.getRecentTrades(pairSymbol, limit)
    return response.map(trade => this.transformTrade(trade, pairSymbol))
  }

  /**
   * Get transformed klines
   */
  async getCryptoKlines(
    symbol: string,
    pair: string = 'USDT',
    interval: KlineInterval,
    limit: number = 100
  ): Promise<Kline[]> {
    const pairSymbol = `${symbol}${pair}`
    const response = await this.getKlines(pairSymbol, interval, { limit })
    return response.map(kline => this.transformKline(kline, pairSymbol, interval))
  }

  // ============================================
  // TRANSFORM HELPERS
  // ============================================

  private transformTicker(ticker: BinanceTicker24hr, symbol: string): CryptoPrice {
    return {
      symbol,
      price: parseFloat(ticker.lastPrice),
      change: parseFloat(ticker.priceChange),
      changePercent: parseFloat(ticker.priceChangePercent),
      open24h: parseFloat(ticker.openPrice),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      volume24h: parseFloat(ticker.volume),
      quoteVolume24h: parseFloat(ticker.quoteVolume),
      bid: parseFloat(ticker.bidPrice),
      ask: parseFloat(ticker.askPrice),
      vwap: parseFloat(ticker.weightedAvgPrice),
      trades24h: ticker.count,
      dataSource: 'BINANCE',
      tier: 2,
      updatedAt: new Date(),
    }
  }

  private transformOrderBook(response: BinanceOrderBookResponse, pairSymbol: string): OrderBook {
    let bidTotal = 0
    let askTotal = 0

    const bids: OrderBookLevel[] = response.bids.map(([price, qty]) => {
      const p = parseFloat(price)
      const q = parseFloat(qty)
      bidTotal += q
      return { price: p, quantity: q, total: bidTotal }
    })

    const asks: OrderBookLevel[] = response.asks.map(([price, qty]) => {
      const p = parseFloat(price)
      const q = parseFloat(qty)
      askTotal += q
      return { price: p, quantity: q, total: askTotal }
    })

    const bestBid = bids[0]?.price || 0
    const bestAsk = asks[0]?.price || 0
    const spread = bestAsk - bestBid
    const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0

    // Calculate buy pressure (0-100)
    const totalVolume = bidTotal + askTotal
    const buyPressure = totalVolume > 0 ? (bidTotal / totalVolume) * 100 : 50

    // Calculate imbalance (-100 to +100)
    const imbalance = totalVolume > 0 ? ((bidTotal - askTotal) / totalVolume) * 100 : 0

    return {
      pairSymbol,
      bestBid,
      bestBidQty: bids[0]?.quantity || 0,
      bestAsk,
      bestAskQty: asks[0]?.quantity || 0,
      spread,
      spreadPct,
      bids,
      asks,
      bidVolumeTotal: bidTotal,
      askVolumeTotal: askTotal,
      buyPressure,
      imbalance,
      lastUpdateId: response.lastUpdateId,
      updatedAt: new Date(),
    }
  }

  private transformTrade(trade: BinanceTradeResponse, pairSymbol: string): Trade {
    return {
      id: String(trade.id),
      pairSymbol,
      price: parseFloat(trade.price),
      quantity: parseFloat(trade.qty),
      quoteQty: parseFloat(trade.quoteQty),
      time: new Date(trade.time),
      isBuyerMaker: trade.isBuyerMaker,
    }
  }

  private transformKline(kline: BinanceKlineResponse, pairSymbol: string, interval: KlineInterval): Kline {
    return {
      pairSymbol,
      interval,
      openTime: new Date(kline[0]),
      closeTime: new Date(kline[6]),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      quoteVolume: parseFloat(kline[7]),
      tradesCount: kline[8],
      takerBuyBase: parseFloat(kline[9]),
      takerBuyQuote: parseFloat(kline[10]),
    }
  }

  // ============================================
  // RATE LIMIT INFO
  // ============================================

  getRateLimitUsage() {
    return this.rateLimiter.getUsage()
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const binanceApi = new BinanceAPI()

// Also export class for custom instances
export { BinanceAPI }

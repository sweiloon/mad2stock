// ============================================
// COINGECKO REST API CLIENT
// Free public API - no authentication required
// Rate limit: 10-50 calls/minute (free tier)
// Used as fallback when Binance is geo-blocked
// ============================================

import type { CryptoPrice, Kline, KlineInterval } from './types'

// ============================================
// CONSTANTS
// ============================================

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

// Symbol to CoinGecko ID mapping
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  TRX: 'tron',
  LINK: 'chainlink',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  SHIB: 'shiba-inu',
  LTC: 'litecoin',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  XLM: 'stellar',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  INJ: 'injective-protocol',
  SUI: 'sui',
  FIL: 'filecoin',
  VET: 'vechain',
  ALGO: 'algorand',
  FTM: 'fantom',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  AXS: 'axie-infinity',
  AAVE: 'aave',
  MKR: 'maker',
  GRT: 'the-graph',
  SNX: 'havven',
  CRV: 'curve-dao-token',
  LDO: 'lido-dao',
  RUNE: 'thorchain',
  EGLD: 'elrond-erd-2',
  FLOW: 'flow',
  XTZ: 'tezos',
  THETA: 'theta-token',
  EOS: 'eos',
  CAKE: 'pancakeswap-token',
  NEO: 'neo',
  KLAY: 'klay-token',
  ZIL: 'zilliqa',
  ENJ: 'enjincoin',
  CHZ: 'chiliz',
  BAT: 'basic-attention-token',
  PEPE: 'pepe',
  WIF: 'dogwifcoin',
  BONK: 'bonk',
  FLOKI: 'floki',
  FET: 'fetch-ai',
  RNDR: 'render-token',
  IMX: 'immutable-x',
  SEI: 'sei-network',
  TIA: 'celestia',
  JUP: 'jupiter-exchange-solana',
  WLD: 'worldcoin-wld',
  STRK: 'starknet',
  PYTH: 'pyth-network',
  JTO: 'jito-governance-token',
}

// Reverse mapping
const ID_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOL_TO_ID).map(([k, v]) => [v, k])
)

// ============================================
// RATE LIMITER
// ============================================

class CoinGeckoRateLimiter {
  private requests: number[] = []
  private limit: number = 30 // Conservative limit for free tier

  async checkLimit(): Promise<void> {
    const now = Date.now()
    // Keep only requests from the last minute
    this.requests = this.requests.filter(time => now - time < 60000)

    if (this.requests.length >= this.limit) {
      const oldestRequest = this.requests[0]
      const waitTime = 60000 - (now - oldestRequest) + 1000 // Add 1s buffer
      console.log(`[CoinGecko API] Rate limit reached, waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.requests = []
    }

    this.requests.push(now)
  }
}

// ============================================
// COINGECKO API CLIENT
// ============================================

class CoinGeckoAPI {
  private rateLimiter: CoinGeckoRateLimiter

  constructor() {
    this.rateLimiter = new CoinGeckoRateLimiter()
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async fetch<T>(endpoint: string): Promise<T> {
    await this.rateLimiter.checkLimit()

    const url = `${COINGECKO_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`CoinGecko API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  private getIdFromSymbol(symbol: string): string | null {
    return SYMBOL_TO_ID[symbol.toUpperCase()] || null
  }

  private getSymbolFromId(id: string): string | null {
    return ID_TO_SYMBOL[id.toLowerCase()] || null
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Get market data for multiple coins
   * Returns price, 24h change, volume, market cap
   */
  async getMarketData(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    const ids = symbols
      .map(s => this.getIdFromSymbol(s))
      .filter((id): id is string => id !== null)

    if (ids.length === 0) {
      return new Map()
    }

    const data = await this.fetch<Array<{
      id: string
      symbol: string
      current_price: number
      price_change_24h: number
      price_change_percentage_24h: number
      high_24h: number
      low_24h: number
      total_volume: number
      market_cap: number
      market_cap_rank: number
    }>>(
      `/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`
    )

    const prices = new Map<string, CryptoPrice>()

    for (const coin of data) {
      const symbol = this.getSymbolFromId(coin.id) || coin.symbol.toUpperCase()
      prices.set(symbol, {
        symbol,
        price: coin.current_price || 0,
        change: coin.price_change_24h || 0,
        changePercent: coin.price_change_percentage_24h || 0,
        open24h: (coin.current_price || 0) - (coin.price_change_24h || 0),
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
        volume24h: coin.total_volume || 0,
        quoteVolume24h: coin.total_volume || 0,
        bid: coin.current_price || 0,
        ask: coin.current_price || 0,
        vwap: coin.current_price || 0,
        trades24h: 0, // Not available from CoinGecko
        dataSource: 'COINGECKO',
        tier: 2,
        updatedAt: new Date(),
      })
    }

    return prices
  }

  /**
   * Get all market data for top coins
   */
  async getAllMarketData(limit: number = 100): Promise<CryptoPrice[]> {
    const data = await this.fetch<Array<{
      id: string
      symbol: string
      current_price: number
      price_change_24h: number
      price_change_percentage_24h: number
      high_24h: number
      low_24h: number
      total_volume: number
      market_cap: number
      market_cap_rank: number
    }>>(
      `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
    )

    return data.map(coin => {
      const symbol = this.getSymbolFromId(coin.id) || coin.symbol.toUpperCase()
      return {
        symbol,
        price: coin.current_price || 0,
        change: coin.price_change_24h || 0,
        changePercent: coin.price_change_percentage_24h || 0,
        open24h: (coin.current_price || 0) - (coin.price_change_24h || 0),
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
        volume24h: coin.total_volume || 0,
        quoteVolume24h: coin.total_volume || 0,
        bid: coin.current_price || 0,
        ask: coin.current_price || 0,
        vwap: coin.current_price || 0,
        trades24h: 0,
        dataSource: 'COINGECKO',
        tier: coin.market_cap_rank <= 20 ? 1 : coin.market_cap_rank <= 50 ? 2 : 3,
        updatedAt: new Date(),
      }
    })
  }

  /**
   * Get OHLC data (candlesticks) for a coin
   * Note: CoinGecko only provides limited intervals (1/7/14/30/90/180/365 days)
   */
  async getOHLC(
    symbol: string,
    days: number = 30
  ): Promise<Kline[]> {
    const id = this.getIdFromSymbol(symbol)
    if (!id) {
      throw new Error(`Unknown symbol: ${symbol}`)
    }

    // CoinGecko OHLC only supports: 1, 7, 14, 30, 90, 180, 365, max
    const validDays = [1, 7, 14, 30, 90, 180, 365]
    const closestDays = validDays.reduce((prev, curr) =>
      Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
    )

    const data = await this.fetch<Array<[number, number, number, number, number]>>(
      `/coins/${id}/ohlc?vs_currency=usd&days=${closestDays}`
    )

    // Determine interval based on days
    let interval: KlineInterval = '1d'
    if (closestDays <= 1) interval = '1h'
    else if (closestDays <= 7) interval = '4h'

    return data.map(([timestamp, open, high, low, close]) => ({
      pairSymbol: `${symbol}USDT`,
      interval,
      openTime: new Date(timestamp),
      closeTime: new Date(timestamp + (interval === '1h' ? 3600000 : interval === '4h' ? 14400000 : 86400000)),
      open,
      high,
      low,
      close,
      volume: 0, // Not provided by OHLC endpoint
      quoteVolume: 0,
      tradesCount: 0,
      takerBuyBase: 0,
      takerBuyQuote: 0,
    }))
  }

  /**
   * Check if a symbol is supported
   */
  isSymbolSupported(symbol: string): boolean {
    return this.getIdFromSymbol(symbol) !== null
  }

  /**
   * Get supported symbols
   */
  getSupportedSymbols(): string[] {
    return Object.keys(SYMBOL_TO_ID)
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const coingeckoApi = new CoinGeckoAPI()
export { CoinGeckoAPI, SYMBOL_TO_ID, ID_TO_SYMBOL }

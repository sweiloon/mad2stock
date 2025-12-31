// ============================================
// BINANCE WEBSOCKET MANAGER
// Real-time market data streaming
// Base URL: wss://stream.binance.com:9443/ws
// ============================================

import type {
  BinanceWSTicker,
  BinanceWSMiniTicker,
  BinanceWSDepthUpdate,
  BinanceWSTrade,
  BinanceWSKline,
  CryptoPrice,
  OrderBook,
  OrderBookLevel,
  Trade,
  KlineInterval,
} from './types'

// ============================================
// TYPES
// ============================================

type StreamType = 'ticker' | 'miniTicker' | 'depth' | 'trade' | 'kline'

interface StreamCallback<T> {
  (data: T): void
}

interface Subscription {
  stream: string
  callbacks: Set<StreamCallback<unknown>>
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

interface WebSocketManagerOptions {
  maxReconnectAttempts?: number
  reconnectDelay?: number
  pingInterval?: number
  pongTimeout?: number
}

// ============================================
// WEBSOCKET MANAGER
// ============================================

export class BinanceWebSocketManager {
  private ws: WebSocket | null = null
  private subscriptions: Map<string, Subscription> = new Map()
  private state: ConnectionState = 'disconnected'
  private reconnectAttempts: number = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private pingInterval: NodeJS.Timeout | null = null
  private pongTimeout: NodeJS.Timeout | null = null
  private lastPong: number = Date.now()
  private messageQueue: string[] = []

  private options: Required<WebSocketManagerOptions> = {
    maxReconnectAttempts: 10,
    reconnectDelay: 1000,
    pingInterval: 30000,      // 30 seconds
    pongTimeout: 60000,       // 60 seconds (Binance requirement)
  }

  constructor(options?: WebSocketManagerOptions) {
    if (options) {
      this.options = { ...this.options, ...options }
    }
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Connect to Binance WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === 'connected') {
        resolve()
        return
      }

      if (this.state === 'connecting') {
        // Wait for connection
        const checkConnection = () => {
          if (this.state === 'connected') {
            resolve()
          } else if (this.state === 'disconnected') {
            reject(new Error('Connection failed'))
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
        return
      }

      this.state = 'connecting'

      // Build stream URL from active subscriptions
      const streams = Array.from(this.subscriptions.keys())
      const url = streams.length > 0
        ? `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`
        : 'wss://stream.binance.com:9443/ws'

      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('[Binance WS] Connected')
          this.state = 'connected'
          this.reconnectAttempts = 0
          this.startPing()

          // Process queued messages
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()
            if (message && this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(message)
            }
          }

          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('[Binance WS] Error:', error)
        }

        this.ws.onclose = (event) => {
          console.log(`[Binance WS] Closed: ${event.code} ${event.reason}`)
          this.state = 'disconnected'
          this.stopPing()
          this.attemptReconnect()
        }

      } catch (error) {
        this.state = 'disconnected'
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.state = 'disconnected'
    this.stopPing()

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.subscriptions.clear()
    this.messageQueue = []
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get current state
   */
  getState(): ConnectionState {
    return this.state
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  /**
   * Subscribe to a stream
   */
  subscribe<T>(stream: string, callback: StreamCallback<T>): () => void {
    let subscription = this.subscriptions.get(stream)

    if (!subscription) {
      subscription = { stream, callbacks: new Set() }
      this.subscriptions.set(stream, subscription)

      // Subscribe via WebSocket if connected
      if (this.isConnected()) {
        this.sendSubscribe([stream])
      }
    }

    subscription.callbacks.add(callback as StreamCallback<unknown>)

    // Return unsubscribe function
    return () => {
      const sub = this.subscriptions.get(stream)
      if (sub) {
        sub.callbacks.delete(callback as StreamCallback<unknown>)
        if (sub.callbacks.size === 0) {
          this.subscriptions.delete(stream)
          if (this.isConnected()) {
            this.sendUnsubscribe([stream])
          }
        }
      }
    }
  }

  /**
   * Subscribe to ticker stream
   * Stream: <symbol>@ticker
   */
  subscribeToTicker(
    symbol: string,
    callback: StreamCallback<CryptoPrice>
  ): () => void {
    const stream = `${symbol.toLowerCase()}@ticker`
    return this.subscribe<BinanceWSTicker>(stream, (data) => {
      callback(this.transformTicker(data))
    })
  }

  /**
   * Subscribe to mini ticker stream (more lightweight)
   * Stream: <symbol>@miniTicker
   */
  subscribeToMiniTicker(
    symbol: string,
    callback: StreamCallback<{ symbol: string; price: number; volume: number }>
  ): () => void {
    const stream = `${symbol.toLowerCase()}@miniTicker`
    return this.subscribe<BinanceWSMiniTicker>(stream, (data) => {
      callback({
        symbol: data.s.replace('USDT', ''),
        price: parseFloat(data.c),
        volume: parseFloat(data.v),
      })
    })
  }

  /**
   * Subscribe to order book depth updates
   * Stream: <symbol>@depth@100ms or <symbol>@depth
   */
  subscribeToDepth(
    symbol: string,
    callback: StreamCallback<BinanceWSDepthUpdate>,
    updateSpeed: '100ms' | '1000ms' = '100ms'
  ): () => void {
    const stream = updateSpeed === '100ms'
      ? `${symbol.toLowerCase()}@depth@100ms`
      : `${symbol.toLowerCase()}@depth`
    return this.subscribe<BinanceWSDepthUpdate>(stream, callback)
  }

  /**
   * Subscribe to trade stream
   * Stream: <symbol>@trade
   */
  subscribeToTrades(
    symbol: string,
    callback: StreamCallback<Trade>
  ): () => void {
    const stream = `${symbol.toLowerCase()}@trade`
    return this.subscribe<BinanceWSTrade>(stream, (data) => {
      callback(this.transformTrade(data))
    })
  }

  /**
   * Subscribe to kline/candlestick stream
   * Stream: <symbol>@kline_<interval>
   */
  subscribeToKline(
    symbol: string,
    interval: KlineInterval,
    callback: StreamCallback<BinanceWSKline>
  ): () => void {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`
    return this.subscribe<BinanceWSKline>(stream, callback)
  }

  /**
   * Subscribe to all market tickers
   * Stream: !ticker@arr
   */
  subscribeToAllTickers(
    callback: StreamCallback<CryptoPrice[]>
  ): () => void {
    const stream = '!ticker@arr'
    return this.subscribe<BinanceWSTicker[]>(stream, (data) => {
      callback(data.map(ticker => this.transformTicker(ticker)))
    })
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private handleMessage(rawData: string): void {
    try {
      const message = JSON.parse(rawData)

      // Handle pong response
      if (message.result === null && message.id) {
        this.lastPong = Date.now()
        return
      }

      // Handle combined stream format
      if (message.stream && message.data) {
        const subscription = this.subscriptions.get(message.stream)
        if (subscription) {
          subscription.callbacks.forEach(callback => callback(message.data))
        }
        return
      }

      // Handle single stream format (no stream wrapper)
      // Try to determine stream from event type
      if (message.e) {
        const stream = this.getStreamFromEvent(message)
        if (stream) {
          const subscription = this.subscriptions.get(stream)
          if (subscription) {
            subscription.callbacks.forEach(callback => callback(message))
          }
        }
      }
    } catch (error) {
      console.error('[Binance WS] Failed to parse message:', error)
    }
  }

  private getStreamFromEvent(data: { e: string; s?: string; k?: { i: string } }): string | null {
    const symbol = data.s?.toLowerCase() || ''

    switch (data.e) {
      case '24hrTicker':
        return `${symbol}@ticker`
      case '24hrMiniTicker':
        return `${symbol}@miniTicker`
      case 'depthUpdate':
        return `${symbol}@depth`
      case 'trade':
        return `${symbol}@trade`
      case 'kline':
        return `${symbol}@kline_${data.k?.i || '1m'}`
      default:
        return null
    }
  }

  private sendSubscribe(streams: string[]): void {
    const message = JSON.stringify({
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now(),
    })

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    } else {
      this.messageQueue.push(message)
    }
  }

  private sendUnsubscribe(streams: string[]): void {
    const message = JSON.stringify({
      method: 'UNSUBSCRIBE',
      params: streams,
      id: Date.now(),
    })

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    }
  }

  private startPing(): void {
    this.stopPing()

    // Check for pong timeout
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping as JSON (Binance uses JSON ping/pong)
        this.ws.send(JSON.stringify({ method: 'ping' }))
      }

      // Check if we've received a pong recently
      const timeSinceLastPong = Date.now() - this.lastPong
      if (timeSinceLastPong > this.options.pongTimeout) {
        console.log('[Binance WS] Pong timeout, reconnecting...')
        this.ws?.close(4000, 'Pong timeout')
      }
    }, this.options.pingInterval)

    this.lastPong = Date.now()
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout)
      this.pongTimeout = null
    }
  }

  private attemptReconnect(): void {
    if (this.state === 'disconnected') return
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('[Binance WS] Max reconnect attempts reached')
      this.state = 'disconnected'
      return
    }

    this.state = 'reconnecting'
    this.reconnectAttempts++

    // Exponential backoff with jitter
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    )
    const jitter = delay * 0.3 * Math.random()
    const totalDelay = delay + jitter

    console.log(`[Binance WS] Reconnecting in ${Math.round(totalDelay)}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('[Binance WS] Reconnect failed:', error)
      })
    }, totalDelay)
  }

  // ============================================
  // TRANSFORM HELPERS
  // ============================================

  private transformTicker(data: BinanceWSTicker): CryptoPrice {
    const symbol = data.s.replace('USDT', '')
    return {
      symbol,
      price: parseFloat(data.c),
      change: parseFloat(data.p),
      changePercent: parseFloat(data.P),
      open24h: parseFloat(data.o),
      high24h: parseFloat(data.h),
      low24h: parseFloat(data.l),
      volume24h: parseFloat(data.v),
      quoteVolume24h: parseFloat(data.q),
      bid: parseFloat(data.b),
      ask: parseFloat(data.a),
      vwap: parseFloat(data.w),
      trades24h: data.n,
      dataSource: 'BINANCE',
      tier: 2,
      updatedAt: new Date(data.E),
    }
  }

  private transformTrade(data: BinanceWSTrade): Trade {
    return {
      id: String(data.t),
      pairSymbol: data.s,
      price: parseFloat(data.p),
      quantity: parseFloat(data.q),
      quoteQty: parseFloat(data.p) * parseFloat(data.q),
      time: new Date(data.T),
      isBuyerMaker: data.m,
    }
  }
}

// ============================================
// ORDER BOOK STATE MANAGER
// Maintains local order book from depth updates
// ============================================

export class OrderBookManager {
  private bids: Map<string, number> = new Map()
  private asks: Map<string, number> = new Map()
  private lastUpdateId: number = 0
  private pairSymbol: string

  constructor(pairSymbol: string) {
    this.pairSymbol = pairSymbol
  }

  /**
   * Initialize from REST API snapshot
   */
  initialize(snapshot: { lastUpdateId: number; bids: [string, string][]; asks: [string, string][] }): void {
    this.bids.clear()
    this.asks.clear()
    this.lastUpdateId = snapshot.lastUpdateId

    snapshot.bids.forEach(([price, qty]) => {
      const q = parseFloat(qty)
      if (q > 0) this.bids.set(price, q)
    })

    snapshot.asks.forEach(([price, qty]) => {
      const q = parseFloat(qty)
      if (q > 0) this.asks.set(price, q)
    })
  }

  /**
   * Apply incremental update from WebSocket
   */
  update(data: BinanceWSDepthUpdate): boolean {
    // Validate update sequence
    if (data.u <= this.lastUpdateId) {
      return false // Already processed
    }

    // Apply bid updates
    data.b.forEach(([price, qty]) => {
      const q = parseFloat(qty)
      if (q === 0) {
        this.bids.delete(price)
      } else {
        this.bids.set(price, q)
      }
    })

    // Apply ask updates
    data.a.forEach(([price, qty]) => {
      const q = parseFloat(qty)
      if (q === 0) {
        this.asks.delete(price)
      } else {
        this.asks.set(price, q)
      }
    })

    this.lastUpdateId = data.u
    return true
  }

  /**
   * Get current order book snapshot
   */
  getOrderBook(levels: number = 20): OrderBook {
    // Sort and limit bids (highest first)
    const sortedBids = Array.from(this.bids.entries())
      .map(([p, q]) => [parseFloat(p), q] as [number, number])
      .sort((a, b) => b[0] - a[0])
      .slice(0, levels)

    // Sort and limit asks (lowest first)
    const sortedAsks = Array.from(this.asks.entries())
      .map(([p, q]) => [parseFloat(p), q] as [number, number])
      .sort((a, b) => a[0] - b[0])
      .slice(0, levels)

    // Build levels with cumulative totals
    let bidTotal = 0
    const bids: OrderBookLevel[] = sortedBids.map(([price, quantity]) => {
      bidTotal += quantity
      return { price, quantity, total: bidTotal }
    })

    let askTotal = 0
    const asks: OrderBookLevel[] = sortedAsks.map(([price, quantity]) => {
      askTotal += quantity
      return { price, quantity, total: askTotal }
    })

    const bestBid = bids[0]?.price || 0
    const bestAsk = asks[0]?.price || 0
    const spread = bestAsk - bestBid
    const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0

    const totalVolume = bidTotal + askTotal
    const buyPressure = totalVolume > 0 ? (bidTotal / totalVolume) * 100 : 50
    const imbalance = totalVolume > 0 ? ((bidTotal - askTotal) / totalVolume) * 100 : 0

    return {
      pairSymbol: this.pairSymbol,
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
      lastUpdateId: this.lastUpdateId,
      updatedAt: new Date(),
    }
  }

  /**
   * Clear the order book
   */
  clear(): void {
    this.bids.clear()
    this.asks.clear()
    this.lastUpdateId = 0
  }
}

// ============================================
// TRADE BUFFER (Circular Buffer)
// ============================================

export class TradeBuffer {
  private buffer: Trade[]
  private head: number = 0
  private size: number = 0
  private capacity: number

  constructor(capacity: number = 50) {
    this.capacity = capacity
    this.buffer = new Array(capacity)
  }

  /**
   * Add a new trade
   */
  push(trade: Trade): void {
    this.buffer[this.head] = trade
    this.head = (this.head + 1) % this.capacity
    this.size = Math.min(this.size + 1, this.capacity)
  }

  /**
   * Get all trades (newest first)
   */
  getAll(): Trade[] {
    if (this.size === 0) return []

    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size).reverse()
    }

    // Full buffer: wrap around
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ].reverse()
  }

  /**
   * Get last trade
   */
  getLast(): Trade | null {
    if (this.size === 0) return null
    const index = (this.head - 1 + this.capacity) % this.capacity
    return this.buffer[index]
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = new Array(this.capacity)
    this.head = 0
    this.size = 0
  }

  /**
   * Get current size
   */
  getSize(): number {
    return this.size
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const binanceWs = new BinanceWebSocketManager()

// Also export classes for custom instances
export { BinanceWebSocketManager as BinanceWS }

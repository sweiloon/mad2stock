"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { useBinanceOrderBook, useOrderBookImbalance } from "@/hooks/use-binance-order-book"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown } from "lucide-react"

// ============================================
// TYPES
// ============================================

interface CryptoOrderBookProps {
  symbol: string
  levels?: number
  showImbalance?: boolean
}

// ============================================
// FORMATTING
// ============================================

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (price >= 1) return price.toFixed(2)
  if (price >= 0.01) return price.toFixed(4)
  return price.toFixed(8)
}

function formatQuantity(qty: number): string {
  if (qty >= 1000) return qty.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (qty >= 1) return qty.toFixed(4)
  return qty.toFixed(8)
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CryptoOrderBook({
  symbol,
  levels = 15,
  showImbalance = true,
}: CryptoOrderBookProps) {
  const {
    bids,
    asks,
    spread,
    spreadPercent,
    midPrice,
    isConnected,
    lastUpdate,
  } = useBinanceOrderBook(symbol, { levels })

  const { imbalance, signal } = useOrderBookImbalance(symbol, { levels })

  // Calculate max quantities for bar sizing
  const maxBidQty = useMemo(() => Math.max(...bids.map(b => b.quantity), 0), [bids])
  const maxAskQty = useMemo(() => Math.max(...asks.map(a => a.quantity), 0), [asks])
  const maxQty = Math.max(maxBidQty, maxAskQty)

  // Order book is not available (Binance geo-blocked)
  // Show a message instead of loading skeleton
  if (bids.length === 0 && asks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm font-medium">Order Book Not Available</p>
        <p className="text-xs mt-1">Real-time order book data requires Binance WebSocket</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Imbalance Indicator */}
      {showImbalance && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Order Book Imbalance</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  imbalance > 0 ? "bg-green-500" : "bg-red-500"
                )}
                style={{
                  width: `${Math.abs(imbalance) * 50 + 50}%`,
                  marginLeft: imbalance < 0 ? `${50 + imbalance * 50}%` : 0,
                }}
              />
            </div>
            <span
              className={cn(
                "font-medium",
                signal === "STRONG_BUY" || signal === "BUY"
                  ? "text-green-600"
                  : signal === "STRONG_SELL" || signal === "SELL"
                  ? "text-red-600"
                  : "text-muted-foreground"
              )}
            >
              {signal.replace("_", " ")}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium">
        <span>Price</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sells) - Reversed to show highest at top */}
      <div className="space-y-0.5">
        {[...asks].reverse().map((ask, i) => (
          <OrderBookRow
            key={`ask-${i}`}
            price={ask.price}
            quantity={ask.quantity}
            total={ask.total}
            maxQty={maxQty}
            side="ask"
          />
        ))}
      </div>

      {/* Spread */}
      <div className="flex items-center justify-between py-2 px-2 bg-muted/50 rounded text-sm">
        <span className="text-muted-foreground">Spread</span>
        <span className="font-mono">
          {formatPrice(spread)} ({spreadPercent.toFixed(4)}%)
        </span>
      </div>

      {/* Bids (Buys) */}
      <div className="space-y-0.5">
        {bids.map((bid, i) => (
          <OrderBookRow
            key={`bid-${i}`}
            price={bid.price}
            quantity={bid.quantity}
            total={bid.total}
            maxQty={maxQty}
            side="bid"
          />
        ))}
      </div>

      {/* Footer */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground text-center">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// ============================================
// ORDER BOOK ROW
// ============================================

function OrderBookRow({
  price,
  quantity,
  total,
  maxQty,
  side,
}: {
  price: number
  quantity: number
  total: number
  maxQty: number
  side: "bid" | "ask"
}) {
  const barWidth = maxQty > 0 ? (quantity / maxQty) * 100 : 0

  return (
    <div className="relative">
      {/* Background bar */}
      <div
        className={cn(
          "absolute inset-0 opacity-20 transition-all",
          side === "bid" ? "bg-green-500" : "bg-red-500"
        )}
        style={{
          width: `${barWidth}%`,
          right: 0,
          left: "auto",
        }}
      />

      {/* Content */}
      <div className="relative grid grid-cols-3 py-1 px-1 text-sm font-mono">
        <span className={side === "bid" ? "text-green-600" : "text-red-600"}>
          {formatPrice(price)}
        </span>
        <span className="text-right">{formatQuantity(quantity)}</span>
        <span className="text-right text-muted-foreground">
          {formatQuantity(total)}
        </span>
      </div>
    </div>
  )
}

// ============================================
// COMPACT ORDER BOOK
// ============================================

export function CompactOrderBook({
  symbol,
  levels = 5,
}: {
  symbol: string
  levels?: number
}) {
  const { bids, asks, spread, spreadPercent } = useBinanceOrderBook(symbol, { levels })

  return (
    <div className="space-y-2">
      {/* Best Ask */}
      {asks[0] && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-red-600 font-mono">{formatPrice(asks[0].price)}</span>
          <span className="text-muted-foreground text-xs">Best Ask</span>
        </div>
      )}

      {/* Spread */}
      <div className="text-center text-xs text-muted-foreground">
        Spread: {formatPrice(spread)} ({spreadPercent.toFixed(3)}%)
      </div>

      {/* Best Bid */}
      {bids[0] && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600 font-mono">{formatPrice(bids[0].price)}</span>
          <span className="text-muted-foreground text-xs">Best Bid</span>
        </div>
      )}
    </div>
  )
}

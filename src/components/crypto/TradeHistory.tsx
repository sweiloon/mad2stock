"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { useBinanceTrades, useTradeFlow } from "@/hooks/use-binance-trades"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

// ============================================
// TYPES
// ============================================

interface CryptoTradeHistoryProps {
  symbol: string
  maxTrades?: number
  showFlow?: boolean
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
  return qty.toFixed(6)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CryptoTradeHistory({
  symbol,
  maxTrades = 30,
  showFlow = true,
}: CryptoTradeHistoryProps) {
  const { trades, lastTrade, isConnected, lastUpdate, stats } = useBinanceTrades(
    symbol,
    { maxTrades }
  )

  const { trend, intensity, flowRatio, netFlow } = useTradeFlow(symbol, {
    maxTrades,
    windowMs: 60000, // 1 minute window
  })

  if (!isConnected && trades.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Trade Flow Indicator */}
      {showFlow && trades.length > 0 && (
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Trade Flow</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Flow Visualization */}
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500"
                style={{ width: `${(flowRatio / (flowRatio + 1)) * 100}%` }}
              />
              <div
                className="h-full bg-red-500"
                style={{ width: `${(1 / (flowRatio + 1)) * 100}%` }}
              />
            </div>
            <span
              className={cn(
                "font-medium text-xs",
                trend === "BUYING"
                  ? "text-green-600"
                  : trend === "SELLING"
                  ? "text-red-600"
                  : "text-muted-foreground"
              )}
            >
              {trend}
              {intensity === "HIGH" && " 🔥"}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium px-1">
        <span>Price</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Value</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trade List */}
      <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
        {trades.map((trade, i) => (
          <TradeRow
            key={trade.id}
            price={trade.price}
            quantity={trade.quantity}
            side={trade.isBuyerMaker ? "sell" : "buy"}
            time={trade.time}
            isNew={i === 0 && lastUpdate !== null && Date.now() - lastUpdate.getTime() < 1000}
          />
        ))}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Buys:</span>
          <span className="text-green-600 font-medium">{stats.buyCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sells:</span>
          <span className="text-red-600 font-medium">{stats.sellCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Buy Vol:</span>
          <span className="font-mono text-green-600">{formatQuantity(stats.buyVolume)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sell Vol:</span>
          <span className="font-mono text-red-600">{formatQuantity(stats.sellVolume)}</span>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground text-center">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// ============================================
// TRADE ROW
// ============================================

function TradeRow({
  price,
  quantity,
  side,
  time,
  isNew,
}: {
  price: number
  quantity: number
  side: "buy" | "sell"
  time: Date
  isNew?: boolean
}) {
  const value = price * quantity

  return (
    <div
      className={cn(
        "grid grid-cols-4 py-1 px-1 text-sm font-mono rounded transition-colors",
        isNew && "bg-amber-100 dark:bg-amber-900/30"
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1",
          side === "buy" ? "text-green-600" : "text-red-600"
        )}
      >
        {side === "buy" ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {formatPrice(price)}
      </span>
      <span className="text-right">{formatQuantity(quantity)}</span>
      <span className="text-right text-muted-foreground">
        ${value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(2)}
      </span>
      <span className="text-right text-muted-foreground text-xs">
        {formatTime(time)}
      </span>
    </div>
  )
}

// ============================================
// COMPACT TRADE HISTORY
// ============================================

export function CompactTradeHistory({
  symbol,
  maxTrades = 5,
}: {
  symbol: string
  maxTrades?: number
}) {
  const { trades, lastTrade } = useBinanceTrades(symbol, { maxTrades })

  return (
    <div className="space-y-1">
      {trades.slice(0, maxTrades).map((trade) => (
        <div
          key={trade.id}
          className="flex items-center justify-between text-xs"
        >
          <span
            className={cn(
              "font-mono",
              !trade.isBuyerMaker ? "text-green-600" : "text-red-600"
            )}
          >
            {formatPrice(trade.price)}
          </span>
          <span className="text-muted-foreground">
            {formatQuantity(trade.quantity)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// LARGE TRADE ALERT
// ============================================

export function LargeTradeAlert({
  symbol,
  threshold = 10000,
}: {
  symbol: string
  threshold?: number
}) {
  const { trades } = useBinanceTrades(symbol, { maxTrades: 100 })

  const largeTrades = useMemo(() => {
    return trades
      .filter((t) => t.price * t.quantity >= threshold)
      .slice(0, 5)
  }, [trades, threshold])

  if (largeTrades.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium flex items-center gap-2">
        🐋 Large Trades ({`>$${threshold.toLocaleString()}`})
      </div>
      <div className="space-y-1">
        {largeTrades.map((trade) => (
          <div
            key={trade.id}
            className={cn(
              "flex items-center justify-between p-2 rounded text-sm",
              !trade.isBuyerMaker
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            )}
          >
            <span className="font-medium">
              {!trade.isBuyerMaker ? "🟢 BUY" : "🔴 SELL"}
            </span>
            <span className="font-mono">
              ${(trade.price * trade.quantity).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatTime(trade.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

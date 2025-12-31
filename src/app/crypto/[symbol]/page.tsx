"use client"

import { use } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  Activity,
  BookOpen,
  LineChart,
  Signal,
  BarChart3,
  Clock,
  DollarSign,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Hooks
import { useBinanceTicker } from "@/hooks/use-binance-ticker"
import { useBinanceOrderBook } from "@/hooks/use-binance-order-book"
import { useBinanceTrades } from "@/hooks/use-binance-trades"
import { useCryptoChart, useTechnicalIndicators } from "@/hooks/use-crypto-chart"

// Lib
import { getCoinTier, getCoinCategory } from "@/lib/crypto"

// Components (will be created)
import { CryptoOrderBook } from "@/components/crypto/OrderBook"
import { CryptoTradeHistory } from "@/components/crypto/TradeHistory"
import { CryptoChart } from "@/components/crypto/CryptoChart"
import { TradingPairSelector } from "@/components/crypto/TradingPairSelector"

// ============================================
// TYPES
// ============================================

interface PageProps {
  params: Promise<{ symbol: string }>
}

// ============================================
// FORMATTING HELPERS
// ============================================

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (price >= 1) return `$${price.toFixed(2)}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  return `$${price.toFixed(8)}`
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`
  return `$${volume.toFixed(2)}`
}

function formatPercent(percent: number): string {
  const sign = percent >= 0 ? "+" : ""
  return `${sign}${percent.toFixed(2)}%`
}

// ============================================
// CATEGORY STYLES
// ============================================

const CATEGORY_STYLES: Record<string, { color: string; icon: string }> = {
  Layer1: { color: "bg-blue-100 text-blue-700", icon: "⛓️" },
  Layer2: { color: "bg-purple-100 text-purple-700", icon: "🔗" },
  DeFi: { color: "bg-green-100 text-green-700", icon: "💰" },
  Meme: { color: "bg-yellow-100 text-yellow-700", icon: "🐕" },
  Gaming: { color: "bg-pink-100 text-pink-700", icon: "🎮" },
  Exchange: { color: "bg-orange-100 text-orange-700", icon: "🏦" },
  Payments: { color: "bg-cyan-100 text-cyan-700", icon: "💳" },
  Oracle: { color: "bg-indigo-100 text-indigo-700", icon: "🔮" },
  Storage: { color: "bg-teal-100 text-teal-700", icon: "💾" },
  Infrastructure: { color: "bg-slate-100 text-slate-700", icon: "🏗️" },
  Privacy: { color: "bg-gray-100 text-gray-700", icon: "🔒" },
  AI: { color: "bg-violet-100 text-violet-700", icon: "🤖" },
  IoT: { color: "bg-emerald-100 text-emerald-700", icon: "📡" },
  Other: { color: "bg-neutral-100 text-neutral-700", icon: "🪙" },
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CryptoProfilePage({ params }: PageProps) {
  const resolvedParams = use(params)
  const symbol = resolvedParams.symbol.toUpperCase()
  const tier = getCoinTier(symbol)
  const category = getCoinCategory(symbol)

  // Real-time ticker data
  const { ticker, isConnected, lastUpdate } = useBinanceTicker(symbol, {
    throttleMs: 500,
  })

  // Order book data
  const { orderBook, spread, spreadPercent, midPrice, isConnected: orderBookConnected } = useBinanceOrderBook(symbol, {
    levels: 15,
  })

  // Trade history
  const { trades, lastTrade, stats: tradeStats, isConnected: tradesConnected } = useBinanceTrades(symbol, {
    maxTrades: 50,
  })

  // Chart data
  const { klines, isLoading: chartLoading, latestPrice, priceChange, priceChangePercent } = useCryptoChart(symbol, {
    interval: "1h",
    limit: 200,
  })

  // Technical indicators
  const indicators = useTechnicalIndicators(klines)

  const isLive = isConnected || orderBookConnected || tradesConnected

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Link href="/crypto">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{symbol}</h1>
                <Badge
                  variant="secondary"
                  className={CATEGORY_STYLES[category]?.color || "bg-neutral-100"}
                >
                  {CATEGORY_STYLES[category]?.icon || "🪙"} {category}
                </Badge>
                <Badge variant="outline">Tier {tier}</Badge>
              </div>

              {/* Price Display */}
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-bold font-mono">
                  {ticker ? formatPrice(ticker.price) : <Skeleton className="h-10 w-32" />}
                </span>
                {ticker && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-lg font-medium",
                      ticker.changePercent > 0
                        ? "text-green-600"
                        : ticker.changePercent < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {ticker.changePercent > 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : ticker.changePercent < 0 ? (
                      <TrendingDown className="h-5 w-5" />
                    ) : (
                      <Minus className="h-5 w-5" />
                    )}
                    {formatPercent(ticker.changePercent)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                isLive
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {isLive ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <span className="animate-pulse">●</span> Live
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  Connecting...
                </>
              )}
            </div>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetricCard
            icon={<DollarSign className="h-4 w-4" />}
            label="24h High"
            value={ticker ? formatPrice(ticker.high24h) : "-"}
            className="text-green-600"
          />
          <MetricCard
            icon={<DollarSign className="h-4 w-4" />}
            label="24h Low"
            value={ticker ? formatPrice(ticker.low24h) : "-"}
            className="text-red-600"
          />
          <MetricCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="24h Volume"
            value={ticker ? formatVolume(ticker.quoteVolume24h) : "-"}
          />
          <MetricCard
            icon={<Activity className="h-4 w-4" />}
            label="Spread"
            value={spreadPercent ? `${spreadPercent.toFixed(4)}%` : "-"}
          />
          <MetricCard
            icon={<Zap className="h-4 w-4" />}
            label="24h Trades"
            value={ticker?.trades24h?.toLocaleString() || "-"}
          />
          <MetricCard
            icon={<Clock className="h-4 w-4" />}
            label="Mid Price"
            value={midPrice ? formatPrice(midPrice) : "-"}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="signals" className="flex items-center gap-2">
              <Signal className="h-4 w-4" />
              Signals
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Price Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CryptoChart symbol={symbol} klines={klines} isLoading={chartLoading} />
                </CardContent>
              </Card>

              {/* Technical Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {klines.length > 0 ? (
                    <>
                      <IndicatorRow
                        label="RSI (14)"
                        value={indicators.rsi14[indicators.rsi14.length - 1]?.toFixed(2) || "-"}
                        signal={
                          indicators.rsi14[indicators.rsi14.length - 1] > 70
                            ? "Overbought"
                            : indicators.rsi14[indicators.rsi14.length - 1] < 30
                            ? "Oversold"
                            : "Neutral"
                        }
                      />
                      <IndicatorRow
                        label="MACD"
                        value={indicators.macd.macd[indicators.macd.macd.length - 1]?.toFixed(4) || "-"}
                        signal={
                          indicators.macd.histogram[indicators.macd.histogram.length - 1] > 0
                            ? "Bullish"
                            : "Bearish"
                        }
                      />
                      <IndicatorRow
                        label="SMA 20"
                        value={formatPrice(indicators.sma20[indicators.sma20.length - 1] || 0)}
                        signal={
                          ticker && ticker.price > indicators.sma20[indicators.sma20.length - 1]
                            ? "Above"
                            : "Below"
                        }
                      />
                      <IndicatorRow
                        label="SMA 50"
                        value={formatPrice(indicators.sma50[indicators.sma50.length - 1] || 0)}
                        signal={
                          ticker && ticker.price > indicators.sma50[indicators.sma50.length - 1]
                            ? "Above"
                            : "Below"
                        }
                      />
                      <IndicatorRow
                        label="BB Upper"
                        value={formatPrice(indicators.bollingerBands.upper[indicators.bollingerBands.upper.length - 1] || 0)}
                      />
                      <IndicatorRow
                        label="BB Lower"
                        value={formatPrice(indicators.bollingerBands.lower[indicators.bollingerBands.lower.length - 1] || 0)}
                      />
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">Loading indicators...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Order Book */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Order Book
                    {orderBookConnected && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Live
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CryptoOrderBook symbol={symbol} />
                </CardContent>
              </Card>

              {/* Trade History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Trades
                    {tradesConnected && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Live
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CryptoTradeHistory symbol={symbol} />
                </CardContent>
              </Card>
            </div>

            {/* Trade Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Trade Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Buy Volume</p>
                    <p className="text-lg font-semibold text-green-600">
                      {tradeStats.buyVolume.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sell Volume</p>
                    <p className="text-lg font-semibold text-red-600">
                      {tradeStats.sellVolume.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">VWAP</p>
                    <p className="text-lg font-semibold">
                      {formatPrice(tradeStats.vwap)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Buy/Sell Ratio</p>
                    <p className="text-lg font-semibold">
                      {tradeStats.sellCount > 0
                        ? (tradeStats.buyCount / tradeStats.sellCount).toFixed(2)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Signal className="h-5 w-5" />
                  AI Trading Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI-generated trading signals for {symbol} will be displayed here.
                </p>
                {/* TODO: Implement signals display */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    Signals are generated every 15 minutes for top 20 coins.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4">
                <p className="text-sm text-amber-800">
                  <strong>Disclaimer:</strong> This information is for educational purposes only and
                  should not be considered as investment advice. Past performance does not guarantee
                  future results. Always do your own research and consult a licensed financial advisor
                  before making investment decisions. Trading involves risk of capital loss.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function MetricCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <p className={cn("text-xl font-semibold mt-1 font-mono", className)}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function IndicatorRow({
  label,
  value,
  signal,
}: {
  label: string
  value: string
  signal?: string
}) {
  const signalColor =
    signal === "Bullish" || signal === "Above" || signal === "Oversold"
      ? "text-green-600"
      : signal === "Bearish" || signal === "Below" || signal === "Overbought"
      ? "text-red-600"
      : "text-muted-foreground"

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="font-mono text-sm">{value}</span>
        {signal && (
          <span className={cn("ml-2 text-xs", signalColor)}>{signal}</span>
        )}
      </div>
    </div>
  )
}

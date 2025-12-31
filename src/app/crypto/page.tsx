"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  RefreshCw,
  Wifi,
  WifiOff,
  Minus,
  Bitcoin,
  Coins,
  Activity,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAllCryptoPrices } from "@/hooks/use-crypto-prices"
import {
  CRYPTO_CATEGORIES,
  getCoinCategory,
  getCoinTier,
  type CryptoCategoryName,
} from "@/lib/crypto"

// ============================================
// TYPES
// ============================================

interface CoinDisplay {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume24h: number
  high24h: number
  low24h: number
  tier: 1 | 2 | 3
  category: CryptoCategoryName | 'Other'
}

type ViewMode = "table" | "cards"
type SortField = "symbol" | "price" | "changePercent" | "volume24h" | "tier"

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

const TIER_LABELS = {
  1: { label: "Top 20", color: "bg-amber-100 text-amber-700" },
  2: { label: "Top 50", color: "bg-slate-100 text-slate-700" },
  3: { label: "Top 100", color: "bg-neutral-100 text-neutral-600" },
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
// MAIN COMPONENT
// ============================================

export default function CryptoPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [tierFilter, setTierFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [sortField, setSortField] = useState<SortField>("tier")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Fetch crypto prices with real-time updates
  const {
    prices,
    count,
    isLoading,
    error,
    isRealtimeConnected,
    lastUpdate,
    refetch,
  } = useAllCryptoPrices({ realtime: true })

  // Transform prices to display format
  const coins = useMemo((): CoinDisplay[] => {
    return Array.from(prices.values()).map((p) => ({
      symbol: p.symbol,
      price: p.price,
      change: p.change,
      changePercent: p.changePercent,
      volume24h: p.quoteVolume24h,
      high24h: p.high24h,
      low24h: p.low24h,
      tier: getCoinTier(p.symbol),
      category: getCoinCategory(p.symbol),
    }))
  }, [prices])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(coins.map((c) => c.category))
    return Array.from(cats).sort()
  }, [coins])

  // Filter and sort coins
  const filteredCoins = useMemo(() => {
    return coins
      .filter((coin) => {
        const matchesSearch =
          coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory =
          categoryFilter === "all" || coin.category === categoryFilter

        const matchesTier =
          tierFilter === "all" || coin.tier === parseInt(tierFilter)

        return matchesSearch && matchesCategory && matchesTier
      })
      .sort((a, b) => {
        let aVal: number | string
        let bVal: number | string

        switch (sortField) {
          case "price":
            aVal = a.price
            bVal = b.price
            break
          case "changePercent":
            aVal = a.changePercent
            bVal = b.changePercent
            break
          case "volume24h":
            aVal = a.volume24h
            bVal = b.volume24h
            break
          case "tier":
            aVal = a.tier
            bVal = b.tier
            break
          default:
            aVal = a.symbol
            bVal = b.symbol
        }

        if (sortDirection === "asc") {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
  }, [coins, searchQuery, categoryFilter, tierFilter, sortField, sortDirection])

  // Stats
  const gainers = coins.filter((c) => c.changePercent > 0).length
  const losers = coins.filter((c) => c.changePercent < 0).length
  const totalVolume = coins.reduce((sum, c) => sum + c.volume24h, 0)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Bitcoin className="h-6 w-6 text-amber-500" />
              Cryptocurrency Market
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time prices for top 100 cryptocurrencies
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                isRealtimeConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {isRealtimeConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isRealtimeConnected ? "Live" : "Connecting..."}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-1.5", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Coins</span>
              </div>
              <p className="text-2xl font-semibold mt-1">{count}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Gainers</span>
              </div>
              <p className="text-2xl font-semibold mt-1 text-green-600">
                {gainers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Losers</span>
              </div>
              <p className="text-2xl font-semibold mt-1 text-red-600">
                {losers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">24h Volume</span>
              </div>
              <p className="text-2xl font-semibold mt-1">
                {formatVolume(totalVolume)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_STYLES[cat]?.icon || "🪙"} {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tier Filter */}
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="1">Top 20</SelectItem>
                  <SelectItem value="2">Top 50</SelectItem>
                  <SelectItem value="3">Top 100</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredCoins.length} of {count} cryptocurrencies
              {lastUpdate && (
                <span className="ml-2">
                  • Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-red-500">Error: {error}</p>
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <CryptoTable
            coins={filteredCoins}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        ) : (
          <CryptoCards coins={filteredCoins} />
        )}
      </div>
    </MainLayout>
  )
}

// ============================================
// TABLE VIEW
// ============================================

function CryptoTable({
  coins,
  sortField,
  sortDirection,
  onSort,
}: {
  coins: CoinDisplay[]
  sortField: SortField
  sortDirection: "asc" | "desc"
  onSort: (field: SortField) => void
}) {
  const SortHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField
    children: React.ReactNode
    className?: string
  }) => (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50", className)}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </TableHead>
  )

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader field="tier" className="w-[80px]">
              Tier
            </SortHeader>
            <SortHeader field="symbol">Symbol</SortHeader>
            <SortHeader field="price" className="text-right">
              Price
            </SortHeader>
            <SortHeader field="changePercent" className="text-right">
              24h Change
            </SortHeader>
            <SortHeader field="volume24h" className="text-right">
              24h Volume
            </SortHeader>
            <TableHead className="text-right">24h Range</TableHead>
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coins.map((coin) => (
            <TableRow key={coin.symbol} className="hover:bg-muted/50">
              <TableCell>
                <Badge
                  variant="secondary"
                  className={TIER_LABELS[coin.tier].color}
                >
                  {coin.tier}
                </Badge>
              </TableCell>
              <TableCell>
                <Link
                  href={`/crypto/${coin.symbol.toLowerCase()}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {coin.symbol}
                </Link>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatPrice(coin.price)}
              </TableCell>
              <TableCell className="text-right">
                <div
                  className={cn(
                    "flex items-center justify-end gap-1",
                    coin.changePercent > 0
                      ? "text-green-600"
                      : coin.changePercent < 0
                      ? "text-red-600"
                      : "text-muted-foreground"
                  )}
                >
                  {coin.changePercent > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : coin.changePercent < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {formatPercent(coin.changePercent)}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {formatVolume(coin.volume24h)}
              </TableCell>
              <TableCell className="text-right">
                <div className="text-xs text-muted-foreground">
                  <span className="text-red-500">
                    {formatPrice(coin.low24h)}
                  </span>
                  <span className="mx-1">-</span>
                  <span className="text-green-500">
                    {formatPrice(coin.high24h)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    CATEGORY_STYLES[coin.category]?.color || "bg-neutral-100"
                  }
                >
                  {CATEGORY_STYLES[coin.category]?.icon || "🪙"} {coin.category}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

// ============================================
// CARDS VIEW
// ============================================

function CryptoCards({ coins }: { coins: CoinDisplay[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {coins.map((coin) => (
        <Link key={coin.symbol} href={`/crypto/${coin.symbol.toLowerCase()}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={TIER_LABELS[coin.tier].color}
                  >
                    T{coin.tier}
                  </Badge>
                  <CardTitle className="text-lg">{coin.symbol}</CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    CATEGORY_STYLES[coin.category]?.color || "bg-neutral-100"
                  }
                >
                  {CATEGORY_STYLES[coin.category]?.icon || "🪙"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold font-mono">
                    {formatPrice(coin.price)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      coin.changePercent > 0
                        ? "text-green-600"
                        : coin.changePercent < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {coin.changePercent > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : coin.changePercent < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {formatPercent(coin.changePercent)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Volume: {formatVolume(coin.volume24h)}</span>
                </div>

                {/* Mini range bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400"
                    style={{
                      width: `${
                        coin.high24h !== coin.low24h
                          ? ((coin.price - coin.low24h) /
                              (coin.high24h - coin.low24h)) *
                            100
                          : 50
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(coin.low24h)}</span>
                  <span>{formatPrice(coin.high24h)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

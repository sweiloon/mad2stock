"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Top Malaysian blue-chip stocks (same as TradingView widget was showing)
const TOP_STOCKS = [
  { code: "MAYBANK", stockCode: "1155", name: "Maybank" },
  { code: "PBBANK", stockCode: "1295", name: "Public Bank" },
  { code: "GENTING", stockCode: "4715", name: "Genting" },
  { code: "AXIATA", stockCode: "6888", name: "Axiata" },
  { code: "TM", stockCode: "4863", name: "Telekom" },
  { code: "IHH", stockCode: "5225", name: "IHH Healthcare" },
  { code: "GENM", stockCode: "3182", name: "Genting Malaysia" },
  { code: "PCHEM", stockCode: "5183", name: "Petronas Chem" },
]

interface StockQuoteData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  dayHigh: number
  dayLow: number
}

interface MarketOverviewCardProps {
  className?: string
}

export function MarketOverviewCard({ className }: MarketOverviewCardProps) {
  const [stockData, setStockData] = useState<Map<string, StockQuoteData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStockData = useCallback(async () => {
    try {
      const symbols = TOP_STOCKS.map(s => s.stockCode).join(',')
      const response = await fetch(`/api/stocks/quote?symbols=${symbols}`)

      if (!response.ok) {
        throw new Error('Failed to fetch stock data')
      }

      const data = await response.json()

      if (data.quotes) {
        const newStockData = new Map<string, StockQuoteData>()
        Object.entries(data.quotes).forEach(([code, quote]: [string, unknown]) => {
          const q = quote as StockQuoteData
          newStockData.set(code, q)
        })
        setStockData(newStockData)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStockData()

    // Refresh data every 5 minutes
    const interval = setInterval(fetchStockData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchStockData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStockData()
  }

  // Calculate market summary
  const marketSummary = (() => {
    if (stockData.size === 0) return { gainers: 0, losers: 0, unchanged: 0 }

    let gainers = 0, losers = 0, unchanged = 0
    stockData.forEach(stock => {
      if (stock.changePercent > 0) gainers++
      else if (stock.changePercent < 0) losers++
      else unchanged++
    })
    return { gainers, losers, unchanged }
  })()

  return (
    <Card className={cn("trading-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Market Overview</CardTitle>
              <p className="text-xs text-muted-foreground">Top Malaysian blue-chip stocks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Market Summary Bar */}
        {!loading && stockData.size > 0 && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-profit" />
              <span className="text-xs text-muted-foreground">Gainers:</span>
              <span className="text-xs font-medium text-profit">{marketSummary.gainers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-loss" />
              <span className="text-xs text-muted-foreground">Losers:</span>
              <span className="text-xs font-medium text-loss">{marketSummary.losers}</span>
            </div>
            {marketSummary.unchanged > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">Unchanged:</span>
                <span className="text-xs font-medium">{marketSummary.unchanged}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {TOP_STOCKS.map((stock) => {
              const data = stockData.get(stock.stockCode)
              const isPositive = data ? data.changePercent >= 0 : false
              const hasData = !!data && data.price > 0

              return (
                <Link
                  key={stock.code}
                  href={`/companies/${stock.code}`}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded flex items-center justify-center text-xs font-bold",
                      hasData && isPositive ? "bg-profit/10 text-profit" :
                      hasData && !isPositive ? "bg-loss/10 text-loss" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {hasData ? (
                        isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                      ) : (
                        <BarChart2 className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{stock.name}</span>
                        <span className="text-[10px] text-muted-foreground">{stock.stockCode}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stock.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasData ? (
                      <>
                        <div className="text-right">
                          <div className="text-sm font-medium tabular-nums">
                            RM {data.price.toFixed(data.price < 1 ? 3 : 2)}
                          </div>
                          <div className={cn(
                            "flex items-center justify-end gap-0.5 text-xs tabular-nums",
                            isPositive ? "text-profit" : "text-loss"
                          )}>
                            {isPositive ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {isPositive ? "+" : ""}{data.changePercent.toFixed(2)}%
                          </div>
                        </div>

                        {/* Mini price bar visualization */}
                        <div className="hidden sm:flex flex-col gap-0.5 w-12">
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                isPositive ? "bg-profit" : "bg-loss"
                              )}
                              style={{
                                width: `${Math.min(Math.abs(data.changePercent) * 10, 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground text-center">
                            {data.change >= 0 ? "+" : ""}{data.change.toFixed(2)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">--</div>
                        <div className="text-xs text-muted-foreground">No data</div>
                      </div>
                    )}

                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* View All Link */}
        <div className="mt-4 pt-3 border-t border-border">
          <Link
            href="/companies"
            className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All Companies
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

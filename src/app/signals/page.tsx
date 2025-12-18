"use client"

import { useState, useEffect, useCallback } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Zap,
  Brain,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Import signal components
import { SignalCard } from "@/components/signals/SignalCard"
import {
  SignalFilters,
  SignalFilterSummary,
  DEFAULT_FILTERS,
  type SignalFiltersState,
} from "@/components/signals/SignalFilters"
import {
  SignalStatsBar,
  SignalEmptyState,
  SignalDisclaimer,
} from "@/components/signals/SignalStats"
import { useAuth } from "@/components/auth/AuthProvider"
import { BlurredContent } from "@/components/auth/BlurredContent"

// ============================================================================
// TYPES
// ============================================================================

interface Signal {
  id: string
  signal_code: string
  stock_code: string
  company_name: string
  sector: string
  signal_type: "BUY" | "SELL" | "HOLD"
  confidence_level: number
  strength: "Strong" | "Moderate" | "Weak"
  entry_price: number | null
  target_price: number | null
  stop_loss: number | null
  current_price: number | null
  potential_gain_pct: number | null
  risk_reward_ratio: number | null
  time_horizon: "Intraday" | "Short-term" | "Medium-term" | "Long-term"
  valid_until: string | null
  summary: string
  reasoning: string[]
  key_catalysts: string[]
  risks: string[]
  data_quality_score: number | null
  sources?: any[]
  generated_at: string
  status: string
}

interface SignalStats {
  totalActive: number
  byType: { BUY: number; SELL: number; HOLD: number }
  byStatus: { active: number; hit_target: number; hit_stoploss: number; expired: number }
  performance: {
    win_rate: number | null
    avg_gain_pct: number | null
    avg_loss_pct: number | null
    profit_factor: number | null
  } | null
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function SignalsPage() {
  const { user } = useAuth()
  const [signals, setSignals] = useState<Signal[]>([])
  const [stats, setStats] = useState<SignalStats | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })
  const [filters, setFilters] = useState<SignalFiltersState>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sectors, setSectors] = useState<string[]>([])

  // Fetch signals
  const fetchSignals = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      else setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (filters.type !== "all") params.set("type", filters.type)
      if (filters.status !== "all") params.set("status", filters.status)
      if (filters.sector !== "all") params.set("sector", filters.sector)
      if (filters.strength !== "all") params.set("strength", filters.strength)
      if (filters.timeHorizon !== "all") params.set("horizon", filters.timeHorizon)
      if (filters.minConfidence && filters.minConfidence !== "any") params.set("minConfidence", filters.minConfidence)
      if (filters.search) params.set("stock", filters.search.toUpperCase())
      params.set("limit", String(pagination.limit))
      params.set("offset", String(pagination.offset))

      const response = await fetch(`/api/signals?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setSignals(data.data || [])
        setPagination(data.pagination)

        // Extract unique sectors from signals
        const uniqueSectors = Array.from(
          new Set(data.data?.map((s: Signal) => s.sector).filter(Boolean) || [])
        ) as string[]
        if (uniqueSectors.length > 0) {
          setSectors(uniqueSectors)
        }

        if (showRefreshToast) {
          toast.success("Signals refreshed", {
            description: `${data.data?.length || 0} signals loaded`,
          })
        }
      } else {
        console.error("Failed to fetch signals:", data.error)
        if (showRefreshToast) {
          toast.error("Failed to refresh signals")
        }
      }
    } catch (error) {
      console.error("Error fetching signals:", error)
      if (showRefreshToast) {
        toast.error("Failed to refresh signals")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, pagination.limit, pagination.offset])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats" }),
      })
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchSignals()
    fetchStats()
  }, []) // Only run once on mount

  // Refetch when filters change (but not on initial load)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSignals()
    }, 300) // Debounce filter changes

    return () => clearTimeout(timer)
  }, [filters, pagination.offset])

  // Handle filter change
  const handleFilterChange = (key: keyof SignalFiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, offset: 0 })) // Reset to first page
  }

  // Handle reset
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setPagination((prev) => ({ ...prev, offset: 0 }))
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchSignals(true)
    fetchStats()
  }

  // Pagination handlers
  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }))
  }

  const handleNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }))
  }

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  // Loading state
  if (loading && signals.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-20" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  // Placeholder content for unauthenticated users
  const signalsPreview = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Trading Signals</h1>
              <p className="text-sm text-muted-foreground">
                Expert AI analysis with full transparency on data sources
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">12</div><p className="text-sm text-muted-foreground">Active Signals</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-500">8</div><p className="text-sm text-muted-foreground">Buy Signals</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-500">3</div><p className="text-sm text-muted-foreground">Sell Signals</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">72%</div><p className="text-sm text-muted-foreground">Win Rate</p></CardContent></Card>
      </div>

      {/* Placeholder Signals */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold">MAYBANK</span>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded">BUY</span>
                </div>
                <span className="text-sm text-muted-foreground">85% confidence</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Strong bullish momentum with positive earnings outlook...</p>
              <div className="flex gap-4 text-sm">
                <span>Entry: RM 9.50</span>
                <span className="text-green-500">Target: RM 10.20</span>
                <span className="text-red-500">Stop: RM 9.10</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // If user is not authenticated, show blurred content
  if (!user) {
    return (
      <MainLayout>
        <BlurredContent
          title="Unlock AI Trading Signals"
          description="Get expert AI-generated trading signals with entry prices, targets, and stop-loss levels for 800+ KLSE stocks."
          minHeight="600px"
          icon="sparkles"
        >
          {signalsPreview}
        </BlurredContent>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">AI Trading Signals</h1>
                <p className="text-sm text-muted-foreground">
                  Expert AI analysis with full transparency on data sources
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Disclaimer */}
        <SignalDisclaimer />

        {/* Stats */}
        <SignalStatsBar stats={stats} isLoading={loading && !stats} />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <SignalFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              onRefresh={handleRefresh}
              isLoading={refreshing}
              sectors={sectors}
            />
          </CardContent>
        </Card>

        {/* Mobile Filter Summary */}
        <div className="md:hidden">
          <SignalFilterSummary filters={filters} onReset={handleReset} />
        </div>

        {/* Signals Grid */}
        {signals.length === 0 ? (
          <SignalEmptyState />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {signals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {pagination.offset + 1}-
                      {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
                      {pagination.total} signals
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={pagination.offset === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!pagination.hasMore}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              How AI Signals Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">1. Data Collection</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI agent continuously monitors stock prices, technical indicators,
                  company financials, AI insights, and market news.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">2. AI Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  When significant opportunities are detected, our expert trading AI
                  analyzes all available data and generates signals with entry/exit points.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">3. Full Transparency</h4>
                <p className="text-sm text-muted-foreground">
                  Every signal shows exactly which data sources were used and how they
                  influenced the decision. No black box - complete transparency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

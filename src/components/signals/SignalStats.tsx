"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  Activity,
  Percent,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface SignalStats {
  totalActive: number
  byType: {
    BUY: number
    SELL: number
    HOLD: number
  }
  byStatus: {
    active: number
    hit_target: number
    hit_stoploss: number
    expired: number
  }
  performance: {
    win_rate: number | null
    avg_gain_pct: number | null
    avg_loss_pct: number | null
    profit_factor: number | null
  } | null
}

interface SignalStatsProps {
  stats: SignalStats | null
  isLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SignalStatsBar({ stats, isLoading }: SignalStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const winRate = stats.performance?.win_rate ?? 0
  const avgGain = stats.performance?.avg_gain_pct ?? 0
  const avgLoss = stats.performance?.avg_loss_pct ?? 0
  const profitFactor = stats.performance?.profit_factor ?? 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Signals */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Signals</p>
              <p className="text-2xl font-bold">{stats.totalActive}</p>
            </div>
            <Activity className="h-8 w-8 text-primary opacity-50" />
          </div>
          <div className="mt-2 flex gap-2">
            <Badge variant="outline" className="text-xs text-profit border-profit/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.byType.BUY}
            </Badge>
            <Badge variant="outline" className="text-xs text-loss border-loss/30">
              <TrendingDown className="h-3 w-3 mr-1" />
              {stats.byType.SELL}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Minus className="h-3 w-3 mr-1" />
              {stats.byType.HOLD}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  winRate >= 60 ? "text-profit" : winRate >= 40 ? "text-amber-500" : "text-loss"
                )}
              >
                {winRate.toFixed(1)}%
              </p>
            </div>
            <Target className="h-8 w-8 text-primary opacity-50" />
          </div>
          <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
            <span className="text-profit">{stats.byStatus.hit_target} hit target</span>
            <span>•</span>
            <span className="text-loss">{stats.byStatus.hit_stoploss} stopped</span>
          </div>
        </CardContent>
      </Card>

      {/* Average Returns */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Return</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-profit">+{avgGain.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground">/</span>
                <span className="text-lg font-bold text-loss">{avgLoss.toFixed(1)}%</span>
              </div>
            </div>
            <Percent className="h-8 w-8 text-primary opacity-50" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Winners vs Losers average
          </p>
        </CardContent>
      </Card>

      {/* Profit Factor */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Profit Factor</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  profitFactor >= 2 ? "text-profit" : profitFactor >= 1 ? "text-amber-500" : "text-loss"
                )}
              >
                {profitFactor.toFixed(2)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary opacity-50" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {profitFactor >= 2 ? "Strong" : profitFactor >= 1 ? "Positive" : "Needs improvement"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

export function SignalEmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Signals Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          AI signals are generated daily by our expert trading agent.
          Check back soon for new trading opportunities with full transparency on data sources.
        </p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// DISCLAIMER
// ============================================================================

export function SignalDisclaimer() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">
            Important Disclaimer
          </p>
          <p className="text-muted-foreground leading-relaxed">
            These AI-generated signals are for <strong>educational purposes only</strong> and should
            NOT be considered as investment advice. Past performance does not guarantee future results.
            Always do your own research and consult a licensed financial advisor before making any
            investment decisions. Trading involves significant risk of capital loss.
          </p>
        </div>
      </div>
    </div>
  )
}

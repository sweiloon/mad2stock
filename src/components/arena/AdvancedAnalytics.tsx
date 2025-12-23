"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  Target,
  Percent,
  ArrowUpDown,
  PieChart,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { ExtendedArenaStats, LeaderboardEntry } from "@/lib/arena/types"

// AI Logo mapping
const AI_LOGOS: Record<string, string> = {
  'Claude': '/images/claude-logo.webp',
  'ChatGPT': '/images/openai-logo.png',
  'DeepSeek': '/images/deepseek-logo.png',
  'Gemini': '/images/gemini-logo.png',
  'Grok': '/images/Grok-logo.png',
  'Kimi': '/images/kimi-logo.jpg',
  'Qwen': '/images/qwen-logo.jpg',
}

interface AdvancedAnalyticsProps {
  stats: ExtendedArenaStats | null
  leaderboard: LeaderboardEntry[]
}

// Format helpers
function formatRM(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `RM ${(value / 1000000).toFixed(2)}M`
  }
  if (Math.abs(value) >= 1000) {
    return `RM ${(value / 1000).toFixed(1)}K`
  }
  return `RM ${value.toFixed(2)}`
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

export function AdvancedAnalytics({ stats, leaderboard }: AdvancedAnalyticsProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Advanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Analytics will be available once trading begins
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate aggregate metrics from leaderboard
  const avgWinRate = leaderboard.length > 0
    ? leaderboard.reduce((sum, e) => sum + e.winRate, 0) / leaderboard.length
    : 0

  const avgSharpe = leaderboard.length > 0
    ? leaderboard.reduce((sum, e) => sum + e.sharpeRatio, 0) / leaderboard.length
    : 0

  const avgExpectancy = leaderboard.length > 0
    ? leaderboard.reduce((sum, e) => sum + e.expectancy, 0) / leaderboard.length
    : 0

  const avgDrawdown = leaderboard.length > 0
    ? leaderboard.reduce((sum, e) => sum + e.maxDrawdown, 0) / leaderboard.length
    : 0

  const totalOpenPositions = leaderboard.reduce((sum, e) => sum + e.openPositions, 0)

  // Best metrics
  const bestSharpe = leaderboard.length > 0
    ? leaderboard.reduce((best, e) => e.sharpeRatio > best.sharpeRatio ? e : best, leaderboard[0])
    : null

  const bestExpectancy = leaderboard.length > 0
    ? leaderboard.reduce((best, e) => e.expectancy > best.expectancy ? e : best, leaderboard[0])
    : null

  const lowestDrawdown = leaderboard.length > 0
    ? leaderboard.reduce((best, e) => e.maxDrawdown < best.maxDrawdown ? e : best, leaderboard[0])
    : null

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Total Trades"
          value={stats.totalTrades.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Trading Volume"
          value={formatRM(stats.totalVolume)}
          color="green"
        />
        <StatCard
          icon={<Percent className="h-5 w-5" />}
          label="Avg Win Rate"
          value={`${avgWinRate.toFixed(1)}%`}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg Sharpe"
          value={avgSharpe.toFixed(2)}
          color={avgSharpe > 1 ? "green" : avgSharpe > 0 ? "yellow" : "red"}
        />
      </div>

      {/* Extended Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ArrowUpDown className="h-5 w-5" />}
          label="Avg Trade Size"
          value={formatRM(stats.avgTradeSize)}
          subValue={`Median: ${formatRM(stats.medianTradeSize)}`}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Avg Hold Time"
          value={formatHours(stats.avgHoldTime)}
          subValue={`Median: ${formatHours(stats.medianHoldTime)}`}
          color="purple"
        />
        <StatCard
          icon={<PieChart className="h-5 w-5" />}
          label="Buy/Sell Ratio"
          value={`${stats.totalBuys}/${stats.totalSells}`}
          subValue={`${stats.totalTrades > 0 ? ((stats.totalBuys / stats.totalTrades) * 100).toFixed(0) : 0}% long`}
          color="blue"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Fees"
          value={formatRM(stats.totalFees)}
          color="red"
        />
      </div>

      {/* Risk & Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Best Sharpe */}
        {bestSharpe && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Zap className="h-4 w-4 text-green-600" />
                Best Risk-Adjusted Return
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-green-500/30"
                  style={{ backgroundColor: bestSharpe.participant.avatar_color + '20' }}
                >
                  <Image
                    src={AI_LOGOS[bestSharpe.participant.display_name] || ''}
                    alt={bestSharpe.participant.display_name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold">{bestSharpe.participant.display_name}</div>
                  <div className="text-sm text-green-600 font-medium">
                    Sharpe: {bestSharpe.sharpeRatio.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Best Expectancy */}
        {bestExpectancy && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                Best Expectancy
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-blue-500/30"
                  style={{ backgroundColor: bestExpectancy.participant.avatar_color + '20' }}
                >
                  <Image
                    src={AI_LOGOS[bestExpectancy.participant.display_name] || ''}
                    alt={bestExpectancy.participant.display_name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold">{bestExpectancy.participant.display_name}</div>
                  <div className="text-sm text-blue-600 font-medium">
                    {formatRM(bestExpectancy.expectancy)}/trade
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lowest Drawdown */}
        {lowestDrawdown && (
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingDown className="h-4 w-4 text-purple-600" />
                Best Risk Management
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-purple-500/30"
                  style={{ backgroundColor: lowestDrawdown.participant.avatar_color + '20' }}
                >
                  <Image
                    src={AI_LOGOS[lowestDrawdown.participant.display_name] || ''}
                    alt={lowestDrawdown.participant.display_name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold">{lowestDrawdown.participant.display_name}</div>
                  <div className="text-sm text-purple-600 font-medium">
                    Max DD: {lowestDrawdown.maxDrawdown.toFixed(2)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Competition Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Avg Expectancy</div>
              <div className={cn("font-semibold text-lg", avgExpectancy >= 0 ? "text-green-600" : "text-red-600")}>
                {formatRM(avgExpectancy)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Max Drawdown</div>
              <div className={cn("font-semibold text-lg", avgDrawdown < 5 ? "text-green-600" : avgDrawdown < 10 ? "text-yellow-600" : "text-red-600")}>
                {avgDrawdown.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Open Positions</div>
              <div className="font-semibold text-lg">{totalOpenPositions}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Active Models</div>
              <div className="font-semibold text-lg">{leaderboard.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subValue,
  color
}: {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  color: "blue" | "green" | "purple" | "red" | "yellow"
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-500/10",
    green: "text-green-600 bg-green-500/10",
    purple: "text-purple-600 bg-purple-500/10",
    red: "text-red-600 bg-red-500/10",
    yellow: "text-yellow-600 bg-yellow-500/10"
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className={cn(
          "flex items-center gap-2 mb-2",
          colorClasses[color].split(' ')[0]
        )}>
          {icon}
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <div className="text-xl font-bold">{value}</div>
        {subValue && (
          <div className="text-xs text-muted-foreground mt-1">{subValue}</div>
        )}
      </CardContent>
    </Card>
  )
}

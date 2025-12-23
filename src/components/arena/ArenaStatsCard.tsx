"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Target,
  DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { ArenaStats, AIParticipant } from "@/lib/arena/types"

// AI Logo mapping - All 7 AI models
const AI_LOGOS: Record<string, string> = {
  'Claude': '/images/claude-logo.webp',
  'ChatGPT': '/images/openai-logo.png',
  'DeepSeek': '/images/deepseek-logo.png',
  'Gemini': '/images/gemini-logo.png',
  'Grok': '/images/Grok-logo.png',
  'Kimi': '/images/kimi-logo.jpg',
  'Qwen': '/images/qwen-logo.jpg',
}

interface ArenaStatsCardProps {
  stats: ArenaStats | null
  participantCount: number
}

export function ArenaStatsCard({ stats, participantCount }: ArenaStatsCardProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Arena Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Statistics will be available once trading begins
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Arena Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox
            icon={<Users className="h-4 w-4" />}
            label="Participants"
            value={participantCount.toString()}
            color="blue"
          />
          <StatBox
            icon={<Activity className="h-4 w-4" />}
            label="Total Trades"
            value={stats.totalTrades.toLocaleString()}
            color="purple"
          />
          <StatBox
            icon={<DollarSign className="h-4 w-4" />}
            label="Trading Volume"
            value={`RM ${(stats.totalVolume / 1000).toFixed(1)}K`}
            color="green"
          />
          <StatBox
            icon={<Target className="h-4 w-4" />}
            label="Avg Return"
            value={`${stats.avgReturn >= 0 ? '+' : ''}${stats.avgReturn.toFixed(2)}%`}
            color={stats.avgReturn >= 0 ? "green" : "red"}
          />
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Best Performer */}
          {stats.bestPerformer && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Best Performer
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-green-500/30"
                  style={{ backgroundColor: stats.bestPerformer.avatar_color + '20' }}
                >
                  <Image
                    src={AI_LOGOS[stats.bestPerformer.display_name] || ''}
                    alt={stats.bestPerformer.display_name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold">{stats.bestPerformer.display_name}</div>
                  <div className="text-sm text-green-600 font-medium">
                    +{stats.bestPerformer.profit_loss_pct.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Most Active */}
          {stats.mostActiveTrade && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Most Active Trader
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-blue-500/30"
                  style={{ backgroundColor: stats.mostActiveTrade.avatar_color + '20' }}
                >
                  <Image
                    src={AI_LOGOS[stats.mostActiveTrade.display_name] || ''}
                    alt={stats.mostActiveTrade.display_name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold">{stats.mostActiveTrade.display_name}</div>
                  <div className="text-sm text-blue-600 font-medium">
                    {stats.mostActiveTrade.total_trades} trades
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Worst Performer (for transparency) */}
        {stats.worstPerformer && stats.worstPerformer.profit_loss_pct !== stats.bestPerformer?.profit_loss_pct && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Lowest Return
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="relative h-6 w-6 rounded-full overflow-hidden ring-1 ring-muted-foreground/30"
                  style={{ backgroundColor: stats.worstPerformer.avatar_color + '20' }}
                >
                  <Image
                    src={AI_LOGOS[stats.worstPerformer.display_name] || ''}
                    alt={stats.worstPerformer.display_name}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </div>
                <span className="font-medium">{stats.worstPerformer.display_name}</span>
                <Badge variant="secondary" className={cn(
                  stats.worstPerformer.profit_loss_pct < 0 ? "text-red-600" : "text-green-600"
                )}>
                  {stats.worstPerformer.profit_loss_pct >= 0 ? '+' : ''}
                  {stats.worstPerformer.profit_loss_pct.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Highest Single Trade */}
        {stats.highestSingleTrade && (
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Highest Single Trade</span>
              <div className="flex items-center gap-2">
                <Badge variant={stats.highestSingleTrade.trade_type === 'BUY' ? 'default' : 'destructive'}>
                  {stats.highestSingleTrade.trade_type}
                </Badge>
                <span className="font-medium">{stats.highestSingleTrade.stock_code}</span>
                <span className="text-muted-foreground">
                  RM {stats.highestSingleTrade.total_value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatBox({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: "blue" | "purple" | "green" | "red"
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-500/10",
    purple: "text-purple-600 bg-purple-500/10",
    green: "text-green-600 bg-green-500/10",
    red: "text-red-600 bg-red-500/10"
  }

  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className={cn(
        "flex items-center gap-1.5 mb-1",
        colorClasses[color].split(' ')[0]
      )}>
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

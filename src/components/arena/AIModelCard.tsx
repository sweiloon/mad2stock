"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Briefcase,
  DollarSign,
  Activity,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import type { AIParticipant, Holding } from "@/lib/arena/types"

// AI Logo mapping
const AI_LOGOS: Record<string, string> = {
  'DeepSeek': '/images/deepseek-logo.png',
  'Grok': '/images/Grok-logo.png',
  'Claude': '/images/claude-logo.webp',
  'ChatGPT': '/images/openai-logo.png',
  'Gemini': '/images/gemini-logo.png',
}

interface AIModelCardProps {
  participant: AIParticipant
  holdings?: Holding[]
  rank?: number
  isSelected?: boolean
  onClick?: () => void
}

export function AIModelCard({
  participant,
  holdings = [],
  rank,
  isSelected,
  onClick
}: AIModelCardProps) {
  const winRate = participant.total_trades > 0
    ? (participant.winning_trades / participant.total_trades) * 100
    : 0

  const holdingsValue = holdings.reduce((sum, h) => sum + h.market_value, 0)

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-lg",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="relative h-12 w-12 rounded-full overflow-hidden shadow-lg ring-2 ring-offset-2"
              style={{
                ['--tw-ring-color' as string]: participant.avatar_color,
                backgroundColor: participant.avatar_color + '20'
              } as React.CSSProperties}
            >
              <Image
                src={AI_LOGOS[participant.display_name] || ''}
                alt={participant.display_name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <CardTitle className="text-lg">{participant.display_name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {participant.model_provider}
              </div>
            </div>
          </div>
          {rank && (
            <Badge
              variant={rank <= 3 ? "default" : "secondary"}
              className={cn(
                rank === 1 && "bg-yellow-500 hover:bg-yellow-600",
                rank === 2 && "bg-slate-400 hover:bg-slate-500",
                rank === 3 && "bg-orange-500 hover:bg-orange-600"
              )}
            >
              #{rank}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Portfolio Value */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm">Portfolio Value</span>
          </div>
          <span className="text-lg font-bold">
            RM {participant.portfolio_value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cash Available */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs">Cash</span>
            </div>
            <div className="font-semibold">
              RM {participant.current_capital.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Holdings Value */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Target className="h-3.5 w-3.5" />
              <span className="text-xs">Holdings</span>
            </div>
            <div className="font-semibold">
              RM {holdingsValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* P&L */}
        <div className={cn(
          "p-3 rounded-lg",
          participant.total_profit_loss >= 0
            ? "bg-green-500/10 border border-green-500/20"
            : "bg-red-500/10 border border-red-500/20"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {participant.total_profit_loss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Total P&L</span>
            </div>
            <div className="text-right">
              <div className={cn(
                "font-bold",
                participant.total_profit_loss >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {participant.total_profit_loss >= 0 ? "+" : ""}
                RM {participant.total_profit_loss.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </div>
              <div className={cn(
                "text-sm",
                participant.profit_loss_pct >= 0 ? "text-green-600" : "text-red-600"
              )}>
                ({participant.profit_loss_pct >= 0 ? "+" : ""}{participant.profit_loss_pct.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-medium">{winRate.toFixed(1)}%</span>
          </div>
          <Progress value={winRate} className="h-2" />
        </div>

        {/* Trade Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>{participant.total_trades} trades</span>
          </div>
          <div className="text-muted-foreground">
            {participant.winning_trades}W / {participant.total_trades - participant.winning_trades}L
          </div>
        </div>

        {/* Last Trade */}
        {participant.last_trade_at && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Last trade {formatDistanceToNow(new Date(participant.last_trade_at), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Current Holdings */}
        {holdings.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">Holdings ({holdings.length})</div>
            <div className="space-y-1.5">
              {holdings.slice(0, 3).map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{h.stock_code}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{h.quantity}</span>
                    <span className={cn(
                      h.unrealized_pnl >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {h.unrealized_pnl >= 0 ? "+" : ""}{h.unrealized_pnl_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {holdings.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{holdings.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

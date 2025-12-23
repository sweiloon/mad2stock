"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import Image from "next/image"
import type { Trade } from "@/lib/arena/types"

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

interface TradeHistoryProps {
  trades: Trade[]
  maxHeight?: string
  showParticipant?: boolean
}

export function TradeHistory({ trades, maxHeight = "400px", showParticipant = true }: TradeHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Recent Trades
          <Badge variant="secondary" className="ml-auto">
            {trades.length} trades
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="px-6 pb-6 space-y-3">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Trade Type Icon */}
                  <div className={cn(
                    "mt-0.5 rounded-full p-1.5",
                    trade.trade_type === "BUY"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600"
                  )}>
                    {trade.trade_type === "BUY" ? (
                      <ArrowUpCircle className="h-4 w-4" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    {/* Header Row */}
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.trade_type === "BUY" ? "default" : "destructive"}>
                        {trade.trade_type}
                      </Badge>
                      <span className="font-semibold">{trade.stock_code}</span>
                      {showParticipant && trade.participant && (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="relative h-4 w-4 rounded-full overflow-hidden ring-1"
                            style={{
                              ['--tw-ring-color' as string]: trade.participant.avatar_color,
                              backgroundColor: trade.participant.avatar_color + '20'
                            } as React.CSSProperties}
                          >
                            <Image
                              src={AI_LOGOS[trade.participant.display_name] || ''}
                              alt={trade.participant.display_name}
                              fill
                              sizes="16px"
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {trade.participant.display_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details Row */}
                    <div className="text-sm text-muted-foreground">
                      {trade.quantity.toLocaleString()} shares @ RM{trade.price.toFixed(4)}
                    </div>

                    {/* Reasoning */}
                    {trade.reasoning && (
                      <div className="text-xs text-muted-foreground/80 italic max-w-[300px] truncate">
                        &ldquo;{trade.reasoning}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  {/* Total Value */}
                  <div className="font-medium">
                    RM {trade.total_value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </div>

                  {/* Realized P&L (for sells) */}
                  {trade.realized_pnl !== null && (
                    <div className={cn(
                      "text-sm font-medium",
                      trade.realized_pnl >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {trade.realized_pnl >= 0 ? "+" : ""}RM {trade.realized_pnl.toFixed(2)}
                    </div>
                  )}

                  {/* Time */}
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(trade.executed_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}

            {trades.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No trades recorded yet
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

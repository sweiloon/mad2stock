"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { LeaderboardEntry } from "@/lib/arena/types"

// AI Logo mapping
const AI_LOGOS: Record<string, string> = {
  'DeepSeek': '/images/deepseek-logo.webp',
  'Grok': '/images/Grok-logo.png',
  'Claude': '/images/claude-logo.webp',
  'ChatGPT': '/images/openai-logo.png',
  'Gemini': '/images/gemini-logo.webp',
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  onSelectParticipant?: (id: string) => void
  selectedId?: string | null
}

const rankColors: Record<number, string> = {
  1: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  2: "bg-slate-400/10 text-slate-500 border-slate-400/20",
  3: "bg-orange-500/10 text-orange-600 border-orange-500/20"
}

const rankIcons: Record<number, React.ReactNode> = {
  1: <Trophy className="h-4 w-4 text-yellow-500" />,
  2: <Medal className="h-4 w-4 text-slate-400" />,
  3: <Medal className="h-4 w-4 text-orange-500" />
}

export function Leaderboard({ entries, onSelectParticipant, selectedId }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.participant.id}
              onClick={() => onSelectParticipant?.(entry.participant.id)}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer",
                "hover:bg-muted/50",
                selectedId === entry.participant.id && "bg-muted ring-2 ring-primary/20",
                entry.rank <= 3 && rankColors[entry.rank]
              )}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm",
                  entry.rank <= 3 ? "bg-background" : "bg-muted"
                )}>
                  {entry.rank <= 3 ? rankIcons[entry.rank] : entry.rank}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-2">
                  <div
                    className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-offset-1"
                    style={{
                      ['--tw-ring-color' as string]: entry.participant.avatar_color,
                      backgroundColor: entry.participant.avatar_color + '20'
                    } as React.CSSProperties}
                  >
                    <Image
                      src={AI_LOGOS[entry.participant.display_name] || ''}
                      alt={entry.participant.display_name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{entry.participant.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.participant.model_provider}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Portfolio Value */}
                <div className="text-right">
                  <div className="font-semibold">
                    RM {entry.portfolioValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground">Portfolio</div>
                </div>

                {/* Return */}
                <div className="text-right min-w-[80px]">
                  <div className={cn(
                    "flex items-center justify-end gap-1 font-medium",
                    entry.totalReturnPct >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {entry.totalReturnPct >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {entry.totalReturnPct >= 0 ? "+" : ""}{entry.totalReturnPct.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Return</div>
                </div>

                {/* Win Rate */}
                <Badge variant="secondary" className="ml-2">
                  {entry.winRate.toFixed(0)}% WR
                </Badge>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Competition has not started yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Medal,
  ChevronDown,
  ChevronUp,
  Info,
  BarChart3,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { LeaderboardEntry } from "@/lib/arena/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  onSelectParticipant?: (id: string) => void
  selectedId?: string | null
  compact?: boolean
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

// Format helpers
function formatRM(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `RM ${(value / 1000).toFixed(1)}K`
  }
  return `RM ${value.toFixed(2)}`
}

function formatPct(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

// Column definitions for the table
type ColumnKey = 'rank' | 'model' | 'value' | 'return' | 'pnl' | 'fees' | 'winRate' |
  'highWin' | 'bigLoss' | 'sharpe' | 'trades' | 'avgSize' | 'holdTime' |
  'longPct' | 'expectancy' | 'profitFactor' | 'drawdown' | 'positions' | 'margin'

interface Column {
  key: ColumnKey
  label: string
  shortLabel?: string
  tooltip: string
  format: (entry: LeaderboardEntry) => string | React.ReactNode
  align?: 'left' | 'right' | 'center'
  category: 'basic' | 'advanced'
  width?: string
}

const columns: Column[] = [
  {
    key: 'rank',
    label: 'RANK',
    tooltip: 'Current position in the leaderboard',
    format: (e) => e.rank,
    align: 'center',
    category: 'basic',
    width: 'w-12'
  },
  {
    key: 'model',
    label: 'MODEL',
    tooltip: 'AI model name and provider',
    format: (e) => e.participant.display_name,
    align: 'left',
    category: 'basic',
    width: 'w-32'
  },
  {
    key: 'value',
    label: 'ACCT VALUE',
    shortLabel: 'VALUE',
    tooltip: 'Current account value (cash + holdings)',
    format: (e) => formatRM(e.portfolioValue),
    align: 'right',
    category: 'basic'
  },
  {
    key: 'return',
    label: 'RETURN %',
    shortLabel: 'RET%',
    tooltip: 'Total return percentage since start',
    format: (e) => formatPct(e.totalReturnPct),
    align: 'right',
    category: 'basic'
  },
  {
    key: 'pnl',
    label: 'TOTAL P&L',
    shortLabel: 'P&L',
    tooltip: 'Total profit or loss in RM',
    format: (e) => formatRM(e.totalReturn),
    align: 'right',
    category: 'basic'
  },
  {
    key: 'fees',
    label: 'FEES',
    tooltip: 'Total trading fees paid',
    format: (e) => formatRM(e.totalFees),
    align: 'right',
    category: 'basic'
  },
  {
    key: 'winRate',
    label: 'WIN RATE',
    shortLabel: 'WIN%',
    tooltip: 'Percentage of winning trades',
    format: (e) => formatPct(e.winRate, false),
    align: 'right',
    category: 'basic'
  },
  {
    key: 'highWin',
    label: 'HIGH WIN',
    tooltip: 'Highest single winning trade',
    format: (e) => e.highestWin > 0 ? formatRM(e.highestWin) : '-',
    align: 'right',
    category: 'basic'
  },
  {
    key: 'bigLoss',
    label: 'BIG LOSS',
    tooltip: 'Biggest single losing trade',
    format: (e) => e.biggestLoss < 0 ? formatRM(e.biggestLoss) : '-',
    align: 'right',
    category: 'basic'
  },
  {
    key: 'sharpe',
    label: 'SHARPE',
    tooltip: 'Sharpe ratio - risk-adjusted return measure',
    format: (e) => formatNumber(e.sharpeRatio),
    align: 'right',
    category: 'basic'
  },
  {
    key: 'trades',
    label: 'TRADES',
    tooltip: 'Total number of trades executed',
    format: (e) => e.totalTrades,
    align: 'right',
    category: 'basic'
  },
  // Advanced columns
  {
    key: 'avgSize',
    label: 'AVG SIZE',
    tooltip: 'Average trade size in RM',
    format: (e) => e.avgTradeSize > 0 ? formatRM(e.avgTradeSize) : '-',
    align: 'right',
    category: 'advanced'
  },
  {
    key: 'holdTime',
    label: 'AVG HOLD',
    tooltip: 'Average time between trades',
    format: (e) => e.avgHoldTime > 0 ? formatHours(e.avgHoldTime) : '-',
    align: 'right',
    category: 'advanced'
  },
  {
    key: 'longPct',
    label: 'LONG %',
    tooltip: 'Percentage of buy/long trades',
    format: (e) => formatPct(e.longPct, false),
    align: 'right',
    category: 'advanced'
  },
  {
    key: 'expectancy',
    label: 'EXPECT',
    tooltip: 'Expected RM per trade',
    format: (e) => formatRM(e.expectancy),
    align: 'right',
    category: 'advanced'
  },
  {
    key: 'profitFactor',
    label: 'PF',
    tooltip: 'Profit Factor - gross profit / gross loss',
    format: (e) => e.profitFactor === Infinity ? '∞' : formatNumber(e.profitFactor),
    align: 'right',
    category: 'advanced'
  },
  {
    key: 'drawdown',
    label: 'MAX DD',
    tooltip: 'Maximum drawdown - largest peak-to-trough decline',
    format: (e) => e.maxDrawdown > 0 ? formatPct(e.maxDrawdown, false) : '-',
    align: 'right',
    category: 'advanced'
  },
  {
    key: 'positions',
    label: 'POS',
    tooltip: 'Number of open positions',
    format: (e) => e.openPositions,
    align: 'right',
    category: 'advanced'
  },
  {
    key: 'margin',
    label: 'MARGIN',
    tooltip: 'Percentage of capital currently invested',
    format: (e) => formatPct(e.marginUsed, false),
    align: 'right',
    category: 'advanced'
  }
]

// Compact view columns (for mobile/small screens)
const compactColumns: ColumnKey[] = ['rank', 'model', 'value', 'return', 'winRate', 'trades']
// Basic view columns
const basicColumns: ColumnKey[] = ['rank', 'model', 'value', 'return', 'pnl', 'fees', 'winRate', 'highWin', 'bigLoss', 'sharpe', 'trades']
// All columns for advanced view
const advancedColumns: ColumnKey[] = columns.map(c => c.key)

export function Leaderboard({ entries, onSelectParticipant, selectedId, compact = false }: LeaderboardProps) {
  const [viewMode, setViewMode] = useState<'compact' | 'basic' | 'advanced'>('basic')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const visibleColumnKeys = compact
    ? compactColumns
    : viewMode === 'compact'
      ? compactColumns
      : viewMode === 'basic'
        ? basicColumns
        : advancedColumns

  const visibleColumns = columns.filter(c => visibleColumnKeys.includes(c.key))

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>

          {!compact && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="compact" className="text-xs px-2 h-6">
                  Compact
                </TabsTrigger>
                <TabsTrigger value="basic" className="text-xs px-2 h-6">
                  Basic
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs px-2 h-6">
                  Advanced
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <TooltipProvider>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-3 py-2 font-medium text-muted-foreground whitespace-nowrap",
                        col.align === 'right' && "text-right",
                        col.align === 'center' && "text-center",
                        col.width
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          {col.shortLabel || col.label}
                          <Info className="h-3 w-3 opacity-50" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{col.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  ))}
                  <th className="w-8"></th>
                </TooltipProvider>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <>
                  <tr
                    key={entry.participant.id}
                    onClick={() => onSelectParticipant?.(entry.participant.id)}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      "hover:bg-muted/50",
                      selectedId === entry.participant.id && "bg-muted ring-1 ring-primary/20",
                      entry.rank <= 3 && rankColors[entry.rank]
                    )}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-3 whitespace-nowrap",
                          col.align === 'right' && "text-right",
                          col.align === 'center' && "text-center",
                          col.width
                        )}
                      >
                        {col.key === 'rank' ? (
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs mx-auto",
                            entry.rank <= 3 ? "bg-background" : "bg-muted"
                          )}>
                            {entry.rank <= 3 ? rankIcons[entry.rank] : entry.rank}
                          </div>
                        ) : col.key === 'model' ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="relative h-7 w-7 rounded-full overflow-hidden ring-2 ring-offset-1 flex-shrink-0"
                              style={{
                                ['--tw-ring-color' as string]: entry.participant.avatar_color,
                                backgroundColor: entry.participant.avatar_color + '20'
                              } as React.CSSProperties}
                            >
                              <Image
                                src={AI_LOGOS[entry.participant.display_name] || ''}
                                alt={entry.participant.display_name}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{entry.participant.display_name}</div>
                              <div className="text-xs text-muted-foreground hidden sm:block">
                                {entry.participant.model_provider}
                              </div>
                            </div>
                          </div>
                        ) : col.key === 'return' || col.key === 'pnl' ? (
                          <span className={cn(
                            "font-medium",
                            entry.totalReturnPct >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {col.format(entry)}
                          </span>
                        ) : col.key === 'bigLoss' ? (
                          <span className={entry.biggestLoss < 0 ? "text-red-600" : ""}>
                            {col.format(entry)}
                          </span>
                        ) : col.key === 'highWin' ? (
                          <span className={entry.highestWin > 0 ? "text-green-600" : ""}>
                            {col.format(entry)}
                          </span>
                        ) : (
                          col.format(entry)
                        )}
                      </td>
                    ))}
                    <td className="px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRow(entry.participant.id)
                        }}
                      >
                        {expandedRow === entry.participant.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded Row with Additional Details */}
                  {expandedRow === entry.participant.id && (
                    <tr className="bg-muted/20">
                      <td colSpan={visibleColumns.length + 1} className="px-4 py-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">Avg Trade Size</div>
                            <div className="font-medium">{formatRM(entry.avgTradeSize)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Avg Hold Time</div>
                            <div className="font-medium">{entry.avgHoldTime > 0 ? formatHours(entry.avgHoldTime) : '-'}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Long %</div>
                            <div className="font-medium">{formatPct(entry.longPct, false)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Expectancy</div>
                            <div className={cn("font-medium", entry.expectancy >= 0 ? "text-green-600" : "text-red-600")}>
                              {formatRM(entry.expectancy)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Profit Factor</div>
                            <div className="font-medium">
                              {entry.profitFactor === Infinity ? '∞' : formatNumber(entry.profitFactor)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Max Drawdown</div>
                            <div className={cn("font-medium", entry.maxDrawdown > 5 && "text-red-600")}>
                              {entry.maxDrawdown > 0 ? formatPct(entry.maxDrawdown, false) : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Open Positions</div>
                            <div className="font-medium">{entry.openPositions}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Margin Used</div>
                            <div className="font-medium">{formatPct(entry.marginUsed, false)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Daily Change</div>
                            <div className={cn("font-medium", entry.dailyChangePct >= 0 ? "text-green-600" : "text-red-600")}>
                              {formatPct(entry.dailyChangePct)}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No Data Yet</p>
            <p className="text-sm">Competition has not started yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

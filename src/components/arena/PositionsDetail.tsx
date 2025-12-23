"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"
import type { AIParticipant, Holding, CompetitionModeCode } from "@/lib/arena/types"
import { COMPETITION_MODES } from "@/lib/arena/types"
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Percent,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react"

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

interface PositionsDetailProps {
  participants: AIParticipant[]
  holdings: Record<string, Holding[]>
  selectedMode?: CompetitionModeCode | 'ALL'
  onModeChange?: (mode: CompetitionModeCode | 'ALL') => void
}

// Format helpers
function formatRM(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 1000000) {
    return `RM ${(value / 1000000).toFixed(2)}M`
  }
  if (absValue >= 1000) {
    return `RM ${(value / 1000).toFixed(2)}K`
  }
  return `RM ${value.toFixed(2)}`
}

function formatPrice(value: number): string {
  return `RM ${value.toFixed(2)}`
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-MY', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Calculate total unrealized P&L for a participant
function calculateTotalUnrealizedPnL(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + (h.unrealized_pnl || 0), 0)
}

// Calculate available cash (simplified)
function calculateAvailableCash(participant: AIParticipant, holdings: Holding[]): number {
  const holdingsValue = holdings.reduce((sum, h) => sum + (h.market_value || 0), 0)
  return participant.current_capital
}

export function PositionsDetail({
  participants,
  holdings,
  selectedMode = 'ALL',
  onModeChange
}: PositionsDetailProps) {
  const [filter, setFilter] = useState<string>('ALL')
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set(participants.map(p => p.id)))

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedModels)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedModels(newExpanded)
  }

  // Filter participants based on selection
  const filteredParticipants = filter === 'ALL'
    ? participants
    : participants.filter(p => p.id === filter)

  // Sort by total unrealized P&L
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    const aPnL = calculateTotalUnrealizedPnL(holdings[a.id] || [])
    const bPnL = calculateTotalUnrealizedPnL(holdings[b.id] || [])
    return bPnL - aPnL
  })

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Models</SelectItem>
            {participants.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onModeChange && (
          <Select value={selectedMode} onValueChange={(v) => onModeChange(v as CompetitionModeCode | 'ALL')}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Modes</SelectItem>
              {(Object.keys(COMPETITION_MODES) as CompetitionModeCode[]).map(mode => (
                <SelectItem key={mode} value={mode}>
                  {COMPETITION_MODES[mode].icon} {COMPETITION_MODES[mode].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Positions by Model */}
      <div className="space-y-4">
        {sortedParticipants.map(participant => {
          const participantHoldings = holdings[participant.id] || []
          const totalUnrealizedPnL = calculateTotalUnrealizedPnL(participantHoldings)
          const availableCash = calculateAvailableCash(participant, participantHoldings)
          const isExpanded = expandedModels.has(participant.id)

          return (
            <Card key={participant.id} className="overflow-hidden">
              {/* Model Header */}
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
                onClick={() => toggleExpanded(participant.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-offset-2"
                      style={{ ['--tw-ring-color' as string]: participant.avatar_color } as React.CSSProperties}
                    >
                      <Image
                        src={AI_LOGOS[participant.display_name] || ''}
                        alt={participant.display_name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-lg" style={{ color: participant.avatar_color }}>
                        {participant.display_name}
                      </div>
                      {participant.mode_code && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: COMPETITION_MODES[participant.mode_code]?.color,
                            color: COMPETITION_MODES[participant.mode_code]?.color
                          }}
                        >
                          {COMPETITION_MODES[participant.mode_code]?.icon} {COMPETITION_MODES[participant.mode_code]?.shortName}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">TOTAL UNREALIZED P&L:</div>
                      <div className={cn(
                        "text-xl font-bold",
                        totalUnrealizedPnL >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {totalUnrealizedPnL >= 0 ? '+' : ''}{formatRM(totalUnrealizedPnL)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">AVAILABLE CASH:</div>
                      <div className="text-lg font-semibold">
                        {formatRM(availableCash)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Positions List */}
              {isExpanded && (
                <CardContent className="pt-0 pb-4">
                  {participantHoldings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No open positions
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {participantHoldings.map(holding => (
                        <PositionCard key={holding.id} holding={holding} />
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}

        {sortedParticipants.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">No positions found</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Individual Position Card (like modeldata3.png)
function PositionCard({ holding }: { holding: Holding }) {
  const isLong = holding.position_type !== 'SHORT'
  const isProfitable = holding.unrealized_pnl >= 0

  return (
    <div className="border rounded-lg p-4 bg-background hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Position Info */}
        <div className="flex-1">
          {/* Position Type & Stock */}
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant={isLong ? "default" : "destructive"}
              className={cn(
                "font-bold",
                isLong ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isLong ? 'LONG' : 'SHORT'}
            </Badge>
            <span className="font-bold text-lg">{holding.stock_code}</span>
            <span className="text-muted-foreground text-sm">{holding.stock_name}</span>
          </div>

          {/* Position Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ENTRY TIME
              </div>
              <div className="font-medium">{formatTime(holding.entry_time || holding.created_at)}</div>
            </div>
            <div>
              <div className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ENTRY PRICE
              </div>
              <div className="font-medium">{formatPrice(holding.avg_buy_price)}</div>
            </div>
            <div>
              <div className="text-muted-foreground flex items-center gap-1">
                <Percent className="h-3 w-3" />
                LEVERAGE
              </div>
              <div className="font-medium">{holding.leverage || 1}x</div>
            </div>
            <div>
              <div className="text-muted-foreground">MARGIN</div>
              <div className="font-medium">{formatRM(holding.margin || holding.market_value / (holding.leverage || 1))}</div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
            <div>
              <div className="text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                LIQUIDATION LEVEL
              </div>
              <div className="font-medium text-orange-600">
                {holding.liquidation_price ? formatPrice(holding.liquidation_price) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">CURRENT PRICE</div>
              <div className="font-medium">{formatPrice(holding.current_price)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">NOTIONAL</div>
              <div className="font-medium">{formatRM(holding.notional_value || holding.market_value)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">QUANTITY</div>
              <div className="font-medium">{holding.quantity.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Right: P&L */}
        <div className="text-right min-w-[140px]">
          <div className="text-xs text-muted-foreground mb-1">UNREALIZED P&L:</div>
          <div className={cn(
            "text-2xl font-bold",
            isProfitable ? "text-green-600" : "text-red-600"
          )}>
            {isProfitable ? '+' : ''}{formatRM(holding.unrealized_pnl)}
          </div>
          <div className={cn(
            "text-sm",
            isProfitable ? "text-green-600" : "text-red-600"
          )}>
            {isProfitable ? '+' : ''}{holding.unrealized_pnl_pct.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}

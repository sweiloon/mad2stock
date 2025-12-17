"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Newspaper,
  Brain,
  Activity,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface SignalSource {
  id: string
  source_type: string
  source_name: string
  source_value: string
  interpretation: string
  influence_weight: number
}

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
  sources?: SignalSource[]

  generated_at: string
  status: string
}

interface SignalCardProps {
  signal: Signal
  variant?: "default" | "compact"
  showSources?: boolean
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SIGNAL_TYPE_CONFIG = {
  BUY: {
    icon: TrendingUp,
    color: "text-profit",
    bg: "bg-profit/10",
    border: "border-profit/30",
    label: "BUY",
  },
  SELL: {
    icon: TrendingDown,
    color: "text-loss",
    bg: "bg-loss/10",
    border: "border-loss/30",
    label: "SELL",
  },
  HOLD: {
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    label: "HOLD",
  },
}

const STRENGTH_CONFIG = {
  Strong: { color: "text-profit", bg: "bg-profit/10" },
  Moderate: { color: "text-amber-500", bg: "bg-amber-500/10" },
  Weak: { color: "text-muted-foreground", bg: "bg-muted" },
}

const SOURCE_TYPE_ICONS: Record<string, any> = {
  technical_indicator: Activity,
  fundamental_data: BarChart3,
  ai_insight: Brain,
  news: Newspaper,
  price_action: TrendingUp,
  volume_analysis: BarChart3,
  sector_analysis: Target,
  market_sentiment: Activity,
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SignalCard({ signal, variant = "default", showSources = true }: SignalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAllSources, setShowAllSources] = useState(false)

  const typeConfig = SIGNAL_TYPE_CONFIG[signal.signal_type]
  const strengthConfig = STRENGTH_CONFIG[signal.strength]
  const TypeIcon = typeConfig.icon

  const formatPrice = (price: number | null) =>
    price ? `RM ${price.toFixed(4)}` : "N/A"

  const formatPercent = (pct: number | null) =>
    pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "N/A"

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return "Just now"
  }

  const confidenceColor =
    signal.confidence_level >= 80
      ? "text-profit"
      : signal.confidence_level >= 60
      ? "text-amber-500"
      : "text-muted-foreground"

  return (
    <Card className={cn("overflow-hidden transition-all", variant === "compact" && "shadow-sm")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Stock info and signal type */}
          <div className="flex items-start gap-3">
            {/* Signal Type Badge */}
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg border-2",
                typeConfig.bg,
                typeConfig.border
              )}
            >
              <TypeIcon className={cn("h-6 w-6", typeConfig.color)} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/companies/${signal.stock_code}`}
                  className="font-semibold hover:underline"
                >
                  {signal.stock_code}
                </Link>
                <Badge variant="outline" className="text-xs">
                  {signal.sector}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {signal.company_name}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {timeAgo(signal.generated_at)}
                <span>•</span>
                <span>{signal.time_horizon}</span>
              </div>
            </div>
          </div>

          {/* Right: Signal strength and confidence */}
          <div className="flex flex-col items-end gap-1">
            <Badge
              className={cn(
                "text-sm font-bold px-3 py-1",
                typeConfig.bg,
                typeConfig.color,
                typeConfig.border
              )}
              variant="outline"
            >
              {signal.signal_type}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-xs", strengthConfig.color, strengthConfig.bg)}
              >
                {signal.strength}
              </Badge>
              <span className={cn("text-sm font-semibold", confidenceColor)}>
                {signal.confidence_level}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary */}
        <p className="text-sm leading-relaxed mb-4">{signal.summary}</p>

        {/* Price Targets */}
        {signal.signal_type !== "HOLD" && (
          <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-muted/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Target className="h-3 w-3" />
                Entry
              </div>
              <p className="font-semibold text-sm">{formatPrice(signal.entry_price)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3 text-profit" />
                Target
              </div>
              <p className="font-semibold text-sm text-profit">
                {formatPrice(signal.target_price)}
              </p>
              {signal.potential_gain_pct && (
                <p className="text-xs text-profit">{formatPercent(signal.potential_gain_pct)}</p>
              )}
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Shield className="h-3 w-3 text-loss" />
                Stop Loss
              </div>
              <p className="font-semibold text-sm text-loss">
                {formatPrice(signal.stop_loss)}
              </p>
            </div>
          </div>
        )}

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-xs">
                {isExpanded ? "Hide Details" : "Show Analysis & Sources"}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3 space-y-4">
            {/* Key Reasoning */}
            {signal.reasoning && signal.reasoning.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Analysis
                </h4>
                <ul className="space-y-1.5">
                  {signal.reasoning.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Catalysts */}
            {signal.key_catalysts && signal.key_catalysts.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Key Catalysts
                </h4>
                <div className="flex flex-wrap gap-2">
                  {signal.key_catalysts.map((catalyst, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {catalyst}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {signal.risks && signal.risks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Risk Factors
                </h4>
                <ul className="space-y-1.5">
                  {signal.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Sources (Transparency) */}
            {showSources && signal.sources && signal.sources.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Data Sources Used
                  </h4>
                  {signal.data_quality_score && (
                    <Badge variant="outline" className="text-xs">
                      Data Quality: {signal.data_quality_score}%
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {(showAllSources ? signal.sources : signal.sources.slice(0, 4)).map(
                    (source, i) => {
                      const SourceIcon = SOURCE_TYPE_ICONS[source.source_type] || Activity
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 rounded bg-muted/30 text-xs"
                        >
                          <SourceIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{source.source_name}</span>
                              <span className="text-muted-foreground">
                                {source.influence_weight}% weight
                              </span>
                            </div>
                            <p className="text-muted-foreground truncate">
                              {source.source_value}
                            </p>
                            {source.interpretation && (
                              <p className="text-muted-foreground/80 italic mt-0.5">
                                "{source.interpretation}"
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    }
                  )}
                  {signal.sources.length > 4 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setShowAllSources(!showAllSources)}
                    >
                      {showAllSources
                        ? "Show Less"
                        : `Show ${signal.sources.length - 4} More Sources`}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* View Company Link */}
            <div className="pt-2">
              <Link href={`/companies/${signal.stock_code}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View {signal.stock_code} Profile
                  <ExternalLink className="h-3.5 w-3.5 ml-2" />
                </Button>
              </Link>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPACT VARIANT FOR LISTS
// ============================================================================

export function SignalCardCompact({ signal }: { signal: Signal }) {
  const typeConfig = SIGNAL_TYPE_CONFIG[signal.signal_type]
  const TypeIcon = typeConfig.icon

  return (
    <Link href={`/companies/${signal.stock_code}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  typeConfig.bg
                )}
              >
                <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{signal.stock_code}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", typeConfig.color)}
                  >
                    {signal.signal_type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {signal.summary}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{signal.confidence_level}%</p>
              <p className="text-xs text-muted-foreground">{signal.time_horizon}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

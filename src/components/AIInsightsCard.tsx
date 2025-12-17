"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sparkles,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AIInsightsCardProps {
  company: {
    code: string
    name: string
  }
  className?: string
}

interface InsightsData {
  summary: string
  insights: string[]
  outlook: "Positive" | "Neutral" | "Cautious" | "Negative"
  keyMetric: string | null
  generatedAt: string
  marketDate: string
}

const OUTLOOK_CONFIG = {
  Positive: {
    icon: TrendingUp,
    color: "text-profit",
    bg: "bg-profit/10",
    border: "border-profit/30",
  },
  Neutral: {
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
  Cautious: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  Negative: {
    icon: TrendingDown,
    color: "text-loss",
    bg: "bg-loss/10",
    border: "border-loss/30",
  },
}

export function AIInsightsCard({ company, className }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Future: Check if user is a member
  const isMember = true // TODO: Replace with actual auth check

  const fetchInsights = useCallback(async () => {
    if (!company.code) return

    setLoading(true)
    setError(null)

    try {
      // Fetch cached insights from database
      const response = await fetch(`/api/insights/${company.code}`)

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setInsights(data.data)
      } else if (data.success && !data.data) {
        // No insights available yet
        setInsights(null)
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error fetching insights:', err)
      setError('Unable to load insights')
    } finally {
      setLoading(false)
    }
  }, [company.code])

  // Fetch on mount
  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const outlookConfig = insights?.outlook ? OUTLOOK_CONFIG[insights.outlook] : OUTLOOK_CONFIG.Neutral
  const OutlookIcon = outlookConfig.icon

  // If not a member (future feature)
  if (!isMember) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
              <p className="text-xs text-muted-foreground">Premium Feature</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6">
            <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Member-Only Feature</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Subscribe to access AI-powered insights for all companies
            </p>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
              <p className="text-xs text-muted-foreground">Updated daily after market close</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {insights && (
              <Badge
                variant="outline"
                className={cn("text-xs", outlookConfig.color, outlookConfig.bg, outlookConfig.border)}
              >
                <OutlookIcon className="h-3 w-3 mr-1" />
                {insights.outlook}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchInsights}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchInsights}>
              Try Again
            </Button>
          </div>
        ) : !insights ? (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Insights not yet generated</p>
            <p className="text-xs text-muted-foreground mt-1">
              AI insights are generated daily after market close (5pm MYT)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <p className="text-sm leading-relaxed">{insights.summary}</p>

            {/* Key Metric Highlight */}
            {insights.keyMetric && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Key Highlight</span>
                </div>
                <p className="text-sm mt-1">{insights.keyMetric}</p>
              </div>
            )}

            {/* Insights List */}
            {insights.insights.length > 0 && (
              <div className="space-y-2">
                {insights.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp */}
            {insights.generatedAt && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                Generated {new Date(insights.generatedAt).toLocaleString('en-MY', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short',
                })}
                {insights.marketDate && ` for ${insights.marketDate}`}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            AI-generated analysis for educational purposes only. Not investment advice.
            Always do your own research and consult a licensed financial advisor.
          </p>
        </div>

        {/* Ask AI Button */}
        <Link
          href={`/chat?company=${company.code}`}
          className="mt-3 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-500/20 transition-all group"
        >
          <MessageSquare className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium text-violet-500">Ask AI about {company.code}</span>
          <ChevronRight className="h-4 w-4 text-violet-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  )
}

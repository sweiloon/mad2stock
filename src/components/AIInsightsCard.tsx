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
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AIInsightsCardProps {
  company: {
    code: string
    name: string
    sector: string
    price?: number
    changePercent?: number
    volume?: number
    revenue?: number
    profit?: number
    revenueYoY?: number
    profitYoY?: number
    revenueQoQ?: number
    profitQoQ?: number
    yoyCategory?: number
    qoqCategory?: number
  }
  className?: string
}

interface InsightsData {
  summary: string
  insights: string[]
  outlook: "Positive" | "Neutral" | "Cautious" | "Negative"
  keyMetric: string | null
  generatedAt: string
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAttempted, setHasAttempted] = useState(false)

  const fetchInsights = useCallback(async () => {
    if (!company.code) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/insights/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setInsights(data.data)
      } else {
        // Show more specific error message
        const errorMsg = data.details || data.error || 'Unknown error'
        throw new Error(errorMsg)
      }
    } catch (err) {
      console.error('Error fetching insights:', err)
      let errorMessage = err instanceof Error ? err.message : 'Unable to generate insights'

      // Provide user-friendly messages for common errors
      if (errorMessage.includes('401') || errorMessage.includes('API key')) {
        errorMessage = 'AI service configuration error. Please contact support.'
      } else if (errorMessage.includes('503') || errorMessage.includes('not configured')) {
        errorMessage = 'AI service is temporarily unavailable.'
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
      setHasAttempted(true)
    }
  }, [company])

  // Auto-fetch on mount if company has financial data
  useEffect(() => {
    const hasData = company.revenue || company.profit || company.revenueYoY
    if (hasData && !hasAttempted) {
      fetchInsights()
    }
  }, [company.code, hasAttempted, fetchInsights, company.revenue, company.profit, company.revenueYoY])

  const outlookConfig = insights?.outlook ? OUTLOOK_CONFIG[insights.outlook] : OUTLOOK_CONFIG.Neutral
  const OutlookIcon = outlookConfig.icon

  // Check if we have enough data
  const hasFinancialData = company.revenue || company.profit || company.revenueYoY

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
              <p className="text-xs text-muted-foreground">Powered by GPT-4</p>
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
        ) : !hasFinancialData && !insights ? (
          <div className="text-center py-4">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Financial data not available for AI analysis</p>
            <p className="text-xs text-muted-foreground mt-1">
              Insights will be generated once financial data is added
            </p>
          </div>
        ) : insights ? (
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
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Button variant="outline" size="sm" onClick={fetchInsights}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Insights
            </Button>
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

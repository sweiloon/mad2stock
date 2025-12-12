"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"

interface MarketStats {
  totalCompanies: number
  category1Count: number
  category4Count: number
  averageRevenueChange: number
  averageProfitChange: number
}

interface MarketOverviewProps {
  stats: MarketStats
  type: "yoy" | "qoq"
}

export function MarketOverview({ stats, type }: MarketOverviewProps) {
  const metrics = [
    {
      label: "Total Companies",
      value: stats.totalCompanies,
      icon: Building2,
      color: "text-primary"
    },
    {
      label: "Strong Performers",
      value: stats.category1Count,
      subtitle: "Category 1",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      label: "Underperformers",
      value: stats.category4Count,
      subtitle: "Category 4",
      icon: TrendingDown,
      color: "text-red-600"
    },
    {
      label: "Avg Revenue",
      value: `${stats.averageRevenueChange > 0 ? "+" : ""}${stats.averageRevenueChange.toFixed(1)}%`,
      icon: BarChart3,
      color: stats.averageRevenueChange >= 0 ? "text-green-600" : "text-red-600"
    }
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Market Overview</CardTitle>
        <Badge variant="outline">{type.toUpperCase()} Analysis</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className={`p-2 rounded-lg bg-background ${metric.color}`}>
                <metric.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-xs text-muted-foreground">
                  {metric.label}
                  {metric.subtitle && (
                    <span className="ml-1">({metric.subtitle})</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

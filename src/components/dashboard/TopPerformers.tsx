"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PerformerData {
  code: string
  name: string
  revenueChange: number
  profitChange: number
  category: number
}

interface TopPerformersProps {
  title: string
  type: "yoy" | "qoq"
  performers: PerformerData[]
}

export function TopPerformers({ title, type, performers }: TopPerformersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Badge variant="secondary">{type.toUpperCase()}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performers.map((company, index) => (
            <Link
              key={company.code}
              href={`/companies/${company.code}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{company.code}</div>
                  <div className="text-sm text-muted-foreground">
                    Category {company.category}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {company.revenueChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      company.revenueChange >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {company.revenueChange > 0 ? "+" : ""}{company.revenueChange}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {company.profitChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      company.profitChange >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {company.profitChange > 0 ? "+" : ""}{company.profitChange}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Profit</div>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>

        <Button variant="ghost" className="w-full mt-4" asChild>
          <Link href={`/companies?sort=${type}&category=1`}>
            View All Category 1 Companies
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

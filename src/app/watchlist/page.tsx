"use client"

import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth/AuthProvider"
import { getCompanyByCode } from "@/lib/company-data"
import {
  Star,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function WatchlistPage() {
  const { user, profile, isLoading, refreshProfile } = useAuth()

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  const watchlist = profile?.watchlist || []

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Watchlist</h1>
              <p className="text-sm text-muted-foreground">
                {watchlist.length} {watchlist.length === 1 ? "stock" : "stocks"} in your watchlist
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/companies">
              <Plus className="h-4 w-4 mr-2" />
              Add Stocks
            </Link>
          </Button>
        </div>

        {/* Watchlist */}
        {watchlist.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No stocks in watchlist</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-sm">
                Start building your watchlist by adding stocks you want to track.
                You&apos;ll get quick access to their prices and insights.
              </p>
              <Button asChild>
                <Link href="/companies">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Companies
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {watchlist.map((code) => {
              const company = getCompanyByCode(code)
              if (!company) return null

              const profitChange = company.profitYoY ?? 0
              const isPositive = profitChange >= 0

              return (
                <Card key={code} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link
                          href={`/companies/${code}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {code}
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {company.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {company.sector}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex items-center text-sm font-medium",
                            isPositive ? "text-profit" : "text-loss"
                          )}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {isPositive ? "+" : ""}
                          {profitChange.toFixed(1)}%
                        </div>
                        <span className="text-xs text-muted-foreground">YoY</span>
                      </div>

                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/companies/${code}`}>
                          View
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Tips */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Add stocks from any company page by clicking the star icon</li>
              <li>• Watchlist stocks will appear in your personalized dashboard</li>
              <li>• You&apos;ll receive alerts when watchlist stocks have significant moves</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

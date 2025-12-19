"use client"

import { useState, lazy, Suspense } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  ChevronRight,
  Eye,
  Clock,
  Flame,
  Star,
  ArrowRight,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCompanyStatsContext } from "@/contexts/CompanyStatsContext"

// Lazy load MarketOverviewCard - it makes its own API call and is below the fold
const MarketOverviewCard = lazy(() =>
  import("@/components/dashboard/MarketOverviewCard").then(mod => ({ default: mod.MarketOverviewCard }))
)

// Loading skeleton for MarketOverviewCard
function MarketOverviewSkeleton() {
  return (
    <Card className="trading-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Performance Categories
const PERFORMANCE_CATEGORIES = [
  {
    id: 1,
    title: "Revenue UP · Profit UP",
    shortTitle: "Growth",
    description: "Strong performers",
    gradient: "from-[#26a69a] to-[#00897b]",
    bgColor: "bg-[#26a69a]/10",
    borderColor: "border-[#26a69a]/30",
    textColor: "text-[#26a69a]",
    icon: TrendingUp,
  },
  {
    id: 2,
    title: "Revenue DOWN · Profit UP",
    shortTitle: "Efficient",
    description: "Margin improvement",
    gradient: "from-[#42a5f5] to-[#1e88e5]",
    bgColor: "bg-[#42a5f5]/10",
    borderColor: "border-[#42a5f5]/30",
    textColor: "text-[#42a5f5]",
    icon: Target,
  },
  {
    id: 3,
    title: "Revenue UP · Profit DOWN",
    shortTitle: "Pressure",
    description: "Margin challenges",
    gradient: "from-[#ff9800] to-[#f57c00]",
    bgColor: "bg-[#ff9800]/10",
    borderColor: "border-[#ff9800]/30",
    textColor: "text-[#ff9800]",
    icon: Activity,
  },
  {
    id: 4,
    title: "Revenue DOWN · Profit DOWN",
    shortTitle: "Decline",
    description: "Under pressure",
    gradient: "from-[#ef5350] to-[#e53935]",
    bgColor: "bg-[#ef5350]/10",
    borderColor: "border-[#ef5350]/30",
    textColor: "text-[#ef5350]",
    icon: TrendingDown,
  },
  {
    id: 5,
    title: "Turnaround",
    shortTitle: "Recovery",
    description: "Loss to profit",
    gradient: "from-[#ab47bc] to-[#8e24aa]",
    bgColor: "bg-[#ab47bc]/10",
    borderColor: "border-[#ab47bc]/30",
    textColor: "text-[#ab47bc]",
    icon: Zap,
  },
  {
    id: 6,
    title: "Deteriorating",
    shortTitle: "Warning",
    description: "Profit to loss",
    gradient: "from-[#78909c] to-[#546e7a]",
    bgColor: "bg-[#78909c]/10",
    borderColor: "border-[#78909c]/30",
    textColor: "text-[#78909c]",
    icon: ArrowDownRight,
  },
]

// Recent signals - sample data for demonstration
const recentSignals = [
  { company: "UWC", type: "earnings", title: "Q4 Profit Surges 685%", time: "30m", strength: "strong" },
  { company: "GAMUDA", type: "news", title: "MRT3 Contract Secured", time: "2h", strength: "buy" },
  { company: "ECOWLD", type: "breakout", title: "Breakout Above RM1.20", time: "4h", strength: "buy" },
  { company: "PRKCORP", type: "volume", title: "Unusual Volume Spike", time: "5h", strength: "watch" },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("yoy")
  const [selectedSector, setSelectedSector] = useState("All Sectors")
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)

  // Get data from shared context (single fetch, shared across Header, Sidebar, Dashboard)
  const { stats, isLoading: loading, refetch } = useCompanyStatsContext()

  // Build current data based on active tab
  const yoyCategoryCounts = stats?.yoyCategoryCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const qoqCategoryCounts = stats?.qoqCategoryCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  const currentCategories = activeTab === "yoy"
    ? Object.entries(yoyCategoryCounts).map(([id, count]) => ({ id: parseInt(id), count }))
    : Object.entries(qoqCategoryCounts).map(([id, count]) => ({ id: parseInt(id), count }))

  const currentTopPerformers = activeTab === "yoy"
    ? (stats?.topYoYPerformers || [])
    : (stats?.topQoQPerformers || [])
  const totalCompanies = stats?.totalCompanies || 0
  const sectorStats = stats?.sectorStats || []
  const sectors = ["All Sectors", ...(stats?.sectors || [])]

  // Market stats based on real data
  const gainersLosers = stats?.gainersLosers || { gainers: 0, losers: 0, unchanged: 0 }
  const marketStats = {
    totalCompanies,
    gainers: gainersLosers.gainers,
    losers: gainersLosers.losers,
    unchanged: gainersLosers.unchanged,
    growthLeaders: yoyCategoryCounts[1] || 0,
    turnarounds: yoyCategoryCounts[5] || 0,
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-4 p-1">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 p-1">
        {/* Market Overview Stats - Compact Row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="trading-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Companies</p>
                  <p className="text-2xl font-bold tabular-nums">{marketStats.totalCompanies}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Gainers</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-profit tabular-nums">{marketStats.gainers}</p>
                    <span className="text-xs text-muted-foreground">/ {marketStats.losers}</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-profit/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-profit" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Growth Leaders</p>
                  <p className="text-2xl font-bold text-profit tabular-nums">
                    {marketStats.growthLeaders}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-profit/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-profit" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Turnaround</p>
                  <p className="text-2xl font-bold text-[#ab47bc] tabular-nums">
                    {marketStats.turnarounds}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#ab47bc]/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-[#ab47bc]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="yoy" className="text-xs h-7 px-3">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  YoY
                </TabsTrigger>
                <TabsTrigger value="qoq" className="text-xs h-7 px-3">
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  QoQ
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector} className="text-xs">{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" asChild>
              <Link href="/companies">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                All Companies
              </Link>
            </Button>
          </div>
        </div>

        {/* Performance Categories - Horizontal Cards */}
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {PERFORMANCE_CATEGORIES.map((category) => {
            const categoryData = currentCategories.find(c => c.id === category.id)
            const count = categoryData?.count || 0
            const percentage = ((count / totalCompanies) * 100).toFixed(0)
            const Icon = category.icon
            const isHovered = hoveredCategory === category.id

            return (
              <Link
                key={category.id}
                href={`/companies?category=${category.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-lg border p-3 transition-all duration-300",
                  category.bgColor,
                  category.borderColor,
                  isHovered && "scale-[1.02] shadow-lg"
                )}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    "h-7 w-7 rounded-md flex items-center justify-center",
                    category.bgColor
                  )}>
                    <Icon className={cn("h-3.5 w-3.5", category.textColor)} />
                  </div>
                  <span className={cn("text-xl font-bold tabular-nums", category.textColor)}>
                    {count}
                  </span>
                </div>
                <p className="text-xs font-medium truncate">{category.shortTitle}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">{category.description}</span>
                  <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/30">
                  <div
                    className={cn("h-full bg-gradient-to-r transition-all duration-500", category.gradient)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Top Performers */}
          <Card className="lg:col-span-2 trading-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-profit/10 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-profit" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Top Performers</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Highest {activeTab === "yoy" ? "YoY" : "QoQ"} profit growth
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <Link href="/companies?sort=profit_change&order=desc">
                    View All
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {currentTopPerformers.map((company, index) => {
                  const profitChange = (activeTab === "yoy" ? company.profitYoY : company.profitQoQ) ?? 0
                  const revenueChange = (activeTab === "yoy" ? company.revenueYoY : company.revenueQoQ) ?? 0
                  return (
                    <Link
                      key={company.code}
                      href={`/companies/${company.code}`}
                      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm",
                        index === 0 ? "bg-[#ffd700]/20 text-[#ffd700]" :
                        index === 1 ? "bg-[#c0c0c0]/20 text-[#a0a0a0]" :
                        index === 2 ? "bg-[#cd7f32]/20 text-[#cd7f32]" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{company.code}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {company.sector}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{company.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-muted-foreground">Rev:</span>
                          <span className={cn(
                            "flex items-center text-xs font-medium tabular-nums",
                            revenueChange >= 0 ? "text-profit" : "text-loss"
                          )}>
                            {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-profit">
                          <ArrowUpRight className="h-3 w-3" />
                          <span className="text-xs font-semibold tabular-nums">+{profitChange.toFixed(0)}%</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Signals */}
          <Card className="trading-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#ff9800]/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-[#ff9800]" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Live Signals</CardTitle>
                    <p className="text-xs text-muted-foreground">Real-time alerts</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentSignals.map((signal, index) => (
                  <Link
                    key={index}
                    href={`/signals?company=${signal.company}`}
                    className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      signal.strength === "strong" ? "bg-profit/10" :
                      signal.strength === "buy" ? "bg-[#42a5f5]/10" :
                      "bg-[#ff9800]/10"
                    )}>
                      {signal.type === "earnings" ? (
                        <BarChart3 className={cn(
                          "h-4 w-4",
                          signal.strength === "strong" ? "text-profit" :
                          signal.strength === "buy" ? "text-[#42a5f5]" :
                          "text-[#ff9800]"
                        )} />
                      ) : signal.type === "breakout" ? (
                        <TrendingUp className={cn(
                          "h-4 w-4",
                          signal.strength === "strong" ? "text-profit" :
                          signal.strength === "buy" ? "text-[#42a5f5]" :
                          "text-[#ff9800]"
                        )} />
                      ) : signal.type === "volume" ? (
                        <Activity className={cn(
                          "h-4 w-4",
                          signal.strength === "strong" ? "text-profit" :
                          signal.strength === "buy" ? "text-[#42a5f5]" :
                          "text-[#ff9800]"
                        )} />
                      ) : (
                        <Zap className={cn(
                          "h-4 w-4",
                          signal.strength === "strong" ? "text-profit" :
                          signal.strength === "buy" ? "text-[#42a5f5]" :
                          "text-[#ff9800]"
                        )} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{signal.company}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-4 px-1.5",
                            signal.strength === "strong" ? "text-profit border-profit/50" :
                            signal.strength === "buy" ? "text-[#42a5f5] border-[#42a5f5]/50" :
                            "text-[#ff9800] border-[#ff9800]/50"
                          )}
                        >
                          {signal.strength === "strong" ? "Strong Buy" :
                           signal.strength === "buy" ? "Buy" : "Watch"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{signal.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">{signal.time}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3 h-9 text-xs" asChild>
                <Link href="/signals">
                  View All Signals
                  <ArrowRight className="h-3 w-3 ml-1.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Category Distribution */}
          <Card className="trading-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Category Distribution</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {totalCompanies} companies analyzed
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {PERFORMANCE_CATEGORIES.map((category) => {
                  const categoryData = currentCategories.find(c => c.id === category.id)
                  const count = categoryData?.count || 0
                  const percentage = ((count / totalCompanies) * 100).toFixed(0)

                  return (
                    <div key={category.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2.5 w-2.5 rounded-sm bg-gradient-to-r", category.gradient)} />
                          <span className="font-medium">{category.shortTitle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-semibold tabular-nums", category.textColor)}>{count}</span>
                          <span className="text-muted-foreground tabular-nums">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", category.gradient)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sector Overview */}
          <Card className="trading-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#42a5f5]/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[#42a5f5]" />
                </div>
                <div>
                  <CardTitle className="text-base">Sector Performance</CardTitle>
                  <p className="text-xs text-muted-foreground">Top sectors by growth</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {sectorStats.map((item, index) => {
                  const colors = [
                    "from-[#42a5f5] to-[#1e88e5]",
                    "from-[#26a69a] to-[#00897b]",
                    "from-[#ab47bc] to-[#8e24aa]",
                    "from-[#ff9800] to-[#f57c00]",
                    "from-[#ef5350] to-[#e53935]",
                  ]
                  return (
                    <Link
                      key={item.sector}
                      href={`/companies?sector=${encodeURIComponent(item.sector)}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br",
                        colors[index % colors.length]
                      )}>
                        {item.count}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.sector}</p>
                        <p className="text-[10px] text-muted-foreground">{item.count} companies</p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-medium tabular-nums",
                        item.avgProfitGrowth >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {item.avgProfitGrowth >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {item.avgProfitGrowth >= 0 ? "+" : ""}{item.avgProfitGrowth.toFixed(1)}%
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Overview - Lazy loaded */}
        <Suspense fallback={<MarketOverviewSkeleton />}>
          <MarketOverviewCard />
        </Suspense>

        {/* Quick Actions */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Link
            href="/companies"
            className="group flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">All Companies</p>
              <p className="text-xs text-muted-foreground">Browse listings</p>
            </div>
          </Link>

          <Link
            href="/chat"
            className="group flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-profit/50 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-profit/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5 text-profit" />
            </div>
            <div>
              <p className="text-sm font-medium">AI Analysis</p>
              <p className="text-xs text-muted-foreground">Smart insights</p>
            </div>
          </Link>

          <Link
            href="/content"
            className="group flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-[#ab47bc]/50 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-[#ab47bc]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5 text-[#ab47bc]" />
            </div>
            <div>
              <p className="text-sm font-medium">Content Creator</p>
              <p className="text-xs text-muted-foreground">Generate posts</p>
            </div>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}

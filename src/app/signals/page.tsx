"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  TrendingUp,
  TrendingDown,
  Bell,
  BellRing,
  Newspaper,
  BarChart3,
  Star,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
  Building2,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Filter,
  Volume2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Eye,
  Bookmark,
  Share2,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Signal {
  id: string
  companyCode: string
  companyName: string
  type: "price_alert" | "news" | "volume" | "earnings" | "recommendation" | "breakout"
  strength: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell"
  title: string
  description: string
  details: string
  source?: string
  sourceUrl?: string
  priceTarget?: number
  currentPrice?: number
  timestamp: Date
  isNew?: boolean
}

const SIGNAL_TYPES = {
  price_alert: { label: "Price Alert", icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-500/10" },
  news: { label: "News", icon: Newspaper, color: "text-purple-600", bgColor: "bg-purple-500/10" },
  volume: { label: "Volume Spike", icon: Volume2, color: "text-amber-600", bgColor: "bg-amber-500/10" },
  earnings: { label: "Earnings", icon: BarChart3, color: "text-green-600", bgColor: "bg-green-500/10" },
  recommendation: { label: "Analyst", icon: Star, color: "text-rose-600", bgColor: "bg-rose-500/10" },
  breakout: { label: "Breakout", icon: Zap, color: "text-orange-600", bgColor: "bg-orange-500/10" },
}

const SIGNAL_STRENGTHS = {
  strong_buy: { label: "Strong Buy", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: ArrowUpRight },
  buy: { label: "Buy", color: "bg-green-100 text-green-700 border-green-200", icon: TrendingUp },
  hold: { label: "Hold", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Target },
  sell: { label: "Sell", color: "bg-orange-100 text-orange-700 border-orange-200", icon: TrendingDown },
  strong_sell: { label: "Strong Sell", color: "bg-red-100 text-red-700 border-red-200", icon: ArrowDownRight },
}

// Enhanced mock signals data
const mockSignals: Signal[] = [
  {
    id: "1",
    companyCode: "UWC",
    companyName: "UWC Berhad",
    type: "earnings",
    strength: "strong_buy",
    title: "Q4 Profit Surges 685% YoY",
    description: "UWC reports exceptional Q4 results with profit increasing nearly 8x YoY. Revenue up 43%.",
    details: `**Key Highlights:**
- Q4 FY2025 Profit: RM28.5M (+685.7% YoY)
- Q4 FY2025 Revenue: RM125.5M (+43.0% YoY)
- Net Margin expanded to 22.7%
- Strong semiconductor demand recovery

**Analysis:**
The exceptional profit growth demonstrates UWC's operational leverage and successful cost management. The company benefited from increased demand from semiconductor clients and improved manufacturing efficiency.

**Outlook:**
Positive momentum expected to continue in FY2026 with sustained demand from the electronics manufacturing sector.`,
    source: "Market Data",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isNew: true,
  },
  {
    id: "2",
    companyCode: "ECOWLD",
    companyName: "Eco World Development",
    type: "news",
    strength: "buy",
    title: "Major RM2.5B Johor Project Secured",
    description: "Eco World announces major mixed development project in Iskandar Malaysia.",
    details: `**Project Details:**
- Total GDV: RM2.5 billion
- Location: Iskandar Malaysia, Johor
- Components: Residential, commercial, and retail
- Development Period: 8 years

**Strategic Significance:**
This project strengthens Eco World's presence in the Southern region and provides earnings visibility for the next decade.

**Impact on Financials:**
Expected to contribute RM300M annually to revenue once phases begin launching in 2026.`,
    source: "The Edge Markets",
    sourceUrl: "https://theedgemarkets.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    companyCode: "GAMUDA",
    companyName: "Gamuda Berhad",
    type: "recommendation",
    strength: "buy",
    title: "Target Price Raised to RM6.50",
    description: "Maybank IB upgrades Gamuda with new TP of RM6.50, citing strong MRT3 orderbook.",
    details: `**Analyst Update:**
- New Target Price: RM6.50 (previously RM5.80)
- Rating: BUY (maintained)
- Upside: 18% from current levels

**Key Catalysts:**
1. MRT3 project award confirmation
2. Strong orderbook of RM25 billion
3. International expansion in Australia and Taiwan

**Valuation:**
Trading at 12x FY26 P/E, below historical average of 15x.`,
    source: "Maybank IB Research",
    priceTarget: 6.50,
    currentPrice: 5.52,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: "4",
    companyCode: "KOSSAN",
    companyName: "Kossan Rubber",
    type: "volume",
    strength: "hold",
    title: "Unusual Volume Detected - 3x Average",
    description: "Trading volume 3x above 30-day average. Price consolidating near support level.",
    details: `**Volume Analysis:**
- Today's Volume: 15.2M shares
- 30-Day Average: 4.8M shares
- Volume Multiple: 3.17x

**Technical Observations:**
- Price consolidating at RM1.85 support
- RSI at 42 (neutral zone)
- MACD showing early signs of bullish crossover

**Possible Catalysts:**
- Upcoming Q4 results announcement
- Sector rotation into healthcare stocks
- Potential M&A speculation`,
    source: "System Alert",
    currentPrice: 1.85,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    id: "5",
    companyCode: "ASTRO",
    companyName: "Astro Malaysia",
    type: "earnings",
    strength: "hold",
    title: "Turnaround in Q3 - Returns to Profit",
    description: "Astro returns to profit in Q3 after massive Q2 loss. Cost management shows results.",
    details: `**Q3 FY2026 Results:**
- Profit: RM9.2M (vs Q2 loss of RM196.9M)
- Revenue: RM695.6M (-7.4% QoQ)
- Net Margin: 1.3%

**Turnaround Drivers:**
1. Cost optimization measures
2. Improved forex hedging
3. sooka streaming growth at 100% YoY

**Risks:**
- Subscriber decline continues (-1.1M since 2019)
- ARPU pressure (RM96.30 vs RM99.80)
- Structural industry headwinds`,
    source: "Market Data",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: "6",
    companyCode: "HIGHTEC",
    companyName: "Hightec Global",
    type: "breakout",
    strength: "strong_buy",
    title: "Technical Breakout Above RM0.85 Resistance",
    description: "Stock breaks above key resistance at RM0.85 with strong momentum and volume.",
    details: `**Technical Analysis:**
- Breakout Level: RM0.85
- Volume Confirmation: 2.5x average
- Next Resistance: RM1.00
- Support: RM0.80

**Chart Pattern:**
Bullish ascending triangle breakout with measured move target of RM1.10.

**Momentum Indicators:**
- RSI: 68 (bullish but not overbought)
- MACD: Positive crossover
- ADX: 32 (trending)`,
    source: "Technical Alert",
    currentPrice: 0.88,
    priceTarget: 1.10,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10),
    isNew: true,
  },
  {
    id: "7",
    companyCode: "SCIENTX",
    companyName: "Scientex Berhad",
    type: "news",
    strength: "buy",
    title: "RM500M Expansion Investment Announced",
    description: "Scientex to invest RM500m in new packaging plant, expanding capacity by 30%.",
    details: `**Investment Details:**
- Total Investment: RM500 million
- Capacity Increase: 30%
- Location: Melaka
- Completion: Q2 2027

**Strategic Rationale:**
To capture growing demand for sustainable packaging solutions in ASEAN markets.

**Financial Impact:**
Expected to add RM200M to annual revenue post-completion.`,
    source: "Company Announcement",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: "8",
    companyCode: "PRKCORP",
    companyName: "Prkorp Berhad",
    type: "earnings",
    strength: "strong_buy",
    title: "Profit Growth +352.7% YoY",
    description: "Outstanding quarterly performance with profit more than tripling year-over-year.",
    details: `**Financial Highlights:**
- Profit Growth: +352.7% YoY
- Revenue Growth: +19.6% YoY
- Strong margin expansion

**Growth Drivers:**
1. Construction sector recovery
2. New project wins
3. Improved operational efficiency

**Outlook:**
Management guides for continued strong performance in coming quarters.`,
    source: "Market Data",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14),
  },
]

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>(mockSignals)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [strengthFilter, setStrengthFilter] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [showAlertSettings, setShowAlertSettings] = useState(false)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  // Simulate new signal notifications
  useEffect(() => {
    if (!alertsEnabled) return

    const interval = setInterval(() => {
      // Randomly show a notification for demo
      const newSignals = signals.filter(s => s.isNew)
      if (newSignals.length > 0 && Math.random() > 0.7) {
        const signal = newSignals[Math.floor(Math.random() * newSignals.length)]
        toast.success(`New Signal: ${signal.companyCode}`, {
          description: signal.title,
          action: {
            label: "View",
            onClick: () => setSelectedSignal(signal),
          },
        })
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [signals, alertsEnabled])

  const filteredSignals = signals.filter((signal) => {
    const matchesSearch =
      signal.companyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || signal.type === typeFilter
    const matchesStrength = strengthFilter === "all" || signal.strength === strengthFilter
    return matchesSearch && matchesType && matchesStrength
  })

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Signals refreshed", {
        description: "Latest market signals loaded",
      })
    }, 1000)
  }

  const signalCounts = {
    total: signals.length,
    strongBuy: signals.filter(s => s.strength === "strong_buy").length,
    buy: signals.filter(s => s.strength === "buy").length,
    sell: signals.filter(s => s.strength === "sell" || s.strength === "strong_sell").length,
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Market Signals</h1>
              <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Real-time market alerts, news, and trading signals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant={alertsEnabled ? "default" : "outline"}
              onClick={() => {
                setAlertsEnabled(!alertsEnabled)
                toast.success(alertsEnabled ? "Alerts disabled" : "Alerts enabled")
              }}
            >
              {alertsEnabled ? (
                <BellRing className="h-4 w-4 mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              {alertsEnabled ? "Alerts On" : "Alerts Off"}
            </Button>
          </div>
        </div>

        {/* Signal Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Signals</p>
                  <p className="text-3xl font-bold">{signalCounts.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Strong Buy</p>
                  <p className="text-3xl font-bold text-emerald-600">{signalCounts.strongBuy}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Buy Signals</p>
                  <p className="text-3xl font-bold text-blue-600">{signalCounts.buy}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Types</p>
                  <p className="text-3xl font-bold text-amber-600">{Object.keys(SIGNAL_TYPES).length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Filter className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search signals by company or title..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Signal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(SIGNAL_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <val.icon className={cn("h-4 w-4", val.color)} />
                        {val.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={strengthFilter} onValueChange={setStrengthFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Signal Strength" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strengths</SelectItem>
                  {Object.entries(SIGNAL_STRENGTHS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Signal Type Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(SIGNAL_TYPES).map(([key, val]) => {
            const count = signals.filter(s => s.type === key).length
            const Icon = val.icon
            const isActive = typeFilter === key
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(isActive ? "all" : key)}
                className={cn(!isActive && val.color)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {val.label}
                <Badge variant="secondary" className="ml-2">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>

        {/* Signals List */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Signal Feed */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Signal Feed ({filteredSignals.length})</CardTitle>
              <CardDescription>Click on any signal for detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredSignals.map((signal) => {
                    const typeInfo = SIGNAL_TYPES[signal.type]
                    const strengthInfo = SIGNAL_STRENGTHS[signal.strength]
                    const TypeIcon = typeInfo.icon
                    const StrengthIcon = strengthInfo.icon

                    return (
                      <div
                        key={signal.id}
                        onClick={() => setSelectedSignal(signal)}
                        className={cn(
                          "relative flex gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50",
                          signal.isNew && "border-emerald-500/50 bg-emerald-500/5"
                        )}
                      >
                        {signal.isNew && (
                          <div className="absolute -top-2 -right-2">
                            <Badge className="bg-emerald-500 text-white text-xs">NEW</Badge>
                          </div>
                        )}

                        {/* Icon */}
                        <div className={cn(
                          "flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center",
                          typeInfo.bgColor
                        )}>
                          <TypeIcon className={cn("h-6 w-6", typeInfo.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/companies/${signal.companyCode}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-lg hover:text-primary hover:underline"
                              >
                                {signal.companyCode}
                              </Link>
                              <Badge variant="outline" className={strengthInfo.color}>
                                <StrengthIcon className="h-3 w-3 mr-1" />
                                {strengthInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(signal.timestamp)}
                            </div>
                          </div>

                          <h3 className="font-semibold mb-1">{signal.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{signal.description}</p>

                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="secondary" className={cn("text-xs", typeInfo.color)}>
                              {typeInfo.label}
                            </Badge>
                            {signal.source && (
                              <span className="text-xs text-muted-foreground">
                                Source: {signal.source}
                              </span>
                            )}
                            {signal.priceTarget && (
                              <span className="text-xs font-medium text-emerald-600">
                                Target: RM{signal.priceTarget.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 self-center" />
                      </div>
                    )
                  })}

                  {filteredSignals.length === 0 && (
                    <div className="text-center py-12">
                      <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No signals found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or search terms
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Strength Distribution */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signal Strength Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(SIGNAL_STRENGTHS).map(([key, val]) => {
                    const count = signals.filter(s => s.strength === key).length
                    const percentage = ((count / signals.length) * 100).toFixed(0)
                    const Icon = val.icon

                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{val.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{count}</span>
                            <span className="text-xs text-muted-foreground">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", val.color.replace("text-", "bg-").replace("-700", "-500"))}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/chat">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask AI About Signals
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/companies">
                    <Building2 className="h-4 w-4 mr-2" />
                    Browse Companies
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Signal Detail Dialog */}
        <Sheet open={!!selectedSignal} onOpenChange={() => setSelectedSignal(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedSignal && (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center",
                      SIGNAL_TYPES[selectedSignal.type].bgColor
                    )}>
                      {(() => {
                        const Icon = SIGNAL_TYPES[selectedSignal.type].icon
                        return <Icon className={cn("h-6 w-6", SIGNAL_TYPES[selectedSignal.type].color)} />
                      })()}
                    </div>
                    <div>
                      <SheetTitle className="text-left">{selectedSignal.companyCode}</SheetTitle>
                      <p className="text-sm text-muted-foreground">{selectedSignal.companyName}</p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {/* Signal Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={SIGNAL_STRENGTHS[selectedSignal.strength].color}>
                        {SIGNAL_STRENGTHS[selectedSignal.strength].label}
                      </Badge>
                      <Badge variant="secondary">
                        {SIGNAL_TYPES[selectedSignal.type].label}
                      </Badge>
                      {selectedSignal.isNew && (
                        <Badge className="bg-emerald-500 text-white">NEW</Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold">{selectedSignal.title}</h2>
                    <p className="text-muted-foreground mt-2">{selectedSignal.description}</p>
                  </div>

                  <Separator />

                  {/* Price Info */}
                  {(selectedSignal.currentPrice || selectedSignal.priceTarget) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSignal.currentPrice && (
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Current Price</p>
                          <p className="text-2xl font-bold">RM{selectedSignal.currentPrice.toFixed(2)}</p>
                        </div>
                      )}
                      {selectedSignal.priceTarget && (
                        <div className="p-4 rounded-lg bg-emerald-500/10">
                          <p className="text-sm text-muted-foreground">Price Target</p>
                          <p className="text-2xl font-bold text-emerald-600">RM{selectedSignal.priceTarget.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detailed Analysis */}
                  <div>
                    <h3 className="font-semibold mb-3">Detailed Analysis</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg">
                        {selectedSignal.details}
                      </pre>
                    </div>
                  </div>

                  {/* Source */}
                  {selectedSignal.source && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm text-muted-foreground">Source</p>
                        <p className="font-medium">{selectedSignal.source}</p>
                      </div>
                      {selectedSignal.sourceUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedSignal.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {selectedSignal.timestamp.toLocaleString()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <Link href={`/companies/${selectedSignal.companyCode}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Company
                      </Link>
                    </Button>
                    <Button variant="outline">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="outline">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </MainLayout>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Building2,
  TrendingUp,
  BarChart3,
  FileText,
  Download,
  Activity,
  DollarSign,
  ExternalLink,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCompanyDocuments, formatFileSize } from "@/hooks/use-documents"
import { getStockCode } from "@/lib/stock-codes"
import { useCachedStockPrice, formatLastUpdated } from "@/hooks/use-cached-prices"
import { LastUpdatedBadge, LastUpdatedDot } from "@/components/LastUpdatedBadge"
import { COMPANY_DATA, getCompanyByCode, hasFinancialData } from "@/lib/company-data"
import { TradingViewWidget, TradingViewTechnicalAnalysis } from "@/components/TradingViewWidget"

// ============================================================================
// TYPES
// ============================================================================

interface CompanyInfo {
  code: string
  name: string
  sector: string
  latestQuarter: string
  revenue: number
  profit: number
  yoyRevenueChange: number
  yoyProfitChange: number
  qoqRevenueChange: number
  qoqProfitChange: number
  yoyCategory: number
  qoqCategory: number
}


// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = [
  { id: 1, name: "Revenue UP, Profit UP", short: "Growth", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  { id: 2, name: "Revenue DOWN, Profit UP", short: "Efficient", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { id: 3, name: "Revenue UP, Profit DOWN", short: "Pressure", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  { id: 4, name: "Revenue DOWN, Profit DOWN", short: "Decline", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  { id: 5, name: "Turnaround", short: "Recovery", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { id: 6, name: "Deteriorating", short: "Warning", color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/30" },
]

// Convert COMPANY_DATA to CompanyInfo format
function getCompanyInfo(code: string): CompanyInfo | null {
  const company = getCompanyByCode(code)
  if (!company) return null

  return {
    code: company.code,
    name: company.name,
    sector: company.sector,
    latestQuarter: "Q4 2025", // Default quarter, can be enhanced with actual data
    revenue: company.latestRevenue ?? 0,
    profit: company.latestProfit ?? 0,
    yoyRevenueChange: company.revenueYoY ?? 0,
    yoyProfitChange: company.profitYoY ?? 0,
    qoqRevenueChange: company.revenueQoQ ?? 0,
    qoqProfitChange: company.profitQoQ ?? 0,
    yoyCategory: company.yoyCategory ?? 0,
    qoqCategory: company.qoqCategory ?? 0,
  }
}


// ============================================================================
// COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    </MainLayout>
  )
}

function NotFound({ code }: { code: string }) {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Company Not Found</h2>
        <p className="text-muted-foreground mb-4">No data available for "{code}"</p>
        <Button asChild>
          <Link href="/companies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Link>
        </Button>
      </div>
    </MainLayout>
  )
}

function PriceCard({ stock, loading, error }: {
  stock: {
    price: number | null
    change: number | null
    changePercent: number | null
    updatedAt: Date | null
    staleness: 'fresh' | 'stale' | 'very-stale'
    dataSource: 'klsescreener' | 'yahoo' | 'live' | null
  } | null
  loading: boolean
  error: string | null
}) {
  const isPositive = (stock?.change ?? 0) >= 0
  const hasPrice = stock && stock.price !== null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Current Price</span>
          {stock && (
            <LastUpdatedDot staleness={stock.staleness} />
          )}
        </div>

        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : error ? (
          <div className="text-sm text-muted-foreground">Unable to fetch price</div>
        ) : hasPrice ? (
          <>
            <div className="text-2xl font-bold tabular-nums">RM {stock.price!.toFixed(2)}</div>
            <div className={cn("flex items-center text-sm font-medium", isPositive ? "text-emerald-500" : "text-red-500")}>
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {isPositive ? "+" : ""}{(stock.change ?? 0).toFixed(2)} ({isPositive ? "+" : ""}{(stock.changePercent ?? 0).toFixed(2)}%)
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatLastUpdated(stock.updatedAt)}
              {stock.dataSource && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {stock.dataSource === 'klsescreener' ? 'KLSE' : stock.dataSource === 'yahoo' ? 'Yahoo' : 'Live'}
                </Badge>
              )}
            </div>
          </>
        ) : (
          <div className="text-2xl font-bold text-muted-foreground">--</div>
        )}
      </CardContent>
    </Card>
  )
}

function MetricCard({ title, value, suffix, icon: Icon, trend }: {
  title: string
  value: string | number
  suffix?: string
  icon: React.ElementType
  trend?: number
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {value}{suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
            </p>
            {trend !== undefined && (
              <p className={cn("text-xs font-medium", trend >= 0 ? "text-emerald-500" : "text-red-500")}>
                {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
              </p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceCard({ title, category, revenueChange, profitChange }: {
  title: string
  category: number
  revenueChange: number
  profitChange: number
}) {
  const cat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge className={cn(cat.bg, cat.color, cat.border, "text-xs")}>{cat.short}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Revenue</p>
            <p className={cn("text-lg font-bold tabular-nums", revenueChange >= 0 ? "text-emerald-500" : "text-red-500")}>
              {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Profit</p>
            <p className={cn("text-lg font-bold tabular-nums", profitChange >= 0 ? "text-emerald-500" : "text-red-500")}>
              {profitChange >= 0 ? "+" : ""}{profitChange.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


function DocumentsSection({ code }: { code: string }) {
  const { documents, loading } = useCompanyDocuments(code)

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No documents available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            doc.type === "annual" ? "bg-purple-500/10" : doc.type === "analysis" ? "bg-emerald-500/10" : "bg-blue-500/10"
          )}>
            <FileText className={cn(
              "h-5 w-5",
              doc.type === "annual" ? "text-purple-500" : doc.type === "analysis" ? "text-emerald-500" : "text-blue-500"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
          </div>
          <Badge variant="outline" className="text-xs capitalize">{doc.type}</Badge>
          <Button variant="outline" size="sm" asChild>
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CompanyProfilePage() {
  const params = useParams()
  const code = ((params.code as string) || "").toUpperCase()
  const [mounted, setMounted] = useState(false)

  // Get company info from COMPANY_DATA
  const companyData = getCompanyByCode(code)
  const company = getCompanyInfo(code) || {
    code,
    name: companyData?.name || `${code} Berhad`,
    sector: companyData?.sector || "General",
    latestQuarter: "Q4 2025",
    revenue: 0,
    profit: 0,
    yoyRevenueChange: 0,
    yoyProfitChange: 0,
    qoqRevenueChange: 0,
    qoqProfitChange: 0,
    yoyCategory: 0,
    qoqCategory: 0,
  }
  const hasData = companyData ? hasFinancialData(companyData) : false

  // Fetch cached stock price from database
  const stockCode = getStockCode(code)
  const { data: cachedPrice, loading: stockLoading, error: stockError } = useCachedStockPrice(stockCode)

  // Transform cached price to stock data format
  const stockData = cachedPrice ? {
    price: cachedPrice.price,
    change: cachedPrice.change,
    changePercent: cachedPrice.changePercent,
    volume: cachedPrice.volume,
    dayHigh: cachedPrice.dayHigh,
    dayLow: cachedPrice.dayLow,
    previousClose: cachedPrice.previousClose,
    updatedAt: cachedPrice.updatedAt,
    staleness: cachedPrice.staleness,
    dataSource: cachedPrice.dataSource,
  } : null

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !code) {
    return <LoadingSkeleton />
  }

  const yoyCategory = CATEGORIES.find((c) => c.id === company.yoyCategory) || CATEGORIES[0]

  return (
    <MainLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/companies">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{code}</h1>
                <Badge variant="outline">{company.sector}</Badge>
                <Badge className={cn(yoyCategory.bg, yoyCategory.color, yoyCategory.border)}>
                  {yoyCategory.short}
                </Badge>
              </div>
              <p className="text-muted-foreground">{company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`https://www.klsescreener.com/v2/stocks/view/${getStockCode(code)}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                KLSE Screener
              </a>
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <PriceCard stock={stockData} loading={stockLoading} error={stockError} />
          <MetricCard title="Volume" value={stockData?.volume ? (stockData.volume / 1000000).toFixed(2) : "--"} suffix="M" icon={Activity} />
          <MetricCard title="Day Range" value={stockData && stockData.dayLow && stockData.dayHigh ? `${stockData.dayLow.toFixed(2)} - ${stockData.dayHigh.toFixed(2)}` : "--"} icon={BarChart3} />
          <MetricCard title="Prev Close" value={stockData?.previousClose?.toFixed(2) || "--"} icon={DollarSign} />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Performance Cards */}
              <PerformanceCard
                title="Year-over-Year (YoY)"
                category={company.yoyCategory}
                revenueChange={company.yoyRevenueChange}
                profitChange={company.yoyProfitChange}
              />
              <PerformanceCard
                title="Quarter-over-Quarter (QoQ)"
                category={company.qoqCategory}
                revenueChange={company.qoqRevenueChange}
                profitChange={company.qoqProfitChange}
              />
            </div>

            {/* TradingView Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Price Chart
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TradingViewWidget
                  symbol={code}
                  stockCode={stockCode}
                  height={450}
                  theme="dark"
                  interval="D"
                  showToolbar={true}
                  showDetails={false}
                />
              </CardContent>
            </Card>

            {/* Technical Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Technical Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TradingViewTechnicalAnalysis
                  symbol={code}
                  stockCode={stockCode}
                  height={350}
                  theme="dark"
                  interval="1D"
                />
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Stock Code</p>
                    <p className="font-medium">{getStockCode(code)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Sector</p>
                    <p className="font-medium">{company.sector}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Latest Quarter</p>
                    <p className="font-medium">{company.latestQuarter}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Exchange</p>
                    <p className="font-medium">Bursa Malaysia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Latest Quarter Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-bold tabular-nums">RM {company.revenue.toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Net Profit</span>
                      <span className={cn("font-bold tabular-nums", company.profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                        RM {company.profit.toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Profit Margin</span>
                      <span className="font-bold tabular-nums">{((company.profit / company.revenue) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">YoY Revenue</span>
                        <span className={cn("text-xs font-medium", company.yoyRevenueChange >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {company.yoyRevenueChange >= 0 ? "+" : ""}{company.yoyRevenueChange.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", company.yoyRevenueChange >= 0 ? "bg-emerald-500" : "bg-red-500")}
                          style={{ width: `${Math.min(Math.abs(company.yoyRevenueChange), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">YoY Profit</span>
                        <span className={cn("text-xs font-medium", company.yoyProfitChange >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {company.yoyProfitChange >= 0 ? "+" : ""}{company.yoyProfitChange.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", company.yoyProfitChange >= 0 ? "bg-emerald-500" : "bg-red-500")}
                          style={{ width: `${Math.min(Math.abs(company.yoyProfitChange) / 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Company Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentsSection code={code} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

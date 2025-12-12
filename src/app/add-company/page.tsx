"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Download,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Building2,
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Globe,
  XCircle,
  RefreshCw,
  ExternalLink,
  Database,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type Step = "input" | "fetching" | "analyzing" | "saving" | "complete" | "error"

interface CompanyData {
  code: string
  name: string
  sector: string
  subsector: string | null
  marketCap: number | null
  currentPrice: number | null
  week52High: number | null
  week52Low: number | null
  peRatio: number | null
  dividendYield: number | null
  latestQuarter: string
  financials: QuarterlyData[]
}

interface QuarterlyData {
  quarter: string
  fiscalYear: number
  quarterNum: number
  revenue: number
  profit: number
  eps: number | null
}

interface AnalysisResult {
  yoyCategory: number
  yoyCategoryName: string
  yoyRevenueChange: number
  yoyProfitChange: number
  qoqCategory: number
  qoqCategoryName: string
  qoqRevenueChange: number
  qoqProfitChange: number
}

const SECTORS = [
  "Banking",
  "Construction",
  "Consumer",
  "Energy",
  "Finance",
  "Healthcare",
  "Industrial",
  "Manufacturing",
  "Media",
  "Plantation",
  "Property",
  "REIT",
  "Retail",
  "Technology",
  "Telecommunications",
  "Transportation",
  "Utilities",
]

const steps = [
  { id: "fetching", label: "Fetching Company Data", icon: Search, description: "Looking up company information" },
  { id: "analyzing", label: "Analyzing Performance", icon: BarChart3, description: "Calculating YoY and QoQ metrics" },
  { id: "saving", label: "Saving to Database", icon: Database, description: "Storing data in Supabase" },
  { id: "complete", label: "Complete", icon: CheckCircle2, description: "Company added successfully" },
]

const CATEGORY_NAMES: Record<number, string> = {
  1: "Revenue UP, Profit UP",
  2: "Revenue DOWN, Profit UP",
  3: "Revenue UP, Profit DOWN",
  4: "Revenue DOWN, Profit DOWN",
  5: "Turnaround (Loss to Profit)",
  6: "Decline (Profit to Loss)",
}

function getCategoryFromChanges(revenueChange: number, profitChange: number, prevProfit: number, currentProfit: number): { category: number, name: string } {
  // Check for turnaround or decline
  if (prevProfit < 0 && currentProfit > 0) {
    return { category: 5, name: CATEGORY_NAMES[5] }
  }
  if (prevProfit > 0 && currentProfit < 0) {
    return { category: 6, name: CATEGORY_NAMES[6] }
  }

  // Normal categories
  if (revenueChange > 0 && profitChange > 0) {
    return { category: 1, name: CATEGORY_NAMES[1] }
  }
  if (revenueChange < 0 && profitChange > 0) {
    return { category: 2, name: CATEGORY_NAMES[2] }
  }
  if (revenueChange > 0 && profitChange < 0) {
    return { category: 3, name: CATEGORY_NAMES[3] }
  }
  return { category: 4, name: CATEGORY_NAMES[4] }
}

export default function AddCompanyPage() {
  const router = useRouter()
  const [companyCode, setCompanyCode] = useState("")
  const [manualMode, setManualMode] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("input")
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [existingCompany, setExistingCompany] = useState(false)

  // Manual input form state
  const [manualForm, setManualForm] = useState({
    name: "",
    sector: "",
    currentPrice: "",
    marketCap: "",
    q1Revenue: "",
    q1Profit: "",
    q2Revenue: "",
    q2Profit: "",
    q3Revenue: "",
    q3Profit: "",
    q4Revenue: "",
    q4Profit: "",
    prevQ3Revenue: "",
    prevQ3Profit: "",
  })

  const supabase = createClient()

  const checkExistingCompany = async (code: string) => {
    const { data, error } = await supabase
      .from("companies")
      .select("id, code, name")
      .eq("code", code.toUpperCase())
      .single()

    if (data) {
      return true
    }
    return false
  }

  const handleSearch = async () => {
    if (!companyCode.trim()) return

    setCurrentStep("fetching")
    setError(null)
    setProgress(0)
    setExistingCompany(false)

    try {
      // Check if company already exists
      const exists = await checkExistingCompany(companyCode)
      if (exists) {
        setExistingCompany(true)
        setError(`Company ${companyCode.toUpperCase()} already exists in the database.`)
        setCurrentStep("error")
        return
      }

      setProgress(20)

      // Simulate fetching from KLSE Screener (in production, this would be an API call)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock company data - in production, this would come from KLSE Screener API
      const mockData: CompanyData = {
        code: companyCode.toUpperCase(),
        name: `${companyCode.toUpperCase()} Berhad`,
        sector: SECTORS[Math.floor(Math.random() * SECTORS.length)],
        subsector: null,
        marketCap: Math.floor(Math.random() * 10000000000) + 100000000, // 100M - 10B
        currentPrice: Number((Math.random() * 20 + 0.5).toFixed(2)),
        week52High: Number((Math.random() * 25 + 5).toFixed(2)),
        week52Low: Number((Math.random() * 5 + 0.5).toFixed(2)),
        peRatio: Number((Math.random() * 30 + 5).toFixed(2)),
        dividendYield: Number((Math.random() * 8).toFixed(2)),
        latestQuarter: "Q3 FY2025",
        financials: [
          { quarter: "Q3 FY2025", fiscalYear: 2025, quarterNum: 3, revenue: Math.floor(Math.random() * 500000000) + 50000000, profit: Math.floor(Math.random() * 100000000) - 10000000, eps: Number((Math.random() * 0.5).toFixed(4)) },
          { quarter: "Q2 FY2025", fiscalYear: 2025, quarterNum: 2, revenue: Math.floor(Math.random() * 500000000) + 50000000, profit: Math.floor(Math.random() * 100000000) - 10000000, eps: Number((Math.random() * 0.5).toFixed(4)) },
          { quarter: "Q1 FY2025", fiscalYear: 2025, quarterNum: 1, revenue: Math.floor(Math.random() * 500000000) + 50000000, profit: Math.floor(Math.random() * 100000000) - 10000000, eps: Number((Math.random() * 0.5).toFixed(4)) },
          { quarter: "Q3 FY2024", fiscalYear: 2024, quarterNum: 3, revenue: Math.floor(Math.random() * 500000000) + 50000000, profit: Math.floor(Math.random() * 100000000) - 10000000, eps: Number((Math.random() * 0.5).toFixed(4)) },
        ],
      }

      setCompanyData(mockData)
      setProgress(40)

      // Analysis step
      setCurrentStep("analyzing")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Calculate YoY and QoQ analysis
      const currentQ = mockData.financials[0]
      const prevQ = mockData.financials[1]
      const prevYearQ = mockData.financials[3]

      const yoyRevenueChange = prevYearQ.revenue > 0
        ? Number((((currentQ.revenue - prevYearQ.revenue) / prevYearQ.revenue) * 100).toFixed(1))
        : 0
      const yoyProfitChange = prevYearQ.profit !== 0
        ? Number((((currentQ.profit - prevYearQ.profit) / Math.abs(prevYearQ.profit)) * 100).toFixed(1))
        : 0
      const qoqRevenueChange = prevQ.revenue > 0
        ? Number((((currentQ.revenue - prevQ.revenue) / prevQ.revenue) * 100).toFixed(1))
        : 0
      const qoqProfitChange = prevQ.profit !== 0
        ? Number((((currentQ.profit - prevQ.profit) / Math.abs(prevQ.profit)) * 100).toFixed(1))
        : 0

      const yoyCategory = getCategoryFromChanges(yoyRevenueChange, yoyProfitChange, prevYearQ.profit, currentQ.profit)
      const qoqCategory = getCategoryFromChanges(qoqRevenueChange, qoqProfitChange, prevQ.profit, currentQ.profit)

      const analysis: AnalysisResult = {
        yoyCategory: yoyCategory.category,
        yoyCategoryName: yoyCategory.name,
        yoyRevenueChange,
        yoyProfitChange,
        qoqCategory: qoqCategory.category,
        qoqCategoryName: qoqCategory.name,
        qoqRevenueChange,
        qoqProfitChange,
      }

      setAnalysisResult(analysis)
      setProgress(60)

      // Saving step
      setCurrentStep("saving")
      await saveToSupabase(mockData, analysis)
      setProgress(100)

      setCurrentStep("complete")
      toast.success("Company added successfully!", {
        description: `${mockData.name} has been added to the database.`,
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while adding the company")
      setCurrentStep("error")
      toast.error("Failed to add company", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const saveToSupabase = async (data: CompanyData, analysis: AnalysisResult) => {
    // 1. Insert company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        code: data.code,
        name: data.name,
        sector: data.sector,
        subsector: data.subsector,
        market_cap: data.marketCap,
        current_price: data.currentPrice,
        week_52_high: data.week52High,
        week_52_low: data.week52Low,
        pe_ratio: data.peRatio,
        dividend_yield: data.dividendYield,
      })
      .select()
      .single()

    if (companyError) {
      throw new Error(`Failed to insert company: ${companyError.message}`)
    }

    setProgress(70)

    // 2. Insert quarterly financials
    const financialsToInsert = data.financials.map(f => ({
      company_id: company.id,
      fiscal_year: f.fiscalYear,
      quarter: f.quarterNum,
      revenue: f.revenue,
      profit: f.profit,
      eps: f.eps,
    }))

    const { error: financialsError } = await supabase
      .from("quarterly_financials")
      .insert(financialsToInsert)

    if (financialsError) {
      console.error("Failed to insert financials:", financialsError)
      // Don't throw, continue with analysis
    }

    setProgress(80)

    // 3. Insert YoY analysis
    const currentQ = data.financials[0]
    const prevYearQ = data.financials[3]

    const { error: yoyError } = await supabase
      .from("yoy_analysis")
      .insert({
        company_id: company.id,
        analysis_date: new Date().toISOString().split("T")[0],
        current_quarter: currentQ.quarter,
        previous_year_quarter: prevYearQ.quarter,
        revenue_current: currentQ.revenue,
        revenue_previous: prevYearQ.revenue,
        revenue_change_pct: analysis.yoyRevenueChange,
        profit_current: currentQ.profit,
        profit_previous: prevYearQ.profit,
        profit_change_pct: analysis.yoyProfitChange,
        category: analysis.yoyCategory,
        category_name: analysis.yoyCategoryName,
      })

    if (yoyError) {
      console.error("Failed to insert YoY analysis:", yoyError)
    }

    setProgress(90)

    // 4. Insert QoQ analysis
    const prevQ = data.financials[1]

    const { error: qoqError } = await supabase
      .from("qoq_analysis")
      .insert({
        company_id: company.id,
        analysis_date: new Date().toISOString().split("T")[0],
        current_quarter: currentQ.quarter,
        previous_quarter: prevQ.quarter,
        revenue_current: currentQ.revenue,
        revenue_previous: prevQ.revenue,
        revenue_change_pct: analysis.qoqRevenueChange,
        profit_current: currentQ.profit,
        profit_previous: prevQ.profit,
        profit_change_pct: analysis.qoqProfitChange,
        category: analysis.qoqCategory,
        category_name: analysis.qoqCategoryName,
      })

    if (qoqError) {
      console.error("Failed to insert QoQ analysis:", qoqError)
    }

    setProgress(95)

    // 5. Generate and insert a basic report
    const reportContent = `# ${data.name} (${data.code}) - Analysis Report

## Company Overview
- **Sector:** ${data.sector}
- **Market Cap:** RM ${(data.marketCap || 0 / 1000000).toFixed(2)}M
- **Current Price:** RM ${data.currentPrice?.toFixed(2) || "N/A"}
- **52-Week Range:** RM ${data.week52Low?.toFixed(2) || "N/A"} - RM ${data.week52High?.toFixed(2) || "N/A"}
- **P/E Ratio:** ${data.peRatio?.toFixed(2) || "N/A"}
- **Dividend Yield:** ${data.dividendYield?.toFixed(2) || "N/A"}%

## Performance Analysis

### Year-over-Year (YoY)
- **Category:** ${analysis.yoyCategoryName}
- **Revenue Change:** ${analysis.yoyRevenueChange > 0 ? "+" : ""}${analysis.yoyRevenueChange}%
- **Profit Change:** ${analysis.yoyProfitChange > 0 ? "+" : ""}${analysis.yoyProfitChange}%

### Quarter-over-Quarter (QoQ)
- **Category:** ${analysis.qoqCategoryName}
- **Revenue Change:** ${analysis.qoqRevenueChange > 0 ? "+" : ""}${analysis.qoqRevenueChange}%
- **Profit Change:** ${analysis.qoqProfitChange > 0 ? "+" : ""}${analysis.qoqProfitChange}%

## Recent Quarterly Results

| Quarter | Revenue (RM) | Profit (RM) | EPS |
|---------|-------------|-------------|-----|
${data.financials.map(f => `| ${f.quarter} | ${f.revenue.toLocaleString()} | ${f.profit.toLocaleString()} | ${f.eps?.toFixed(4) || "N/A"} |`).join("\n")}

---
*Report automatically generated on ${new Date().toLocaleDateString()}*
`

    const { error: reportError } = await supabase
      .from("company_reports")
      .insert({
        company_id: company.id,
        report_type: "comprehensive",
        content: reportContent,
        sections: {
          overview: true,
          performance: true,
          financials: true,
        },
      })

    if (reportError) {
      console.error("Failed to insert report:", reportError)
    }
  }

  const handleReset = () => {
    setCompanyCode("")
    setCurrentStep("input")
    setCompanyData(null)
    setAnalysisResult(null)
    setError(null)
    setProgress(0)
    setExistingCompany(false)
    setManualMode(false)
    setManualForm({
      name: "",
      sector: "",
      currentPrice: "",
      marketCap: "",
      q1Revenue: "",
      q1Profit: "",
      q2Revenue: "",
      q2Profit: "",
      q3Revenue: "",
      q3Profit: "",
      q4Revenue: "",
      q4Profit: "",
      prevQ3Revenue: "",
      prevQ3Profit: "",
    })
  }

  const getStepStatus = (stepId: string) => {
    const stepOrder = ["fetching", "analyzing", "saving", "complete"]
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(stepId)

    if (currentStep === "input" || currentStep === "error") return "pending"
    if (stepIndex < currentIndex) return "complete"
    if (stepIndex === currentIndex) return "current"
    return "pending"
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A"
    if (value >= 1000000000) return `RM ${(value / 1000000000).toFixed(2)}B`
    if (value >= 1000000) return `RM ${(value / 1000000).toFixed(2)}M`
    return `RM ${value.toLocaleString()}`
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Add Company
            </h1>
            <p className="text-muted-foreground">
              Add a new KLSE company to the analysis platform
            </p>
          </div>
          {currentStep !== "input" && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>

        {/* Input Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Company Lookup
                </CardTitle>
                <CardDescription>
                  Enter a stock code (e.g., AEONCR) or stock number (e.g., 5139)
                </CardDescription>
              </div>
              {currentStep === "input" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualMode(!manualMode)}
                >
                  {manualMode ? "Auto Mode" : "Manual Entry"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="code" className="sr-only">
                  Company Code
                </Label>
                <Input
                  id="code"
                  placeholder="Enter stock code or number..."
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  disabled={currentStep !== "input"}
                  className="text-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && companyCode.trim()) {
                      handleSearch()
                    }
                  }}
                />
              </div>
              {currentStep === "input" ? (
                <Button onClick={handleSearch} disabled={!companyCode.trim()} size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              ) : currentStep === "complete" ? (
                <Button onClick={() => router.push(`/companies/${companyData?.code}`)} size="lg">
                  View Company
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              ) : currentStep === "error" ? (
                <Button onClick={handleReset} variant="outline" size="lg">
                  Try Again
                </Button>
              ) : (
                <Button disabled size="lg">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                  {existingCompany && (
                    <Button
                      variant="link"
                      className="p-0 h-auto ml-2"
                      onClick={() => router.push(`/companies/${companyCode.toUpperCase()}`)}
                    >
                      View existing company →
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Progress Steps */}
        {currentStep !== "input" && currentStep !== "error" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Progress</span>
                <Badge variant={currentStep === "complete" ? "default" : "secondary"}>
                  {currentStep === "complete" ? "Complete" : "In Progress"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const status = getStepStatus(step.id)
                  const Icon = step.icon

                  return (
                    <div key={step.id} className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex items-center justify-center h-10 w-10 rounded-full transition-colors",
                          status === "complete" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                          status === "current" && "bg-primary/10 text-primary",
                          status === "pending" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {status === "complete" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : status === "current" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div
                          className={cn(
                            "font-medium",
                            status === "pending" && "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </div>
                        {status === "current" && (
                          <div className="text-sm text-muted-foreground">
                            {step.description}
                          </div>
                        )}
                      </div>
                      {status === "complete" && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Done
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Preview / Results */}
        {companyData && currentStep !== "input" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Stock Code</div>
                    <div className="text-2xl font-bold">{companyData.code}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Company Name</div>
                    <div className="text-lg font-semibold">{companyData.name}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{companyData.sector}</Badge>
                    <Badge variant="outline">{companyData.latestQuarter}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                    <div className="font-semibold">RM {companyData.currentPrice?.toFixed(2) || "N/A"}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                    <div className="font-semibold">{formatCurrency(companyData.marketCap)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-xs text-muted-foreground mb-1">P/E Ratio</div>
                    <div className="font-semibold">{companyData.peRatio?.toFixed(2) || "N/A"}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-xs text-muted-foreground mb-1">Dividend Yield</div>
                    <div className="font-semibold">{companyData.dividendYield?.toFixed(2) || "0"}%</div>
                  </div>
                </div>
              </div>

              {analysisResult && (
                <>
                  <Separator className="my-6" />

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* YoY Analysis */}
                    <Card className="border-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Year-over-Year Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge
                          className={cn(
                            "mb-3",
                            analysisResult.yoyCategory === 1 && "bg-emerald-500",
                            analysisResult.yoyCategory === 2 && "bg-blue-500",
                            analysisResult.yoyCategory === 3 && "bg-orange-500",
                            analysisResult.yoyCategory === 4 && "bg-red-500",
                            analysisResult.yoyCategory === 5 && "bg-purple-500",
                            analysisResult.yoyCategory === 6 && "bg-rose-500",
                          )}
                        >
                          {analysisResult.yoyCategoryName}
                        </Badge>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Revenue</div>
                            <div className={cn(
                              "text-lg font-bold flex items-center gap-1",
                              analysisResult.yoyRevenueChange >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {analysisResult.yoyRevenueChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {analysisResult.yoyRevenueChange > 0 ? "+" : ""}{analysisResult.yoyRevenueChange}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Profit</div>
                            <div className={cn(
                              "text-lg font-bold flex items-center gap-1",
                              analysisResult.yoyProfitChange >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {analysisResult.yoyProfitChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {analysisResult.yoyProfitChange > 0 ? "+" : ""}{analysisResult.yoyProfitChange}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* QoQ Analysis */}
                    <Card className="border-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Quarter-over-Quarter Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge
                          className={cn(
                            "mb-3",
                            analysisResult.qoqCategory === 1 && "bg-emerald-500",
                            analysisResult.qoqCategory === 2 && "bg-blue-500",
                            analysisResult.qoqCategory === 3 && "bg-orange-500",
                            analysisResult.qoqCategory === 4 && "bg-red-500",
                            analysisResult.qoqCategory === 5 && "bg-purple-500",
                            analysisResult.qoqCategory === 6 && "bg-rose-500",
                          )}
                        >
                          {analysisResult.qoqCategoryName}
                        </Badge>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Revenue</div>
                            <div className={cn(
                              "text-lg font-bold flex items-center gap-1",
                              analysisResult.qoqRevenueChange >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {analysisResult.qoqRevenueChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {analysisResult.qoqRevenueChange > 0 ? "+" : ""}{analysisResult.qoqRevenueChange}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Profit</div>
                            <div className={cn(
                              "text-lg font-bold flex items-center gap-1",
                              analysisResult.qoqProfitChange >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {analysisResult.qoqProfitChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {analysisResult.qoqProfitChange > 0 ? "+" : ""}{analysisResult.qoqProfitChange}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {currentStep === "complete" && (
                <>
                  <Separator className="my-6" />

                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 dark:text-green-200">Successfully Added</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      {companyData.name} has been added to the database with quarterly financials, YoY analysis, QoQ analysis, and an auto-generated report.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-4 mt-6">
                    <Button className="flex-1" onClick={() => router.push(`/companies/${companyData.code}`)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      View Company Analysis
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleReset}>
                      Add Another Company
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        {currentStep === "input" && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                What happens when you add a company?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Fetch Company Data</div>
                    <p className="text-muted-foreground">We look up the company information including sector, market cap, and current price.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Analyze Performance</div>
                    <p className="text-muted-foreground">YoY and QoQ analysis is calculated, and the company is categorized based on revenue and profit performance.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Save to Database</div>
                    <p className="text-muted-foreground">Company info, quarterly financials, and analysis are saved to Supabase for real-time access.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    4
                  </div>
                  <div>
                    <div className="font-medium">Generate Report</div>
                    <p className="text-muted-foreground">A comprehensive analysis report is automatically generated for AI chat and content creation.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

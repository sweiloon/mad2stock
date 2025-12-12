"use client"

import { useState, useRef, useEffect } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Send,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  Building2,
  FileText,
  Loader2,
  BookOpen,
  ChevronRight,
  Eye,
  Download,
  Globe,
  TrendingUp,
  TrendingDown,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCompanyDocuments, formatFileSize } from "@/hooks/use-documents"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  companyContext?: string
}

interface Company {
  code: string
  name: string
  sector: string
  category: number
  revenueChange: number
  profitChange: number
  hasReport: boolean
}

interface CompanyReport {
  id: string
  companyCode: string
  type: string
  title: string
  content: string
  generatedAt: string
}

const COMPANIES: Company[] = [
  { code: "UWC", name: "UWC Berhad", sector: "Manufacturing", category: 1, revenueChange: 43.0, profitChange: 685.7, hasReport: true },
  { code: "ECOWLD", name: "Eco World Development", sector: "Property", category: 1, revenueChange: 17.6, profitChange: 51.9, hasReport: true },
  { code: "ASTRO", name: "Astro Malaysia", sector: "Media", category: 5, revenueChange: -13.0, profitChange: 0, hasReport: true },
  { code: "GAMUDA", name: "Gamuda Berhad", sector: "Construction", category: 1, revenueChange: 25.4, profitChange: 18.9, hasReport: true },
  { code: "HIGHTEC", name: "Hightec Global", sector: "Technology", category: 1, revenueChange: 44.2, profitChange: 180.6, hasReport: true },
  { code: "PRKCORP", name: "Park Corporation", sector: "Consumer", category: 1, revenueChange: 19.6, profitChange: 352.7, hasReport: true },
  { code: "UMCCA", name: "UMCCA Berhad", sector: "Plantation", category: 1, revenueChange: 16.9, profitChange: 184.2, hasReport: true },
  { code: "MYNEWS", name: "MyNews Holdings", sector: "Retail", category: 1, revenueChange: 11.3, profitChange: 146.2, hasReport: true },
  { code: "TENAGA", name: "Tenaga Nasional", sector: "Utilities", category: 2, revenueChange: -5.2, profitChange: 12.4, hasReport: true },
  { code: "MAYBANK", name: "Maybank", sector: "Banking", category: 1, revenueChange: 8.7, profitChange: 15.2, hasReport: true },
]

const MOCK_REPORTS: Record<string, CompanyReport> = {
  "UWC": {
    id: "1",
    companyCode: "UWC",
    type: "comprehensive",
    title: "UWC Berhad - Comprehensive Analysis Report",
    generatedAt: "2025-12-10",
    content: `# UWC Berhad (7237) - Investment Analysis Report

## Executive Summary
UWC Berhad has demonstrated exceptional performance in Q3 FY2025, with revenue growth of 43.0% YoY and an extraordinary profit surge of 685.7% YoY.

## Financial Highlights
- Q3 FY2025 Revenue: RM 245.8 million (+43.0% YoY)
- Net Profit: RM 52.3 million (+685.7% YoY)
- Net Margin: 21.3%

## Growth Drivers
1. Strong semiconductor demand
2. New contracts secured
3. Operational efficiency improvements
4. Capacity expansion

## Recommendation
**ACCUMULATE** - Strong fundamentals with momentum.`,
  },
  "ECOWLD": {
    id: "2",
    companyCode: "ECOWLD",
    type: "comprehensive",
    title: "Eco World Development - Analysis Report",
    generatedAt: "2025-12-10",
    content: `# Eco World Development (8206) - Investment Analysis Report

## Executive Summary
Strong recovery in property sector with revenue growth of 17.6% YoY and profit growth of 51.9% YoY.

## Financial Highlights
- Q3 FY2025 Revenue: RM 1.82 billion (+17.6% YoY)
- Net Profit: RM 186.5 million (+51.9% YoY)

## Key Projects
1. Eco Botanic - Iskandar Malaysia
2. Eco Horizon - Premium landed
3. Eco Grandeur - Township development

## Recommendation
**BUY** - Property sector recovery play.`,
  },
  "ASTRO": {
    id: "3",
    companyCode: "ASTRO",
    type: "comprehensive",
    title: "Astro Malaysia - Turnaround Analysis",
    generatedAt: "2025-12-10",
    content: `# Astro Malaysia (6399) - Turnaround Analysis Report

## Executive Summary
Technical turnaround from loss to profit in Q3 FY2026. However, structural challenges remain.

## Financial Highlights
- Q3 FY2026 Revenue: RM 695.6 million (-13.0% YoY)
- Net Profit: RM 9.2 million (vs Q2 loss)

## Challenges
1. Subscriber decline (-1.1M since 2019)
2. ARPU pressure
3. Streaming competition

## Recommendation
**AVOID** - Technical turnaround but structural challenges remain.`,
  },
}

const CATEGORY_NAMES: Record<number, string> = {
  1: "Revenue UP, Profit UP",
  2: "Revenue DOWN, Profit UP",
  3: "Revenue UP, Profit DOWN",
  4: "Revenue DOWN, Profit DOWN",
  5: "Turnaround",
  6: "Decline",
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [showReportPanel, setShowReportPanel] = useState(false)
  const [currentReport, setCurrentReport] = useState<CompanyReport | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch company documents from Supabase
  const { documents: supabaseDocuments, loading: docsLoading, error: docsError } = useCompanyDocuments(
    selectedCompany !== "all" ? selectedCompany : null
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (selectedCompany && selectedCompany !== "all") {
      loadCompanyReport(selectedCompany)
    } else {
      setCurrentReport(null)
    }
  }, [selectedCompany])

  const loadCompanyReport = async (companyCode: string) => {
    setIsLoadingReport(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    const report = MOCK_REPORTS[companyCode]
    setCurrentReport(report || null)
    setIsLoadingReport(false)
  }

  const getSuggestedQuestions = (): string[] => {
    if (selectedCompany === "all") {
      return [
        "Which companies have the best YoY performance?",
        "What are the top 5 growth stocks?",
        "Compare property vs technology sector",
        "List all turnaround companies",
      ]
    }
    const company = COMPANIES.find(c => c.code === selectedCompany)
    if (company) {
      return [
        `Analyze ${company.code}'s financial performance`,
        `What are the key risks for ${company.code}?`,
        `Should I invest in ${company.code}?`,
        `Compare ${company.code} with peers`,
      ]
    }
    return []
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      companyContext: selectedCompany,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    setTimeout(() => {
      let response = ""
      const lowerInput = userMessage.content.toLowerCase()
      const company = COMPANIES.find(c => c.code === selectedCompany)

      if (selectedCompany !== "all" && company) {
        if (lowerInput.includes("performance") || lowerInput.includes("analyze")) {
          response = `## ${company.name} Performance Analysis

**Category:** ${CATEGORY_NAMES[company.category]}
**Sector:** ${company.sector}

### YoY Performance
- Revenue: ${company.revenueChange > 0 ? "+" : ""}${company.revenueChange}%
- Profit: ${company.profitChange > 0 ? "+" : ""}${company.profitChange}%

${company.category === 1 ? "Strong growth in both revenue and profit indicates healthy business expansion." : "Performance requires careful monitoring."}

Would you like me to dive deeper into any specific aspect?`
        } else if (lowerInput.includes("risk")) {
          response = `## Risk Analysis for ${company.name}

### Key Risks
1. **Sector Risks:** ${company.sector} sector cyclicality
2. **Market Risks:** Global economic uncertainty
3. **Company Specific:** ${company.profitChange < 0 ? "Declining profitability" : "Maintaining growth rate"}

### Mitigation
- Monitor quarterly results
- Set appropriate position sizing
- Maintain diversification`
        } else {
          response = `## ${company.name} Overview

**Sector:** ${company.sector}
**Category:** ${CATEGORY_NAMES[company.category]}

| Metric | Value |
|--------|-------|
| Revenue YoY | ${company.revenueChange > 0 ? "+" : ""}${company.revenueChange}% |
| Profit YoY | ${company.profitChange > 0 ? "+" : ""}${company.profitChange}% |

How can I help you with ${company.code}?`
        }
      } else {
        if (lowerInput.includes("top") || lowerInput.includes("best")) {
          response = `## Top Performers - KLSE Analysis

### Category 1: Revenue UP, Profit UP

| Company | Revenue YoY | Profit YoY |
|---------|------------|------------|
| UWC | +43.0% | +685.7% |
| PRKCORP | +19.6% | +352.7% |
| UMCCA | +16.9% | +184.2% |
| HIGHTEC | +44.2% | +180.6% |
| MYNEWS | +11.3% | +146.2% |

Manufacturing and Technology sectors are leading growth.`
        } else if (lowerInput.includes("sector")) {
          response = `## Sector Analysis

### Strong Sectors
1. **Manufacturing** - UWC leading with +685.7% profit
2. **Technology** - HIGHTEC at +180.6% profit
3. **Consumer** - PRKCORP at +352.7% profit

### Recovering
- **Property** - ECOWLD +51.9% profit

### Challenging
- **Media** - ASTRO facing headwinds`
        } else {
          response = `## KLSE Market Intelligence

Data available on **80 Malaysian listed companies**.

### Quick Stats
- Growth Leaders: 45 companies
- Turnaround Stories: 3 companies
- Under Pressure: 10 companies

What would you like to explore?`
        }
      }

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        companyContext: selectedCompany,
      }])
      setIsLoading(false)
    }, 1200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const selectedCompanyData = COMPANIES.find(c => c.code === selectedCompany)

  return (
    <MainLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="flex-none flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">AI Stock Analyst</h1>
              <p className="text-xs text-muted-foreground">KLSE Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant={showReportPanel ? "default" : "outline"}
              size="sm"
              onClick={() => setShowReportPanel(!showReportPanel)}
              className="hidden sm:flex"
            >
              <FileText className="h-4 w-4 mr-1" />
              Reports
            </Button>
            <Button
              variant={showReportPanel ? "default" : "outline"}
              size="sm"
              onClick={() => setShowReportPanel(!showReportPanel)}
              className="sm:hidden"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Company Selector Bar */}
        <div className="flex-none py-2 px-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-xl bg-muted/50 border">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full sm:w-[280px] bg-background">
                <SelectValue placeholder="Select company..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    All Companies (80 stocks)
                  </div>
                </SelectItem>
                <Separator className="my-1" />
                {COMPANIES.map((company) => (
                  <SelectItem key={company.code} value={company.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{company.code}</span>
                      <span className="text-muted-foreground text-sm truncate">- {company.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCompanyData && (
              <>
                <Separator orientation="vertical" className="h-8 hidden sm:block" />
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Rev:</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      selectedCompanyData.revenueChange >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {selectedCompanyData.revenueChange > 0 ? "+" : ""}{selectedCompanyData.revenueChange}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Profit:</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      selectedCompanyData.profitChange >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {selectedCompanyData.profitChange > 0 ? "+" : ""}{selectedCompanyData.profitChange}%
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                    {CATEGORY_NAMES[selectedCompanyData.category]}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden px-1 pb-2">
          {/* Chat Panel */}
          <div className="flex-1 flex flex-col min-w-0 rounded-xl border bg-card overflow-hidden">
            {/* Messages Area - Fixed height with proper scrolling */}
            <div className="flex-1 overflow-hidden relative">
              <div
                ref={scrollRef}
                className="absolute inset-0 overflow-y-auto p-4 scrollbar-thin"
              >
                {messages.length === 0 ? (
                  <div className="min-h-full flex flex-col items-center justify-center text-center p-4 sm:p-6">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                      <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold mb-2">
                      {selectedCompany === "all" ? "Ask About Any Stock" : `Chat About ${selectedCompanyData?.name}`}
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                      Get insights on financial performance, risks, and investment analysis.
                    </p>
                    <div className="grid gap-2 w-full max-w-md">
                      {getSuggestedQuestions().map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className="justify-start h-auto py-2 px-3 text-left text-sm"
                          onClick={() => { setInput(q); inputRef.current?.focus() }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2 text-primary shrink-0" />
                          <span className="truncate">{q}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={cn("flex gap-2 sm:gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                        {msg.role === "assistant" && (
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 overflow-hidden",
                          msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                        )}>
                          <div className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere">{msg.content}</div>
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleCopy(msg.content, msg.id)}>
                                {copiedId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                              <span className="text-xs text-muted-foreground">{msg.timestamp.toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                            <AvatarFallback className="bg-secondary text-xs">
                              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-2 sm:gap-3">
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                            <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                            <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex-none p-3 sm:p-4 border-t bg-background/50">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  placeholder={selectedCompany === "all" ? "Ask about any KLSE stock..." : `Ask about ${selectedCompanyData?.code}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[44px] max-h-[120px] resize-none rounded-xl text-sm"
                  rows={1}
                />
                <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="shrink-0 rounded-xl px-3 sm:px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Reports Panel - Responsive: Full screen overlay on mobile, sidebar on desktop */}
          {showReportPanel && (
            <div className="fixed inset-0 z-50 bg-background sm:relative sm:inset-auto sm:z-auto sm:w-[340px] flex-none rounded-xl sm:border bg-card overflow-hidden flex flex-col">
              <div className="flex-none p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Reports</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowReportPanel(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedCompany === "all" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-3">Select a company to view reports</p>
                    {COMPANIES.filter(c => c.hasReport).slice(0, 6).map((company) => (
                      <button
                        key={company.code}
                        className="w-full p-3 rounded-lg border bg-background hover:bg-muted transition-colors text-left flex items-center gap-3"
                        onClick={() => setSelectedCompany(company.code)}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{company.code}</div>
                          <div className="text-xs text-muted-foreground truncate">{company.name}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (isLoadingReport || docsLoading) ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Separator className="my-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* AI Analysis Report Section */}
                    {currentReport && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI Analysis</span>
                        </div>
                        <div className="p-3 rounded-lg border bg-gradient-to-br from-primary/5 to-purple-500/5">
                          <h3 className="font-semibold text-sm">{currentReport.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">Generated: {currentReport.generatedAt}</p>
                          <div className="flex gap-2 mt-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="flex-1">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>{currentReport.title}</DialogTitle>
                                  <DialogDescription>Generated on {currentReport.generatedAt}</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh] mt-4">
                                  <div className="whitespace-pre-wrap text-sm">{currentReport.content}</div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Company Documents from Supabase */}
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Company Documents</span>
                    </div>

                    {docsError ? (
                      <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                        <p className="text-xs text-destructive">Failed to load documents</p>
                      </div>
                    ) : supabaseDocuments.length > 0 ? (
                      <div className="space-y-2">
                        {supabaseDocuments.map((doc) => (
                          <div
                            key={doc.path}
                            className="p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                doc.type === "annual" ? "bg-amber-500/10 text-amber-500" :
                                doc.type === "quarterly" ? "bg-blue-500/10 text-blue-500" :
                                "bg-emerald-500/10 text-emerald-500"
                              )}>
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate" title={doc.name}>
                                  {doc.name}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {doc.type === "annual" ? "Annual" :
                                     doc.type === "quarterly" ? `Q${doc.quarter || "?"}` :
                                     "Analysis"}
                                  </Badge>
                                  {doc.fiscalYear && (
                                    <span className="text-[10px] text-muted-foreground">FY{doc.fiscalYear}</span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.size)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2 ml-11">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                asChild
                              >
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                asChild
                              >
                                <a href={doc.url} download={doc.name}>
                                  <Download className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 rounded-lg border border-dashed">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">No documents uploaded</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload reports via the Company Profile page
                        </p>
                      </div>
                    )}

                    {/* No content at all */}
                    {!currentReport && supabaseDocuments.length === 0 && !docsError && (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground">
                          Visit the Company Profile to upload documents
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

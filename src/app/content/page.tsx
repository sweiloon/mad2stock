"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Facebook,
  Instagram,
  Youtube,
  Send,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Hash,
  RefreshCw,
  Twitter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { COMPANY_DATA, hasFinancialData, getTotalCompanyCount, CompanyData } from "@/lib/company-data"
import { useAuth } from "@/components/auth/AuthProvider"
import { BlurredContent } from "@/components/auth/BlurredContent"

interface GeneratedContent {
  platform: string
  title: string
  content: string
  hashtags: string[]
}

const PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
  { id: "telegram", label: "Telegram", icon: Send, color: "text-sky-500" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "text-foreground" },
]

// Get companies with financial data for content generation
const getCompaniesForContent = (): CompanyData[] => {
  return COMPANY_DATA.filter(hasFinancialData).sort((a, b) => {
    // Sort by profit growth (highest first)
    const profitA = a.profitYoY ?? 0
    const profitB = b.profitYoY ?? 0
    return profitB - profitA
  })
}

const mockGeneratedContent: Record<string, GeneratedContent> = {
  facebook: {
    platform: "facebook",
    title: "UWC Berhad Shows Exceptional Growth",
    content: `🚀 IMPRESSIVE Q4 RESULTS!

UWC Berhad (7237) just reported phenomenal numbers:
📈 Revenue: +43.0% YoY
💰 Profit: +685.7% YoY

This manufacturing gem has delivered nearly 8x profit growth compared to last year!

Key takeaways:
✅ Strong operational efficiency
✅ Expanding market share
✅ Solid management execution

What's your view on UWC? Drop a comment below! 👇

⚠️ Disclaimer: This is for educational purposes only. Not financial advice.`,
    hashtags: ["#KLSE", "#MalaysiaStocks", "#UWC", "#StockMarket", "#Investing", "#BursaMalaysia"],
  },
  instagram: {
    platform: "instagram",
    title: "UWC Profit Surge 🚀",
    content: `Profit up 685.7% 📈

UWC Berhad just dropped some INSANE numbers!

Swipe to see the full breakdown →

#StockTips #MalaysiaStocks`,
    hashtags: ["#KLSE", "#UWC", "#StockMarket", "#Investing", "#MalaysiaInvesting", "#FinancialFreedom", "#WealthBuilding"],
  },
  youtube: {
    platform: "youtube",
    title: "UWC Stock Analysis: 685% Profit Growth Explained",
    content: `In this video, I break down UWC Berhad's incredible Q4 results and what it means for investors.

📊 TIMESTAMPS:
0:00 - Introduction
1:30 - Q4 Financial Highlights
4:00 - Revenue Analysis
7:30 - Profit Breakdown
10:00 - YoY Comparison
13:00 - Industry Context
16:00 - Technical Analysis
19:00 - My Investment Thesis
22:00 - Conclusion & Outlook

🔑 KEY POINTS:
• Revenue increased 43% year-over-year
• Profit surged an incredible 685.7%
• Category 1 performer (Revenue UP, Profit UP)
• Manufacturing sector leader

💡 This video is for educational purposes only. Always do your own research before making investment decisions.

👍 Like & Subscribe for more KLSE stock analysis!`,
    hashtags: ["#KLSE", "#UWC", "#StockAnalysis", "#MalaysiaStocks", "#Investing"],
  },
  telegram: {
    platform: "telegram",
    title: "📊 UWC Berhad (7237) Analysis",
    content: `📊 UWC BERHAD (7237) - Q4 FY2025

🟢 CATEGORY 1: Revenue UP, Profit UP

📈 KEY METRICS:
• Revenue: +43.0% YoY
• Profit: +685.7% YoY
• Sector: Manufacturing

💡 ANALYSIS:
Outstanding quarter with profit nearly 8x higher than same period last year. Revenue growth of 43% shows strong demand while margin expansion indicates operational improvements.

🎯 SIGNAL: Strong momentum, watch for consolidation.

⚠️ Not financial advice. DYOR.`,
    hashtags: ["#KLSE", "#UWC"],
  },
  twitter: {
    platform: "twitter",
    title: "UWC Thread",
    content: `1/ 🧵 THREAD: $UWC just dropped INSANE Q4 numbers. Here's what you need to know:

2/ Revenue: +43% YoY
Profit: +685.7% YoY

Yes, you read that right. Profit increased nearly 8x! 📈

3/ What's driving this growth?
• Strong manufacturing demand
• Operational efficiency gains
• Market share expansion

4/ Category 1 stock (Revenue UP, Profit UP) - the best performing category in my analysis of 80 KLSE stocks.

Worth watching! 👀

(Not financial advice. DYOR.)`,
    hashtags: ["#KLSE", "#UWC", "#MalaysiaStocks", "#StockMarket"],
  },
}

export default function ContentPage() {
  const { user } = useAuth()
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook")
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")

  const handleGenerate = async () => {
    if (!selectedCompany) return

    setIsGenerating(true)

    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setGeneratedContent(mockGeneratedContent[selectedPlatform])
    setIsGenerating(false)
  }

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const companies = getCompaniesForContent()
  const selectedCompanyData = COMPANY_DATA.find((c) => c.code === selectedCompany)

  // Placeholder content for unauthenticated users
  const contentPreview = (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Creator</h1>
        <p className="text-muted-foreground">
          Generate social media content for stock analysis
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Select Company</CardTitle>
              <CardDescription>Choose a company to create content about</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded-md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Choose Platform</CardTitle>
              <CardDescription>Select the social media platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <div key={platform.id} className="flex flex-col items-center gap-1 p-3 border rounded-md">
                      <Icon className={cn("h-5 w-5", platform.color)} />
                      <span className="text-xs">{platform.label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" disabled>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </Button>
        </div>

        {/* Right Panel Preview */}
        <Card className="lg:min-h-[400px]">
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium mb-2">🚀 MAYBANK Q4 RESULTS!</p>
                <p className="text-sm text-muted-foreground">Strong quarterly performance with revenue growth...</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">#KLSE</Badge>
                <Badge variant="secondary">#MAYBANK</Badge>
                <Badge variant="secondary">#Investing</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // If user is not authenticated, show blurred content
  if (!user) {
    return (
      <MainLayout>
        <BlurredContent
          title="Unlock Content Creator"
          description="Generate professional social media content for Facebook, Instagram, YouTube, and more with AI assistance."
          minHeight="600px"
          icon="sparkles"
        >
          {contentPreview}
        </BlurredContent>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Creator</h1>
          <p className="text-muted-foreground">
            Generate social media content for stock analysis
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Company Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Select Company</CardTitle>
                <CardDescription>
                  Choose a company to create content about
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Companies with Analysis ({companies.length})
                    </div>
                    {companies.slice(0, 50).map((company) => (
                      <SelectItem key={company.code} value={company.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{company.code}</span>
                          <span className="text-muted-foreground">- {company.name}</span>
                          {company.yoyCategory && (
                            <Badge variant="outline" className="ml-2">
                              Cat {company.yoyCategory}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCompanyData && hasFinancialData(selectedCompanyData) && (
                  <div className="mt-4 p-4 rounded-lg bg-muted">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue Change YoY</span>
                        <span className={(selectedCompanyData.revenueYoY ?? 0) >= 0 ? "text-green-600" : "text-red-600"}>
                          {(selectedCompanyData.revenueYoY ?? 0) > 0 ? "+" : ""}
                          {(selectedCompanyData.revenueYoY ?? 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit Change YoY</span>
                        <span className={(selectedCompanyData.profitYoY ?? 0) >= 0 ? "text-green-600" : "text-red-600"}>
                          {(selectedCompanyData.profitYoY ?? 0) > 0 ? "+" : ""}
                          {(selectedCompanyData.profitYoY ?? 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sector</span>
                        <span>{selectedCompanyData.sector}</span>
                      </div>
                    </div>
                  </div>
                )}
                {selectedCompanyData && !hasFinancialData(selectedCompanyData) && (
                  <div className="mt-4 p-4 rounded-lg bg-muted text-muted-foreground text-sm">
                    No financial analysis data available for this company.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Selection */}
            <Card>
              <CardHeader>
                <CardTitle>2. Choose Platform</CardTitle>
                <CardDescription>
                  Select the social media platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon
                    const isSelected = selectedPlatform === platform.id
                    return (
                      <Button
                        key={platform.id}
                        variant={isSelected ? "default" : "outline"}
                        className="flex flex-col gap-1 h-auto py-3"
                        onClick={() => setSelectedPlatform(platform.id)}
                      >
                        <Icon className={cn("h-5 w-5", !isSelected && platform.color)} />
                        <span className="text-xs">{platform.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Custom Prompt */}
            <Card>
              <CardHeader>
                <CardTitle>3. Custom Instructions (Optional)</CardTitle>
                <CardDescription>
                  Add specific requirements for the content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="E.g., Focus on the turnaround story, include price targets, make it more casual..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedCompany || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Generated Content */}
          <Card className="lg:min-h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Content</CardTitle>
                {generatedContent && (
                  <Button variant="outline" size="sm" onClick={handleRegenerate}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!generatedContent ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">No content generated yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Select a company and platform, then click "Generate Content" to create social media posts.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Title</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(generatedContent.title, "title")}
                        >
                          {copiedField === "title" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        {generatedContent.title}
                      </div>
                    </div>

                    <Separator />

                    {/* Content */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Content</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(generatedContent.content, "content")}
                        >
                          {copiedField === "content" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-muted whitespace-pre-wrap text-sm">
                        {generatedContent.content}
                      </div>
                    </div>

                    <Separator />

                    {/* Hashtags */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Hashtags
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(generatedContent.hashtags.join(" "), "hashtags")
                          }
                        >
                          {copiedField === "hashtags" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Copy All */}
                    <Button
                      className="w-full"
                      onClick={() =>
                        handleCopy(
                          `${generatedContent.content}\n\n${generatedContent.hashtags.join(" ")}`,
                          "all"
                        )
                      }
                    >
                      {copiedField === "all" ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy All Content
                        </>
                      )}
                    </Button>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

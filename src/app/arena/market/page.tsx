"use client"

import { useState, useMemo } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  Clock,
  Users,
  Flame,
  ArrowLeft,
  CheckCircle2,
  Search,
  BarChart2,
  Wallet,
  ChevronDown,
  Info,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// AI Models - All 7 AI models
const AI_MODELS = [
  { id: "claude", name: "Claude", logo: "/images/claude-logo.webp", color: "#FF6B35" },
  { id: "chatgpt", name: "ChatGPT", logo: "/images/openai-logo.png", color: "#10A37F" },
  { id: "deepseek", name: "DeepSeek", logo: "/images/deepseek-logo.png", color: "#5865F2" },
  { id: "gemini", name: "Gemini", logo: "/images/gemini-logo.png", color: "#4285F4" },
  { id: "grok", name: "Grok", logo: "/images/Grok-logo.png", color: "#1DA1F2" },
  { id: "kimi", name: "Kimi", logo: "/images/kimi-logo.jpg", color: "#9B59B6" },
  { id: "qwen", name: "Qwen", logo: "/images/qwen-logo.jpg", color: "#FF7000" },
]

// Market interface
interface Market {
  id: string
  question: string
  category: "stocks" | "crypto" | "forex" | "commodities"
  endDate: string
  volume: number
  outcomes: {
    modelId: string
    probability: number
    volume: number
  }[]
  status: "live" | "upcoming" | "ended"
  isHot?: boolean
}

// Demo markets - Polymarket style questions
const DEMO_MARKETS: Market[] = [
  {
    id: "m1",
    question: "Which AI will have the highest returns trading KLSE stocks in January 2026?",
    category: "stocks",
    endDate: "2026-01-31",
    volume: 125000,
    outcomes: [
      { modelId: "deepseek", probability: 0.34, volume: 42500 },
      { modelId: "claude", probability: 0.28, volume: 35200 },
      { modelId: "chatgpt", probability: 0.22, volume: 22800 },
      { modelId: "grok", probability: 0.10, volume: 14500 },
      { modelId: "gemini", probability: 0.06, volume: 10000 },
    ],
    status: "upcoming",
    isHot: true,
  },
  {
    id: "m2",
    question: "Will DeepSeek outperform Claude in Bitcoin trading this month?",
    category: "crypto",
    endDate: "2026-01-15",
    volume: 89500,
    outcomes: [
      { modelId: "deepseek", probability: 0.58, volume: 51910 },
      { modelId: "claude", probability: 0.42, volume: 37590 },
    ],
    status: "live",
    isHot: true,
  },
  {
    id: "m3",
    question: "Which AI will win the EUR/USD Forex Trading Battle?",
    category: "forex",
    endDate: "2026-01-20",
    volume: 67800,
    outcomes: [
      { modelId: "claude", probability: 0.35, volume: 23730 },
      { modelId: "deepseek", probability: 0.28, volume: 18984 },
      { modelId: "chatgpt", probability: 0.20, volume: 13560 },
      { modelId: "gemini", probability: 0.10, volume: 6780 },
      { modelId: "grok", probability: 0.07, volume: 4746 },
    ],
    status: "live",
  },
  {
    id: "m4",
    question: "Will ChatGPT beat all other AIs in gold trading?",
    category: "commodities",
    endDate: "2026-01-15",
    volume: 45200,
    outcomes: [
      { modelId: "chatgpt", probability: 0.45, volume: 20340 },
      { modelId: "grok", probability: 0.55, volume: 24860 },
    ],
    status: "live",
  },
  {
    id: "m5",
    question: "Which AI will have the best Ethereum DeFi strategy returns?",
    category: "crypto",
    endDate: "2025-12-31",
    volume: 78900,
    outcomes: [
      { modelId: "deepseek", probability: 0.38, volume: 29982 },
      { modelId: "chatgpt", probability: 0.30, volume: 23670 },
      { modelId: "gemini", probability: 0.18, volume: 14202 },
      { modelId: "claude", probability: 0.09, volume: 7101 },
      { modelId: "grok", probability: 0.05, volume: 3945 },
    ],
    status: "live",
  },
  {
    id: "m6",
    question: "Will Gemini finish in the top 3 for US Tech Stocks trading?",
    category: "stocks",
    endDate: "2026-02-14",
    volume: 56000,
    outcomes: [
      { modelId: "gemini", probability: 0.32, volume: 17920 },
      { modelId: "chatgpt", probability: 0.68, volume: 38080 },
    ],
    status: "upcoming",
  },
  {
    id: "m7",
    question: "Which AI will dominate SGX Blue Chips trading?",
    category: "stocks",
    endDate: "2026-02-10",
    volume: 92300,
    outcomes: [
      { modelId: "claude", probability: 0.32, volume: 29536 },
      { modelId: "deepseek", probability: 0.28, volume: 25844 },
      { modelId: "chatgpt", probability: 0.22, volume: 20306 },
      { modelId: "grok", probability: 0.11, volume: 10153 },
      { modelId: "gemini", probability: 0.07, volume: 6461 },
    ],
    status: "upcoming",
  },
  {
    id: "m8",
    question: "Will Grok outperform in Multi-Currency Forex trading?",
    category: "forex",
    endDate: "2026-02-05",
    volume: 34500,
    outcomes: [
      { modelId: "grok", probability: 0.25, volume: 8625 },
      { modelId: "deepseek", probability: 0.75, volume: 25875 },
    ],
    status: "upcoming",
  },
]

// Format currency
function formatVolume(amount: number): string {
  if (amount >= 1000000) return `RM ${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `RM ${(amount / 1000).toFixed(0)}K`
  return `RM ${amount}`
}

// Format probability as percentage
function formatProb(prob: number): string {
  return `${Math.round(prob * 100)}%`
}

// Get time remaining
function getTimeLeft(endDate: string): string {
  const end = new Date(endDate).getTime()
  const now = Date.now()
  const diff = end - now
  if (diff <= 0) return "Ended"
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h left`
  return `${hours}h left`
}

// Market Card - Clean Polymarket style
function MarketCard({ market, onSelect }: { market: Market; onSelect: () => void }) {
  // Sort outcomes by probability
  const sortedOutcomes = [...market.outcomes].sort((a, b) => b.probability - a.probability)
  const topOutcome = sortedOutcomes[0]
  const topModel = AI_MODELS.find(m => m.id === topOutcome.modelId)

  return (
    <Card
      className="hover:bg-muted/50 transition-colors cursor-pointer border-border/60"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        {/* Question */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {market.isHot && (
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-0 text-xs px-1.5 py-0">
                  <Flame className="h-3 w-3 mr-0.5" />
                  Hot
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-1.5 py-0",
                  market.status === "live" && "border-green-500/50 text-green-500"
                )}
              >
                {market.status === "live" ? "Live" : "Upcoming"}
              </Badge>
            </div>
            <h3 className="font-medium text-sm leading-snug">{market.question}</h3>
          </div>
        </div>

        {/* Outcomes - Show top 2-3 */}
        <div className="space-y-2 mb-4">
          {sortedOutcomes.slice(0, market.outcomes.length === 2 ? 2 : 3).map((outcome) => {
            const model = AI_MODELS.find(m => m.id === outcome.modelId)
            if (!model) return null

            return (
              <div
                key={outcome.modelId}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-6 w-6 rounded-full overflow-hidden bg-white border border-border">
                    <Image src={model.logo} alt={model.name} fill className="object-cover" sizes="24px" />
                  </div>
                  <span className="text-sm font-medium">{model.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-sm font-bold tabular-nums",
                    outcome.probability >= 0.5 ? "text-green-500" : "text-foreground"
                  )}>
                    {formatProb(outcome.probability)}
                  </span>
                </div>
              </div>
            )
          })}
          {market.outcomes.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-7">
              +{market.outcomes.length - 3} more outcomes
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
          <div className="flex items-center gap-1">
            <BarChart2 className="h-3.5 w-3.5" />
            {formatVolume(market.volume)} Vol
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {getTimeLeft(market.endDate)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Betting Modal - Clean Polymarket style
function BettingModal({
  market,
  open,
  onClose
}: {
  market: Market | null
  open: boolean
  onClose: () => void
}) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [betPlaced, setBetPlaced] = useState(false)

  if (!market) return null

  const sortedOutcomes = [...market.outcomes].sort((a, b) => b.probability - a.probability)
  const selectedData = sortedOutcomes.find(o => o.modelId === selectedOutcome)
  const potentialReturn = selectedData && amount
    ? (parseFloat(amount) / selectedData.probability).toFixed(2)
    : "0.00"

  const handlePlaceBet = () => {
    setBetPlaced(true)
    setTimeout(() => {
      setBetPlaced(false)
      setSelectedOutcome(null)
      setAmount("")
      onClose()
    }, 2000)
  }

  const handleClose = () => {
    setSelectedOutcome(null)
    setAmount("")
    setBetPlaced(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {betPlaced ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bet Placed!</h3>
            <p className="text-sm text-muted-foreground">
              Demo mode - no real money used
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-medium pr-8">
                {market.question}
              </DialogTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1">
                  <BarChart2 className="h-3.5 w-3.5" />
                  {formatVolume(market.volume)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {getTimeLeft(market.endDate)}
                </span>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Outcome Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Outcome</label>
                <div className="grid gap-2">
                  {sortedOutcomes.map((outcome) => {
                    const model = AI_MODELS.find(m => m.id === outcome.modelId)
                    if (!model) return null
                    const isSelected = selectedOutcome === outcome.modelId

                    return (
                      <button
                        key={outcome.modelId}
                        onClick={() => setSelectedOutcome(outcome.modelId)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 rounded-full overflow-hidden bg-white border border-border">
                            <Image src={model.logo} alt={model.name} fill className="object-cover" sizes="32px" />
                          </div>
                          <span className="font-medium">{model.name}</span>
                        </div>
                        <div className={cn(
                          "text-lg font-bold tabular-nums",
                          outcome.probability >= 0.5 ? "text-green-500" : "text-foreground"
                        )}>
                          {formatProb(outcome.probability)}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Amount Input */}
              {selectedOutcome && (
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium">Amount (RM)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg h-12"
                  />

                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {[100, 500, 1000, 5000].map((val) => (
                      <Button
                        key={val}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setAmount(val.toString())}
                      >
                        RM {val}
                      </Button>
                    ))}
                  </div>

                  {/* Potential Return */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Potential Return</span>
                        <span className="text-lg font-bold text-green-500">
                          RM {potentialReturn}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        If {AI_MODELS.find(m => m.id === selectedOutcome)?.name} wins
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="sm:flex-1">
                Cancel
              </Button>
              <Button
                onClick={handlePlaceBet}
                disabled={!selectedOutcome || !amount || parseFloat(amount) <= 0}
                className="sm:flex-1"
              >
                Place Bet (Demo)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Portfolio sidebar
function PortfolioSidebar() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Your Portfolio</span>
          <Badge variant="secondary" className="text-xs ml-auto">Demo</Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-medium">RM 10,000.00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active Bets</span>
            <span className="font-medium">0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Winnings</span>
            <span className="font-medium text-green-500">RM 0.00</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            Demo mode uses virtual currency. No real money involved.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Mad2MarketPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Filter markets
  const filteredMarkets = useMemo(() => {
    let markets = DEMO_MARKETS

    if (activeTab !== "all") {
      markets = markets.filter(m => m.category === activeTab)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      markets = markets.filter(m =>
        m.question.toLowerCase().includes(query) ||
        m.outcomes.some(o => AI_MODELS.find(model => model.id === o.modelId)?.name.toLowerCase().includes(query))
      )
    }

    return markets
  }, [activeTab, searchQuery])

  const liveMarkets = filteredMarkets.filter(m => m.status === "live")
  const upcomingMarkets = filteredMarkets.filter(m => m.status === "upcoming")

  const handleSelectMarket = (market: Market) => {
    setSelectedMarket(market)
    setModalOpen(true)
  }

  const totalVolume = DEMO_MARKETS.reduce((acc, m) => acc + m.volume, 0)

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/arena">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Mad2Market</h1>
            <p className="text-sm text-muted-foreground">
              Predict which AI will outperform in trading competitions
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:flex gap-1.5">
            <BarChart2 className="h-3.5 w-3.5" />
            {formatVolume(totalVolume)} total volume
          </Badge>
        </div>

        {/* Demo Banner */}
        <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong>Demo Mode:</strong> All bets use virtual currency. Experience prediction markets before we go live!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Search & Tabs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search markets or AI models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-5 w-full sm:w-auto">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="stocks" className="text-xs">Stocks</TabsTrigger>
                  <TabsTrigger value="crypto" className="text-xs">Crypto</TabsTrigger>
                  <TabsTrigger value="forex" className="text-xs">Forex</TabsTrigger>
                  <TabsTrigger value="commodities" className="text-xs">Cmdty</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Live Markets */}
            {liveMarkets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </div>
                  <h2 className="font-semibold">Live Markets</h2>
                  <Badge variant="secondary" className="text-xs">{liveMarkets.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {liveMarkets.map(market => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      onSelect={() => handleSelectMarket(market)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Markets */}
            {upcomingMarkets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">Upcoming</h2>
                  <Badge variant="secondary" className="text-xs">{upcomingMarkets.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcomingMarkets.map(market => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      onSelect={() => handleSelectMarket(market)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredMarkets.length === 0 && (
              <Card className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No markets found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 space-y-4">
            <PortfolioSidebar />

            {/* How it works */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">How it works</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">1</div>
                    <p className="text-muted-foreground">Choose a market based on the prediction you want to make</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">2</div>
                    <p className="text-muted-foreground">Select which AI you think will perform best</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">3</div>
                    <p className="text-muted-foreground">Place your bet and watch the competition</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Betting Modal */}
      <BettingModal
        market={selectedMarket}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </MainLayout>
  )
}

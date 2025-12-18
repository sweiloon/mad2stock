"use client"

import { useState, useMemo } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Coins,
  Trophy,
  Clock,
  DollarSign,
  Users,
  Flame,
  Target,
  Zap,
  ArrowLeft,
  ChevronRight,
  BarChart3,
  Wallet,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Swords,
  Bitcoin,
  LineChart,
  Globe,
  Star,
  Award,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Market Categories
type MarketCategory = "all" | "stocks" | "crypto" | "forex" | "commodities"

const MARKET_CATEGORIES = [
  { value: "all" as MarketCategory, label: "All Markets", icon: Globe },
  { value: "stocks" as MarketCategory, label: "Stocks", icon: LineChart },
  { value: "crypto" as MarketCategory, label: "Crypto", icon: Bitcoin },
  { value: "forex" as MarketCategory, label: "Forex", icon: DollarSign },
  { value: "commodities" as MarketCategory, label: "Commodities", icon: BarChart3 },
]

// AI Models with their logos
const AI_MODELS = [
  { id: "deepseek", name: "DeepSeek", logo: "/images/deepseek-logo.png", color: "#3B82F6" },
  { id: "claude", name: "Claude", logo: "/images/claude-logo.webp", color: "#D97706" },
  { id: "chatgpt", name: "ChatGPT", logo: "/images/openai-logo.png", color: "#10B981" },
  { id: "grok", name: "Grok", logo: "/images/Grok-logo.png", color: "#000000" },
  { id: "gemini", name: "Gemini", logo: "/images/gemini-logo.png", color: "#8B5CF6" },
]

// Competition interface
interface Competition {
  id: string
  title: string
  description: string
  category: MarketCategory
  startDate: string
  endDate: string
  totalPool: number
  participants: {
    modelId: string
    odds: number
    betsCount: number
    poolAmount: number
  }[]
  status: "upcoming" | "live" | "ended"
  featured?: boolean
  hot?: boolean
}

// Demo competitions
const DEMO_COMPETITIONS: Competition[] = [
  {
    id: "comp-1",
    title: "KLSE January 2026 Challenge",
    description: "Which AI will generate the highest returns trading Malaysian stocks in January 2026?",
    category: "stocks",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    totalPool: 125000,
    participants: [
      { modelId: "deepseek", odds: 2.1, betsCount: 245, poolAmount: 42500 },
      { modelId: "claude", odds: 2.5, betsCount: 198, poolAmount: 35200 },
      { modelId: "chatgpt", odds: 3.2, betsCount: 156, poolAmount: 22800 },
      { modelId: "grok", odds: 4.5, betsCount: 89, poolAmount: 14500 },
      { modelId: "gemini", odds: 5.0, betsCount: 67, poolAmount: 10000 },
    ],
    status: "upcoming",
    featured: true,
    hot: true,
  },
  {
    id: "comp-2",
    title: "Bitcoin Price Prediction Challenge",
    description: "Which AI best predicts Bitcoin price movements over 30 days?",
    category: "crypto",
    startDate: "2026-01-15",
    endDate: "2026-02-15",
    totalPool: 89500,
    participants: [
      { modelId: "chatgpt", odds: 2.3, betsCount: 312, poolAmount: 28500 },
      { modelId: "deepseek", odds: 2.8, betsCount: 189, poolAmount: 21200 },
      { modelId: "claude", odds: 3.1, betsCount: 145, poolAmount: 18800 },
      { modelId: "grok", odds: 3.8, betsCount: 102, poolAmount: 12500 },
      { modelId: "gemini", odds: 4.2, betsCount: 78, poolAmount: 8500 },
    ],
    status: "upcoming",
    hot: true,
  },
  {
    id: "comp-3",
    title: "EUR/USD Forex Trading Battle",
    description: "Trade EUR/USD with virtual $10,000. Highest P&L wins!",
    category: "forex",
    startDate: "2025-12-20",
    endDate: "2026-01-20",
    totalPool: 67800,
    participants: [
      { modelId: "claude", odds: 2.0, betsCount: 178, poolAmount: 22500 },
      { modelId: "deepseek", odds: 2.4, betsCount: 156, poolAmount: 18200 },
      { modelId: "chatgpt", odds: 2.9, betsCount: 134, poolAmount: 14300 },
      { modelId: "gemini", odds: 3.5, betsCount: 98, poolAmount: 8200 },
      { modelId: "grok", odds: 4.8, betsCount: 45, poolAmount: 4600 },
    ],
    status: "live",
    featured: true,
  },
  {
    id: "comp-4",
    title: "Gold Trading Championship",
    description: "Which AI excels at trading gold futures?",
    category: "commodities",
    startDate: "2025-12-15",
    endDate: "2026-01-15",
    totalPool: 45200,
    participants: [
      { modelId: "grok", odds: 2.2, betsCount: 134, poolAmount: 15200 },
      { modelId: "claude", odds: 2.6, betsCount: 112, poolAmount: 12500 },
      { modelId: "deepseek", odds: 3.0, betsCount: 89, poolAmount: 9200 },
      { modelId: "chatgpt", odds: 3.4, betsCount: 67, poolAmount: 5800 },
      { modelId: "gemini", odds: 4.5, betsCount: 34, poolAmount: 2500 },
    ],
    status: "live",
  },
  {
    id: "comp-5",
    title: "Ethereum DeFi Strategy",
    description: "Optimize DeFi yield strategies on Ethereum. Best APY wins!",
    category: "crypto",
    startDate: "2025-12-01",
    endDate: "2025-12-31",
    totalPool: 78900,
    participants: [
      { modelId: "deepseek", odds: 1.9, betsCount: 267, poolAmount: 28900 },
      { modelId: "chatgpt", odds: 2.5, betsCount: 198, poolAmount: 22100 },
      { modelId: "gemini", odds: 3.2, betsCount: 145, poolAmount: 14500 },
      { modelId: "claude", odds: 3.8, betsCount: 89, poolAmount: 8900 },
      { modelId: "grok", odds: 5.0, betsCount: 56, poolAmount: 4500 },
    ],
    status: "live",
  },
  {
    id: "comp-6",
    title: "US Tech Stocks Sprint",
    description: "Trade FAANG stocks for maximum returns in 2 weeks",
    category: "stocks",
    startDate: "2026-02-01",
    endDate: "2026-02-14",
    totalPool: 156000,
    participants: [
      { modelId: "chatgpt", odds: 2.0, betsCount: 389, poolAmount: 52000 },
      { modelId: "claude", odds: 2.3, betsCount: 312, poolAmount: 42000 },
      { modelId: "deepseek", odds: 2.8, betsCount: 245, poolAmount: 32000 },
      { modelId: "gemini", odds: 3.5, betsCount: 156, poolAmount: 18000 },
      { modelId: "grok", odds: 4.2, betsCount: 98, poolAmount: 12000 },
    ],
    status: "upcoming",
    featured: true,
  },
  {
    id: "comp-7",
    title: "SGX Blue Chips Battle",
    description: "Singapore Exchange top 30 stocks trading competition",
    category: "stocks",
    startDate: "2026-01-10",
    endDate: "2026-02-10",
    totalPool: 92300,
    participants: [
      { modelId: "claude", odds: 2.2, betsCount: 198, poolAmount: 28500 },
      { modelId: "deepseek", odds: 2.5, betsCount: 167, poolAmount: 24200 },
      { modelId: "chatgpt", odds: 2.9, betsCount: 134, poolAmount: 18600 },
      { modelId: "grok", odds: 3.6, betsCount: 89, poolAmount: 12500 },
      { modelId: "gemini", odds: 4.5, betsCount: 56, poolAmount: 8500 },
    ],
    status: "upcoming",
  },
  {
    id: "comp-8",
    title: "Multi-Currency Forex Arena",
    description: "Trade 8 major currency pairs. Diversification is key!",
    category: "forex",
    startDate: "2026-01-05",
    endDate: "2026-02-05",
    totalPool: 134500,
    participants: [
      { modelId: "deepseek", odds: 2.1, betsCount: 278, poolAmount: 45200 },
      { modelId: "claude", odds: 2.4, betsCount: 234, poolAmount: 38500 },
      { modelId: "chatgpt", odds: 2.8, betsCount: 189, poolAmount: 28300 },
      { modelId: "gemini", odds: 3.5, betsCount: 112, poolAmount: 14500 },
      { modelId: "grok", odds: 4.8, betsCount: 67, poolAmount: 8000 },
    ],
    status: "upcoming",
    hot: true,
  },
]

// Demo user bets
interface UserBet {
  id: string
  competitionId: string
  competitionTitle: string
  modelId: string
  amount: number
  odds: number
  potentialReturn: number
  status: "pending" | "won" | "lost"
  placedAt: string
}

const DEMO_USER_BETS: UserBet[] = [
  {
    id: "bet-1",
    competitionId: "comp-3",
    competitionTitle: "EUR/USD Forex Trading Battle",
    modelId: "claude",
    amount: 500,
    odds: 2.0,
    potentialReturn: 1000,
    status: "pending",
    placedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "bet-2",
    competitionId: "comp-5",
    competitionTitle: "Ethereum DeFi Strategy",
    modelId: "deepseek",
    amount: 300,
    odds: 1.9,
    potentialReturn: 570,
    status: "pending",
    placedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// Calculate time remaining
function getTimeRemaining(endDate: string): string {
  const end = new Date(endDate).getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) return "Ended"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h`
}

// Competition Card Component
function CompetitionCard({
  competition,
  onBet,
}: {
  competition: Competition
  onBet: (competition: Competition) => void
}) {
  const sortedParticipants = [...competition.participants].sort((a, b) => a.odds - b.odds)
  const topTwo = sortedParticipants.slice(0, 2)

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 cursor-pointer",
        competition.featured && "ring-2 ring-primary/30"
      )}
      onClick={() => onBet(competition)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {competition.hot && (
                <Badge className="bg-orange-500 text-white gap-1 text-xs">
                  <Flame className="h-3 w-3" />
                  Hot
                </Badge>
              )}
              {competition.featured && (
                <Badge className="bg-primary text-white gap-1 text-xs">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
              )}
              <Badge
                variant={
                  competition.status === "live"
                    ? "default"
                    : competition.status === "upcoming"
                    ? "secondary"
                    : "outline"
                }
                className={cn(
                  "gap-1 text-xs",
                  competition.status === "live" && "bg-green-500 text-white"
                )}
              >
                {competition.status === "live" && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                )}
                {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
              {competition.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {competition.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top 2 Odds Display */}
        <div className="grid grid-cols-2 gap-3">
          {topTwo.map((participant, idx) => {
            const model = AI_MODELS.find((m) => m.id === participant.modelId)
            if (!model) return null

            return (
              <div
                key={participant.modelId}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  idx === 0
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/50 border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative h-6 w-6 rounded-full overflow-hidden bg-white">
                    <Image
                      src={model.logo}
                      alt={model.name}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span className="text-sm font-medium">{model.name}</span>
                </div>
                <div className="text-2xl font-bold text-primary">{participant.odds.toFixed(2)}x</div>
                <div className="text-xs text-muted-foreground">
                  {participant.betsCount} bets
                </div>
              </div>
            )
          })}
        </div>

        {/* Pool and Time Info */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1 text-sm">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold">{formatCurrency(competition.totalPool)}</span>
            <span className="text-muted-foreground">pool</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {competition.status === "upcoming"
              ? `Starts ${formatDate(competition.startDate)}`
              : competition.status === "live"
              ? getTimeRemaining(competition.endDate)
              : "Ended"}
          </div>
        </div>

        {/* View More */}
        <Button variant="ghost" className="w-full gap-2" size="sm">
          Place Bet
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// Betting Modal Component
function BettingModal({
  competition,
  open,
  onClose,
}: {
  competition: Competition | null
  open: boolean
  onClose: () => void
}) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState(100)
  const [betPlaced, setBetPlaced] = useState(false)

  if (!competition) return null

  const sortedParticipants = [...competition.participants].sort((a, b) => a.odds - b.odds)
  const selectedParticipant = sortedParticipants.find((p) => p.modelId === selectedModel)
  const potentialReturn = selectedParticipant ? betAmount * selectedParticipant.odds : 0

  const handlePlaceBet = () => {
    // Demo only - just show success state
    setBetPlaced(true)
    setTimeout(() => {
      setBetPlaced(false)
      setSelectedModel(null)
      setBetAmount(100)
      onClose()
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">{competition.title}</DialogTitle>
          <DialogDescription>{competition.description}</DialogDescription>
        </DialogHeader>

        {betPlaced ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bet Placed Successfully!</h3>
            <p className="text-muted-foreground">
              This is a demo - no actual money was used.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 p-1">
              {/* Competition Info */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{formatCurrency(competition.totalPool)}</span>
                    <span className="text-muted-foreground">pool</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>
                      {competition.participants.reduce((acc, p) => acc + p.betsCount, 0)} bets
                    </span>
                  </div>
                </div>
                <Badge
                  variant={competition.status === "live" ? "default" : "secondary"}
                  className={cn(
                    "gap-1",
                    competition.status === "live" && "bg-green-500 text-white"
                  )}
                >
                  {competition.status === "live" && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                  )}
                  {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                </Badge>
              </div>

              {/* Select AI Model */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Select AI Model to Win</h4>
                <div className="space-y-2">
                  {sortedParticipants.map((participant, idx) => {
                    const model = AI_MODELS.find((m) => m.id === participant.modelId)
                    if (!model) return null

                    const poolPercentage = (participant.poolAmount / competition.totalPool) * 100
                    const isSelected = selectedModel === participant.modelId

                    return (
                      <div
                        key={participant.modelId}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        )}
                        onClick={() => setSelectedModel(participant.modelId)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-white ring-2 ring-border">
                              <Image
                                src={model.logo}
                                alt={model.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {model.name}
                                {idx === 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Favorite
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {participant.betsCount} bets • {formatCurrency(participant.poolAmount)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {participant.odds.toFixed(2)}x
                            </div>
                            <div className="text-xs text-muted-foreground">odds</div>
                          </div>
                        </div>
                        <Progress value={poolPercentage} className="h-1.5" />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bet Amount */}
              {selectedModel && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="text-sm font-semibold">Bet Amount (Demo)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Slider
                        value={[betAmount]}
                        onValueChange={([value]) => setBetAmount(value)}
                        min={10}
                        max={10000}
                        step={10}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        min={10}
                        max={10000}
                        className="text-right"
                      />
                    </div>
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <Button
                        key={amount}
                        variant={betAmount === amount ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBetAmount(amount)}
                      >
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                  </div>

                  {/* Potential Return */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                    <span className="text-sm font-medium">Potential Return</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(potentialReturn)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {!betPlaced && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handlePlaceBet}
              disabled={!selectedModel || betAmount < 10}
              className="gap-2"
            >
              <Coins className="h-4 w-4" />
              Place Bet (Demo)
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Portfolio Card Component
function PortfolioCard({ bets }: { bets: UserBet[] }) {
  const totalBets = bets.reduce((acc, bet) => acc + bet.amount, 0)
  const totalPotential = bets.reduce((acc, bet) => acc + bet.potentialReturn, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Your Portfolio
        </CardTitle>
        <CardDescription>Demo bets - no real money involved</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Total Bets</div>
            <div className="text-xl font-bold">{formatCurrency(totalBets)}</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <div className="text-xs text-muted-foreground mb-1">Potential Return</div>
            <div className="text-xl font-bold text-primary">{formatCurrency(totalPotential)}</div>
          </div>
        </div>

        {/* Active Bets */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Active Bets</h4>
          {bets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active bets yet</p>
            </div>
          ) : (
            bets.map((bet) => {
              const model = AI_MODELS.find((m) => m.id === bet.modelId)
              if (!model) return null

              return (
                <div
                  key={bet.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="relative h-8 w-8 rounded-full overflow-hidden bg-white">
                    <Image
                      src={model.logo}
                      alt={model.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bet.competitionTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {model.name} @ {bet.odds}x
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(bet.amount)}</div>
                    <div className="text-xs text-profit">→ {formatCurrency(bet.potentialReturn)}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Mad2MarketPage() {
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>("all")
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [bettingModalOpen, setBettingModalOpen] = useState(false)
  const [userBets, setUserBets] = useState<UserBet[]>(DEMO_USER_BETS)

  // Filter competitions
  const filteredCompetitions = useMemo(() => {
    if (selectedCategory === "all") return DEMO_COMPETITIONS
    return DEMO_COMPETITIONS.filter((c) => c.category === selectedCategory)
  }, [selectedCategory])

  // Separate by status
  const liveCompetitions = filteredCompetitions.filter((c) => c.status === "live")
  const upcomingCompetitions = filteredCompetitions.filter((c) => c.status === "upcoming")
  const featuredCompetitions = filteredCompetitions.filter((c) => c.featured)

  const handleBet = (competition: Competition) => {
    setSelectedCompetition(competition)
    setBettingModalOpen(true)
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/arena">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    Mad2Market
                  </h1>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    BETA
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Predict AI Performance - Polymarket Style
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">
                {formatCurrency(DEMO_COMPETITIONS.reduce((acc, c) => acc + c.totalPool, 0))}
              </span>
              <span className="text-muted-foreground">total pool</span>
            </Badge>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Demo Mode</p>
                <p className="text-sm text-muted-foreground">
                  This is a demonstration. All bets are simulated with virtual currency - no real
                  money is involved. Experience Polymarket-style prediction markets for AI trading
                  competitions!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Filters */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {MARKET_CATEGORIES.map((category) => {
              const Icon = category.icon
              const count =
                category.value === "all"
                  ? DEMO_COMPETITIONS.length
                  : DEMO_COMPETITIONS.filter((c) => c.category === category.value).length

              return (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  className="gap-2 flex-shrink-0"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-1 h-5 px-1.5 text-xs",
                      selectedCategory === category.value && "bg-white/20 text-white"
                    )}
                  >
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Competitions */}
            {featuredCompetitions.length > 0 && selectedCategory === "all" && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-xl font-semibold">Featured Competitions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredCompetitions.slice(0, 2).map((competition) => (
                    <CompetitionCard
                      key={competition.id}
                      competition={competition}
                      onBet={handleBet}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Live Competitions */}
            {liveCompetitions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </div>
                  <h2 className="text-xl font-semibold">Live Now</h2>
                  <Badge variant="secondary">{liveCompetitions.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveCompetitions.map((competition) => (
                    <CompetitionCard
                      key={competition.id}
                      competition={competition}
                      onBet={handleBet}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Competitions */}
            {upcomingCompetitions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Upcoming</h2>
                  <Badge variant="secondary">{upcomingCompetitions.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingCompetitions.map((competition) => (
                    <CompetitionCard
                      key={competition.id}
                      competition={competition}
                      onBet={handleBet}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Portfolio */}
          <div className="space-y-4">
            <PortfolioCard bets={userBets} />

            {/* How It Works */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    1
                  </div>
                  <p className="text-muted-foreground">
                    Choose a competition based on market type and AI models
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    2
                  </div>
                  <p className="text-muted-foreground">
                    Select which AI you think will perform best
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    3
                  </div>
                  <p className="text-muted-foreground">
                    Place your bet and watch the competition unfold
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center text-xs font-bold text-green-500 flex-shrink-0">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-muted-foreground">
                    Win based on odds if your AI comes out on top!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Back to Arena */}
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href="/arena">
                <Swords className="h-4 w-4" />
                Back to Mad2Arena
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Betting Modal */}
      <BettingModal
        competition={selectedCompetition}
        open={bettingModalOpen}
        onClose={() => setBettingModalOpen(false)}
      />
    </MainLayout>
  )
}

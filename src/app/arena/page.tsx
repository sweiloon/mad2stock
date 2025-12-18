"use client"

import { useEffect, useState, useMemo } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Swords,
  Trophy,
  Activity,
  LineChart,
  Users,
  RefreshCw,
  Bot,
  Info,
  Sparkles,
  Coins,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useArenaStore } from "@/stores/arena"
import {
  Leaderboard,
  TradeHistory,
  PerformanceChart,
  AIModelCard,
  CompetitionTimer,
  ArenaStatsCard
} from "@/components/arena"
import { ArenaChart } from "@/components/charts"
import { AI_MODELS, Trade, AIParticipant } from "@/lib/arena/types"

// Malaysian stocks for demo trades
const MALAYSIAN_STOCKS = [
  { code: 'GAMUDA', name: 'Gamuda Berhad' },
  { code: 'MAYBANK', name: 'Malayan Banking Berhad' },
  { code: 'TENAGA', name: 'Tenaga Nasional Berhad' },
  { code: 'CIMB', name: 'CIMB Group Holdings' },
  { code: 'PBBANK', name: 'Public Bank Berhad' },
  { code: 'PETRONAS', name: 'Petronas Chemicals Group' },
  { code: 'IHH', name: 'IHH Healthcare Berhad' },
  { code: 'AXIATA', name: 'Axiata Group Berhad' },
  { code: 'DIGI', name: 'Digi.Com Berhad' },
  { code: 'GENTING', name: 'Genting Berhad' },
  { code: 'TOPGLOVE', name: 'Top Glove Corporation' },
  { code: 'HARTA', name: 'Hartalega Holdings' },
  { code: 'MISC', name: 'MISC Berhad' },
  { code: 'SIMEPLT', name: 'Sime Darby Plantation' },
  { code: 'KLCC', name: 'KLCCP Stapled Group' },
]

// AI reasoning templates for demo
const BUY_REASONS = [
  'Strong quarterly earnings beat expectations, momentum building',
  'Technical breakout above key resistance with high volume',
  'Sector rotation favoring this stock, institutional buying detected',
  'Undervalued based on DCF analysis, good entry point',
  'Positive news catalyst, expecting price appreciation',
  'RSI oversold condition, mean reversion opportunity',
  'Strong dividend yield with stable fundamentals',
  'Breaking out of consolidation pattern with bullish MACD crossover',
]

const SELL_REASONS = [
  'Target price reached, taking profits',
  'Technical breakdown below support, cutting losses',
  'Sector weakness, rotating to defensive positions',
  'Overbought RSI, expecting pullback',
  'Negative earnings revision, reducing exposure',
  'Stop loss triggered at predetermined level',
  'Better opportunity identified elsewhere',
  'Portfolio rebalancing to manage risk',
]

// Demo AI participants data
const DEMO_PARTICIPANTS: AIParticipant[] = [
  {
    id: 'deepseek-1',
    model_name: 'deepseek-chat',
    model_provider: 'DeepSeek',
    display_name: 'DeepSeek',
    avatar_color: '#3B82F6',
    initial_capital: 10000,
    current_capital: 7250.50,
    portfolio_value: 10520.30,
    total_trades: 12,
    winning_trades: 8,
    total_profit_loss: 520.30,
    profit_loss_pct: 5.20,
    rank: 1,
    status: 'active',
    last_trade_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-12-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'claude-1',
    model_name: 'claude-sonnet-4',
    model_provider: 'Anthropic',
    display_name: 'Claude',
    avatar_color: '#D97706',
    initial_capital: 10000,
    current_capital: 6890.25,
    portfolio_value: 10380.75,
    total_trades: 10,
    winning_trades: 7,
    total_profit_loss: 380.75,
    profit_loss_pct: 3.81,
    rank: 2,
    status: 'active',
    last_trade_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-12-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'chatgpt-1',
    model_name: 'gpt-4o',
    model_provider: 'OpenAI',
    display_name: 'ChatGPT',
    avatar_color: '#10B981',
    initial_capital: 10000,
    current_capital: 8120.00,
    portfolio_value: 10245.50,
    total_trades: 8,
    winning_trades: 5,
    total_profit_loss: 245.50,
    profit_loss_pct: 2.46,
    rank: 3,
    status: 'active',
    last_trade_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-12-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'grok-1',
    model_name: 'grok-2-latest',
    model_provider: 'xAI',
    display_name: 'Grok',
    avatar_color: '#000000',
    initial_capital: 10000,
    current_capital: 5450.80,
    portfolio_value: 10125.20,
    total_trades: 15,
    winning_trades: 8,
    total_profit_loss: 125.20,
    profit_loss_pct: 1.25,
    rank: 4,
    status: 'active',
    last_trade_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-12-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gemini-1',
    model_name: 'gemini-2.0-flash',
    model_provider: 'Google',
    display_name: 'Gemini',
    avatar_color: '#8B5CF6',
    initial_capital: 10000,
    current_capital: 7890.00,
    portfolio_value: 9920.40,
    total_trades: 6,
    winning_trades: 3,
    total_profit_loss: -79.60,
    profit_loss_pct: -0.80,
    rank: 5,
    status: 'active',
    last_trade_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-12-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
]

// Generate demo trades
function generateDemoTrades(): Trade[] {
  const trades: Trade[] = []
  const now = new Date()

  // Create trades for each AI participant
  DEMO_PARTICIPANTS.forEach((participant) => {
    const numTrades = participant.total_trades

    for (let i = 0; i < numTrades; i++) {
      const stock = MALAYSIAN_STOCKS[Math.floor(Math.random() * MALAYSIAN_STOCKS.length)]
      const isBuy = Math.random() > 0.4 // More buys than sells
      const price = 1.5 + Math.random() * 8 // RM 1.50 to RM 9.50
      const quantity = Math.floor(100 + Math.random() * 900) // 100 to 1000 shares
      const totalValue = price * quantity
      const fees = totalValue * 0.0015 // 0.15% trading fee

      // Calculate time offset (spread trades over past 2 weeks)
      const hoursAgo = Math.floor(Math.random() * 336) // 0 to 14 days in hours
      const executedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

      const trade: Trade = {
        id: `demo-${participant.id}-${i}`,
        participant_id: participant.id,
        stock_code: stock.code,
        stock_name: stock.name,
        trade_type: isBuy ? 'BUY' : 'SELL',
        quantity,
        price: Math.round(price * 10000) / 10000,
        total_value: Math.round(totalValue * 100) / 100,
        fees: Math.round(fees * 100) / 100,
        realized_pnl: isBuy ? null : (Math.random() > 0.4 ? Math.random() * 200 : -Math.random() * 100),
        reasoning: isBuy
          ? BUY_REASONS[Math.floor(Math.random() * BUY_REASONS.length)]
          : SELL_REASONS[Math.floor(Math.random() * SELL_REASONS.length)],
        executed_at: executedAt.toISOString(),
        created_at: executedAt.toISOString(),
        participant: participant,
      }

      trades.push(trade)
    }
  })

  // Sort by execution time (most recent first)
  return trades.sort((a, b) =>
    new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
  )
}

export default function ArenaPage() {
  const {
    participants,
    holdings,
    trades,
    chartData,
    leaderboard,
    competitionStatus,
    stats,
    isLoading,
    error,
    selectedParticipant,
    fetchAll,
    selectParticipant,
    subscribeToUpdates
  } = useArenaStore()

  const [activeTab, setActiveTab] = useState("overview")

  // Generate demo data (memoized to prevent regeneration on every render)
  const demoTrades = useMemo(() => generateDemoTrades(), [])

  useEffect(() => {
    fetchAll()
    const unsubscribe = subscribeToUpdates()
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Use demo data when no real data exists
  const displayTrades = trades.length > 0 ? trades : demoTrades
  const displayParticipants = participants.length > 0 ? participants : DEMO_PARTICIPANTS
  const useDemoMode = trades.length === 0

  // Get selected participant's data
  const selectedModel = displayParticipants.find(p => p.id === selectedParticipant)
  const selectedHoldings = selectedParticipant ? holdings[selectedParticipant] || [] : []
  const selectedTrades = selectedParticipant
    ? displayTrades.filter(t => t.participant_id === selectedParticipant)
    : displayTrades

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center shadow-lg">
                <Swords className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                    Mad2Arena
                  </h1>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    LIVE
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  AI Stock Trading Competition - 5 Models Battle for Supremacy
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/arena/market">
              <Button
                className="gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all"
              >
                <Trophy className="h-4 w-4" />
                Mad2Market
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  NEW
                </Badge>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAll()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Badge variant="secondary" className="gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              {participants.length || 5} AI Traders
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="p-4">
              <div className="text-red-600 font-medium">Error loading arena data</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Trophy className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trades" className="gap-2">
              <Activity className="h-4 w-4" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Users className="h-4 w-4" />
              Models
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Hero Chart - Main Focus */}
            <ArenaChart height={500} showDemoData={true} />

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Timer & Stats */}
              <div className="space-y-6">
                <CompetitionTimer status={competitionStatus} />
                <ArenaStatsCard
                  stats={stats}
                  participantCount={participants.length}
                />
              </div>

              {/* Right Column - Leaderboard */}
              <div className="lg:col-span-2">
                {isLoading ? (
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Leaderboard
                    entries={leaderboard}
                    onSelectParticipant={selectParticipant}
                    selectedId={selectedParticipant}
                  />
                )}
              </div>
            </div>

            {/* Mad2Market Promo Card */}
            <Link href="/arena/market" className="block">
              <Card className="group overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                            Mad2Market
                          </h3>
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                            NEW
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          Predict AI performance across Stocks, Crypto, Forex & more - Polymarket style!
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          RM 789,200 total pool
                        </div>
                        <div className="text-xs text-muted-foreground">8 active competitions</div>
                      </div>
                      <Button className="gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white border-0">
                        Explore Markets
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Recent Trades Preview */}
            <TradeHistory
              trades={displayTrades.slice(0, 10)}
              maxHeight="350px"
              showParticipant
              showDemoMode={useDemoMode}
            />
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Trade History</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedModel
                    ? `Showing trades by ${selectedModel.display_name}`
                    : "All trades from all AI models"}
                </p>
              </div>
              {selectedParticipant && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectParticipant(null)}
                >
                  Show All Trades
                </Button>
              )}
            </div>

            <TradeHistory
              trades={selectedTrades}
              maxHeight="600px"
              showParticipant={!selectedParticipant}
              showDemoMode={useDemoMode}
            />
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold">AI Trading Models</h2>
              <p className="text-sm text-muted-foreground">
                Detailed view of each competing AI model
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6 space-y-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map((participant, index) => (
                  <AIModelCard
                    key={participant.id}
                    participant={participant}
                    holdings={holdings[participant.id] || []}
                    rank={index + 1}
                    isSelected={selectedParticipant === participant.id}
                    onClick={() => {
                      selectParticipant(
                        selectedParticipant === participant.id ? null : participant.id
                      )
                      setActiveTab("trades")
                    }}
                  />
                ))}
              </div>
            )}

          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <strong>Competition Rules:</strong> Starting capital RM 10,000 |
                Trading fee 0.15% | Max 30% single position |
                Malaysian stocks only
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Trading Hours: 9am - 5pm MYT (Mon-Fri)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

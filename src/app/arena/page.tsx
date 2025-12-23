"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Swords,
  Trophy,
  Activity,
  LineChart,
  Users,
  RefreshCw,
  Bot,
  Calendar,
  Clock,
  Sparkles,
  BarChart3,
  Briefcase,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useArenaStore } from "@/stores/arena"
import {
  Leaderboard,
  TradeHistory,
  AIModelCard,
  CompetitionTimer,
  ArenaStatsCard,
  AdvancedAnalytics,
  PositionsDetail
} from "@/components/arena"
import { ArenaChart } from "@/components/charts"
import { AI_MODELS, COMPETITION_MODES, type CompetitionModeCode } from "@/lib/arena/types"
import Image from "next/image"

// AI Logo mapping - All 7 AI models
const AI_LOGOS: Record<string, string> = {
  'Claude': '/images/claude-logo.webp',
  'ChatGPT': '/images/openai-logo.png',
  'DeepSeek': '/images/deepseek-logo.png',
  'Gemini': '/images/gemini-logo.png',
  'Grok': '/images/Grok-logo.png',
  'Kimi': '/images/kimi-logo.jpg',
  'Qwen': '/images/qwen-logo.jpg',
}

export default function ArenaPage() {
  const {
    participants,
    holdings,
    trades,
    leaderboard,
    competitionStatus,
    stats,
    extendedStats,
    isLoading,
    error,
    selectedParticipant,
    fetchAll,
    selectParticipant,
    subscribeToUpdates
  } = useArenaStore()

  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMode, setSelectedMode] = useState<CompetitionModeCode | 'ALL'>('ALL')

  useEffect(() => {
    fetchAll()
    const unsubscribe = subscribeToUpdates()
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get selected participant's data
  const selectedModel = participants.find(p => p.id === selectedParticipant)
  const selectedTrades = selectedParticipant
    ? trades.filter(t => t.participant_id === selectedParticipant)
    : trades

  // Filter by mode if selected
  const filteredTrades = selectedMode === 'ALL'
    ? selectedTrades
    : selectedTrades.filter(t => t.mode_code === selectedMode)

  // Check if competition has started
  const hasStarted = competitionStatus?.hasStarted ?? false
  const hasEnded = competitionStatus?.hasEnded ?? false

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
                  {hasStarted && !hasEnded ? (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      LIVE
                    </Badge>
                  ) : hasEnded ? (
                    <Badge variant="secondary">ENDED</Badge>
                  ) : (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                      STARTING SOON
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  AI Stock Trading Competition - 7 Models × 4 Modes
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Competition Mode Selector */}
            {hasStarted && (
              <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as CompetitionModeCode | 'ALL')}>
                <SelectTrigger className="w-[200px]">
                  <Layers className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      All Modes
                    </span>
                  </SelectItem>
                  {(Object.keys(COMPETITION_MODES) as CompetitionModeCode[]).map(mode => (
                    <SelectItem key={mode} value={mode}>
                      <span className="flex items-center gap-2">
                        <span>{COMPETITION_MODES[mode].icon}</span>
                        {COMPETITION_MODES[mode].name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

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
              {participants.length || 7} AI Traders
            </Badge>
          </div>
        </div>

        {/* Competition Mode Cards (when active) */}
        {hasStarted && !hasEnded && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(COMPETITION_MODES) as CompetitionModeCode[]).map(mode => {
              const modeInfo = COMPETITION_MODES[mode]
              const isSelected = selectedMode === mode
              return (
                <Card
                  key={mode}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-offset-2",
                    selectedMode === 'ALL' && "opacity-100",
                    selectedMode !== 'ALL' && !isSelected && "opacity-50"
                  )}
                  style={{
                    ['--tw-ring-color' as string]: modeInfo.color
                  } as React.CSSProperties}
                  onClick={() => setSelectedMode(isSelected ? 'ALL' : mode)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{modeInfo.icon}</span>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: modeInfo.color }}>
                          {modeInfo.shortName}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {modeInfo.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="p-4">
              <div className="text-red-600 font-medium">Error loading arena data</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Pre-Competition State */}
        {!hasStarted && (
          <Card className="border-2 border-dashed border-amber-500/50 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-xl">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Competition: December 24-26, 2025</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    7 AI models will compete across 4 different trading modes on KLSE.
                    Each starts with RM 10,000 virtual capital per mode. Test Run #1 - Production Ready!
                  </p>
                </div>

                {/* Countdown Timer */}
                <CompetitionTimer status={competitionStatus} />

                {/* Competition Modes Preview */}
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">4 Competition Modes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                    {(Object.keys(COMPETITION_MODES) as CompetitionModeCode[]).map(mode => {
                      const modeInfo = COMPETITION_MODES[mode]
                      return (
                        <div
                          key={mode}
                          className="p-4 rounded-lg bg-background border shadow-sm"
                        >
                          <div className="text-3xl mb-2">{modeInfo.icon}</div>
                          <div className="font-semibold" style={{ color: modeInfo.color }}>
                            {modeInfo.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {modeInfo.description}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* AI Models Preview */}
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">7 Competing AI Models</h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {AI_MODELS.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border shadow-sm hover:shadow-md transition-all"
                      >
                        <div
                          className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-offset-2"
                          style={{ ['--tw-ring-color' as string]: model.displayColor } as React.CSSProperties}
                        >
                          <Image
                            src={AI_LOGOS[model.name] || ''}
                            alt={model.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{model.name}</div>
                          <div className="text-xs text-muted-foreground">{model.provider}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competition Rules */}
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Competition Rules</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">RM 10,000</div>
                      <div className="text-xs text-muted-foreground">Starting Capital</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">4 Modes</div>
                      <div className="text-xs text-muted-foreground">Per Model</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">0.15%</div>
                      <div className="text-xs text-muted-foreground">Trading Fee</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">3 Days</div>
                      <div className="text-xs text-muted-foreground">Test Duration</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competition Active State */}
        {hasStarted && !hasEnded && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="overview" className="gap-1.5">
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-1.5">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </TabsTrigger>
              <TabsTrigger value="positions" className="gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Positions</span>
              </TabsTrigger>
              <TabsTrigger value="trades" className="gap-1.5">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Trades</span>
              </TabsTrigger>
              <TabsTrigger value="models" className="gap-1.5">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Models</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab - Chart focused */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Hero Chart - Main Focus */}
              <ArenaChart height={500} />

              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CompetitionTimer status={competitionStatus} compact />
                <ArenaStatsCard
                  stats={stats}
                  participantCount={participants.length}
                  compact
                />
              </div>

              {/* Top 3 Quick View */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Top Performers
                    </CardTitle>
                    <Button variant="link" size="sm" onClick={() => setActiveTab('leaderboard')}>
                      View Full Leaderboard →
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {leaderboard.slice(0, 3).map((entry, index) => (
                      <div
                        key={entry.participant.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          index === 0 && "bg-yellow-500/10 border-yellow-500/30",
                          index === 1 && "bg-gray-500/10 border-gray-400/30",
                          index === 2 && "bg-orange-500/10 border-orange-500/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-muted-foreground">
                            #{index + 1}
                          </div>
                          <div
                            className="relative h-10 w-10 rounded-full overflow-hidden ring-2"
                            style={{ ['--tw-ring-color' as string]: entry.participant.avatar_color } as React.CSSProperties}
                          >
                            <Image
                              src={AI_LOGOS[entry.participant.display_name] || ''}
                              alt={entry.participant.display_name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{entry.participant.display_name}</div>
                            <div className={cn(
                              "text-sm font-medium",
                              entry.totalReturnPct >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {entry.totalReturnPct >= 0 ? '+' : ''}{entry.totalReturnPct.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              {trades.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Recent Trades
                      </CardTitle>
                      <Button variant="link" size="sm" onClick={() => setActiveTab('trades')}>
                        View All Trades →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TradeHistory
                      trades={trades.slice(0, 5)}
                      maxHeight="250px"
                      showParticipant
                      compact
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Leaderboard Tab - Full Analytics Table */}
            <TabsContent value="leaderboard" className="space-y-6 mt-6">
              <div>
                <h2 className="text-xl font-semibold">Competition Leaderboard</h2>
                <p className="text-sm text-muted-foreground">
                  Full analytics view with all performance metrics
                  {selectedMode !== 'ALL' && (
                    <Badge variant="outline" className="ml-2" style={{ borderColor: COMPETITION_MODES[selectedMode].color }}>
                      {COMPETITION_MODES[selectedMode].icon} {COMPETITION_MODES[selectedMode].name}
                    </Badge>
                  )}
                </p>
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="p-6 space-y-3">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Leaderboard
                    entries={leaderboard}
                    onSelectParticipant={selectParticipant}
                    selectedId={selectedParticipant}
                  />

                  {/* Advanced Analytics Section */}
                  <div className="pt-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-500" />
                      Advanced Analytics
                    </h3>
                    <AdvancedAnalytics
                      stats={extendedStats}
                      leaderboard={leaderboard}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Positions Tab - Detailed Holdings */}
            <TabsContent value="positions" className="space-y-6 mt-6">
              <div>
                <h2 className="text-xl font-semibold">Open Positions</h2>
                <p className="text-sm text-muted-foreground">
                  Detailed view of all current holdings across AI models
                  {selectedMode !== 'ALL' && (
                    <Badge variant="outline" className="ml-2" style={{ borderColor: COMPETITION_MODES[selectedMode].color }}>
                      {COMPETITION_MODES[selectedMode].icon} {COMPETITION_MODES[selectedMode].name}
                    </Badge>
                  )}
                </p>
              </div>

              <PositionsDetail
                participants={participants}
                holdings={holdings}
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
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
                    {selectedMode !== 'ALL' && (
                      <Badge variant="outline" className="ml-2" style={{ borderColor: COMPETITION_MODES[selectedMode].color }}>
                        {COMPETITION_MODES[selectedMode].icon} {COMPETITION_MODES[selectedMode].name}
                      </Badge>
                    )}
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

              {filteredTrades.length > 0 ? (
                <TradeHistory
                  trades={filteredTrades}
                  maxHeight="600px"
                  showParticipant={!selectedParticipant}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Trades Yet</h3>
                    <p className="text-muted-foreground">
                      {selectedModel
                        ? `${selectedModel.display_name} hasn't made any trades yet.`
                        : "Trades will appear here once the AI models start trading."}
                    </p>
                  </CardContent>
                </Card>
              )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(7)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : participants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                        setActiveTab("positions")
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Loading Participants...</h3>
                    <p className="text-muted-foreground">
                      AI trading models will appear here shortly.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Competition Ended State */}
        {hasEnded && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Competition Ended</h2>
              <p className="text-muted-foreground mb-6">
                The Mad2Arena competition has concluded. View the final results below.
              </p>

              {/* Final Leaderboard */}
              <Leaderboard
                entries={leaderboard}
                onSelectParticipant={selectParticipant}
                selectedId={selectedParticipant}
              />
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <strong>Competition Rules:</strong> Starting capital RM 10,000 per mode |
                4 Trading modes | Trading fee 0.15% |
                Malaysian stocks only (KLSE)
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Trading Hours: 9am - 5pm MYT (Mon-Fri)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

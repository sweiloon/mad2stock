"use client"

import { useEffect, useState } from "react"
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
  Info
} from "lucide-react"
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
import { AI_MODELS } from "@/lib/arena/types"

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

  useEffect(() => {
    fetchAll()
    const unsubscribe = subscribeToUpdates()
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get selected participant's data
  const selectedModel = participants.find(p => p.id === selectedParticipant)
  const selectedHoldings = selectedParticipant ? holdings[selectedParticipant] || [] : []
  const selectedTrades = selectedParticipant
    ? trades.filter(t => t.participant_id === selectedParticipant)
    : trades

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Swords className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mad2Arena</h1>
                <p className="text-muted-foreground">
                  AI Stock Trading Competition - 5 Models Battle for Supremacy
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              {participants.length} AI Traders
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

            {/* Performance Chart */}
            <PerformanceChart
              data={chartData}
              participants={participants}
              height={350}
            />

            {/* Recent Trades Preview */}
            <TradeHistory
              trades={trades.slice(0, 10)}
              maxHeight="350px"
              showParticipant
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

            {/* API Setup Info */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4" />
                  API Configuration Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  To enable AI trading, add the following API keys to your environment variables:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
                  {AI_MODELS.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-2 rounded bg-background"
                    >
                      <span className="text-muted-foreground">{model.name}:</span>
                      <code className="text-xs">{model.apiKeyEnvVar}</code>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add these to your <code>.env.local</code> file. The trading system will
                  automatically detect available API keys and enable those models.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <strong>Competition Rules:</strong> Starting capital RM 10,000 |
                Trading fee 0.15% | Max 30% single position |
                Malaysian stocks only (KLSE/Bursa Malaysia)
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

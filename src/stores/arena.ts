/**
 * Mad2Arena - Zustand Store
 * Manages AI trading competition state
 */

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type {
  AIParticipant,
  Holding,
  Trade,
  DailySnapshot,
  ArenaConfig,
  CompetitionStatus,
  ArenaStats,
  LeaderboardEntry,
  ChartDataPoint
} from '@/lib/arena/types'

interface ArenaState {
  // Data
  participants: AIParticipant[]
  holdings: Record<string, Holding[]> // keyed by participant_id
  trades: Trade[]
  dailySnapshots: DailySnapshot[]
  config: ArenaConfig | null

  // UI State
  isLoading: boolean
  error: string | null
  selectedParticipant: string | null

  // Computed
  competitionStatus: CompetitionStatus | null
  leaderboard: LeaderboardEntry[]
  chartData: ChartDataPoint[]
  stats: ArenaStats | null

  // Actions
  fetchParticipants: () => Promise<void>
  fetchHoldings: (participantId?: string) => Promise<void>
  fetchTrades: (participantId?: string, limit?: number) => Promise<void>
  fetchDailySnapshots: () => Promise<void>
  fetchConfig: () => Promise<void>
  fetchAll: () => Promise<void>
  selectParticipant: (id: string | null) => void
  computeLeaderboard: () => void
  computeChartData: () => void
  computeStats: () => void
  subscribeToUpdates: () => () => void
}

export const useArenaStore = create<ArenaState>((set, get) => ({
  // Initial state
  participants: [],
  holdings: {},
  trades: [],
  dailySnapshots: [],
  config: null,
  isLoading: false,
  error: null,
  selectedParticipant: null,
  competitionStatus: null,
  leaderboard: [],
  chartData: [],
  stats: null,

  // Fetch participants
  fetchParticipants: async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('arena_participants')
      .select('*')
      .order('rank', { ascending: true })

    if (error) {
      set({ error: error.message })
      return
    }

    set({ participants: data || [] })
    get().computeLeaderboard()
  },

  // Fetch holdings
  fetchHoldings: async (participantId?: string) => {
    const supabase = createClient()
    let query = supabase
      .from('arena_holdings')
      .select('*')

    if (participantId) {
      query = query.eq('participant_id', participantId)
    }

    const { data, error } = await query

    if (error) {
      set({ error: error.message })
      return
    }

    // Group by participant_id
    const holdingsMap: Record<string, Holding[]> = {}
    data?.forEach((holding: Holding) => {
      if (!holdingsMap[holding.participant_id]) {
        holdingsMap[holding.participant_id] = []
      }
      holdingsMap[holding.participant_id].push(holding)
    })

    set({ holdings: { ...get().holdings, ...holdingsMap } })
  },

  // Fetch trades
  fetchTrades: async (participantId?: string, limit = 100) => {
    const supabase = createClient()
    let query = supabase
      .from('arena_trades')
      .select(`
        *,
        participant:arena_participants(id, display_name, avatar_color)
      `)
      .order('executed_at', { ascending: false })
      .limit(limit)

    if (participantId) {
      query = query.eq('participant_id', participantId)
    }

    const { data, error } = await query

    if (error) {
      set({ error: error.message })
      return
    }

    set({ trades: data || [] })
  },

  // Fetch daily snapshots
  fetchDailySnapshots: async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('arena_daily_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: true })

    if (error) {
      set({ error: error.message })
      return
    }

    set({ dailySnapshots: data || [] })
    get().computeChartData()
  },

  // Fetch config
  fetchConfig: async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('arena_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      set({ error: error.message })
      return
    }

    if (data) {
      set({ config: data })

      // Compute competition status
      const now = new Date()
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      set({
        competitionStatus: {
          isActive: data.is_active && now >= startDate && now <= endDate,
          hasStarted: now >= startDate,
          hasEnded: now > endDate,
          daysRemaining,
          daysElapsed,
          totalDays,
          progressPct: Math.min(100, (daysElapsed / totalDays) * 100),
          startDate,
          endDate
        }
      })
    }
  },

  // Fetch all data
  fetchAll: async () => {
    set({ isLoading: true, error: null })

    try {
      await Promise.all([
        get().fetchConfig(),
        get().fetchParticipants(),
        get().fetchTrades(),
        get().fetchDailySnapshots()
      ])

      // Fetch holdings for all participants
      const participants = get().participants
      await Promise.all(
        participants.map(p => get().fetchHoldings(p.id))
      )

      get().computeStats()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch data' })
    } finally {
      set({ isLoading: false })
    }
  },

  // Select participant
  selectParticipant: (id: string | null) => {
    set({ selectedParticipant: id })
  },

  // Compute leaderboard
  computeLeaderboard: () => {
    const { participants } = get()

    const leaderboard: LeaderboardEntry[] = participants
      .map((p, index) => ({
        rank: index + 1,
        participant: p,
        portfolioValue: p.portfolio_value,
        totalReturn: p.total_profit_loss,
        totalReturnPct: p.profit_loss_pct,
        dailyChange: 0, // Would be computed from snapshots
        dailyChangePct: 0,
        winRate: p.total_trades > 0 ? (p.winning_trades / p.total_trades) * 100 : 0,
        totalTrades: p.total_trades
      }))
      .sort((a, b) => b.portfolioValue - a.portfolioValue)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    set({ leaderboard })
  },

  // Compute chart data
  computeChartData: () => {
    const { dailySnapshots, participants } = get()

    // Group snapshots by date
    const dataByDate: Record<string, ChartDataPoint> = {}

    dailySnapshots.forEach(snapshot => {
      const date = snapshot.snapshot_date
      if (!dataByDate[date]) {
        dataByDate[date] = {
          date,
          timestamp: new Date(date).getTime()
        }
      }

      // Find participant name
      const participant = participants.find(p => p.id === snapshot.participant_id)
      if (participant) {
        dataByDate[date][participant.display_name] = snapshot.portfolio_value
      }
    })

    const chartData = Object.values(dataByDate).sort((a, b) => a.timestamp - b.timestamp)
    set({ chartData })
  },

  // Compute stats
  computeStats: () => {
    const { participants, trades } = get()

    if (participants.length === 0) {
      set({ stats: null })
      return
    }

    const totalTrades = trades.length
    const totalVolume = trades.reduce((sum, t) => sum + t.total_value, 0)
    const avgReturn = participants.reduce((sum, p) => sum + p.profit_loss_pct, 0) / participants.length

    const sortedByReturn = [...participants].sort((a, b) => b.profit_loss_pct - a.profit_loss_pct)
    const sortedByTrades = [...participants].sort((a, b) => b.total_trades - a.total_trades)

    const highestTrade = trades.length > 0
      ? trades.reduce((max, t) => t.total_value > max.total_value ? t : max, trades[0])
      : null

    set({
      stats: {
        totalTrades,
        totalVolume,
        avgReturn,
        bestPerformer: sortedByReturn[0] || null,
        worstPerformer: sortedByReturn[sortedByReturn.length - 1] || null,
        mostActiveTrade: sortedByTrades[0] || null,
        highestSingleTrade: highestTrade
      }
    })
  },

  // Subscribe to realtime updates
  subscribeToUpdates: () => {
    const supabase = createClient()

    const channel = supabase
      .channel('arena-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arena_participants' },
        () => get().fetchParticipants()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arena_trades' },
        () => get().fetchTrades()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arena_holdings' },
        () => {
          const participants = get().participants
          participants.forEach(p => get().fetchHoldings(p.id))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arena_daily_snapshots' },
        () => get().fetchDailySnapshots()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}))

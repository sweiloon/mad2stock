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
  ChartDataPoint,
  ExtendedArenaStats
} from '@/lib/arena/types'

// Helper functions for advanced metrics

/**
 * Calculate Sharpe Ratio
 * Formula: (Portfolio Return - Risk Free Rate) / Std Dev of Returns
 * Using 3% annual risk-free rate (Malaysian T-bills approx)
 */
function calculateSharpeRatio(dailyReturns: number[], totalReturnPct: number): number {
  if (dailyReturns.length < 2) return 0

  const riskFreeRate = 3 // 3% annual
  const excessReturn = totalReturnPct - (riskFreeRate / 12) // Monthly adjustment

  // Calculate standard deviation of daily returns
  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length
  const squaredDiffs = dailyReturns.map(r => Math.pow(r - mean, 2))
  const variance = squaredDiffs.reduce((s, d) => s + d, 0) / dailyReturns.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return excessReturn > 0 ? 3 : 0 // Cap at 3 if no volatility

  // Annualized Sharpe (assuming ~252 trading days)
  const annualizedSharpe = (excessReturn / stdDev) * Math.sqrt(252 / dailyReturns.length)
  return Math.max(-3, Math.min(3, annualizedSharpe)) // Cap between -3 and 3
}

/**
 * Calculate Maximum Drawdown
 * Formula: (Peak - Trough) / Peak × 100
 */
function calculateMaxDrawdown(snapshots: DailySnapshot[]): number {
  if (snapshots.length < 2) return 0

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  )

  let peak = sorted[0]?.portfolio_value || 0
  let maxDrawdown = 0

  for (const snapshot of sorted) {
    if (snapshot.portfolio_value > peak) {
      peak = snapshot.portfolio_value
    }
    const drawdown = peak > 0 ? ((peak - snapshot.portfolio_value) / peak) * 100 : 0
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  return maxDrawdown
}

/**
 * Calculate average hold time between trades (in hours)
 */
function calculateAvgHoldTime(trades: Trade[]): number {
  if (trades.length < 2) return 0

  const sorted = [...trades].sort(
    (a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime()
  )

  let totalHours = 0
  for (let i = 1; i < sorted.length; i++) {
    const diff = new Date(sorted[i].executed_at).getTime() - new Date(sorted[i - 1].executed_at).getTime()
    totalHours += diff / (1000 * 60 * 60)
  }

  return totalHours / (sorted.length - 1)
}

/**
 * Calculate median of an array
 */
function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

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
  extendedStats: ExtendedArenaStats | null
  // Participant-specific trade data for metrics computation
  participantTrades: Record<string, Trade[]>

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
  extendedStats: null,
  participantTrades: {},

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

    // Group trades by participant for metrics computation
    const participantTrades: Record<string, Trade[]> = {}
    data?.forEach((trade: Trade) => {
      if (!participantTrades[trade.participant_id]) {
        participantTrades[trade.participant_id] = []
      }
      participantTrades[trade.participant_id].push(trade)
    })

    set({ trades: data || [], participantTrades })
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

  // Compute leaderboard with advanced metrics
  computeLeaderboard: () => {
    const { participants, participantTrades, holdings, dailySnapshots, config } = get()

    const leaderboard: LeaderboardEntry[] = participants
      .map((p) => {
        const trades = participantTrades[p.id] || []
        const participantHoldings = holdings[p.id] || []
        const participantSnapshots = dailySnapshots.filter(s => s.participant_id === p.id)

        // Basic metrics
        const totalTrades = trades.length
        const winningTrades = trades.filter(t => (t.realized_pnl || 0) > 0).length
        const losingTrades = trades.filter(t => (t.realized_pnl || 0) < 0).length
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

        // Fee calculation
        const totalFees = trades.reduce((sum, t) => sum + (t.fees || 0), 0)

        // P&L metrics
        const realizedPnls = trades.map(t => t.realized_pnl || 0).filter(pnl => pnl !== 0)
        const wins = realizedPnls.filter(pnl => pnl > 0)
        const losses = realizedPnls.filter(pnl => pnl < 0)

        const highestWin = wins.length > 0 ? Math.max(...wins) : 0
        const biggestLoss = losses.length > 0 ? Math.min(...losses) : 0

        // Gross profit/loss for profit factor
        const grossProfit = wins.reduce((sum, w) => sum + w, 0)
        const grossLoss = Math.abs(losses.reduce((sum, l) => sum + l, 0))
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

        // Trade size metrics
        const tradeSizes = trades.map(t => t.total_value)
        const avgTradeSize = tradeSizes.length > 0
          ? tradeSizes.reduce((sum, s) => sum + s, 0) / tradeSizes.length
          : 0

        // Long percentage (BUY trades)
        const buyTrades = trades.filter(t => t.trade_type === 'BUY').length
        const longPct = totalTrades > 0 ? (buyTrades / totalTrades) * 100 : 50

        // Expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
        const avgWin = wins.length > 0 ? wins.reduce((s, w) => s + w, 0) / wins.length : 0
        const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, l) => s + l, 0) / losses.length) : 0
        const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss)

        // Holdings metrics
        const openPositions = participantHoldings.length
        const holdingsValue = participantHoldings.reduce((sum, h) => sum + (h.market_value || 0), 0)
        const marginUsed = p.initial_capital > 0 ? (holdingsValue / p.initial_capital) * 100 : 0

        // Average hold time (simplified - based on trade frequency)
        const avgHoldTime = totalTrades > 1 && trades.length > 1
          ? calculateAvgHoldTime(trades)
          : 0

        // Sharpe Ratio calculation (simplified)
        // Sharpe = (Portfolio Return - Risk Free Rate) / Std Dev of Returns
        const returns = participantSnapshots.map(s => s.daily_change_pct || 0)
        const sharpeRatio = calculateSharpeRatio(returns, p.profit_loss_pct)

        // Max Drawdown from snapshots
        const maxDrawdown = calculateMaxDrawdown(participantSnapshots)

        // Daily change (from most recent snapshot)
        const sortedSnapshots = [...participantSnapshots].sort(
          (a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
        )
        const latestSnapshot = sortedSnapshots[0]
        const dailyChange = latestSnapshot?.daily_change || 0
        const dailyChangePct = latestSnapshot?.daily_change_pct || 0

        return {
          rank: p.rank || 0,
          participant: p,
          portfolioValue: p.portfolio_value,
          totalReturn: p.total_profit_loss,
          totalReturnPct: p.profit_loss_pct,
          dailyChange,
          dailyChangePct,
          winRate,
          totalTrades,
          totalFees,
          highestWin,
          biggestLoss,
          sharpeRatio,
          avgTradeSize,
          avgHoldTime,
          longPct,
          expectancy,
          profitFactor,
          maxDrawdown,
          openPositions,
          marginUsed
        }
      })
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
      set({ stats: null, extendedStats: null })
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

    // Extended stats
    const totalFees = trades.reduce((sum, t) => sum + (t.fees || 0), 0)
    const tradeSizes = trades.map(t => t.total_value)
    const avgTradeSize = tradeSizes.length > 0
      ? tradeSizes.reduce((s, t) => s + t, 0) / tradeSizes.length
      : 0
    const medianTradeSize = calculateMedian(tradeSizes)

    // Calculate hold times between consecutive trades per participant
    const holdTimes: number[] = []
    const participantTradesMap: Record<string, Trade[]> = {}
    trades.forEach(t => {
      if (!participantTradesMap[t.participant_id]) {
        participantTradesMap[t.participant_id] = []
      }
      participantTradesMap[t.participant_id].push(t)
    })

    Object.values(participantTradesMap).forEach(pTrades => {
      const sorted = pTrades.sort((a, b) =>
        new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime()
      )
      for (let i = 1; i < sorted.length; i++) {
        const diff = new Date(sorted[i].executed_at).getTime() - new Date(sorted[i-1].executed_at).getTime()
        holdTimes.push(diff / (1000 * 60 * 60)) // in hours
      }
    })

    const avgHoldTime = holdTimes.length > 0
      ? holdTimes.reduce((s, h) => s + h, 0) / holdTimes.length
      : 0
    const medianHoldTime = calculateMedian(holdTimes)

    const totalBuys = trades.filter(t => t.trade_type === 'BUY').length
    const totalSells = trades.filter(t => t.trade_type === 'SELL').length

    set({
      stats: {
        totalTrades,
        totalVolume,
        avgReturn,
        bestPerformer: sortedByReturn[0] || null,
        worstPerformer: sortedByReturn[sortedByReturn.length - 1] || null,
        mostActiveTrade: sortedByTrades[0] || null,
        highestSingleTrade: highestTrade
      },
      extendedStats: {
        totalTrades,
        totalVolume,
        avgReturn,
        bestPerformer: sortedByReturn[0] || null,
        worstPerformer: sortedByReturn[sortedByReturn.length - 1] || null,
        mostActiveTrade: sortedByTrades[0] || null,
        highestSingleTrade: highestTrade,
        totalFees,
        avgTradeSize,
        medianTradeSize,
        avgHoldTime,
        medianHoldTime,
        totalBuys,
        totalSells,
        avgConfidence: 0 // Would need AI decision data
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

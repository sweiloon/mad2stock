/**
 * Arena Daily Snapshot Cron Job
 * Captures daily portfolio values for all participants
 * Should run once daily at market close (5:30 PM MYT)
 *
 * Schedule on cron-job.org: 30 17 * * 1-5 (5:30 PM MYT, Mon-Fri)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { ArenaConfig, AIParticipant } from '@/lib/arena/types'

export const maxDuration = 60 // 1 minute timeout
export const dynamic = 'force-dynamic'

interface SnapshotResult {
  participantId: string
  participantName: string
  portfolioValue: number
  cashBalance: number
  holdingsValue: number
  dailyChange: number
  dailyChangePct: number
  cumulativeReturnPct: number
  success: boolean
  error?: string
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results: SnapshotResult[] = []
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  try {
    // Check if competition is active
    const { data: config, error: configError } = await supabase
      .from('arena_config')
      .select('*')
      .single() as { data: ArenaConfig | null, error: unknown }

    if (configError || !config) {
      return NextResponse.json({
        success: false,
        error: 'Competition config not found',
        timestamp: new Date().toISOString()
      })
    }

    const now = new Date()
    const startDate = new Date(config.start_date)
    const endDate = new Date(config.end_date)

    if (!config.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Competition is not active',
        timestamp: new Date().toISOString()
      })
    }

    if (now < startDate) {
      return NextResponse.json({
        success: false,
        error: `Competition starts on ${startDate.toISOString()}`,
        timestamp: new Date().toISOString()
      })
    }

    if (now > endDate) {
      return NextResponse.json({
        success: false,
        error: `Competition ended on ${endDate.toISOString()}`,
        timestamp: new Date().toISOString()
      })
    }

    // Check if snapshot already exists for today
    const { data: existingSnapshot } = await supabase
      .from('arena_daily_snapshots')
      .select('id')
      .eq('snapshot_date', today)
      .limit(1)

    if (existingSnapshot && existingSnapshot.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Snapshot already exists for ${today}`,
        timestamp: new Date().toISOString()
      })
    }

    // Get all active participants
    const { data: participants, error: participantsError } = await supabase
      .from('arena_participants')
      .select('*')
      .eq('status', 'active') as { data: AIParticipant[] | null, error: unknown }

    if (participantsError || !participants) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch participants',
        timestamp: new Date().toISOString()
      })
    }

    // Get yesterday's snapshots for daily change calculation
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: yesterdaySnapshots } = await supabase
      .from('arena_daily_snapshots')
      .select('participant_id, portfolio_value')
      .eq('snapshot_date', yesterdayStr) as { data: { participant_id: string, portfolio_value: number }[] | null }

    const yesterdayValues: Record<string, number> = {}
    yesterdaySnapshots?.forEach(s => {
      yesterdayValues[s.participant_id] = s.portfolio_value
    })

    // Create snapshot for each participant
    for (const participant of participants) {
      try {
        // Get current holdings
        const { data: holdings } = await supabase
          .from('arena_holdings')
          .select('market_value')
          .eq('participant_id', participant.id) as { data: { market_value: number }[] | null }

        const holdingsValue = holdings?.reduce((sum, h) => sum + (h.market_value || 0), 0) || 0
        const portfolioValue = participant.current_capital + holdingsValue
        const cashBalance = participant.current_capital

        // Calculate daily change
        const previousValue = yesterdayValues[participant.id] || participant.initial_capital
        const dailyChange = portfolioValue - previousValue
        const dailyChangePct = previousValue > 0 ? (dailyChange / previousValue) * 100 : 0

        // Calculate cumulative return
        const cumulativeReturnPct = ((portfolioValue - participant.initial_capital) / participant.initial_capital) * 100

        // Insert snapshot
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('arena_daily_snapshots')
          .insert({
            participant_id: participant.id,
            snapshot_date: today,
            portfolio_value: portfolioValue,
            cash_balance: cashBalance,
            holdings_value: holdingsValue,
            daily_change: dailyChange,
            daily_change_pct: dailyChangePct,
            cumulative_return_pct: cumulativeReturnPct
          })

        if (insertError) {
          results.push({
            participantId: participant.id,
            participantName: participant.display_name,
            portfolioValue,
            cashBalance,
            holdingsValue,
            dailyChange,
            dailyChangePct,
            cumulativeReturnPct,
            success: false,
            error: insertError.message
          })
        } else {
          // Update participant's portfolio_value and profit_loss fields
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('arena_participants')
            .update({
              portfolio_value: portfolioValue,
              total_profit_loss: portfolioValue - participant.initial_capital,
              profit_loss_pct: cumulativeReturnPct
            })
            .eq('id', participant.id)

          results.push({
            participantId: participant.id,
            participantName: participant.display_name,
            portfolioValue,
            cashBalance,
            holdingsValue,
            dailyChange,
            dailyChangePct,
            cumulativeReturnPct,
            success: true
          })
        }
      } catch (err) {
        results.push({
          participantId: participant.id,
          participantName: participant.display_name,
          portfolioValue: 0,
          cashBalance: 0,
          holdingsValue: 0,
          dailyChange: 0,
          dailyChangePct: 0,
          cumulativeReturnPct: 0,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Update rankings based on portfolio value
    const { data: sortedParticipants } = await supabase
      .from('arena_participants')
      .select('id, portfolio_value')
      .eq('status', 'active')
      .order('portfolio_value', { ascending: false }) as { data: { id: string, portfolio_value: number }[] | null }

    if (sortedParticipants) {
      for (let i = 0; i < sortedParticipants.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('arena_participants')
          .update({ rank: i + 1 })
          .eq('id', sortedParticipants[i].id)
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      date: today,
      snapshotsCreated: successCount,
      snapshotsFailed: failCount,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Arena snapshot error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

// Type for participant
interface Participant {
  id: string
  current_capital: number
  initial_capital: number
}

// Type for snapshot
interface Snapshot {
  participant_id: string
  portfolio_value: number
}

// GET /api/arena/snapshot - Get daily snapshots for charting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participant_id')
    const days = parseInt(searchParams.get('days') || '30')

    const supabase = createAdminClient() as any

    let query = supabase
      .from('arena_daily_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: true })
      .limit(days)

    if (participantId) {
      query = query.eq('participant_id', participantId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching snapshots:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ snapshots: data })
  } catch (err) {
    console.error('Snapshots API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    )
  }
}

// POST /api/arena/snapshot - Create daily snapshot (cron job - runs daily at market close)
export async function POST(request: Request) {
  try {
    // Verify admin secret
    const authHeader = request.headers.get('authorization')
    const isVercel = request.headers.get('x-vercel-cron') === '1'
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

    if (!isVercel && authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient() as any

    // Check if competition is active
    const { data: config } = await supabase
      .from('arena_config')
      .select('*')
      .single()

    if (!config?.is_active) {
      return NextResponse.json({ message: 'Competition not active' })
    }

    const now = new Date()
    const startDate = new Date(config.start_date)
    const endDate = new Date(config.end_date)

    if (now < startDate || now > endDate) {
      return NextResponse.json({ message: 'Outside competition period' })
    }

    // Get today's date in Malaysia timezone
    const today = format(
      new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })),
      'yyyy-MM-dd'
    )

    // Check if snapshot already exists for today
    const { data: existing } = await supabase
      .from('arena_daily_snapshots')
      .select('id')
      .eq('snapshot_date', today)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        message: 'Snapshot already exists for today',
        date: today
      })
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from('arena_participants')
      .select('*') as { data: Participant[] | null, error: any }

    if (participantsError || !participants) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }

    // Get yesterday's snapshots for daily change calculation
    const yesterday = format(
      new Date(now.getTime() - 24 * 60 * 60 * 1000),
      'yyyy-MM-dd'
    )

    const { data: yesterdaySnapshots } = await supabase
      .from('arena_daily_snapshots')
      .select('*')
      .eq('snapshot_date', yesterday) as { data: Snapshot[] | null }

    const yesterdayMap = new Map(
      (yesterdaySnapshots || []).map((s: Snapshot) => [s.participant_id, s])
    )

    // Create snapshots for each participant
    const snapshots = []
    for (const participant of participants) {
      // Get holdings value
      const { data: holdings } = await supabase
        .from('arena_holdings')
        .select('market_value')
        .eq('participant_id', participant.id) as { data: { market_value: number }[] | null }

      const holdingsValue = holdings?.reduce((sum: number, h: { market_value: number }) => sum + (h.market_value || 0), 0) || 0
      const portfolioValue = participant.current_capital + holdingsValue

      // Calculate daily change
      const yesterdaySnapshot = yesterdayMap.get(participant.id) as Snapshot | undefined
      const dailyChange = yesterdaySnapshot
        ? portfolioValue - yesterdaySnapshot.portfolio_value
        : 0
      const dailyChangePct = yesterdaySnapshot && yesterdaySnapshot.portfolio_value > 0
        ? (dailyChange / yesterdaySnapshot.portfolio_value) * 100
        : 0

      // Calculate cumulative return
      const cumulativeReturnPct = ((portfolioValue - participant.initial_capital) / participant.initial_capital) * 100

      snapshots.push({
        participant_id: participant.id,
        snapshot_date: today,
        portfolio_value: portfolioValue,
        cash_balance: participant.current_capital,
        holdings_value: holdingsValue,
        daily_change: dailyChange,
        daily_change_pct: dailyChangePct,
        cumulative_return_pct: cumulativeReturnPct
      })
    }

    // Insert all snapshots
    const { data, error } = await supabase
      .from('arena_daily_snapshots')
      .insert(snapshots)
      .select()

    if (error) {
      console.error('Error creating snapshots:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      date: today,
      snapshotsCreated: data?.length || 0
    })

  } catch (err) {
    console.error('Snapshot creation error:', err)
    return NextResponse.json(
      { error: 'Failed to create snapshots' },
      { status: 500 }
    )
  }
}

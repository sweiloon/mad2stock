import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// GET /api/signals - Fetch signals with filters
// ============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const signalType = searchParams.get('type') // BUY, SELL, HOLD
    const status = searchParams.get('status') || 'active' // active, expired, hit_target, etc.
    const sector = searchParams.get('sector')
    const stockCode = searchParams.get('stock')
    const strength = searchParams.get('strength') // Strong, Moderate, Weak
    const timeHorizon = searchParams.get('horizon') // Intraday, Short-term, etc.
    const minConfidence = searchParams.get('minConfidence')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'generated_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    let query = supabase
      .from('signals')
      .select('*', { count: 'exact' })

    // Apply filters
    if (signalType && signalType !== 'all') {
      query = query.eq('signal_type', signalType.toUpperCase())
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (sector && sector !== 'all') {
      query = query.eq('sector', sector)
    }

    if (stockCode) {
      query = query.eq('stock_code', stockCode.toUpperCase())
    }

    if (strength && strength !== 'all') {
      query = query.eq('strength', strength)
    }

    if (timeHorizon && timeHorizon !== 'all') {
      query = query.eq('time_horizon', timeHorizon)
    }

    if (minConfidence) {
      query = query.gte('confidence_level', parseInt(minConfidence))
    }

    // Apply sorting
    const validSortFields = ['generated_at', 'confidence_level', 'potential_gain_pct', 'stock_code']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'generated_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: signals, error, count } = await query

    if (error) {
      console.error('[Signals API] Query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch signals' },
        { status: 500 }
      )
    }

    // Get signal sources for each signal
    const signalIds = signals?.map(s => s.id) || []
    let sources: any[] = []

    if (signalIds.length > 0) {
      const { data: sourcesData } = await supabase
        .from('signal_sources')
        .select('*')
        .in('signal_id', signalIds)

      sources = sourcesData || []
    }

    // Attach sources to signals
    const signalsWithSources = signals?.map(signal => ({
      ...signal,
      sources: sources.filter(s => s.signal_id === signal.id)
    }))

    return NextResponse.json({
      success: true,
      data: signalsWithSources,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('[Signals API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/signals/stats - Get signal statistics
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === 'stats') {
      const supabase = getSupabaseClient()

      // Get counts by signal type
      const { data: typeCounts } = await supabase
        .from('signals')
        .select('signal_type')
        .eq('status', 'active')

      // Get counts by status
      const { data: statusCounts } = await supabase
        .from('signals')
        .select('status')

      // Get performance stats
      const { data: performance } = await supabase
        .from('signal_performance')
        .select('*')
        .eq('period', 'all_time')
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

      // Calculate stats
      const stats = {
        totalActive: typeCounts?.length || 0,
        byType: {
          BUY: typeCounts?.filter(s => s.signal_type === 'BUY').length || 0,
          SELL: typeCounts?.filter(s => s.signal_type === 'SELL').length || 0,
          HOLD: typeCounts?.filter(s => s.signal_type === 'HOLD').length || 0,
        },
        byStatus: {
          active: statusCounts?.filter(s => s.status === 'active').length || 0,
          hit_target: statusCounts?.filter(s => s.status === 'hit_target').length || 0,
          hit_stoploss: statusCounts?.filter(s => s.status === 'hit_stoploss').length || 0,
          expired: statusCounts?.filter(s => s.status === 'expired').length || 0,
        },
        performance: performance || null
      }

      return NextResponse.json({ success: true, stats })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Signals Stats API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

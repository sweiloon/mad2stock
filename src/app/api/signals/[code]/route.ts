import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// GET /api/signals/[code] - Get signals for a specific stock
// ============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const stockCode = code.toUpperCase()
    const supabase = getSupabaseClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build query
    let query = supabase
      .from('signals')
      .select('*')
      .eq('stock_code', stockCode)
      .order('generated_at', { ascending: false })
      .limit(limit)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: signals, error } = await query

    if (error) {
      console.error(`[Signals API] Error fetching signals for ${stockCode}:`, error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch signals' },
        { status: 500 }
      )
    }

    // Get sources for these signals
    const signalIds = signals?.map(s => s.id) || []
    let sources: any[] = []

    if (signalIds.length > 0) {
      const { data: sourcesData } = await supabase
        .from('signal_sources')
        .select('*')
        .in('signal_id', signalIds)
        .order('influence_weight', { ascending: false })

      sources = sourcesData || []
    }

    // Attach sources to signals
    const signalsWithSources = signals?.map(signal => ({
      ...signal,
      sources: sources.filter(s => s.signal_id === signal.id)
    }))

    // Get latest active signal summary
    const latestActive = signals?.find(s => s.status === 'active')

    return NextResponse.json({
      success: true,
      stockCode,
      latestSignal: latestActive || null,
      signals: signalsWithSources,
      total: signals?.length || 0
    })

  } catch (error) {
    console.error('[Signals API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

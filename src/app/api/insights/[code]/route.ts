import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
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

    if (!code) {
      return NextResponse.json(
        { error: 'Stock code is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Get the latest insight for this company
    const { data: insight, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('stock_code', code.toUpperCase())
      .order('market_date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching insight:', error)
      return NextResponse.json(
        { error: 'Failed to fetch insights' },
        { status: 500 }
      )
    }

    if (!insight) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No insights available yet. Insights are generated daily after market close.'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: insight.summary,
        insights: insight.insights || [],
        outlook: insight.outlook,
        keyMetric: insight.key_metric,
        generatedAt: insight.generated_at,
        marketDate: insight.market_date,
      }
    })
  } catch (error) {
    console.error('Error in insights API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch insights', details: errorMessage },
      { status: 500 }
    )
  }
}

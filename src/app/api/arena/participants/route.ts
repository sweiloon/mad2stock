import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/arena/participants - Get all AI participants
export async function GET() {
  try {
    const supabase = createAdminClient() as any

    const { data, error } = await supabase
      .from('arena_participants')
      .select('*')
      .order('rank', { ascending: true })

    if (error) {
      console.error('Error fetching participants:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ participants: data })
  } catch (err) {
    console.error('Participants API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}

// POST /api/arena/participants - Initialize participants (admin only)
export async function POST(request: Request) {
  try {
    // Verify admin secret
    const authHeader = request.headers.get('authorization')
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient() as any

    // Check if participants already exist
    const { data: existing } = await supabase
      .from('arena_participants')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { message: 'Participants already initialized', count: existing.length }
      )
    }

    // Insert initial participants
    const participants = [
      { model_name: 'claude-3-opus', model_provider: 'Anthropic', display_name: 'Claude', avatar_color: '#FF6B35' },
      { model_name: 'gpt-4-turbo', model_provider: 'OpenAI', display_name: 'GPT-4', avatar_color: '#10A37F' },
      { model_name: 'gemini-pro', model_provider: 'Google', display_name: 'Gemini', avatar_color: '#4285F4' },
      { model_name: 'mistral-large', model_provider: 'Mistral', display_name: 'Mistral', avatar_color: '#FF7000' },
      { model_name: 'llama-3-70b', model_provider: 'Meta', display_name: 'Llama', avatar_color: '#0668E1' },
      { model_name: 'grok-1', model_provider: 'xAI', display_name: 'Grok', avatar_color: '#1DA1F2' }
    ]

    const { data, error } = await (supabase as any)
      .from('arena_participants')
      .insert(participants)
      .select()

    if (error) {
      console.error('Error initializing participants:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Participants initialized successfully',
      participants: data
    })
  } catch (err) {
    console.error('Initialize participants error:', err)
    return NextResponse.json(
      { error: 'Failed to initialize participants' },
      { status: 500 }
    )
  }
}

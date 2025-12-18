import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client with service role for auto-confirming users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get user by email using admin API
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { success: false, error: 'Failed to find user' },
        { status: 500 }
      )
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already confirmed
    if (user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: 'Email already confirmed',
        confirmed: true
      })
    }

    // Auto-confirm the user's email using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('Error confirming user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to confirm email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmed successfully',
      confirmed: true
    })

  } catch (error) {
    console.error('Confirm email error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

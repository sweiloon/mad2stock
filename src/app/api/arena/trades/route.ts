import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/arena/trades - Get trade history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participant_id')
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = createAdminClient() as any

    let query = supabase
      .from('arena_trades')
      .select(`
        *,
        participant:arena_participants(id, display_name, avatar_color, mode_code)
      `)
      .order('executed_at', { ascending: false })
      .limit(limit)

    if (participantId) {
      query = query.eq('participant_id', participantId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching trades:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trades: data })
  } catch (err) {
    console.error('Trades API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

// Participant type
interface Participant {
  id: string
  current_capital: number
  total_trades: number
  winning_trades: number
  total_profit_loss: number
}

// Holding type
interface Holding {
  id: string
  quantity: number
  avg_buy_price: number
  market_value: number
}

// POST /api/arena/trades - Execute a trade (admin/cron only)
export async function POST(request: Request) {
  try {
    // Verify admin secret
    const authHeader = request.headers.get('authorization')
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      participant_id,
      stock_code,
      stock_name,
      trade_type,
      quantity,
      price,
      reasoning
    } = body

    // Validate required fields
    if (!participant_id || !stock_code || !trade_type || !quantity || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient() as any

    // Get current participant data
    const { data: participant, error: participantError } = await supabase
      .from('arena_participants')
      .select('*')
      .eq('id', participant_id)
      .single() as { data: Participant | null, error: any }

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    const total_value = quantity * price
    const fees = total_value * 0.0015 // 0.15% trading fee
    let realized_pnl: number | null = null

    if (trade_type === 'BUY') {
      // Check sufficient capital
      const required = total_value + fees
      if (required > participant.current_capital) {
        return NextResponse.json(
          { error: 'Insufficient capital' },
          { status: 400 }
        )
      }

      // Update holding
      const { data: existingHolding } = await supabase
        .from('arena_holdings')
        .select('*')
        .eq('participant_id', participant_id)
        .eq('stock_code', stock_code)
        .single() as { data: Holding | null }

      if (existingHolding) {
        // Update existing holding
        const new_quantity = existingHolding.quantity + quantity
        const new_avg_price = (
          (existingHolding.avg_buy_price * existingHolding.quantity) +
          (price * quantity)
        ) / new_quantity

        await supabase
          .from('arena_holdings')
          .update({
            quantity: new_quantity,
            avg_buy_price: new_avg_price,
            current_price: price,
            market_value: new_quantity * price,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingHolding.id)
      } else {
        // Create new holding
        await supabase
          .from('arena_holdings')
          .insert({
            participant_id,
            stock_code,
            stock_name,
            quantity,
            avg_buy_price: price,
            current_price: price,
            market_value: quantity * price
          })
      }

      // Update participant capital
      await supabase
        .from('arena_participants')
        .update({
          current_capital: participant.current_capital - required,
          total_trades: participant.total_trades + 1,
          last_trade_at: new Date().toISOString()
        })
        .eq('id', participant_id)

    } else if (trade_type === 'SELL') {
      // Get current holding
      const { data: holding, error: holdingError } = await supabase
        .from('arena_holdings')
        .select('*')
        .eq('participant_id', participant_id)
        .eq('stock_code', stock_code)
        .single() as { data: Holding | null, error: any }

      if (holdingError || !holding) {
        return NextResponse.json(
          { error: 'No holding found for this stock' },
          { status: 400 }
        )
      }

      if (quantity > holding.quantity) {
        return NextResponse.json(
          { error: 'Insufficient shares' },
          { status: 400 }
        )
      }

      // Calculate realized P&L
      realized_pnl = (price - holding.avg_buy_price) * quantity - fees
      const isWinningTrade = realized_pnl > 0

      // Update or delete holding
      const remaining = holding.quantity - quantity
      if (remaining === 0) {
        await supabase
          .from('arena_holdings')
          .delete()
          .eq('id', holding.id)
      } else {
        await supabase
          .from('arena_holdings')
          .update({
            quantity: remaining,
            market_value: remaining * price,
            updated_at: new Date().toISOString()
          })
          .eq('id', holding.id)
      }

      // Update participant
      const proceeds = total_value - fees
      await supabase
        .from('arena_participants')
        .update({
          current_capital: participant.current_capital + proceeds,
          total_trades: participant.total_trades + 1,
          winning_trades: participant.winning_trades + (isWinningTrade ? 1 : 0),
          total_profit_loss: participant.total_profit_loss + realized_pnl,
          last_trade_at: new Date().toISOString()
        })
        .eq('id', participant_id)
    }

    // Record the trade
    const { data: trade, error: tradeError } = await supabase
      .from('arena_trades')
      .insert({
        participant_id,
        stock_code,
        stock_name,
        trade_type,
        quantity,
        price,
        total_value,
        fees,
        realized_pnl,
        reasoning
      })
      .select()
      .single()

    if (tradeError) {
      console.error('Error recording trade:', tradeError)
      return NextResponse.json({ error: tradeError.message }, { status: 500 })
    }

    // Recalculate portfolio value
    await updatePortfolioValue(supabase, participant_id)

    return NextResponse.json({
      success: true,
      trade,
      realized_pnl
    })
  } catch (err) {
    console.error('Trade execution error:', err)
    return NextResponse.json(
      { error: 'Failed to execute trade' },
      { status: 500 }
    )
  }
}

async function updatePortfolioValue(supabase: any, participantId: string) {
  // Get current capital
  const { data: participant } = await supabase
    .from('arena_participants')
    .select('current_capital, initial_capital')
    .eq('id', participantId)
    .single()

  // Get holdings value
  const { data: holdings } = await supabase
    .from('arena_holdings')
    .select('market_value')
    .eq('participant_id', participantId)

  const holdingsValue = holdings?.reduce((sum: number, h: any) => sum + h.market_value, 0) || 0
  const portfolioValue = participant.current_capital + holdingsValue
  const totalProfitLoss = portfolioValue - participant.initial_capital
  const profitLossPct = (totalProfitLoss / participant.initial_capital) * 100

  await supabase
    .from('arena_participants')
    .update({
      portfolio_value: portfolioValue,
      total_profit_loss: totalProfitLoss,
      profit_loss_pct: profitLossPct
    })
    .eq('id', participantId)
}

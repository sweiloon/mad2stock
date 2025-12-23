/**
 * Mad2Arena - Trading Session Cron
 *
 * Triggers AI trading sessions for all participants
 * Schedule: Every hour during market hours (9am-5pm MYT, Mon-Fri)
 *
 * Endpoints:
 * - GET: For cron-job.org (uses ?secret= query param)
 * - POST: For Vercel cron (uses Bearer token or x-vercel-cron header)
 */

import { NextResponse } from 'next/server'
import { runTradingSession } from '@/lib/arena/engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for AI calls

// Validate cron request
function validateCronRequest(request: Request): boolean {
  // Check Vercel cron header
  if (request.headers.get('x-vercel-cron') === '1') return true

  // Check Bearer token in Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true

  // Check secret in query param (for cron-job.org)
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret === process.env.CRON_SECRET) return true

  return false
}

// GET - Support cron-job.org
export async function GET(request: Request) {
  return handleTradingSession(request)
}

// POST - Support Vercel cron
export async function POST(request: Request) {
  return handleTradingSession(request)
}

async function handleTradingSession(request: Request) {
  try {
    // Verify authorization
    if (!validateCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse options from query params
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'
    const singleModel = url.searchParams.get('model') || undefined

    console.log(`[Arena Trading] Starting session - dryRun: ${dryRun}, model: ${singleModel || 'all'}`)

    // Run trading session
    const report = await runTradingSession({
      dryRun,
      singleModel
    })

    // Log summary
    console.log(`[Arena Trading] Session complete:`)
    console.log(`  - Market open: ${report.marketHours}`)
    console.log(`  - Competition active: ${report.competitionActive}`)
    console.log(`  - Models processed: ${report.modelsProcessed}`)
    console.log(`  - Trades executed: ${report.tradesExecuted}`)
    console.log(`  - Tokens used: ${report.totalTokensUsed}`)

    if (report.errors.length > 0) {
      console.log(`  - Errors: ${report.errors.join(', ')}`)
    }

    // Return report
    return NextResponse.json({
      success: report.errors.length === 0 || report.modelsProcessed > 0,
      timestamp: report.timestamp.toISOString(),
      summary: {
        marketHours: report.marketHours,
        competitionActive: report.competitionActive,
        modelsProcessed: report.modelsProcessed,
        tradesExecuted: report.tradesExecuted,
        totalTokensUsed: report.totalTokensUsed
      },
      results: report.results.map(r => ({
        model: r.modelName,
        success: r.success,
        sentiment: r.sentiment,
        trades: r.tradesExecuted,
        tokens: r.tokensUsed,
        latencyMs: r.latencyMs,
        error: r.error
      })),
      errors: report.errors
    })

  } catch (err) {
    console.error('[Arena Trading] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Trading session failed' },
      { status: 500 }
    )
  }
}

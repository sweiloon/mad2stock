/**
 * Mad2Arena - AI Provider Test Endpoint
 * Tests all 7 AI providers with a simple prompt
 * DELETE THIS AFTER TESTING
 */

import { NextResponse } from 'next/server'
import { AI_MODELS } from '@/lib/arena/types'
import { getProvider } from '@/lib/arena/ai/router'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Simple test prompt
const TEST_SYSTEM = 'You are a helpful assistant. Respond briefly.'
const TEST_PROMPT = 'Say "Hello from [your model name]" in exactly one sentence.'

export async function GET(request: Request) {
  // Verify secret
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{
    model: string
    provider: string
    available: boolean
    success?: boolean
    response?: string
    tokensUsed?: number
    latencyMs?: number
    error?: string
  }> = []

  for (const config of AI_MODELS) {
    const provider = getProvider(config.id)

    if (!provider.isAvailable()) {
      results.push({
        model: config.name,
        provider: config.provider,
        available: false,
        error: `Missing env: ${config.apiKeyEnvVar}`
      })
      continue
    }

    try {
      const response = await provider.chat(TEST_SYSTEM, TEST_PROMPT)

      results.push({
        model: config.name,
        provider: config.provider,
        available: true,
        success: response.success,
        response: response.content.substring(0, 100),
        tokensUsed: response.tokensUsed,
        latencyMs: response.latencyMs,
        error: response.error
      })
    } catch (err) {
      results.push({
        model: config.name,
        provider: config.provider,
        available: true,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  const summary = {
    total: results.length,
    available: results.filter(r => r.available).length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => r.available && !r.success).length
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary,
    results
  })
}

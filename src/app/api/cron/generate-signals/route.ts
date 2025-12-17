import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import {
  SIGNAL_AGENT_SYSTEM_PROMPT,
  buildSignalPrompt,
  generateSignalCode,
  validateSignalOutput,
  type SignalInputData,
  type SignalOutput
} from '@/lib/prompts/signal-agent'

// ============================================================================
// CONFIGURATION
// ============================================================================

// Process 2 stocks per cron run (AI calls take ~5-8s each)
// 2 stocks × ~8s = ~16s (safe for 30s timeout)
const STOCKS_PER_RUN = 2

// Model selection
const AI_MODEL = 'gpt-4o-mini'

// Signal generation criteria
const MIN_PRICE_CHANGE_PCT = 3 // Minimum % change to trigger signal evaluation
const MIN_VOLUME_RATIO = 1.5 // Minimum volume vs average to trigger evaluation

// ============================================================================
// INITIALIZATION
// ============================================================================

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

function validateRequest(request: NextRequest): boolean {
  // Vercel cron header
  const vercelCronHeader = request.headers.get('x-vercel-cron')
  if (vercelCronHeader) return true

  // Manual trigger with CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    return token === process.env.CRON_SECRET
  }

  // Query param for cron-job.org
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret && secret === process.env.CRON_SECRET) return true

  // Development mode
  if (process.env.NODE_ENV === 'development') return true

  return false
}

// ============================================================================
// CANDIDATE SELECTION
// ============================================================================

interface StockCandidate {
  code: string          // Text code (MAYBANK) for signals
  numeric_code: string  // Numeric code (1155) for stock_prices lookup
  name: string
  sector: string
  price: number | null
  change_percent: number | null
  volume: number | null
  avg_volume: number | null
  priority_score: number
}

async function selectCandidates(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  limit: number
): Promise<StockCandidate[]> {
  // Get stocks with significant price movement or volume
  const { data: stocks, error } = await supabase
    .from('stock_prices')
    .select('stock_code, price, change_percent, volume')
    .not('price', 'is', null)
    .order('updated_at', { ascending: false })

  if (error || !stocks) {
    console.error('[Signal Gen] Failed to fetch stock candidates:', error)
    return []
  }

  // Get all numeric codes from stock_prices
  const numericCodes = stocks.map((s: any) => s.stock_code)

  // Lookup companies by numeric_code
  const { data: companies } = await supabase
    .from('companies')
    .select('code, name, sector, numeric_code')
    .in('numeric_code', numericCodes)

  // Create a map for quick lookup (numeric_code -> company info)
  const companyMap = new Map<string, { code: string; name: string; sector: string; numeric_code: string }>()
  companies?.forEach((c: any) => {
    companyMap.set(c.numeric_code, { code: c.code, name: c.name, sector: c.sector, numeric_code: c.numeric_code })
  })

  // Score and rank candidates
  const candidates = stocks
    .map((stock: any) => {
      let score = 0
      const company = companyMap.get(stock.stock_code)

      // Skip if no matching company found
      if (!company) return null

      // Price change scoring
      const changeAbs = Math.abs(stock.change_percent || 0)
      if (changeAbs >= 5) score += 30
      else if (changeAbs >= 3) score += 20
      else if (changeAbs >= 1) score += 10

      // Volume scoring (would need avg_volume data)
      // For now, use raw volume as proxy
      if (stock.volume > 10000000) score += 20
      else if (stock.volume > 1000000) score += 10

      // Negative change gets slight priority (potential buying opportunity)
      if (stock.change_percent && stock.change_percent < -3) score += 5

      return {
        code: company.code, // Use text code (MAYBANK) for signals
        numeric_code: company.numeric_code, // Use for stock_prices lookup
        name: company.name,
        sector: company.sector || 'Unknown',
        price: stock.price,
        change_percent: stock.change_percent,
        volume: stock.volume,
        avg_volume: null as number | null, // Would need historical data
        priority_score: score
      }
    })
    .filter((c): c is StockCandidate => c !== null && c.priority_score > 0)
    .sort((a, b) => b.priority_score - a.priority_score)

  // Check for existing active signals to avoid duplicates
  const topCodes = candidates.slice(0, limit * 3).map(c => c.code)

  if (topCodes.length === 0) return []

  const { data: existingSignals } = await supabase
    .from('signals')
    .select('stock_code')
    .in('stock_code', topCodes)
    .eq('status', 'active')
    .gte('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const existingCodes = new Set(existingSignals?.map(s => s.stock_code) || [])

  // Filter out stocks with recent signals
  return candidates
    .filter(c => !existingCodes.has(c.code))
    .slice(0, limit)
}

// ============================================================================
// DATA GATHERING
// ============================================================================

async function gatherStockData(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  candidate: StockCandidate
): Promise<SignalInputData> {
  // Get stock price data (use numeric_code for stock_prices table)
  const { data: priceData } = await supabase
    .from('stock_prices')
    .select('*')
    .eq('stock_code', candidate.numeric_code)
    .single()

  // Get YoY analysis
  const { data: yoyData } = await supabase
    .from('yoy_analysis')
    .select('*')
    .eq('stock_code', candidate.code)
    .order('quarter', { ascending: false })
    .limit(1)
    .single()

  // Get QoQ analysis
  const { data: qoqData } = await supabase
    .from('qoq_analysis')
    .select('*')
    .eq('stock_code', candidate.code)
    .order('quarter', { ascending: false })
    .limit(1)
    .single()

  // Get AI Insights (from daily cache)
  const { data: aiInsight } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('stock_code', candidate.code)
    .order('market_date', { ascending: false })
    .limit(1)
    .single()

  // Get recent news (if available)
  const { data: news } = await supabase
    .from('market_news')
    .select('title, summary, sentiment, published_at')
    .contains('related_stocks', [candidate.code])
    .order('published_at', { ascending: false })
    .limit(5)

  // Build input data
  const inputData: SignalInputData = {
    stockCode: candidate.code,
    companyName: candidate.name,
    sector: candidate.sector,

    // Price data
    currentPrice: priceData?.price || candidate.price,
    priceChange: priceData?.change || null,
    priceChangePercent: priceData?.change_percent || candidate.change_percent,
    volume: priceData?.volume || candidate.volume,
    avgVolume: candidate.avg_volume,
    previousClose: priceData?.previous_close || null,
    high52Week: priceData?.high_52_week || null,
    low52Week: priceData?.low_52_week || null,

    // Fundamental data
    revenue: yoyData?.revenue || qoqData?.revenue || null,
    profit: yoyData?.profit || qoqData?.profit || null,
    revenueYoY: yoyData?.revenue_yoy_pct || null,
    profitYoY: yoyData?.profit_yoy_pct || null,
    revenueQoQ: qoqData?.revenue_qoq_pct || null,
    profitQoQ: qoqData?.profit_qoq_pct || null,
    peRatio: priceData?.pe_ratio || null,
    pbRatio: priceData?.pb_ratio || null,
    dividendYield: priceData?.dividend_yield || null,
    marketCap: priceData?.market_cap || null,

    // Performance category
    yoyCategory: yoyData?.category || null,
    qoqCategory: qoqData?.category || null,

    // AI Insights
    aiInsight: aiInsight ? {
      summary: aiInsight.summary,
      insights: aiInsight.insights || [],
      outlook: aiInsight.outlook,
      keyMetric: aiInsight.key_metric
    } : null,

    // News
    recentNews: news?.map(n => ({
      title: n.title,
      summary: n.summary,
      sentiment: n.sentiment,
      date: n.published_at ? new Date(n.published_at).toLocaleDateString() : undefined
    })) || [],

    // Market context (placeholder - could be enhanced)
    marketSentiment: 'Neutral',
    sectorTrend: 'Unknown'
  }

  return inputData
}

// ============================================================================
// SIGNAL GENERATION
// ============================================================================

async function generateSignal(
  openai: OpenAI,
  inputData: SignalInputData
): Promise<SignalOutput | null> {
  const startTime = Date.now()

  try {
    const userPrompt = buildSignalPrompt(inputData)

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SIGNAL_AGENT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)

    const validated = validateSignalOutput(parsed)

    if (validated) {
      console.log(`[Signal Gen] Generated ${validated.signal_type} signal for ${inputData.stockCode} (${validated.confidence_level}% confidence) in ${Date.now() - startTime}ms`)
    }

    return validated

  } catch (error) {
    console.error(`[Signal Gen] Failed to generate signal for ${inputData.stockCode}:`, error)
    return null
  }
}

// ============================================================================
// SAVE SIGNAL
// ============================================================================

async function saveSignal(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  inputData: SignalInputData,
  signal: SignalOutput
): Promise<{ success: boolean; error?: string }> {
  try {
    const signalCode = generateSignalCode(inputData.stockCode)

    // Calculate valid_until based on time horizon
    const validUntilDays: Record<string, number> = {
      'Intraday': 1,
      'Short-term': 7,
      'Medium-term': 30,
      'Long-term': 90
    }
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (validUntilDays[signal.time_horizon] || 7))

    // Insert signal
    const { data: savedSignal, error: signalError } = await supabase
      .from('signals')
      .insert({
        signal_code: signalCode,
        stock_code: inputData.stockCode,
        company_name: inputData.companyName,
        sector: inputData.sector,

        signal_type: signal.signal_type,
        confidence_level: signal.confidence_level,
        strength: signal.strength,

        entry_price: signal.entry_price,
        target_price: signal.target_price,
        stop_loss: signal.stop_loss,
        current_price: inputData.currentPrice,
        potential_gain_pct: signal.potential_gain_pct,
        risk_reward_ratio: signal.risk_reward_ratio,

        time_horizon: signal.time_horizon,
        valid_until: validUntil.toISOString(),

        summary: signal.summary,
        reasoning: signal.reasoning,
        key_catalysts: signal.key_catalysts,
        risks: signal.risks,

        sources_used: {
          technical: signal.sources?.filter(s => s.type === 'technical_indicator') || [],
          fundamental: signal.sources?.filter(s => s.type === 'fundamental_data') || [],
          ai_insight: signal.sources?.filter(s => s.type === 'ai_insight') || [],
          news: signal.sources?.filter(s => s.type === 'news') || [],
          other: signal.sources?.filter(s => !['technical_indicator', 'fundamental_data', 'ai_insight', 'news'].includes(s.type)) || []
        },
        data_quality_score: signal.data_quality_score,

        ai_model: AI_MODEL,
        status: 'active',
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (signalError) {
      console.error(`[Signal Gen] Failed to save signal for ${inputData.stockCode}:`, signalError)
      return { success: false, error: signalError.message }
    }

    // Insert detailed sources
    if (savedSignal && signal.sources && signal.sources.length > 0) {
      const sourcesToInsert = signal.sources.map(source => ({
        signal_id: savedSignal.id,
        source_type: source.type,
        source_name: source.name,
        source_value: source.value,
        interpretation: source.interpretation,
        influence_weight: source.influence_weight
      }))

      const { error: sourcesError } = await supabase
        .from('signal_sources')
        .insert(sourcesToInsert)

      if (sourcesError) {
        console.warn(`[Signal Gen] Failed to save sources for ${inputData.stockCode}:`, sourcesError)
      }
    }

    return { success: true }

  } catch (error) {
    console.error(`[Signal Gen] Error saving signal for ${inputData.stockCode}:`, error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Validate request
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const singleCode = url.searchParams.get('code') // For testing single stock
  const forceGenerate = url.searchParams.get('force') === 'true'

  // Initialize clients
  let openai: OpenAI
  let supabase: ReturnType<typeof getSupabaseAdmin>

  try {
    openai = getOpenAIClient()
  } catch (error) {
    console.error('[Signal Gen] OpenAI not configured:', error)
    return NextResponse.json(
      { error: 'AI service not configured', details: 'OPENAI_API_KEY missing' },
      { status: 503 }
    )
  }

  try {
    supabase = getSupabaseAdmin()
  } catch (error) {
    console.error('[Signal Gen] Supabase not configured:', error)
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  // Single stock mode (for testing)
  if (singleCode) {
    console.log(`[Signal Gen] Processing single stock: ${singleCode}`)

    const { data: company } = await supabase
      .from('companies')
      .select('code, name, sector, numeric_code')
      .eq('code', singleCode.toUpperCase())
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (!company.numeric_code) {
      return NextResponse.json({ error: 'Company has no numeric_code mapping' }, { status: 400 })
    }

    const candidate: StockCandidate = {
      code: company.code,
      numeric_code: company.numeric_code,
      name: company.name,
      sector: company.sector || 'Unknown',
      price: null,
      change_percent: null,
      volume: null,
      avg_volume: null,
      priority_score: 100
    }

    const inputData = await gatherStockData(supabase, candidate)
    const signal = await generateSignal(openai, inputData)

    if (!signal) {
      return NextResponse.json({ error: 'Failed to generate signal' }, { status: 500 })
    }

    const saveResult = await saveSignal(supabase, inputData, signal)

    return NextResponse.json({
      success: saveResult.success,
      stockCode: singleCode.toUpperCase(),
      signal: {
        type: signal.signal_type,
        confidence: signal.confidence_level,
        strength: signal.strength,
        summary: signal.summary
      },
      saveError: saveResult.error || null,
      duration: Date.now() - startTime
    })
  }

  // Debug mode - return diagnostic info
  const debugMode = url.searchParams.get('debug') === 'true'

  // Batch mode - select and process candidates
  const candidates = await selectCandidates(supabase, STOCKS_PER_RUN)

  if (candidates.length === 0) {
    // Get debug info if requested
    if (debugMode) {
      const { data: sampleStocks } = await supabase
        .from('stock_prices')
        .select('stock_code, price, change_percent')
        .not('price', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(10)

      const numericCodes = sampleStocks?.map((s: any) => s.stock_code) || []
      const { data: matchingCompanies } = await supabase
        .from('companies')
        .select('code, numeric_code')
        .in('numeric_code', numericCodes)

      return NextResponse.json({
        success: true,
        message: 'No suitable candidates found for signal generation',
        processed: 0,
        debug: {
          sampleStocks: sampleStocks?.slice(0, 5),
          numericCodes: numericCodes.slice(0, 5),
          matchingCompanies: matchingCompanies?.slice(0, 5)
        },
        duration: Date.now() - startTime
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No suitable candidates found for signal generation',
      processed: 0,
      duration: Date.now() - startTime
    })
  }

  console.log(`[Signal Gen] Processing ${candidates.length} candidates:`, candidates.map(c => c.code).join(', '))

  const results = {
    success: 0,
    failed: 0,
    signals: [] as Array<{ code: string; type: string; confidence: number }>
  }

  for (const candidate of candidates) {
    try {
      const inputData = await gatherStockData(supabase, candidate)
      const signal = await generateSignal(openai, inputData)

      if (signal) {
        const saveResult = await saveSignal(supabase, inputData, signal)
        if (saveResult.success) {
          results.success++
          results.signals.push({
            code: candidate.code,
            type: signal.signal_type,
            confidence: signal.confidence_level
          })
        } else {
          console.error(`[Signal Gen] Save failed for ${candidate.code}:`, saveResult.error)
          results.failed++
        }
      } else {
        results.failed++
      }
    } catch (error) {
      console.error(`[Signal Gen] Error processing ${candidate.code}:`, error)
      results.failed++
    }
  }

  const duration = Date.now() - startTime
  console.log(`[Signal Gen] Completed: ${results.success} success, ${results.failed} failed in ${duration}ms`)

  return NextResponse.json({
    success: true,
    processed: results.success + results.failed,
    results,
    duration
  })
}

// Support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

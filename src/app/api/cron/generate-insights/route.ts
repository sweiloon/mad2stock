import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// ============================================================================
// CONFIGURATION
// ============================================================================

// Process 10 companies per cron invocation (OpenAI calls take ~1-2s each)
// With batching, we can do ~10 in 10 seconds (Vercel timeout)
// 800 stocks / 10 per call = 80 calls → Run cron every 15 mins = 20 hours to complete
// Or run more frequently during off-market hours
const COMPANIES_PER_RUN = 10

// Model selection - gpt-4o-mini is cheapest but still very capable
// Cost: ~$0.15/1M input, $0.60/1M output
// ~800 tokens per company = ~$0.20/day for all 800 companies
const AI_MODEL = 'gpt-4o-mini'

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

  // Query param for external cron services
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret && secret === process.env.CRON_SECRET) return true

  // Development mode
  if (process.env.NODE_ENV === 'development') return true

  return false
}

// ============================================================================
// AI INSIGHT GENERATION
// ============================================================================

const CATEGORY_LABELS: Record<number, string> = {
  1: "Revenue UP, Profit UP (Growth)",
  2: "Revenue DOWN, Profit UP (Efficient)",
  3: "Revenue UP, Profit DOWN (Pressure)",
  4: "Revenue DOWN, Profit DOWN (Decline)",
  5: "Turnaround",
  6: "Deteriorating",
}

interface CompanyData {
  code: string
  name: string
  sector: string
  price?: number
  change_percent?: number
  volume?: number
  revenue?: number
  profit?: number
  revenue_yoy?: number
  profit_yoy?: number
  revenue_qoq?: number
  profit_qoq?: number
  yoy_category?: number
  qoq_category?: number
}

async function generateInsightForCompany(
  openai: OpenAI,
  company: CompanyData
): Promise<{
  summary: string
  insights: string[]
  outlook: string
  keyMetric: string | null
} | null> {
  const systemPrompt = `You are a concise financial analyst for Mad2Stock, a Malaysian stock market platform. Generate brief, data-driven insights for investors.

Your response must be a valid JSON object with this exact structure:
{
  "summary": "One sentence overview of the company's current state",
  "insights": [
    "First key insight (max 15 words)",
    "Second key insight (max 15 words)",
    "Third key insight (max 15 words)"
  ],
  "outlook": "Positive" | "Neutral" | "Cautious" | "Negative",
  "keyMetric": "The most important number or fact to highlight"
}

Guidelines:
- Be factual and data-driven
- Never give buy/sell recommendations
- Focus on observable trends from the data provided
- Keep insights actionable and specific
- If data is limited, acknowledge it and focus on what's available`

  const yoyLabel = company.yoy_category ? CATEGORY_LABELS[company.yoy_category] : 'Unknown'
  const qoqLabel = company.qoq_category ? CATEGORY_LABELS[company.qoq_category] : 'Unknown'

  const userPrompt = `Analyze this Malaysian company and provide quick insights:

Company: ${company.name} (${company.code})
Sector: ${company.sector}

Market Data:
- Current Price: ${company.price ? `RM ${company.price.toFixed(2)}` : 'N/A'}
- Price Change: ${company.change_percent !== undefined ? `${company.change_percent >= 0 ? '+' : ''}${company.change_percent.toFixed(2)}%` : 'N/A'}
- Volume: ${company.volume ? company.volume.toLocaleString() : 'N/A'}

Financial Performance:
- Latest Revenue: ${company.revenue ? `RM ${company.revenue.toFixed(1)}M` : 'N/A'}
- Latest Profit: ${company.profit ? `RM ${company.profit.toFixed(1)}M` : 'N/A'}
- YoY Revenue Change: ${company.revenue_yoy !== undefined ? `${company.revenue_yoy >= 0 ? '+' : ''}${company.revenue_yoy.toFixed(1)}%` : 'N/A'}
- YoY Profit Change: ${company.profit_yoy !== undefined ? `${company.profit_yoy >= 0 ? '+' : ''}${company.profit_yoy.toFixed(1)}%` : 'N/A'}
- QoQ Revenue Change: ${company.revenue_qoq !== undefined ? `${company.revenue_qoq >= 0 ? '+' : ''}${company.revenue_qoq.toFixed(1)}%` : 'N/A'}
- QoQ Profit Change: ${company.profit_qoq !== undefined ? `${company.profit_qoq >= 0 ? '+' : ''}${company.profit_qoq.toFixed(1)}%` : 'N/A'}

Performance Category:
- YoY: ${yoyLabel}
- QoQ: ${qoqLabel}

Respond with JSON only, no markdown formatting.`

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)

    return {
      summary: parsed.summary || 'Analysis not available',
      insights: parsed.insights || [],
      outlook: parsed.outlook || 'Neutral',
      keyMetric: parsed.keyMetric || null,
    }
  } catch (error) {
    console.error(`[AI Insights] Failed to generate for ${company.code}:`, error)
    return null
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
  const offsetParam = url.searchParams.get('offset')
  const forceParam = url.searchParams.get('force') === 'true'
  const singleCode = url.searchParams.get('code') // For testing single company

  // Initialize clients
  let openai: OpenAI
  let supabase: ReturnType<typeof getSupabaseAdmin>

  try {
    openai = getOpenAIClient()
  } catch (error) {
    console.error('[AI Insights] OpenAI not configured:', error)
    return NextResponse.json(
      { error: 'AI service not configured', details: 'OPENAI_API_KEY missing' },
      { status: 503 }
    )
  }

  try {
    supabase = getSupabaseAdmin()
  } catch (error) {
    console.error('[AI Insights] Supabase not configured:', error)
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  // Get today's date (Malaysia timezone, after market close this represents today)
  const today = new Date()
  const marketDate = today.toISOString().split('T')[0] // YYYY-MM-DD format

  // If single code specified, only process that one (for testing)
  if (singleCode) {
    console.log(`[AI Insights] Processing single company: ${singleCode}`)

    // Get company data with stock price
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('code', singleCode.toUpperCase())
      .limit(1)

    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const company = companies[0]

    // Get stock price data
    const { data: stockPrice } = await supabase
      .from('stock_prices')
      .select('*')
      .eq('stock_code', company.code)
      .single()

    // Get YoY analysis data
    const { data: yoyData } = await supabase
      .from('yoy_analysis')
      .select('*')
      .eq('stock_code', company.code)
      .order('quarter', { ascending: false })
      .limit(1)
      .single()

    // Get QoQ analysis data
    const { data: qoqData } = await supabase
      .from('qoq_analysis')
      .select('*')
      .eq('stock_code', company.code)
      .order('quarter', { ascending: false })
      .limit(1)
      .single()

    const companyData: CompanyData = {
      code: company.code,
      name: company.name,
      sector: company.sector || 'Unknown',
      price: stockPrice?.price,
      change_percent: stockPrice?.change_percent,
      volume: stockPrice?.volume,
      revenue: yoyData?.revenue || qoqData?.revenue,
      profit: yoyData?.profit || qoqData?.profit,
      revenue_yoy: yoyData?.revenue_yoy_pct,
      profit_yoy: yoyData?.profit_yoy_pct,
      revenue_qoq: qoqData?.revenue_qoq_pct,
      profit_qoq: qoqData?.profit_qoq_pct,
      yoy_category: yoyData?.category,
      qoq_category: qoqData?.category,
    }

    const insight = await generateInsightForCompany(openai, companyData)

    if (!insight) {
      return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 })
    }

    // Save to database
    const { error: upsertError } = await supabase
      .from('ai_insights')
      .upsert({
        stock_code: company.code,
        company_name: company.name,
        sector: company.sector,
        summary: insight.summary,
        insights: insight.insights,
        outlook: insight.outlook,
        key_metric: insight.keyMetric,
        market_date: marketDate,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'stock_code,market_date' })

    if (upsertError) {
      console.error('[AI Insights] Failed to save:', upsertError)
      return NextResponse.json({ error: 'Failed to save insight' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      company: company.code,
      insight,
      marketDate,
      duration: Date.now() - startTime,
    })
  }

  // Batch processing mode
  // Get companies that don't have insights for today
  let query = supabase
    .from('companies')
    .select('code, name, sector')
    .order('code')

  // If not forcing, only get companies without today's insights
  if (!forceParam) {
    // Get companies that already have today's insights
    const { data: existingInsights } = await supabase
      .from('ai_insights')
      .select('stock_code')
      .eq('market_date', marketDate)

    const existingCodes = existingInsights?.map(i => i.stock_code) || []

    if (existingCodes.length > 0) {
      query = query.not('code', 'in', `(${existingCodes.join(',')})`)
    }
  }

  // Apply offset for rotation
  const offset = offsetParam ? parseInt(offsetParam) : 0
  query = query.range(offset, offset + COMPANIES_PER_RUN - 1)

  const { data: companies, error: companiesError } = await query

  if (companiesError) {
    console.error('[AI Insights] Failed to fetch companies:', companiesError)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }

  if (!companies || companies.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No companies to process (all insights generated for today)',
      marketDate,
      processed: 0,
    })
  }

  console.log(`[AI Insights] Processing ${companies.length} companies (offset: ${offset})`)

  // Process each company
  const results = {
    success: 0,
    failed: 0,
    failedCodes: [] as string[],
  }

  for (const company of companies) {
    try {
      // Get stock price data
      const { data: stockPrice } = await supabase
        .from('stock_prices')
        .select('*')
        .eq('stock_code', company.code)
        .single()

      // Get YoY analysis data
      const { data: yoyData } = await supabase
        .from('yoy_analysis')
        .select('*')
        .eq('stock_code', company.code)
        .order('quarter', { ascending: false })
        .limit(1)
        .single()

      // Get QoQ analysis data
      const { data: qoqData } = await supabase
        .from('qoq_analysis')
        .select('*')
        .eq('stock_code', company.code)
        .order('quarter', { ascending: false })
        .limit(1)
        .single()

      const companyData: CompanyData = {
        code: company.code,
        name: company.name,
        sector: company.sector || 'Unknown',
        price: stockPrice?.price,
        change_percent: stockPrice?.change_percent,
        volume: stockPrice?.volume,
        revenue: yoyData?.revenue || qoqData?.revenue,
        profit: yoyData?.profit || qoqData?.profit,
        revenue_yoy: yoyData?.revenue_yoy_pct,
        profit_yoy: yoyData?.profit_yoy_pct,
        revenue_qoq: qoqData?.revenue_qoq_pct,
        profit_qoq: qoqData?.profit_qoq_pct,
        yoy_category: yoyData?.category,
        qoq_category: qoqData?.category,
      }

      const insight = await generateInsightForCompany(openai, companyData)

      if (!insight) {
        results.failed++
        results.failedCodes.push(company.code)
        continue
      }

      // Save to database
      const { error: upsertError } = await supabase
        .from('ai_insights')
        .upsert({
          stock_code: company.code,
          company_name: company.name,
          sector: company.sector,
          summary: insight.summary,
          insights: insight.insights,
          outlook: insight.outlook,
          key_metric: insight.keyMetric,
          market_date: marketDate,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'stock_code,market_date' })

      if (upsertError) {
        console.error(`[AI Insights] Failed to save ${company.code}:`, upsertError)
        results.failed++
        results.failedCodes.push(company.code)
      } else {
        results.success++
      }
    } catch (error) {
      console.error(`[AI Insights] Error processing ${company.code}:`, error)
      results.failed++
      results.failedCodes.push(company.code)
    }
  }

  const duration = Date.now() - startTime

  console.log(`[AI Insights] Completed: ${results.success} success, ${results.failed} failed in ${duration}ms`)

  return NextResponse.json({
    success: true,
    marketDate,
    processed: results.success + results.failed,
    results,
    offset,
    nextOffset: offset + COMPANIES_PER_RUN,
    duration,
    estimatedTotalRuns: Math.ceil(800 / COMPANIES_PER_RUN),
  })
}

// Support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

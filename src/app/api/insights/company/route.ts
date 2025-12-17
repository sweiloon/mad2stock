import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface CompanyData {
  code: string
  name: string
  sector: string
  price?: number
  changePercent?: number
  volume?: number
  revenue?: number
  profit?: number
  revenueYoY?: number
  profitYoY?: number
  revenueQoQ?: number
  profitQoQ?: number
  yoyCategory?: number
  qoqCategory?: number
}

const CATEGORY_LABELS: Record<number, string> = {
  1: "Revenue UP, Profit UP (Growth)",
  2: "Revenue DOWN, Profit UP (Efficient)",
  3: "Revenue UP, Profit DOWN (Pressure)",
  4: "Revenue DOWN, Profit DOWN (Decline)",
  5: "Turnaround",
  6: "Deteriorating",
}

export async function POST(request: NextRequest) {
  try {
    const body: CompanyData = await request.json()

    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: 'Missing required company data' },
        { status: 400 }
      )
    }

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

    const yoyLabel = body.yoyCategory ? CATEGORY_LABELS[body.yoyCategory] : 'Unknown'
    const qoqLabel = body.qoqCategory ? CATEGORY_LABELS[body.qoqCategory] : 'Unknown'

    const userPrompt = `Analyze this Malaysian company and provide quick insights:

Company: ${body.name} (${body.code})
Sector: ${body.sector}

Market Data:
- Current Price: ${body.price ? `RM ${body.price.toFixed(2)}` : 'N/A'}
- Price Change: ${body.changePercent !== undefined ? `${body.changePercent >= 0 ? '+' : ''}${body.changePercent.toFixed(2)}%` : 'N/A'}
- Volume: ${body.volume ? body.volume.toLocaleString() : 'N/A'}

Financial Performance:
- Latest Revenue: ${body.revenue ? `RM ${body.revenue.toFixed(1)}M` : 'N/A'}
- Latest Profit: ${body.profit ? `RM ${body.profit.toFixed(1)}M` : 'N/A'}
- YoY Revenue Change: ${body.revenueYoY !== undefined ? `${body.revenueYoY >= 0 ? '+' : ''}${body.revenueYoY.toFixed(1)}%` : 'N/A'}
- YoY Profit Change: ${body.profitYoY !== undefined ? `${body.profitYoY >= 0 ? '+' : ''}${body.profitYoY.toFixed(1)}%` : 'N/A'}
- QoQ Revenue Change: ${body.revenueQoQ !== undefined ? `${body.revenueQoQ >= 0 ? '+' : ''}${body.revenueQoQ.toFixed(1)}%` : 'N/A'}
- QoQ Profit Change: ${body.profitQoQ !== undefined ? `${body.profitQoQ >= 0 ? '+' : ''}${body.profitQoQ.toFixed(1)}%` : 'N/A'}

Performance Category:
- YoY: ${yoyLabel}
- QoQ: ${qoqLabel}

Respond with JSON only, no markdown formatting.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content || '{}'

    try {
      const insights = JSON.parse(content)

      return NextResponse.json({
        success: true,
        data: {
          summary: insights.summary || 'Analysis not available',
          insights: insights.insights || [],
          outlook: insights.outlook || 'Neutral',
          keyMetric: insights.keyMetric || null,
          generatedAt: new Date().toISOString(),
        }
      })
    } catch {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json({
        success: true,
        data: {
          summary: 'Unable to generate detailed analysis at this time.',
          insights: ['Financial data analysis in progress'],
          outlook: 'Neutral',
          keyMetric: null,
          generatedAt: new Date().toISOString(),
        }
      })
    }
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

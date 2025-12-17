import OpenAI from 'openai'

// Lazy initialization to ensure env vars are available at runtime (Vercel)
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not configured')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function chat(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const openai = getOpenAI()

  const systemMessage: ChatMessage = {
    role: 'system',
    content: systemPrompt || `You are a professional financial analyst assistant specializing in Malaysian KLSE stocks.
You have access to comprehensive company data including quarterly financials, YoY and QoQ analysis, sector information, and analyst reports.
Provide accurate, data-driven insights and recommendations. When discussing specific companies, reference their actual financial data.
Be concise but thorough. Use professional financial terminology when appropriate.`
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Fast and cost-effective model
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 2000,
  })

  return response.choices[0]?.message?.content || ''
}

export async function generateContent(
  platform: string,
  companyData: {
    name: string
    code: string
    category?: string
    revenueChange?: number
    profitChange?: number
    highlights?: string[]
  }
): Promise<{ title: string; content: string; hashtags: string[] }> {
  const platformPrompts: Record<string, string> = {
    facebook: `Create an engaging Facebook post about ${companyData.name} (${companyData.code}) stock.
Include key financial highlights, make it informative yet accessible to retail investors.
Keep it under 500 characters. Include a call-to-action.`,

    instagram: `Create a captivating Instagram caption for ${companyData.name} (${companyData.code}) stock analysis.
Make it visually descriptive, use emojis strategically, keep it concise (under 300 characters).
Focus on the most impactful data point.`,

    youtube: `Write a YouTube video description for a stock analysis video about ${companyData.name} (${companyData.code}).
Include timestamps, key points covered, and a brief summary. Target length: 200-300 words.
Make it SEO-friendly with relevant keywords.`,

    telegram: `Create a Telegram channel post about ${companyData.name} (${companyData.code}).
Use a structured format with bullet points, include key metrics,
and provide a clear buy/sell/hold indication. Keep it professional and data-focused.`,

    twitter: `Write a Twitter/X thread about ${companyData.name} (${companyData.code}).
First tweet should hook attention, followed by 2-3 tweets with key insights.
Use financial abbreviations appropriately. Total: 4 tweets max.`
  }

  const prompt = platformPrompts[platform] || platformPrompts.facebook

  const dataContext = `
Company: ${companyData.name} (${companyData.code})
${companyData.category ? `Category: ${companyData.category}` : ''}
${companyData.revenueChange !== undefined ? `Revenue Change: ${companyData.revenueChange > 0 ? '+' : ''}${companyData.revenueChange}%` : ''}
${companyData.profitChange !== undefined ? `Profit Change: ${companyData.profitChange > 0 ? '+' : ''}${companyData.profitChange}%` : ''}
${companyData.highlights?.length ? `Key Highlights: ${companyData.highlights.join(', ')}` : ''}
`

  const openai = getOpenAI()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Fast and cost-effective model
    messages: [
      {
        role: 'system',
        content: `You are a professional financial content creator specializing in Malaysian stock market content.
Create engaging, accurate, and compliant content. Never give explicit financial advice.
Include appropriate disclaimers when necessary.`
      },
      {
        role: 'user',
        content: `${prompt}\n\nData:\n${dataContext}\n\nRespond in JSON format with: {"title": "...", "content": "...", "hashtags": ["...", "..."]}`
      }
    ],
    temperature: 0.8,
    max_tokens: 1000,
  })

  const content = response.choices[0]?.message?.content || ''

  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || '',
      content: parsed.content || '',
      hashtags: parsed.hashtags || []
    }
  } catch {
    return {
      title: '',
      content: content,
      hashtags: ['#KLSE', '#MalaysiaStocks', `#${companyData.code}`]
    }
  }
}

// Export getOpenAI for cases where direct client access is needed
export { getOpenAI }
export default getOpenAI

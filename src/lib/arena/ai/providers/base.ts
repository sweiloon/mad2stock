/**
 * Mad2Arena - Base AI Provider Interface
 * All AI providers must implement this interface for consistent trading integration
 */

import type { AIModelConfig } from '../../types'

export interface AIProviderResponse {
  success: boolean
  content: string
  tokensUsed: number
  error?: string
  latencyMs: number
}

export interface AIProvider {
  config: AIModelConfig

  /**
   * Check if the provider is available (API key configured)
   */
  isAvailable(): boolean

  /**
   * Send a trading prompt and get response
   */
  chat(systemPrompt: string, userPrompt: string): Promise<AIProviderResponse>

  /**
   * Get the provider name for logging
   */
  getName(): string
}

/**
 * Base class with common functionality for all providers
 */
export abstract class BaseAIProvider implements AIProvider {
  constructor(public config: AIModelConfig) {}

  abstract chat(systemPrompt: string, userPrompt: string): Promise<AIProviderResponse>

  isAvailable(): boolean {
    const apiKey = process.env[this.config.apiKeyEnvVar]
    return !!apiKey && apiKey.length > 0
  }

  getName(): string {
    return `${this.config.name} (${this.config.provider})`
  }

  protected getApiKey(): string {
    const key = process.env[this.config.apiKeyEnvVar]
    if (!key) {
      throw new Error(`API key not configured for ${this.config.provider}. Set ${this.config.apiKeyEnvVar}`)
    }
    return key
  }

  protected async measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
    const start = performance.now()
    const result = await fn()
    const latencyMs = Math.round(performance.now() - start)
    return { result, latencyMs }
  }
}

/**
 * OpenAI-compatible API request helper
 * Works for: OpenAI, DeepSeek, Grok, Kimi, Qwen (via DashScope)
 */
export async function openAICompatibleRequest(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<{ content: string; tokensUsed: number }> {
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API request failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0
  }
}

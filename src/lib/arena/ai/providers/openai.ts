/**
 * Mad2Arena - OpenAI ChatGPT Provider
 * Model: gpt-5.2 (BEST - Dec 2025)
 * Note: GPT-5.x uses max_completion_tokens instead of max_tokens
 */

import { BaseAIProvider, type AIProviderResponse } from './base'
import type { AIModelConfig } from '../../types'

export class OpenAIProvider extends BaseAIProvider {
  constructor(config: AIModelConfig) {
    super(config)
  }

  async chat(systemPrompt: string, userPrompt: string): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        content: '',
        tokensUsed: 0,
        error: `${this.config.apiKeyEnvVar} not configured`,
        latencyMs: 0
      }
    }

    try {
      const { result, latencyMs } = await this.measureLatency(async () => {
        // GPT-5.x models require max_completion_tokens instead of max_tokens
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getApiKey()}`
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_completion_tokens: this.config.maxTokens,
            temperature: this.config.temperature
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
      })

      return {
        success: true,
        content: result.content,
        tokensUsed: result.tokensUsed,
        latencyMs
      }
    } catch (error) {
      return {
        success: false,
        content: '',
        tokensUsed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: 0
      }
    }
  }
}

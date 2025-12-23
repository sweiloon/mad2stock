/**
 * Mad2Arena - Anthropic Claude Provider
 * Model: claude-sonnet-4-20250514
 */

import { BaseAIProvider, type AIProviderResponse } from './base'
import type { AIModelConfig } from '../../types'

export class ClaudeProvider extends BaseAIProvider {
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
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.getApiKey(),
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: this.config.model,
            max_tokens: this.config.maxTokens,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ]
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Claude API error: ${response.status} - ${errorText}`)
        }

        return response.json()
      })

      const content = result.content?.[0]?.text || ''
      const tokensUsed = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)

      return {
        success: true,
        content,
        tokensUsed,
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

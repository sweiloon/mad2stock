/**
 * Mad2Arena - Google Gemini Provider
 * Model: gemini-2.0-flash (FREE tier)
 */

import { BaseAIProvider, type AIProviderResponse } from './base'
import type { AIModelConfig } from '../../types'

export class GeminiProvider extends BaseAIProvider {
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
        const apiKey = this.getApiKey()
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${apiKey}`

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                parts: [{ text: userPrompt }]
              }
            ],
            generationConfig: {
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxTokens
            }
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
        }

        return response.json()
      })

      const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const tokensUsed = result.usageMetadata?.totalTokenCount || 0

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

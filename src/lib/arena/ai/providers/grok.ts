/**
 * Mad2Arena - xAI Grok Provider
 * Model: grok-2-latest
 */

import { BaseAIProvider, openAICompatibleRequest, type AIProviderResponse } from './base'
import type { AIModelConfig } from '../../types'

export class GrokProvider extends BaseAIProvider {
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
        return openAICompatibleRequest(
          this.config.endpoint || 'https://api.x.ai/v1',
          this.getApiKey(),
          this.config.model,
          systemPrompt,
          userPrompt,
          this.config.maxTokens,
          this.config.temperature
        )
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

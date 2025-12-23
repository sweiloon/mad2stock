/**
 * Mad2Arena - AI Router
 * Unified interface for routing requests to all AI providers
 * Ensures fair competition with identical prompts to all models
 */

import { AI_MODELS, type AIModelConfig } from '../types'
import type { AIProvider, AIProviderResponse } from './providers/base'
import { ClaudeProvider } from './providers/claude'
import { OpenAIProvider } from './providers/openai'
import { DeepSeekProvider } from './providers/deepseek'
import { GeminiProvider } from './providers/gemini'
import { GrokProvider } from './providers/grok'
import { KimiProvider } from './providers/kimi'
import { QwenProvider } from './providers/qwen'

// Provider factory
function createProvider(config: AIModelConfig): AIProvider {
  switch (config.id) {
    case 'claude':
      return new ClaudeProvider(config)
    case 'chatgpt':
      return new OpenAIProvider(config)
    case 'deepseek':
      return new DeepSeekProvider(config)
    case 'gemini':
      return new GeminiProvider(config)
    case 'grok':
      return new GrokProvider(config)
    case 'kimi':
      return new KimiProvider(config)
    case 'qwen':
      return new QwenProvider(config)
    default:
      throw new Error(`Unknown AI provider: ${config.id}`)
  }
}

// Cached providers (lazy initialization)
const providerCache = new Map<string, AIProvider>()

/**
 * Get a provider instance by model ID
 */
export function getProvider(modelId: string): AIProvider {
  if (providerCache.has(modelId)) {
    return providerCache.get(modelId)!
  }

  const config = AI_MODELS.find(m => m.id === modelId)
  if (!config) {
    throw new Error(`Model not found: ${modelId}`)
  }

  const provider = createProvider(config)
  providerCache.set(modelId, provider)
  return provider
}

/**
 * Get all available providers (those with API keys configured)
 */
export function getAvailableProviders(): AIProvider[] {
  return AI_MODELS
    .map(config => getProvider(config.id))
    .filter(provider => provider.isAvailable())
}

/**
 * Get all providers regardless of availability
 */
export function getAllProviders(): AIProvider[] {
  return AI_MODELS.map(config => getProvider(config.id))
}

/**
 * Check provider availability status
 */
export function getProviderStatus(): Record<string, { available: boolean; name: string; provider: string }> {
  const status: Record<string, { available: boolean; name: string; provider: string }> = {}

  for (const config of AI_MODELS) {
    const provider = getProvider(config.id)
    status[config.id] = {
      available: provider.isAvailable(),
      name: config.name,
      provider: config.provider
    }
  }

  return status
}

export interface TradingSessionResult {
  modelId: string
  modelName: string
  provider: string
  response: AIProviderResponse
  timestamp: Date
}

/**
 * Execute trading session for a single model
 */
export async function executeTradingSession(
  modelId: string,
  systemPrompt: string,
  tradingContext: string
): Promise<TradingSessionResult> {
  const provider = getProvider(modelId)
  const config = AI_MODELS.find(m => m.id === modelId)!

  const response = await provider.chat(systemPrompt, tradingContext)

  return {
    modelId,
    modelName: config.name,
    provider: config.provider,
    response,
    timestamp: new Date()
  }
}

/**
 * Execute trading session for all available models in parallel
 * All models receive the EXACT same prompt (fair competition)
 */
export async function executeAllTradingSessions(
  systemPrompt: string,
  tradingContext: string
): Promise<TradingSessionResult[]> {
  const availableProviders = getAvailableProviders()

  if (availableProviders.length === 0) {
    console.warn('No AI providers available. Check API key configuration.')
    return []
  }

  console.log(`Executing trading session for ${availableProviders.length} AI models...`)

  // Execute all in parallel for fairness
  const results = await Promise.all(
    availableProviders.map(provider =>
      executeTradingSession(provider.config.id, systemPrompt, tradingContext)
    )
  )

  // Log summary
  const successful = results.filter(r => r.response.success)
  const failed = results.filter(r => !r.response.success)

  console.log(`Trading session complete: ${successful.length} successful, ${failed.length} failed`)

  if (failed.length > 0) {
    failed.forEach(f => {
      console.error(`${f.modelName} failed: ${f.response.error}`)
    })
  }

  return results
}

/**
 * Calculate total tokens used in a session
 */
export function calculateSessionTokens(results: TradingSessionResult[]): number {
  return results.reduce((sum, r) => sum + r.response.tokensUsed, 0)
}

/**
 * Calculate estimated cost for a session
 */
export function calculateSessionCost(results: TradingSessionResult[]): number {
  return results.reduce((sum, r) => {
    const config = AI_MODELS.find(m => m.id === r.modelId)
    if (!config) return sum
    // Rough estimate: assume ~2500 tokens per call
    return sum + (config.estimatedCostPer1K / 1000) * (r.response.tokensUsed / 2500)
  }, 0)
}

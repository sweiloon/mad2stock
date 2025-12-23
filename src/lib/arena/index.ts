/**
 * Mad2Arena - AI Trading Competition Module
 *
 * 7 AI Models competing in real-time KLSE stock trading
 * Competition: Dec 27, 2025 - Jan 27, 2026
 *
 * Participants:
 * - Claude (Anthropic)
 * - ChatGPT (OpenAI)
 * - DeepSeek
 * - Gemini (Google)
 * - Grok (xAI)
 * - Kimi (Moonshot)
 * - Qwen (Alibaba)
 */

// Types
export * from './types'

// AI Providers
export * from './ai'

// Prompts
export * from './prompts'

// Trading Engine
export * from './engine'

// AI Trader utilities
export {
  AI_TRADER_SYSTEM_PROMPT,
  getAvailableStocks,
  buildTradingContext,
  validateTradeAction,
  calculateTradeMetrics,
  parseAIResponse,
  getMockStockPrice
} from './ai-trader'

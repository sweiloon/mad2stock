/**
 * Mad2Arena - AI Stock Trading Competition Types
 */

// Competition Mode Types (like Alpha Arena)
export type CompetitionModeCode = 'NEW_BASELINE' | 'MONK_MODE' | 'SITUATIONAL_AWARENESS' | 'MAX_LEVERAGE'

export interface CompetitionMode {
  id: string
  mode_code: CompetitionModeCode
  mode_name: string
  description: string
  rules: {
    max_position_pct: number
    leverage_allowed?: boolean
    leverage_required?: boolean
    max_leverage?: number
    news_access: boolean
    memory_enabled: boolean
    can_see_competitors?: boolean
    max_daily_loss_pct?: number
    mandatory_stop_loss?: boolean
  }
  is_active: boolean
  display_order: number
  created_at: string
}

// Mode display info for UI
export const COMPETITION_MODES: Record<CompetitionModeCode, { name: string; shortName: string; color: string; icon: string; description: string }> = {
  'NEW_BASELINE': {
    name: 'New Baseline',
    shortName: 'Baseline',
    color: '#3B82F6', // blue
    icon: '📊',
    description: 'Standard trading with full market access'
  },
  'MONK_MODE': {
    name: 'Monk Mode',
    shortName: 'Monk',
    color: '#8B5CF6', // purple
    icon: '🧘',
    description: 'Capital preservation focus, defensive trading'
  },
  'SITUATIONAL_AWARENESS': {
    name: 'Situational Awareness',
    shortName: 'Aware',
    color: '#F59E0B', // amber
    icon: '👁️',
    description: 'Can see competitors rankings and positions'
  },
  'MAX_LEVERAGE': {
    name: 'Max Leverage',
    shortName: 'Leverage',
    color: '#EF4444', // red
    icon: '🚀',
    description: 'Required leverage on every trade'
  }
}

export interface AIParticipant {
  id: string
  model_name: string
  model_provider: string
  display_name: string
  avatar_color: string
  initial_capital: number
  current_capital: number
  portfolio_value: number
  total_trades: number
  winning_trades: number
  total_profit_loss: number
  profit_loss_pct: number
  rank: number
  status: 'active' | 'paused' | 'disqualified'
  last_trade_at: string | null
  created_at: string
  updated_at: string
  // Competition mode fields
  mode_id?: string
  mode_code?: CompetitionModeCode
}

export interface Holding {
  id: string
  participant_id: string
  stock_code: string
  stock_name: string
  quantity: number
  avg_buy_price: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  created_at: string
  updated_at: string
  // Enhanced position details (like Alpha Arena)
  mode_code?: CompetitionModeCode
  entry_time?: string
  leverage?: number
  margin?: number
  liquidation_price?: number
  notional_value?: number
  position_type?: 'LONG' | 'SHORT'
}

export interface Trade {
  id: string
  participant_id: string
  stock_code: string
  stock_name: string
  trade_type: 'BUY' | 'SELL'
  quantity: number
  price: number
  total_value: number
  fees: number
  realized_pnl: number | null
  reasoning: string
  executed_at: string
  created_at: string
  // Enhanced trade details
  mode_code?: CompetitionModeCode
  leverage?: number
  // Joined fields
  participant?: AIParticipant
}

export interface DailySnapshot {
  id: string
  participant_id: string
  snapshot_date: string
  portfolio_value: number
  cash_balance: number
  holdings_value: number
  daily_change: number
  daily_change_pct: number
  cumulative_return_pct: number
  created_at: string
}

export interface ArenaConfig {
  id: string
  competition_name: string
  start_date: string
  end_date: string
  initial_capital: number
  trading_fee_pct: number
  min_trade_value: number
  max_position_pct: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AIDecision {
  id: string
  participant_id: string
  decision_type: 'ANALYSIS' | 'TRADE' | 'HOLD'
  stocks_analyzed: string[]
  market_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  decision_summary: string
  raw_response: string
  tokens_used: number
  created_at: string
}

// Chart data types
export interface ChartDataPoint {
  date: string
  timestamp: number
  [key: string]: number | string // Dynamic keys for each AI model
}

export interface LeaderboardEntry {
  rank: number
  participant: AIParticipant
  portfolioValue: number
  totalReturn: number
  totalReturnPct: number
  dailyChange: number
  dailyChangePct: number
  winRate: number
  totalTrades: number
  // Enhanced metrics from KB "One Glance" table
  totalFees: number
  highestWin: number
  biggestLoss: number
  sharpeRatio: number
  // Advanced analytics
  avgTradeSize: number
  avgHoldTime: number // in hours
  longPct: number // percentage of long/buy trades
  expectancy: number // expected $ per trade
  profitFactor: number // gross profit / gross loss
  maxDrawdown: number // largest peak-to-trough decline %
  openPositions: number
  marginUsed: number // % of capital in positions
}

// Extended stats for analytics
export interface ExtendedArenaStats extends ArenaStats {
  totalFees: number
  avgTradeSize: number
  medianTradeSize: number
  avgHoldTime: number
  medianHoldTime: number
  totalBuys: number
  totalSells: number
  avgConfidence: number
}

// Trading action types
export interface TradeAction {
  action: 'BUY' | 'SELL' | 'HOLD'
  stock_code: string
  stock_name?: string
  quantity: number
  reasoning: string
  confidence: number // 0-100
  target_price?: number
  stop_loss?: number
  leverage?: number // For MAX_LEVERAGE mode: 2.5-3x required
}

export interface MarketAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  top_picks: string[]
  avoid_stocks: string[]
  market_summary: string
  recommended_actions: TradeAction[]
}

// AI Model configurations
export interface AIModelConfig {
  id: string
  name: string
  provider: string
  apiKeyEnvVar: string
  endpoint?: string
  model: string
  maxTokens: number
  temperature: number
  displayColor: string // For UI consistency
  estimatedCostPer1K: number // Cost per 1000 API calls in USD
}

/**
 * 7 AI Models for Mad2Arena Competition
 * Budget: $5/day = 4 sessions × 7 models = 28 calls/day
 * BEST models from each provider (December 2025)
 */
export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'claude',
    name: 'Claude',
    provider: 'Anthropic',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    model: 'claude-opus-4-5-20251101', // BEST - Opus 4.5
    maxTokens: 4096,
    temperature: 0.7,
    displayColor: '#FF6B35',
    estimatedCostPer1K: 27.50 // $5/1M input + $25/1M output
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    provider: 'OpenAI',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    model: 'gpt-5.2', // BEST - GPT-5.2 (Dec 2025)
    maxTokens: 4096,
    temperature: 0.7,
    displayColor: '#10A37F',
    estimatedCostPer1K: 15.00
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    endpoint: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat', // V3.2 (latest)
    maxTokens: 4096,
    temperature: 0.7,
    displayColor: '#5865F2',
    estimatedCostPer1K: 1.68
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    apiKeyEnvVar: 'GOOGLE_API_KEY',
    model: 'gemini-2.0-flash-exp', // Latest experimental (gemini-3 not yet in API)
    maxTokens: 4096,
    temperature: 0.7,
    displayColor: '#4285F4',
    estimatedCostPer1K: 0.50 // Free tier flash model
  },
  {
    id: 'grok',
    name: 'Grok',
    provider: 'xAI',
    apiKeyEnvVar: 'XAI_API_KEY',
    endpoint: 'https://api.x.ai/v1',
    model: 'grok-4-1-fast-reasoning', // BEST - Grok 4.1 (4.2 not available yet)
    maxTokens: 4096,
    temperature: 0.7,
    displayColor: '#1DA1F2',
    estimatedCostPer1K: 5.00
  },
  {
    id: 'kimi',
    name: 'Kimi',
    provider: 'Moonshot',
    apiKeyEnvVar: 'MOONSHOT_API_KEY',
    endpoint: 'https://api.moonshot.ai/v1', // Global endpoint (not .cn)
    model: 'kimi-k2-thinking', // BEST - K2 Thinking (Nov 2025)
    maxTokens: 4096,
    temperature: 0.7,
    displayColor: '#9B59B6',
    estimatedCostPer1K: 3.00
  },
  {
    id: 'qwen',
    name: 'Qwen',
    provider: 'Alibaba',
    apiKeyEnvVar: 'DASHSCOPE_API_KEY',
    endpoint: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', // International endpoint
    model: 'qwen3-max', // BEST - Qwen3-Max
    maxTokens: 4096,
    temperature: 0.7,
    displayColor: '#FF7000',
    estimatedCostPer1K: 4.00
  }
]

// Helper to get model by ID
export function getModelById(id: string): AIModelConfig | undefined {
  return AI_MODELS.find(m => m.id === id)
}

// Calculate estimated daily cost for all models
export function calculateDailyCost(sessionsPerDay: number = 4): number {
  return AI_MODELS.reduce((sum, model) => {
    return sum + (model.estimatedCostPer1K / 1000) * sessionsPerDay
  }, 0)
}

// Competition status
export interface CompetitionStatus {
  isActive: boolean
  hasStarted: boolean
  hasEnded: boolean
  daysRemaining: number
  daysElapsed: number
  totalDays: number
  progressPct: number
  startDate: Date
  endDate: Date
}

// Stats summary
export interface ArenaStats {
  totalTrades: number
  totalVolume: number
  avgReturn: number
  bestPerformer: AIParticipant | null
  worstPerformer: AIParticipant | null
  mostActiveTrade: AIParticipant | null
  highestSingleTrade: Trade | null
}

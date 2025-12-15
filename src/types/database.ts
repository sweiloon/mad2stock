export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          code: string
          name: string
          sector: string | null
          subsector: string | null
          market_cap: number | null
          listing_date: string | null
          headquarters: string | null
          current_price: number | null
          week_52_high: number | null
          week_52_low: number | null
          pe_ratio: number | null
          dividend_yield: number | null
          analyst_rating: string | null
          avg_daily_volume: number | null
          shares_outstanding: number | null
          business_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          sector?: string | null
          subsector?: string | null
          market_cap?: number | null
          listing_date?: string | null
          headquarters?: string | null
          current_price?: number | null
          week_52_high?: number | null
          week_52_low?: number | null
          pe_ratio?: number | null
          dividend_yield?: number | null
          analyst_rating?: string | null
          avg_daily_volume?: number | null
          shares_outstanding?: number | null
          business_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          sector?: string | null
          subsector?: string | null
          market_cap?: number | null
          listing_date?: string | null
          headquarters?: string | null
          current_price?: number | null
          week_52_high?: number | null
          week_52_low?: number | null
          pe_ratio?: number | null
          dividend_yield?: number | null
          analyst_rating?: string | null
          avg_daily_volume?: number | null
          shares_outstanding?: number | null
          business_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quarterly_financials: {
        Row: {
          id: string
          company_id: string
          fiscal_year: number
          quarter: number
          quarter_end_date: string | null
          revenue: number | null
          profit: number | null
          eps: number | null
          gross_margin: number | null
          net_margin: number | null
          operating_margin: number | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          fiscal_year: number
          quarter: number
          quarter_end_date?: string | null
          revenue?: number | null
          profit?: number | null
          eps?: number | null
          gross_margin?: number | null
          net_margin?: number | null
          operating_margin?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          fiscal_year?: number
          quarter?: number
          quarter_end_date?: string | null
          revenue?: number | null
          profit?: number | null
          eps?: number | null
          gross_margin?: number | null
          net_margin?: number | null
          operating_margin?: number | null
          created_at?: string
        }
      }
      yoy_analysis: {
        Row: {
          id: string
          company_id: string
          analysis_date: string
          current_quarter: string | null
          previous_year_quarter: string | null
          revenue_current: number | null
          revenue_previous: number | null
          revenue_change_pct: number | null
          profit_current: number | null
          profit_previous: number | null
          profit_change_pct: number | null
          category: number | null
          category_name: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          analysis_date: string
          current_quarter?: string | null
          previous_year_quarter?: string | null
          revenue_current?: number | null
          revenue_previous?: number | null
          revenue_change_pct?: number | null
          profit_current?: number | null
          profit_previous?: number | null
          profit_change_pct?: number | null
          category?: number | null
          category_name?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          analysis_date?: string
          current_quarter?: string | null
          previous_year_quarter?: string | null
          revenue_current?: number | null
          revenue_previous?: number | null
          revenue_change_pct?: number | null
          profit_current?: number | null
          profit_previous?: number | null
          profit_change_pct?: number | null
          category?: number | null
          category_name?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      qoq_analysis: {
        Row: {
          id: string
          company_id: string
          analysis_date: string
          current_quarter: string | null
          previous_quarter: string | null
          revenue_current: number | null
          revenue_previous: number | null
          revenue_change_pct: number | null
          profit_current: number | null
          profit_previous: number | null
          profit_change_pct: number | null
          category: number | null
          category_name: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          analysis_date: string
          current_quarter?: string | null
          previous_quarter?: string | null
          revenue_current?: number | null
          revenue_previous?: number | null
          revenue_change_pct?: number | null
          profit_current?: number | null
          profit_previous?: number | null
          profit_change_pct?: number | null
          category?: number | null
          category_name?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          analysis_date?: string
          current_quarter?: string | null
          previous_quarter?: string | null
          revenue_current?: number | null
          revenue_previous?: number | null
          revenue_change_pct?: number | null
          profit_current?: number | null
          profit_previous?: number | null
          profit_change_pct?: number | null
          category?: number | null
          category_name?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      company_documents: {
        Row: {
          id: string
          company_id: string
          document_type: string
          fiscal_year: number | null
          quarter: number | null
          file_name: string
          storage_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          company_id: string
          document_type: string
          fiscal_year?: number | null
          quarter?: number | null
          file_name: string
          storage_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          document_type?: string
          fiscal_year?: number | null
          quarter?: number | null
          file_name?: string
          storage_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_at?: string
        }
      }
      company_reports: {
        Row: {
          id: string
          company_id: string
          report_type: string | null
          content: string
          sections: Json | null
          generated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          report_type?: string | null
          content: string
          sections?: Json | null
          generated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          report_type?: string | null
          content?: string
          sections?: Json | null
          generated_at?: string
        }
      }
      signals: {
        Row: {
          id: string
          company_id: string | null
          signal_type: string
          signal_strength: string | null
          title: string
          description: string | null
          source: string | null
          source_url: string | null
          metadata: Json | null
          is_active: boolean | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          signal_type: string
          signal_strength?: string | null
          title: string
          description?: string | null
          source?: string | null
          source_url?: string | null
          metadata?: Json | null
          is_active?: boolean | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          signal_type?: string
          signal_strength?: string | null
          title?: string
          description?: string | null
          source?: string | null
          source_url?: string | null
          metadata?: Json | null
          is_active?: boolean | null
          created_at?: string
          expires_at?: string | null
        }
      }
      chat_history: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      generated_content: {
        Row: {
          id: string
          company_id: string | null
          platform: string
          content_type: string | null
          title: string | null
          content: string
          hashtags: string[] | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          platform: string
          content_type?: string | null
          title?: string | null
          content: string
          hashtags?: string[] | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          platform?: string
          content_type?: string | null
          title?: string | null
          content?: string
          hashtags?: string[] | null
          metadata?: Json | null
          created_at?: string
        }
      }
      stock_prices: {
        Row: {
          id: string
          company_id: string | null
          stock_code: string
          price: number | null
          change: number | null
          change_percent: number | null
          previous_close: number | null
          day_open: number | null
          day_high: number | null
          day_low: number | null
          volume: number | null
          market_cap: number | null
          pe_ratio: number | null
          tier: number | null
          next_update_at: string | null
          data_source: string | null
          scrape_status: string | null
          error_message: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          stock_code: string
          price?: number | null
          change?: number | null
          change_percent?: number | null
          previous_close?: number | null
          day_open?: number | null
          day_high?: number | null
          day_low?: number | null
          volume?: number | null
          market_cap?: number | null
          pe_ratio?: number | null
          tier?: number | null
          next_update_at?: string | null
          data_source?: string | null
          scrape_status?: string | null
          error_message?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          stock_code?: string
          price?: number | null
          change?: number | null
          change_percent?: number | null
          previous_close?: number | null
          day_open?: number | null
          day_high?: number | null
          day_low?: number | null
          volume?: number | null
          market_cap?: number | null
          pe_ratio?: number | null
          tier?: number | null
          next_update_at?: string | null
          data_source?: string | null
          scrape_status?: string | null
          error_message?: string | null
          updated_at?: string
          created_at?: string
        }
      }
      price_update_logs: {
        Row: {
          id: string
          job_id: string
          started_at: string
          completed_at: string | null
          execution_time_ms: number | null
          total_companies: number
          successful_updates: number | null
          failed_updates: number | null
          failed_codes: string[] | null
          error_summary: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          started_at: string
          completed_at?: string | null
          execution_time_ms?: number | null
          total_companies: number
          successful_updates?: number | null
          failed_updates?: number | null
          failed_codes?: string[] | null
          error_summary?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          started_at?: string
          completed_at?: string | null
          execution_time_ms?: number | null
          total_companies?: number
          successful_updates?: number | null
          failed_updates?: number | null
          failed_codes?: string[] | null
          error_summary?: string | null
          status?: string | null
          created_at?: string
        }
      }
      // Arena tables
      arena_participants: {
        Row: {
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
          status: string
          last_trade_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          model_name: string
          model_provider: string
          display_name: string
          avatar_color: string
          initial_capital?: number
          current_capital?: number
          portfolio_value?: number
          total_trades?: number
          winning_trades?: number
          total_profit_loss?: number
          profit_loss_pct?: number
          rank?: number
          status?: string
          last_trade_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          model_name?: string
          model_provider?: string
          display_name?: string
          avatar_color?: string
          initial_capital?: number
          current_capital?: number
          portfolio_value?: number
          total_trades?: number
          winning_trades?: number
          total_profit_loss?: number
          profit_loss_pct?: number
          rank?: number
          status?: string
          last_trade_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      arena_holdings: {
        Row: {
          id: string
          participant_id: string
          stock_code: string
          stock_name: string | null
          quantity: number
          avg_buy_price: number
          current_price: number | null
          market_value: number | null
          unrealized_pnl: number
          unrealized_pnl_pct: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          stock_code: string
          stock_name?: string | null
          quantity: number
          avg_buy_price: number
          current_price?: number | null
          market_value?: number | null
          unrealized_pnl?: number
          unrealized_pnl_pct?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          stock_code?: string
          stock_name?: string | null
          quantity?: number
          avg_buy_price?: number
          current_price?: number | null
          market_value?: number | null
          unrealized_pnl?: number
          unrealized_pnl_pct?: number
          created_at?: string
          updated_at?: string
        }
      }
      arena_trades: {
        Row: {
          id: string
          participant_id: string
          stock_code: string
          stock_name: string | null
          trade_type: string
          quantity: number
          price: number
          total_value: number
          fees: number
          realized_pnl: number | null
          reasoning: string | null
          executed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          stock_code: string
          stock_name?: string | null
          trade_type: string
          quantity: number
          price: number
          total_value: number
          fees?: number
          realized_pnl?: number | null
          reasoning?: string | null
          executed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          stock_code?: string
          stock_name?: string | null
          trade_type?: string
          quantity?: number
          price?: number
          total_value?: number
          fees?: number
          realized_pnl?: number | null
          reasoning?: string | null
          executed_at?: string
          created_at?: string
        }
      }
      arena_daily_snapshots: {
        Row: {
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
        Insert: {
          id?: string
          participant_id: string
          snapshot_date: string
          portfolio_value: number
          cash_balance: number
          holdings_value: number
          daily_change?: number
          daily_change_pct?: number
          cumulative_return_pct?: number
          created_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          snapshot_date?: string
          portfolio_value?: number
          cash_balance?: number
          holdings_value?: number
          daily_change?: number
          daily_change_pct?: number
          cumulative_return_pct?: number
          created_at?: string
        }
      }
      arena_config: {
        Row: {
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
        Insert: {
          id?: string
          competition_name?: string
          start_date?: string
          end_date?: string
          initial_capital?: number
          trading_fee_pct?: number
          min_trade_value?: number
          max_position_pct?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          competition_name?: string
          start_date?: string
          end_date?: string
          initial_capital?: number
          trading_fee_pct?: number
          min_trade_value?: number
          max_position_pct?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      arena_ai_decisions: {
        Row: {
          id: string
          participant_id: string
          decision_type: string
          stocks_analyzed: string[] | null
          market_sentiment: string | null
          decision_summary: string | null
          raw_response: string | null
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          decision_type: string
          stocks_analyzed?: string[] | null
          market_sentiment?: string | null
          decision_summary?: string | null
          raw_response?: string | null
          tokens_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          decision_type?: string
          stocks_analyzed?: string[] | null
          market_sentiment?: string | null
          decision_summary?: string | null
          raw_response?: string | null
          tokens_used?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Company = Database['public']['Tables']['companies']['Row']
export type QuarterlyFinancial = Database['public']['Tables']['quarterly_financials']['Row']
export type YoYAnalysis = Database['public']['Tables']['yoy_analysis']['Row']
export type QoQAnalysis = Database['public']['Tables']['qoq_analysis']['Row']
export type CompanyDocument = Database['public']['Tables']['company_documents']['Row']
export type CompanyReport = Database['public']['Tables']['company_reports']['Row']
export type Signal = Database['public']['Tables']['signals']['Row']
export type ChatMessage = Database['public']['Tables']['chat_history']['Row']
export type GeneratedContent = Database['public']['Tables']['generated_content']['Row']
export type StockPrice = Database['public']['Tables']['stock_prices']['Row']
export type PriceUpdateLog = Database['public']['Tables']['price_update_logs']['Row']

// Arena types
export type ArenaParticipant = Database['public']['Tables']['arena_participants']['Row']
export type ArenaHolding = Database['public']['Tables']['arena_holdings']['Row']
export type ArenaTrade = Database['public']['Tables']['arena_trades']['Row']
export type ArenaDailySnapshot = Database['public']['Tables']['arena_daily_snapshots']['Row']
export type ArenaConfig = Database['public']['Tables']['arena_config']['Row']
export type ArenaAIDecision = Database['public']['Tables']['arena_ai_decisions']['Row']

// Category mapping
export const CATEGORIES = {
  1: 'Revenue UP, Profit UP',
  2: 'Revenue DOWN, Profit DOWN',
  3: 'Revenue UP, Profit DOWN',
  4: 'Revenue DOWN, Profit UP',
  5: 'Turnaround - Loss to Profit',
  6: 'Decline - Profit to Loss'
} as const

export type CategoryId = keyof typeof CATEGORIES

// Signal types
export const SIGNAL_TYPES = {
  price_alert: 'Price Alert',
  news: 'News',
  volume: 'Volume Spike',
  earnings: 'Earnings',
  recommendation: 'Analyst Recommendation'
} as const

export const SIGNAL_STRENGTHS = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell'
} as const

// Platform types for content generation
export const PLATFORMS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  telegram: 'Telegram',
  twitter: 'Twitter/X'
} as const

export type Platform = keyof typeof PLATFORMS

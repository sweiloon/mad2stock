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

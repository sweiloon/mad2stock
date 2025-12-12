-- Mad2Stock - Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies master table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    subsector VARCHAR(100),
    market_cap DECIMAL(20, 2),
    listing_date DATE,
    headquarters TEXT,
    current_price DECIMAL(10, 4),
    week_52_high DECIMAL(10, 4),
    week_52_low DECIMAL(10, 4),
    pe_ratio DECIMAL(10, 2),
    dividend_yield DECIMAL(6, 2),
    analyst_rating VARCHAR(50),
    avg_daily_volume BIGINT,
    shares_outstanding BIGINT,
    business_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quarterly financials
CREATE TABLE IF NOT EXISTS quarterly_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    quarter_end_date DATE,
    revenue DECIMAL(20, 2),
    profit DECIMAL(20, 2),
    eps DECIMAL(10, 4),
    gross_margin DECIMAL(6, 2),
    net_margin DECIMAL(6, 2),
    operating_margin DECIMAL(6, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, fiscal_year, quarter)
);

-- YoY Analysis
CREATE TABLE IF NOT EXISTS yoy_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    current_quarter VARCHAR(20),
    previous_year_quarter VARCHAR(20),
    revenue_current DECIMAL(20, 2),
    revenue_previous DECIMAL(20, 2),
    revenue_change_pct DECIMAL(8, 2),
    profit_current DECIMAL(20, 2),
    profit_previous DECIMAL(20, 2),
    profit_change_pct DECIMAL(8, 2),
    category INTEGER CHECK (category BETWEEN 1 AND 6),
    category_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QoQ Analysis
CREATE TABLE IF NOT EXISTS qoq_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    current_quarter VARCHAR(20),
    previous_quarter VARCHAR(20),
    revenue_current DECIMAL(20, 2),
    revenue_previous DECIMAL(20, 2),
    revenue_change_pct DECIMAL(8, 2),
    profit_current DECIMAL(20, 2),
    profit_previous DECIMAL(20, 2),
    profit_change_pct DECIMAL(8, 2),
    category INTEGER CHECK (category BETWEEN 1 AND 6),
    category_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company documents (PDFs)
CREATE TABLE IF NOT EXISTS company_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'quarterly', 'annual'
    fiscal_year INTEGER,
    quarter INTEGER,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company reports (analysis text)
CREATE TABLE IF NOT EXISTS company_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    report_type VARCHAR(50) DEFAULT 'comprehensive',
    content TEXT NOT NULL,
    sections JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time signals
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL, -- 'price_alert', 'news', 'volume', 'earnings', 'recommendation'
    signal_strength VARCHAR(20), -- 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(100),
    source_url TEXT,
    metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- AI Chat history
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated content for social media
CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'instagram', 'youtube', 'telegram', 'twitter'
    content_type VARCHAR(50), -- 'post', 'story', 'video_script', 'thread'
    title VARCHAR(255),
    content TEXT NOT NULL,
    hashtags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_quarterly_financials_company ON quarterly_financials(company_id);
CREATE INDEX IF NOT EXISTS idx_quarterly_financials_date ON quarterly_financials(fiscal_year, quarter);
CREATE INDEX IF NOT EXISTS idx_yoy_analysis_company ON yoy_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_yoy_analysis_category ON yoy_analysis(category);
CREATE INDEX IF NOT EXISTS idx_qoq_analysis_company ON qoq_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_qoq_analysis_category ON qoq_analysis(category);
CREATE INDEX IF NOT EXISTS idx_signals_company ON signals(company_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_active ON signals(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_company ON generated_content(company_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_platform ON generated_content(platform);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE yoy_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE qoq_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed for your auth setup)
CREATE POLICY "Public read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quarterly_financials FOR SELECT USING (true);
CREATE POLICY "Public read access" ON yoy_analysis FOR SELECT USING (true);
CREATE POLICY "Public read access" ON qoq_analysis FOR SELECT USING (true);
CREATE POLICY "Public read access" ON company_documents FOR SELECT USING (true);
CREATE POLICY "Public read access" ON company_reports FOR SELECT USING (true);
CREATE POLICY "Public read access" ON signals FOR SELECT USING (true);
CREATE POLICY "Public read access" ON chat_history FOR SELECT USING (true);
CREATE POLICY "Public read access" ON generated_content FOR SELECT USING (true);

-- Create policies for insert/update (service role only for now)
CREATE POLICY "Service role insert" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update" ON companies FOR UPDATE USING (true);
CREATE POLICY "Service role insert" ON quarterly_financials FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update" ON quarterly_financials FOR UPDATE USING (true);
CREATE POLICY "Service role insert" ON yoy_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert" ON qoq_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert" ON company_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert" ON company_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert" ON signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update" ON signals FOR UPDATE USING (true);
CREATE POLICY "Service role insert" ON chat_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert" ON generated_content FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for companies table
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for signals table
ALTER PUBLICATION supabase_realtime ADD TABLE signals;

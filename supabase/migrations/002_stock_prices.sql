-- Stock Prices Cache Table
-- Stores cached stock prices updated by cron job

CREATE TABLE IF NOT EXISTS stock_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  stock_code VARCHAR(10) NOT NULL,

  -- Price data
  price DECIMAL(12, 4),
  change DECIMAL(12, 4),
  change_percent DECIMAL(8, 4),
  previous_close DECIMAL(12, 4),
  day_open DECIMAL(12, 4),
  day_high DECIMAL(12, 4),
  day_low DECIMAL(12, 4),
  volume BIGINT,

  -- Metadata
  data_source VARCHAR(20) DEFAULT 'klsescreener', -- 'klsescreener' | 'yahoo'
  scrape_status VARCHAR(20) DEFAULT 'success', -- 'success' | 'failed'
  error_message TEXT,

  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one row per stock code
  CONSTRAINT stock_prices_code_unique UNIQUE (stock_code)
);

-- Price Update Logs Table
-- Audit trail for cron job executions

CREATE TABLE IF NOT EXISTS price_update_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR(50) NOT NULL,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,

  -- Stats
  total_companies INTEGER NOT NULL,
  successful_updates INTEGER DEFAULT 0,
  failed_updates INTEGER DEFAULT 0,

  -- Failure tracking
  failed_codes TEXT[], -- Array of stock codes that failed
  error_summary TEXT,

  -- Job status
  status VARCHAR(20) DEFAULT 'running', -- 'running' | 'completed' | 'failed'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_prices_code ON stock_prices(stock_code);
CREATE INDEX IF NOT EXISTS idx_stock_prices_updated ON stock_prices(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_update_logs_job ON price_update_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_price_update_logs_started ON price_update_logs(started_at DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on UPDATE
DROP TRIGGER IF EXISTS stock_prices_updated_at ON stock_prices;
CREATE TRIGGER stock_prices_updated_at
  BEFORE UPDATE ON stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_prices_updated_at();

-- Enable RLS but allow public read access for frontend
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_update_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for stock_prices
CREATE POLICY "Public can read stock prices" ON stock_prices
  FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Service role can manage stock prices" ON stock_prices
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage update logs" ON price_update_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Stock History Cache Table
-- Stores historical OHLCV data from Yahoo Finance to reduce API calls
-- ============================================================================

-- Create the stock_history_cache table
CREATE TABLE IF NOT EXISTS stock_history_cache (
  id BIGSERIAL PRIMARY KEY,
  stock_code VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(12, 4),
  high DECIMAL(12, 4),
  low DECIMAL(12, 4),
  close DECIMAL(12, 4) NOT NULL,
  volume BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stock_code, date)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_stock_history_cache_code ON stock_history_cache(stock_code);
CREATE INDEX IF NOT EXISTS idx_stock_history_cache_date ON stock_history_cache(date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_cache_code_date ON stock_history_cache(stock_code, date DESC);

-- Add comment to table
COMMENT ON TABLE stock_history_cache IS 'Cached historical stock data from Yahoo Finance to reduce API rate limiting';

-- Enable Row Level Security (optional, can be disabled for server-side access)
ALTER TABLE stock_history_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (server-side with service role key)
CREATE POLICY "Allow all operations for authenticated" ON stock_history_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_history_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS stock_history_cache_updated_at_trigger ON stock_history_cache;
CREATE TRIGGER stock_history_cache_updated_at_trigger
  BEFORE UPDATE ON stock_history_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_history_cache_updated_at();

-- Stock Tiers Table
-- Manages tiered update strategy for ~1000 KLSE stocks
-- Tier 1: Core 80 stocks - Every 5 min
-- Tier 2: Mid-cap stocks (>1B market cap) - Every 15 min
-- Tier 3: Small-cap stocks - Every 30 min

CREATE TABLE IF NOT EXISTS stock_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_code VARCHAR(10) NOT NULL UNIQUE,
  company_name VARCHAR(255),

  -- Tier assignment (1, 2, or 3)
  tier INTEGER NOT NULL DEFAULT 3 CHECK (tier >= 1 AND tier <= 3),

  -- Tier assignment criteria
  is_core BOOLEAN DEFAULT FALSE, -- Part of original 80 companies
  market_cap DECIMAL(20, 2), -- In MYR

  -- Priority score for dynamic tier adjustment
  priority_score DECIMAL(10, 4) DEFAULT 0,

  -- Timestamps
  last_tier_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notes for manual overrides
  notes TEXT
);

-- Add tier and scheduling columns to stock_prices table
ALTER TABLE stock_prices
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_update_at TIMESTAMPTZ;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_stock_tiers_tier ON stock_tiers(tier);
CREATE INDEX IF NOT EXISTS idx_stock_tiers_code ON stock_tiers(stock_code);
CREATE INDEX IF NOT EXISTS idx_stock_tiers_is_core ON stock_tiers(is_core);
CREATE INDEX IF NOT EXISTS idx_stock_tiers_market_cap ON stock_tiers(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prices_tier ON stock_prices(tier);
CREATE INDEX IF NOT EXISTS idx_stock_prices_next_update ON stock_prices(next_update_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on UPDATE
DROP TRIGGER IF EXISTS stock_tiers_updated_at ON stock_tiers;
CREATE TRIGGER stock_tiers_updated_at
  BEFORE UPDATE ON stock_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_tiers_updated_at();

-- Enable RLS
ALTER TABLE stock_tiers ENABLE ROW LEVEL SECURITY;

-- Public read access for stock_tiers
CREATE POLICY "Public can read stock tiers" ON stock_tiers
  FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Service role can manage stock tiers" ON stock_tiers
  FOR ALL USING (auth.role() = 'service_role');

-- View for tier statistics
CREATE OR REPLACE VIEW tier_stats AS
SELECT
  tier,
  COUNT(*) as stock_count,
  CASE tier
    WHEN 1 THEN 'Core (5 min)'
    WHEN 2 THEN 'Mid-cap (15 min)'
    WHEN 3 THEN 'Small-cap (30 min)'
  END as tier_name,
  CASE tier
    WHEN 1 THEN 5
    WHEN 2 THEN 15
    WHEN 3 THEN 30
  END as update_interval_mins
FROM stock_tiers
GROUP BY tier
ORDER BY tier;

-- Grant select on view
GRANT SELECT ON tier_stats TO anon, authenticated;

-- Function to get stocks that need updating
CREATE OR REPLACE FUNCTION get_stocks_to_update(p_tier INTEGER DEFAULT NULL)
RETURNS TABLE (
  stock_code VARCHAR(10),
  company_name VARCHAR(255),
  tier INTEGER,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.stock_code,
    st.company_name,
    st.tier,
    sp.updated_at as last_updated
  FROM stock_tiers st
  LEFT JOIN stock_prices sp ON st.stock_code = sp.stock_code
  WHERE (p_tier IS NULL OR st.tier = p_tier)
    AND (
      sp.updated_at IS NULL
      OR sp.next_update_at IS NULL
      OR sp.next_update_at <= NOW()
    )
  ORDER BY st.tier, st.priority_score DESC;
END;
$$;

-- Comment on tables
COMMENT ON TABLE stock_tiers IS 'Manages tiered update strategy for KLSE stocks';
COMMENT ON COLUMN stock_tiers.tier IS '1=Core (5min), 2=Mid-cap (15min), 3=Small-cap (30min)';
COMMENT ON COLUMN stock_tiers.is_core IS 'True if part of original 80 companies';
COMMENT ON COLUMN stock_tiers.priority_score IS 'Higher score = higher priority within tier';

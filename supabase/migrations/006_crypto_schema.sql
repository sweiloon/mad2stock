-- ============================================
-- CRYPTO MARKET SCHEMA
-- Migration: 006_crypto_schema.sql
-- Purpose: Add cryptocurrency support to Mad2Stock
-- ============================================

-- ============================================
-- CORE CRYPTO TABLES
-- ============================================

-- Crypto Coins Master Data (parallel to companies table)
CREATE TABLE IF NOT EXISTS crypto_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL UNIQUE,         -- 'BTC', 'ETH', 'SOL'
  name VARCHAR(255) NOT NULL,                  -- 'Bitcoin', 'Ethereum'
  slug VARCHAR(100) UNIQUE,                    -- 'bitcoin', 'ethereum'

  -- Category
  category VARCHAR(100),                       -- 'Layer1', 'DeFi', 'Meme', etc.

  -- Market data
  market_cap DECIMAL(30, 2),
  market_cap_rank INTEGER,
  fully_diluted_valuation DECIMAL(30, 2),

  -- Supply metrics
  circulating_supply DECIMAL(30, 8),
  total_supply DECIMAL(30, 8),
  max_supply DECIMAL(30, 8),

  -- All-time high/low
  ath DECIMAL(20, 8),
  ath_date TIMESTAMPTZ,
  ath_change_percent DECIMAL(10, 4),
  atl DECIMAL(20, 8),
  atl_date TIMESTAMPTZ,
  atl_change_percent DECIMAL(10, 4),

  -- Metadata
  logo_url TEXT,
  website_url TEXT,
  description TEXT,

  -- Update tier (1=top20 frequent, 2=top50, 3=top100)
  tier INTEGER DEFAULT 2 CHECK (tier >= 1 AND tier <= 3),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Pairs (all available Binance pairs)
CREATE TABLE IF NOT EXISTS trading_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_symbol VARCHAR(30) NOT NULL UNIQUE,    -- 'BTCUSDT', 'ETHBTC'
  base_symbol VARCHAR(20) NOT NULL,           -- 'BTC', 'ETH'
  quote_symbol VARCHAR(20) NOT NULL,          -- 'USDT', 'BTC'

  -- Exchange info
  exchange VARCHAR(20) DEFAULT 'BINANCE',
  status VARCHAR(20) DEFAULT 'TRADING',       -- 'TRADING', 'HALT', 'BREAK'

  -- Trading rules (from Binance exchangeInfo)
  min_qty DECIMAL(20, 8),
  max_qty DECIMAL(20, 8),
  step_size DECIMAL(20, 8),
  min_notional DECIMAL(20, 8),
  tick_size DECIMAL(20, 8),

  -- Current price cache
  current_price DECIMAL(20, 8),
  price_change_24h DECIMAL(20, 8),
  price_change_percent_24h DECIMAL(10, 4),
  volume_24h DECIMAL(30, 2),
  quote_volume_24h DECIMAL(30, 2),

  -- Priority tier
  tier INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REAL-TIME DATA TABLES
-- ============================================

-- Crypto Prices (parallel to stock_prices table)
CREATE TABLE IF NOT EXISTS crypto_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL UNIQUE,          -- 'BTC', 'ETH' (base symbol)

  -- Price in USDT
  price DECIMAL(20, 8) NOT NULL,
  change DECIMAL(20, 8),
  change_percent DECIMAL(10, 4),

  -- 24h stats
  open_24h DECIMAL(20, 8),
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  volume_24h DECIMAL(30, 2),
  quote_volume_24h DECIMAL(30, 2),

  -- Order book top
  bid DECIMAL(20, 8),
  ask DECIMAL(20, 8),

  -- Volume weighted average price
  vwap DECIMAL(20, 8),

  -- Trade count
  trades_24h BIGINT,

  -- Data source and tier
  data_source VARCHAR(20) DEFAULT 'BINANCE',
  tier INTEGER DEFAULT 2,
  next_update_at TIMESTAMPTZ,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Book Snapshots (for caching, real-time via WebSocket)
CREATE TABLE IF NOT EXISTS crypto_order_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_symbol VARCHAR(30) NOT NULL UNIQUE,     -- 'BTCUSDT'

  -- Top of book
  best_bid_price DECIMAL(20, 8),
  best_bid_qty DECIMAL(20, 8),
  best_ask_price DECIMAL(20, 8),
  best_ask_qty DECIMAL(20, 8),
  spread DECIMAL(20, 8),
  spread_pct DECIMAL(10, 6),

  -- Aggregated depth (top 20 levels)
  bids JSONB,                                  -- [{price, qty}, ...]
  asks JSONB,                                  -- [{price, qty}, ...]

  -- Order flow indicators
  bid_volume_total DECIMAL(30, 8),
  ask_volume_total DECIMAL(30, 8),
  buy_pressure DECIMAL(10, 4),                 -- 0-100
  imbalance DECIMAL(10, 4),                    -- -100 to +100

  last_update_id BIGINT,                       -- Binance update ID
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candlestick/Kline Cache
CREATE TABLE IF NOT EXISTS crypto_klines (
  id BIGSERIAL PRIMARY KEY,
  pair_symbol VARCHAR(30) NOT NULL,
  interval VARCHAR(10) NOT NULL,               -- '1m', '5m', '15m', '1h', '4h', '1d'
  open_time TIMESTAMPTZ NOT NULL,

  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(30, 8) NOT NULL,

  close_time TIMESTAMPTZ,
  quote_volume DECIMAL(30, 8),
  trades_count INTEGER,
  taker_buy_base DECIMAL(30, 8),
  taker_buy_quote DECIMAL(30, 8),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT crypto_klines_unique UNIQUE(pair_symbol, interval, open_time)
);

-- Recent Trades Cache (aggregated, not individual)
CREATE TABLE IF NOT EXISTS crypto_trades_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_symbol VARCHAR(30) NOT NULL,

  -- Aggregated trade data
  last_price DECIMAL(20, 8),
  last_qty DECIMAL(20, 8),
  last_trade_time TIMESTAMPTZ,

  -- Recent trades JSON (last 50)
  recent_trades JSONB,                         -- [{id, price, qty, time, isBuyerMaker}, ...]

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT crypto_trades_cache_pair_unique UNIQUE(pair_symbol)
);

-- ============================================
-- AI SIGNALS TABLES
-- ============================================

-- Crypto Signals (parallel to signals table)
CREATE TABLE IF NOT EXISTS crypto_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id UUID REFERENCES crypto_coins(id) ON DELETE SET NULL,
  symbol VARCHAR(20) NOT NULL,
  pair_symbol VARCHAR(30),

  -- Signal info
  signal_type VARCHAR(50) NOT NULL,            -- 'BUY', 'SELL', 'HOLD'
  signal_strength VARCHAR(20),                 -- 'STRONG_BUY', 'BUY', etc.
  confidence DECIMAL(5, 2),                    -- 0-100

  -- Price targets
  entry_price DECIMAL(20, 8),
  target_price DECIMAL(20, 8),
  stop_loss DECIMAL(20, 8),
  risk_reward_ratio DECIMAL(6, 2),

  -- Time horizon
  time_horizon VARCHAR(20),                    -- 'SHORT' (1-3 days), 'MEDIUM' (1-2 weeks), 'LONG' (1+ month)

  -- Analysis
  technical_summary TEXT,
  fundamental_summary TEXT,
  sentiment_summary TEXT,
  reasoning TEXT,

  -- Data sources used
  data_sources JSONB,
  indicators_used JSONB,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  hit_target BOOLEAN DEFAULT FALSE,
  hit_stop_loss BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- ============================================
-- ARENA CRYPTO TABLES
-- ============================================

-- Add market support to existing arena_participants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'arena_participants' AND column_name = 'market_code') THEN
    ALTER TABLE arena_participants ADD COLUMN market_code VARCHAR(20) DEFAULT 'KLSE';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'arena_participants' AND column_name = 'allowed_markets') THEN
    ALTER TABLE arena_participants ADD COLUMN allowed_markets TEXT[] DEFAULT ARRAY['KLSE'];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'arena_participants' AND column_name = 'crypto_cash') THEN
    ALTER TABLE arena_participants ADD COLUMN crypto_cash DECIMAL(20, 4) DEFAULT 10000.00;
  END IF;
END $$;

-- Arena Crypto Holdings
CREATE TABLE IF NOT EXISTS arena_crypto_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,

  symbol VARCHAR(20) NOT NULL,                 -- 'BTC', 'ETH'
  pair_symbol VARCHAR(30) NOT NULL,            -- 'BTCUSDT' (traded pair)

  quantity DECIMAL(20, 8) NOT NULL,
  avg_buy_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  market_value DECIMAL(20, 4),                 -- In quote currency (USDT)

  unrealized_pnl DECIMAL(20, 4) DEFAULT 0.00,
  unrealized_pnl_pct DECIMAL(10, 4) DEFAULT 0.00,

  -- Position tracking
  entry_time TIMESTAMPTZ,
  position_type VARCHAR(10) DEFAULT 'SPOT',    -- 'SPOT', 'LONG', 'SHORT' (future)

  mode_code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT arena_crypto_holdings_unique UNIQUE(participant_id, symbol, pair_symbol)
);

-- Arena Crypto Trades
CREATE TABLE IF NOT EXISTS arena_crypto_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,

  symbol VARCHAR(20) NOT NULL,
  pair_symbol VARCHAR(30) NOT NULL,

  trade_type VARCHAR(10) NOT NULL,             -- 'BUY', 'SELL'
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  total_value DECIMAL(20, 4) NOT NULL,         -- In quote currency
  fees DECIMAL(20, 8) DEFAULT 0.00,

  realized_pnl DECIMAL(20, 4),
  reasoning TEXT,

  -- Trade context
  mode_code VARCHAR(50),
  market_conditions JSONB,

  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arena Crypto Daily Snapshots
CREATE TABLE IF NOT EXISTS arena_crypto_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  cash_balance DECIMAL(20, 4) NOT NULL,        -- USDT balance
  holdings_value DECIMAL(20, 4) NOT NULL,      -- Total crypto holdings value
  total_portfolio_value DECIMAL(20, 4) NOT NULL,

  daily_pnl DECIMAL(20, 4),
  daily_pnl_pct DECIMAL(10, 4),
  cumulative_pnl DECIMAL(20, 4),
  cumulative_pnl_pct DECIMAL(10, 4),

  -- Holdings snapshot
  holdings_snapshot JSONB,

  -- Performance metrics
  trades_today INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),

  mode_code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT arena_crypto_snapshots_unique UNIQUE(participant_id, snapshot_date)
);

-- ============================================
-- INDEXES
-- ============================================

-- Crypto coins
CREATE INDEX IF NOT EXISTS idx_crypto_coins_symbol ON crypto_coins(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_coins_rank ON crypto_coins(market_cap_rank);
CREATE INDEX IF NOT EXISTS idx_crypto_coins_tier ON crypto_coins(tier);
CREATE INDEX IF NOT EXISTS idx_crypto_coins_category ON crypto_coins(category);

-- Trading pairs
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(pair_symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_base ON trading_pairs(base_symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_quote ON trading_pairs(quote_symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_tier ON trading_pairs(tier);

-- Crypto prices
CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol ON crypto_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_prices_updated ON crypto_prices(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_prices_tier ON crypto_prices(tier);

-- Order book
CREATE INDEX IF NOT EXISTS idx_crypto_order_book_pair ON crypto_order_book(pair_symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_order_book_updated ON crypto_order_book(updated_at DESC);

-- Klines
CREATE INDEX IF NOT EXISTS idx_crypto_klines_lookup ON crypto_klines(pair_symbol, interval, open_time DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_klines_pair_interval ON crypto_klines(pair_symbol, interval);

-- Signals
CREATE INDEX IF NOT EXISTS idx_crypto_signals_symbol ON crypto_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_signals_active ON crypto_signals(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_crypto_signals_created ON crypto_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_signals_type ON crypto_signals(signal_type);

-- Arena holdings
CREATE INDEX IF NOT EXISTS idx_arena_crypto_holdings_participant ON arena_crypto_holdings(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_crypto_holdings_symbol ON arena_crypto_holdings(symbol);

-- Arena trades
CREATE INDEX IF NOT EXISTS idx_arena_crypto_trades_participant ON arena_crypto_trades(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_crypto_trades_executed ON arena_crypto_trades(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_arena_crypto_trades_symbol ON arena_crypto_trades(symbol);

-- Arena snapshots
CREATE INDEX IF NOT EXISTS idx_arena_crypto_snapshots_participant ON arena_crypto_snapshots(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_crypto_snapshots_date ON arena_crypto_snapshots(snapshot_date DESC);

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable Supabase Realtime for crypto tables
DO $$
BEGIN
  -- Check if publication exists and add tables
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Remove first to avoid errors if already added
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS crypto_prices;
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS crypto_signals;
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS arena_crypto_trades;
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS arena_crypto_holdings;

    -- Add tables
    ALTER PUBLICATION supabase_realtime ADD TABLE crypto_prices;
    ALTER PUBLICATION supabase_realtime ADD TABLE crypto_signals;
    ALTER PUBLICATION supabase_realtime ADD TABLE arena_crypto_trades;
    ALTER PUBLICATION supabase_realtime ADD TABLE arena_crypto_holdings;
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE crypto_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_order_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_klines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_trades_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_crypto_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_crypto_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_crypto_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access for market data
CREATE POLICY "Public read access for crypto_coins" ON crypto_coins FOR SELECT USING (true);
CREATE POLICY "Public read access for trading_pairs" ON trading_pairs FOR SELECT USING (true);
CREATE POLICY "Public read access for crypto_prices" ON crypto_prices FOR SELECT USING (true);
CREATE POLICY "Public read access for crypto_order_book" ON crypto_order_book FOR SELECT USING (true);
CREATE POLICY "Public read access for crypto_klines" ON crypto_klines FOR SELECT USING (true);
CREATE POLICY "Public read access for crypto_trades_cache" ON crypto_trades_cache FOR SELECT USING (true);
CREATE POLICY "Public read access for crypto_signals" ON crypto_signals FOR SELECT USING (true);
CREATE POLICY "Public read access for arena_crypto_holdings" ON arena_crypto_holdings FOR SELECT USING (true);
CREATE POLICY "Public read access for arena_crypto_trades" ON arena_crypto_trades FOR SELECT USING (true);
CREATE POLICY "Public read access for arena_crypto_snapshots" ON arena_crypto_snapshots FOR SELECT USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_crypto_coins_updated_at ON crypto_coins;
CREATE TRIGGER update_crypto_coins_updated_at BEFORE UPDATE ON crypto_coins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crypto_prices_updated_at ON crypto_prices;
CREATE TRIGGER update_crypto_prices_updated_at BEFORE UPDATE ON crypto_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_arena_crypto_holdings_updated_at ON arena_crypto_holdings;
CREATE TRIGGER update_arena_crypto_holdings_updated_at BEFORE UPDATE ON arena_crypto_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: TOP 100 COINS
-- ============================================

-- Insert top 100 coins (basic data, will be updated by cron)
INSERT INTO crypto_coins (symbol, name, slug, category, market_cap_rank, tier) VALUES
  ('BTC', 'Bitcoin', 'bitcoin', 'Layer1', 1, 1),
  ('ETH', 'Ethereum', 'ethereum', 'Layer1', 2, 1),
  ('BNB', 'BNB', 'bnb', 'Exchange', 3, 1),
  ('SOL', 'Solana', 'solana', 'Layer1', 4, 1),
  ('XRP', 'XRP', 'xrp', 'Payments', 5, 1),
  ('DOGE', 'Dogecoin', 'dogecoin', 'Meme', 6, 1),
  ('ADA', 'Cardano', 'cardano', 'Layer1', 7, 1),
  ('AVAX', 'Avalanche', 'avalanche', 'Layer1', 8, 1),
  ('TRX', 'TRON', 'tron', 'Layer1', 9, 1),
  ('LINK', 'Chainlink', 'chainlink', 'Oracle', 10, 1),
  ('DOT', 'Polkadot', 'polkadot', 'Layer0', 11, 1),
  ('MATIC', 'Polygon', 'polygon', 'Layer2', 12, 1),
  ('TON', 'Toncoin', 'toncoin', 'Layer1', 13, 1),
  ('SHIB', 'Shiba Inu', 'shiba-inu', 'Meme', 14, 1),
  ('LTC', 'Litecoin', 'litecoin', 'Payments', 15, 1),
  ('BCH', 'Bitcoin Cash', 'bitcoin-cash', 'Payments', 16, 1),
  ('ATOM', 'Cosmos', 'cosmos', 'Layer0', 17, 1),
  ('UNI', 'Uniswap', 'uniswap', 'DeFi', 18, 1),
  ('XLM', 'Stellar', 'stellar', 'Payments', 19, 1),
  ('NEAR', 'NEAR Protocol', 'near', 'Layer1', 20, 1),
  ('APT', 'Aptos', 'aptos', 'Layer1', 21, 2),
  ('ICP', 'Internet Computer', 'internet-computer', 'Layer1', 22, 2),
  ('FIL', 'Filecoin', 'filecoin', 'Storage', 23, 2),
  ('ETC', 'Ethereum Classic', 'ethereum-classic', 'Layer1', 24, 2),
  ('HBAR', 'Hedera', 'hedera', 'Layer1', 25, 2),
  ('ARB', 'Arbitrum', 'arbitrum', 'Layer2', 26, 2),
  ('VET', 'VeChain', 'vechain', 'Supply Chain', 27, 2),
  ('OP', 'Optimism', 'optimism', 'Layer2', 28, 2),
  ('MKR', 'Maker', 'maker', 'DeFi', 29, 2),
  ('INJ', 'Injective', 'injective', 'DeFi', 30, 2),
  ('AAVE', 'Aave', 'aave', 'DeFi', 31, 2),
  ('GRT', 'The Graph', 'the-graph', 'Infrastructure', 32, 2),
  ('ALGO', 'Algorand', 'algorand', 'Layer1', 33, 2),
  ('FTM', 'Fantom', 'fantom', 'Layer1', 34, 2),
  ('SAND', 'The Sandbox', 'the-sandbox', 'Gaming', 35, 2),
  ('AXS', 'Axie Infinity', 'axie-infinity', 'Gaming', 36, 2),
  ('MANA', 'Decentraland', 'decentraland', 'Gaming', 37, 2),
  ('THETA', 'Theta Network', 'theta-network', 'Media', 38, 2),
  ('XTZ', 'Tezos', 'tezos', 'Layer1', 39, 2),
  ('EOS', 'EOS', 'eos', 'Layer1', 40, 2),
  ('FLOW', 'Flow', 'flow', 'Layer1', 41, 2),
  ('CRV', 'Curve DAO', 'curve-dao', 'DeFi', 42, 2),
  ('EGLD', 'MultiversX', 'multiversx', 'Layer1', 43, 2),
  ('SNX', 'Synthetix', 'synthetix', 'DeFi', 44, 2),
  ('CHZ', 'Chiliz', 'chiliz', 'Sports', 45, 2),
  ('LDO', 'Lido DAO', 'lido-dao', 'DeFi', 46, 2),
  ('RUNE', 'THORChain', 'thorchain', 'DeFi', 47, 2),
  ('APE', 'ApeCoin', 'apecoin', 'Meme', 48, 2),
  ('KLAY', 'Klaytn', 'klaytn', 'Layer1', 49, 2),
  ('GALA', 'Gala', 'gala', 'Gaming', 50, 2),
  ('NEO', 'Neo', 'neo', 'Layer1', 51, 3),
  ('CAKE', 'PancakeSwap', 'pancakeswap', 'DeFi', 52, 3),
  ('FXS', 'Frax Share', 'frax-share', 'DeFi', 53, 3),
  ('COMP', 'Compound', 'compound', 'DeFi', 54, 3),
  ('ZIL', 'Zilliqa', 'zilliqa', 'Layer1', 55, 3),
  ('ENJ', 'Enjin Coin', 'enjin-coin', 'Gaming', 56, 3),
  ('BAT', 'Basic Attention', 'basic-attention-token', 'Media', 57, 3),
  ('1INCH', '1inch', '1inch', 'DeFi', 58, 3),
  ('DYDX', 'dYdX', 'dydx', 'DeFi', 59, 3),
  ('GMT', 'STEPN', 'stepn', 'Gaming', 60, 3),
  ('YFI', 'yearn.finance', 'yearn-finance', 'DeFi', 61, 3),
  ('MASK', 'Mask Network', 'mask-network', 'Social', 62, 3),
  ('ZRX', '0x', '0x', 'DeFi', 63, 3),
  ('ENS', 'Ethereum Name Service', 'ethereum-name-service', 'Infrastructure', 64, 3),
  ('LRC', 'Loopring', 'loopring', 'Layer2', 65, 3),
  ('SUSHI', 'SushiSwap', 'sushiswap', 'DeFi', 66, 3),
  ('IOTA', 'IOTA', 'iota', 'IoT', 67, 3),
  ('WAVES', 'Waves', 'waves', 'Layer1', 68, 3),
  ('DASH', 'Dash', 'dash', 'Payments', 69, 3),
  ('ZEC', 'Zcash', 'zcash', 'Privacy', 70, 3),
  ('ICX', 'ICON', 'icon', 'Layer1', 71, 3),
  ('QTUM', 'Qtum', 'qtum', 'Layer1', 72, 3),
  ('CELO', 'Celo', 'celo', 'Layer1', 73, 3),
  ('ONE', 'Harmony', 'harmony', 'Layer1', 74, 3),
  ('HOT', 'Holo', 'holo', 'Infrastructure', 75, 3),
  ('KSM', 'Kusama', 'kusama', 'Layer0', 76, 3),
  ('ANKR', 'Ankr', 'ankr', 'Infrastructure', 77, 3),
  ('BAL', 'Balancer', 'balancer', 'DeFi', 78, 3),
  ('SKL', 'SKALE', 'skale', 'Layer2', 79, 3),
  ('STORJ', 'Storj', 'storj', 'Storage', 80, 3),
  ('AUDIO', 'Audius', 'audius', 'Media', 81, 3),
  ('OMG', 'OMG Network', 'omg-network', 'Layer2', 82, 3),
  ('REN', 'Ren', 'ren', 'DeFi', 83, 3),
  ('SXP', 'Solar', 'solar', 'Payments', 84, 3),
  ('CELR', 'Celer Network', 'celer-network', 'Layer2', 85, 3),
  ('REEF', 'Reef', 'reef', 'DeFi', 86, 3),
  ('BAND', 'Band Protocol', 'band-protocol', 'Oracle', 87, 3),
  ('NKN', 'NKN', 'nkn', 'Infrastructure', 88, 3),
  ('OCEAN', 'Ocean Protocol', 'ocean-protocol', 'Data', 89, 3),
  ('ARPA', 'ARPA', 'arpa', 'Privacy', 90, 3),
  ('CTSI', 'Cartesi', 'cartesi', 'Layer2', 91, 3),
  ('DENT', 'Dent', 'dent', 'Telecom', 92, 3),
  ('FET', 'Fetch.ai', 'fetch-ai', 'AI', 93, 3),
  ('IOTX', 'IoTeX', 'iotex', 'IoT', 94, 3),
  ('RLC', 'iExec RLC', 'iexec-rlc', 'Computing', 95, 3),
  ('STMX', 'StormX', 'stormx', 'Rewards', 96, 3),
  ('TRB', 'Tellor', 'tellor', 'Oracle', 97, 3),
  ('UTK', 'Utrust', 'utrust', 'Payments', 98, 3),
  ('WRX', 'WazirX', 'wazirx', 'Exchange', 99, 3),
  ('PEPE', 'Pepe', 'pepe', 'Meme', 100, 3)
ON CONFLICT (symbol) DO NOTHING;

-- Insert common trading pairs
INSERT INTO trading_pairs (pair_symbol, base_symbol, quote_symbol, tier) VALUES
  -- USDT pairs (primary) - Tier 1
  ('BTCUSDT', 'BTC', 'USDT', 1),
  ('ETHUSDT', 'ETH', 'USDT', 1),
  ('BNBUSDT', 'BNB', 'USDT', 1),
  ('SOLUSDT', 'SOL', 'USDT', 1),
  ('XRPUSDT', 'XRP', 'USDT', 1),
  ('DOGEUSDT', 'DOGE', 'USDT', 1),
  ('ADAUSDT', 'ADA', 'USDT', 1),
  ('AVAXUSDT', 'AVAX', 'USDT', 1),
  ('TRXUSDT', 'TRX', 'USDT', 1),
  ('LINKUSDT', 'LINK', 'USDT', 1),
  ('DOTUSDT', 'DOT', 'USDT', 1),
  ('MATICUSDT', 'MATIC', 'USDT', 1),
  ('TONUSDT', 'TON', 'USDT', 1),
  ('SHIBUSDT', 'SHIB', 'USDT', 1),
  ('LTCUSDT', 'LTC', 'USDT', 1),
  ('ATOMUSDT', 'ATOM', 'USDT', 1),
  ('UNIUSDT', 'UNI', 'USDT', 1),
  ('NEARUSDT', 'NEAR', 'USDT', 1),
  ('APTUSDT', 'APT', 'USDT', 1),
  ('ARBUSDT', 'ARB', 'USDT', 1),
  -- BTC pairs - Tier 2
  ('ETHBTC', 'ETH', 'BTC', 2),
  ('BNBBTC', 'BNB', 'BTC', 2),
  ('SOLBTC', 'SOL', 'BTC', 2),
  ('XRPBTC', 'XRP', 'BTC', 2),
  ('ADABTC', 'ADA', 'BTC', 2),
  ('DOTBTC', 'DOT', 'BTC', 2),
  ('LINKBTC', 'LINK', 'BTC', 2),
  ('LTCBTC', 'LTC', 'BTC', 2),
  ('ATOMBTC', 'ATOM', 'BTC', 2),
  ('AVAXBTC', 'AVAX', 'BTC', 2),
  -- ETH pairs - Tier 2
  ('LINKETH', 'LINK', 'ETH', 2),
  ('UNIAETH', 'UNI', 'ETH', 2),
  ('AAVEETH', 'AAVE', 'ETH', 2),
  -- USDC pairs - Tier 2
  ('BTCUSDC', 'BTC', 'USDC', 2),
  ('ETHUSDC', 'ETH', 'USDC', 2),
  ('SOLUSDC', 'SOL', 'USDC', 2)
ON CONFLICT (pair_symbol) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE crypto_coins IS 'Master table for cryptocurrency coin data - parallel to companies table';
COMMENT ON TABLE trading_pairs IS 'Binance trading pairs with trading rules and current prices';
COMMENT ON TABLE crypto_prices IS 'Real-time crypto price cache - updated by cron and WebSocket';
COMMENT ON TABLE crypto_order_book IS 'Order book snapshots for each trading pair';
COMMENT ON TABLE crypto_klines IS 'Candlestick/OHLCV data for charting';
COMMENT ON TABLE crypto_signals IS 'AI-generated trading signals for cryptocurrencies';
COMMENT ON TABLE arena_crypto_holdings IS 'Arena AI model cryptocurrency holdings';
COMMENT ON TABLE arena_crypto_trades IS 'Arena AI model cryptocurrency trade history';
COMMENT ON TABLE arena_crypto_snapshots IS 'Daily snapshots of Arena crypto portfolios';

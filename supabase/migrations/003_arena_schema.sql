-- Mad2Arena - AI Stock Trading Competition Schema
-- Competition: Dec 16, 2025 9am - Dec 15, 2026 5pm (Malaysia Time)

-- AI Participants table
CREATE TABLE IF NOT EXISTS arena_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(50) NOT NULL,
    model_provider VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_color VARCHAR(20) NOT NULL,
    initial_capital DECIMAL(15, 2) DEFAULT 10000.00,
    current_capital DECIMAL(15, 2) DEFAULT 10000.00,
    portfolio_value DECIMAL(15, 2) DEFAULT 10000.00,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_profit_loss DECIMAL(15, 2) DEFAULT 0.00,
    profit_loss_pct DECIMAL(8, 4) DEFAULT 0.00,
    rank INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'disqualified'
    last_trade_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holdings table (current stock positions)
CREATE TABLE IF NOT EXISTS arena_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES arena_participants(id) ON DELETE CASCADE,
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    avg_buy_price DECIMAL(10, 4) NOT NULL,
    current_price DECIMAL(10, 4),
    market_value DECIMAL(15, 2),
    unrealized_pnl DECIMAL(15, 2) DEFAULT 0.00,
    unrealized_pnl_pct DECIMAL(8, 4) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_id, stock_code)
);

-- Trade history table
CREATE TABLE IF NOT EXISTS arena_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES arena_participants(id) ON DELETE CASCADE,
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(255),
    trade_type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 4) NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    fees DECIMAL(10, 2) DEFAULT 0.00,
    realized_pnl DECIMAL(15, 2), -- Only for SELL trades
    reasoning TEXT, -- AI's reasoning for the trade
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily snapshots for charting
CREATE TABLE IF NOT EXISTS arena_daily_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES arena_participants(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    portfolio_value DECIMAL(15, 2) NOT NULL,
    cash_balance DECIMAL(15, 2) NOT NULL,
    holdings_value DECIMAL(15, 2) NOT NULL,
    daily_change DECIMAL(15, 2) DEFAULT 0.00,
    daily_change_pct DECIMAL(8, 4) DEFAULT 0.00,
    cumulative_return_pct DECIMAL(8, 4) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_id, snapshot_date)
);

-- Competition config table
CREATE TABLE IF NOT EXISTS arena_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_name VARCHAR(100) NOT NULL DEFAULT 'Mad2Arena 2025-2026',
    start_date TIMESTAMPTZ NOT NULL DEFAULT '2025-12-16 01:00:00+00', -- 9am MYT = 1am UTC
    end_date TIMESTAMPTZ NOT NULL DEFAULT '2026-12-15 09:00:00+00', -- 5pm MYT = 9am UTC
    initial_capital DECIMAL(15, 2) DEFAULT 10000.00,
    trading_fee_pct DECIMAL(6, 4) DEFAULT 0.0015, -- 0.15% per trade (typical KLSE brokerage)
    min_trade_value DECIMAL(10, 2) DEFAULT 100.00,
    max_position_pct DECIMAL(6, 4) DEFAULT 0.30, -- Max 30% of portfolio in single stock
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Trading decisions log (for debugging/transparency)
CREATE TABLE IF NOT EXISTS arena_ai_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES arena_participants(id) ON DELETE CASCADE,
    decision_type VARCHAR(20) NOT NULL, -- 'ANALYSIS', 'TRADE', 'HOLD'
    stocks_analyzed TEXT[], -- List of stocks analyzed
    market_sentiment VARCHAR(20), -- 'BULLISH', 'BEARISH', 'NEUTRAL'
    decision_summary TEXT,
    raw_response TEXT, -- Full AI response for debugging
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_arena_holdings_participant ON arena_holdings(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_trades_participant ON arena_trades(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_trades_executed ON arena_trades(executed_at);
CREATE INDEX IF NOT EXISTS idx_arena_snapshots_participant ON arena_daily_snapshots(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_snapshots_date ON arena_daily_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_arena_decisions_participant ON arena_ai_decisions(participant_id);

-- Enable RLS
ALTER TABLE arena_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_ai_decisions ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read arena_participants" ON arena_participants FOR SELECT USING (true);
CREATE POLICY "Public read arena_holdings" ON arena_holdings FOR SELECT USING (true);
CREATE POLICY "Public read arena_trades" ON arena_trades FOR SELECT USING (true);
CREATE POLICY "Public read arena_daily_snapshots" ON arena_daily_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read arena_config" ON arena_config FOR SELECT USING (true);
CREATE POLICY "Public read arena_ai_decisions" ON arena_ai_decisions FOR SELECT USING (true);

-- Service role write policies
CREATE POLICY "Service write arena_participants" ON arena_participants FOR ALL USING (true);
CREATE POLICY "Service write arena_holdings" ON arena_holdings FOR ALL USING (true);
CREATE POLICY "Service write arena_trades" ON arena_trades FOR ALL USING (true);
CREATE POLICY "Service write arena_daily_snapshots" ON arena_daily_snapshots FOR ALL USING (true);
CREATE POLICY "Service write arena_config" ON arena_config FOR ALL USING (true);
CREATE POLICY "Service write arena_ai_decisions" ON arena_ai_decisions FOR ALL USING (true);

-- Insert initial AI participants
INSERT INTO arena_participants (model_name, model_provider, display_name, avatar_color) VALUES
    ('claude-3-opus', 'Anthropic', 'Claude', '#FF6B35'),
    ('gpt-4-turbo', 'OpenAI', 'GPT-4', '#10A37F'),
    ('gemini-pro', 'Google', 'Gemini', '#4285F4'),
    ('mistral-large', 'Mistral', 'Mistral', '#FF7000'),
    ('llama-3-70b', 'Meta', 'Llama', '#0668E1'),
    ('grok-1', 'xAI', 'Grok', '#1DA1F2')
ON CONFLICT DO NOTHING;

-- Insert competition config
INSERT INTO arena_config (competition_name, start_date, end_date) VALUES
    ('Mad2Arena 2025-2026', '2025-12-16 01:00:00+00', '2026-12-15 09:00:00+00')
ON CONFLICT DO NOTHING;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_arena_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_arena_participants_updated_at
    BEFORE UPDATE ON arena_participants
    FOR EACH ROW EXECUTE FUNCTION update_arena_updated_at();

CREATE TRIGGER update_arena_holdings_updated_at
    BEFORE UPDATE ON arena_holdings
    FOR EACH ROW EXECUTE FUNCTION update_arena_updated_at();

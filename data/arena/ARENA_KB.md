# Mad2Arena Knowledge Base & Development Guide

> **Purpose**: Persistent knowledge base for Mad2Arena development, combining insights from nof1.ai/AlphaArena and Polymarket to build an expandable AI trading competition platform.

---

## 🎯 CRITICAL DECISIONS MADE

### 1. Knowledge Base Storage (Token-Efficient)
**Location**: `/data/arena/ARENA_KB.md`
- NOT in CLAUDE.md (would burn context every session)
- Only loaded when working on Arena features
- Reference in CLAUDE.md: `For Arena development, see /data/arena/ARENA_KB.md`

### 2. AI Model Selection ($5/day Budget)
**7 Providers, 1 Latest Model Each**:
| Provider | Model | Est. Cost/1K calls | Notes |
|----------|-------|-------------------|-------|
| Anthropic | Claude Sonnet 4 | $0.003 | Balanced performance |
| OpenAI | GPT-4o-mini | $0.00015 | **Cheapest**, good for volume |
| DeepSeek | DeepSeek-V3 | $0.00014 | Very cheap, strong performer |
| Google | Gemini 2.0 Flash | FREE | Free tier, fast |
| xAI | Grok-2 | $0.002 | X platform integration |
| Moonshot | Kimi-K2 | $0.001 | New contender |
| Alibaba | Qwen-Max | $0.002 | Strong Chinese model |

**Budget Allocation ($5/day)**:
- 4 analysis sessions/day × 7 models = 28 API calls
- Each call: ~2K tokens input, ~500 tokens output
- Estimated daily cost: ~$2-3/day (within budget)
- Reserve $2/day for market data APIs

### 3. Competition Structure
**Arena 1: KLSE Malaysia**
- Start: December 27, 2025
- End: January 27, 2026
- Duration: 1 month
- Initial Capital: RM 10,000 per model
- Trading Mode: Single mode (New Baseline) for Phase 1

### 4. Stock Screening Strategy (Cost-Effective)
**Tiered Approach for ~1000 KLSE Stocks**:
| Tier | Stocks | Frequency | Purpose |
|------|--------|-----------|---------|
| 1 | Top 30 (FBM30) | Every 30 min | High liquidity, active trading |
| 2 | Next 70 active | Every 2 hours | Mid-cap opportunities |
| 3 | Remaining ~900 | Once daily (9:30am) | Scan for breakouts |

---

## 📚 KNOWLEDGE BASE (Reference During Development)

### Platform Inspiration Analysis

#### 1. nof1.ai / AlphaArena - AI Trading Competition

**Core Concept**: Real AI models (GPT, Claude, Grok, DeepSeek, Gemini, etc.) competing in real-time stock/crypto trading with actual money.

**Key Features to Learn From**:

| Feature | AlphaArena Approach | Mad2Arena Adaptation |
|---------|---------------------|----------------------|
| Capital | Real $10,000 per AI | Virtual RM 10,000 per AI |
| Markets | US Stocks + Crypto | KLSE → Expand to US, Crypto, Forex |
| Execution | Real trades via Hyperliquid/brokers | Simulated trades |
| Models | 8 AI models | 7 AI models (Claude, GPT, DeepSeek, Gemini, Grok, Kimi, Qwen) |
| Verification | On-chain + broker statements | Database logs + price verification |
| Transparency | Full AI reasoning displayed | Full AI reasoning displayed |

**Trading Modes (AlphaArena's Key Innovation)**:
1. **New Baseline**: Standard trading with memory + news access
2. **Monk Mode**: Capital preservation focus, defensive trading
3. **Situational Awareness**: Can see competitors' rankings
4. **Max Leverage**: Required high-leverage trading

**Future Consideration for Mad2Arena**:
- Standard Mode (current)
- Defensive Mode: Max 5% per position, mandatory stop-loss
- Aggressive Mode: Allow margin/leverage
- News-Reactive Mode: Must trade based on news events

**AI Trading Behaviors Observed**:
- DeepSeek: Trend-following, long-biased, holds through volatility
- Gemini: High-frequency, smaller/faster trades
- ChatGPT: Struggled with timing, low win rate
- Grok: Consistent across modes, best risk management
- Technical analysis dominance (MA, MACD, RSI)
- News integration matters for better performance

---

#### 2. Polymarket - Prediction Markets

**Core Concept**: Users bet on binary outcomes (Yes/No) across various events with real-time probability pricing.

**Key Features**:

| Feature | Polymarket Approach | Mad2Arena Market Adaptation |
|---------|---------------------|----------------------------|
| Market Type | Binary predictions | AI performance predictions |
| Pricing | Probability-based (0.001-0.999) | Same probability system |
| Categories | Politics, Sports, Crypto, Finance | Stocks, Crypto, Forex, Commodities |
| Resolution | Event-based | Competition end date |
| Rewards | Holding rewards, daily rates | Similar reward structure |

**UI/UX Patterns to Adopt**:
- Market cards with outcome probabilities
- Category filtering (All, Stocks, Crypto, Forex)
- Sorting: 24hr Volume, Trending, Popular, Ending Soon
- Portfolio management sidebar
- Quick amount buttons for betting
- Potential return calculator
- Hot/Trending badges

**Market Creation Framework**:
```typescript
interface Market {
  id: string
  question: string  // "Which AI will have highest returns in X?"
  category: "stocks" | "crypto" | "forex" | "commodities"
  endDate: string
  volume: number
  outcomes: {
    modelId: string
    probability: number
    volume: number
  }[]
  status: "live" | "upcoming" | "ended"
  isHot?: boolean
}
```

---

### Current Implementation Status

#### Existing Database Schema (`003_arena_schema.sql`)

**Tables Already Created**:
- `arena_participants`: AI model profiles with performance tracking
- `arena_holdings`: Current stock positions per AI
- `arena_trades`: Complete trade history with reasoning
- `arena_daily_snapshots`: Daily portfolio values for charting
- `arena_config`: Competition settings
- `arena_ai_decisions`: AI reasoning logs for transparency

#### Existing Pages

1. **`/arena`** - Main Arena Page
   - Leaderboard with rankings
   - Performance chart (ArenaChart)
   - Trade history with AI reasoning
   - Competition timer
   - Demo mode with generated trades
   - Link to Mad2Market

2. **`/arena/market`** - Polymarket-style Predictions
   - Market cards with AI probabilities
   - Category tabs (All, Stocks, Crypto, Forex, Commodities)
   - Betting modal with potential returns
   - Portfolio sidebar (demo mode)
   - Search functionality

#### Zustand Store (`stores/arena.ts`)
- Full state management for arena data
- Real-time Supabase subscriptions
- Computed leaderboard and chart data
- Holdings, trades, snapshots management

---

## 📊 UI REQUIREMENTS (Based on AlphaArena)

### "One Glance" Data Table Design
Reference: `/data/modeldata.png`

**Required Columns**:
| Column | Description | Format |
|--------|-------------|--------|
| RANK | Position in leaderboard | #1, #2... |
| MODEL | AI model name + variant | "CLAUDE-SONNET-4" |
| MODE | Trading mode | "NEW BASELINE" |
| ACCT VALUE | Current account balance | RM 10,234.50 |
| RETURN % | Percentage return | +5.23% (green) / -2.10% (red) |
| TOTAL P&L | Profit/Loss in RM | +RM 523.50 |
| FEES | Trading fees paid | RM 45.20 |
| WIN RATE | Winning trade % | 65.4% |
| HIGHEST WIN | Best single trade | +RM 234.50 |
| BIGGEST LOSS | Worst single trade | -RM 156.20 |
| SHARPE | Sharpe ratio | 1.45 |
| TRADES | Total trades executed | 42 |

**Additional Expert Columns** (Mad2Arena Exclusive):
| Column | Description |
|--------|-------------|
| AVG HOLD TIME | Average position duration |
| OPEN POSITIONS | Current active positions |
| MARGIN USED | % of capital in positions |
| MAX DRAWDOWN | Largest peak-to-trough decline |
| PROFIT FACTOR | Gross profit / Gross loss |
| AVG TRADE SIZE | Average position size |

### Advanced Analytics Tab
Reference: `/data/modeldata2.png`

| Column | Description | Why It Matters |
|--------|-------------|----------------|
| AVG TRADE SIZE | Average $ per trade | Shows risk appetite |
| MEDIAN TRADE SIZE | Middle value of trades | Filters outliers |
| AVG HOLD | Average hold time | Day trader vs swing |
| MEDIAN HOLD | Middle hold time | True holding pattern |
| LONG % | % of long positions | Bullish/bearish bias |
| EXPECTANCY | Expected $ per trade | Key profitability metric |
| MEDIAN LEVERAGE | Middle leverage used | Risk management style |
| AVG LEVERAGE | Average leverage | Overall risk exposure |
| MEDIAN CONFIDENCE | AI's confidence level | Decision certainty |

### Formula Calculations

```typescript
// Expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

// Sharpe Ratio = (Return - RiskFreeRate) / StdDev
const sharpeRatio = (portfolioReturn - 0.03) / stdDeviation;

// Profit Factor = Gross Profit / Gross Loss
const profitFactor = totalWins / Math.abs(totalLosses);

// Max Drawdown = (Peak - Trough) / Peak
const maxDrawdown = (peakValue - troughValue) / peakValue;

// Sortino Ratio = (Return - RiskFreeRate) / DownsideDeviation
const sortinoRatio = (portfolioReturn - 0.03) / downsideStdDev;
```

---

## 📋 IMPLEMENTATION ARCHITECTURE

### Expandable Multi-Market System

```
/src/lib/arena/
├── core/
│   ├── types.ts           # Universal types for all markets
│   ├── engine.ts          # Trading engine (market-agnostic)
│   └── portfolio.ts       # Portfolio management
├── markets/
│   ├── base.ts            # Base market interface
│   ├── klse/              # Malaysia market
│   │   ├── config.ts      # KLSE-specific config
│   │   ├── data.ts        # KLSE data fetching
│   │   └── rules.ts       # KLSE trading rules
│   ├── us/                # US market (future)
│   ├── crypto/            # Crypto market (future)
│   └── forex/             # Forex market (future)
├── ai/
│   ├── providers/
│   │   ├── claude.ts
│   │   ├── openai.ts
│   │   ├── deepseek.ts
│   │   ├── gemini.ts
│   │   ├── grok.ts
│   │   ├── kimi.ts
│   │   └── qwen.ts
│   ├── prompts/
│   │   ├── analysis.ts    # Market analysis prompt
│   │   ├── trading.ts     # Trading decision prompt
│   │   └── reasoning.ts   # Explain decision prompt
│   └── router.ts          # AI provider router
└── cron/
    ├── screening.ts       # Stock screening job
    ├── trading.ts         # Trading execution job
    └── snapshot.ts        # Daily snapshot job
```

### Cron Job Schedule

| Job | Frequency | Time (MYT) | Purpose |
|-----|-----------|------------|---------|
| tier1_screening | 30 min | 9:00-17:00 | Screen FBM30 stocks |
| tier2_screening | 2 hours | 9:00-17:00 | Screen mid-cap stocks |
| tier3_screening | daily | 9:30 | Full market scan |
| trading_session | 1 hour | 9:30-16:30 | Execute AI trading decisions |
| price_update | 5 min | 9:00-17:30 | Update holding prices |
| daily_snapshot | daily | 17:30 | Save daily portfolio values |
| weekly_metrics | weekly | Sunday 20:00 | Calculate Sharpe, drawdown |

---

## 🔧 COST OPTIMIZATION STRATEGIES

### 1. Prompt Caching
- Cache market data summaries
- Reuse technical indicator calculations
- Share news context across models

### 2. Batch Processing
- Group multiple stocks in single AI call
- Use cheaper models for screening, expensive for final decisions

### 3. Smart Triggers
- Only call AI when significant price movement (>2%)
- Skip analysis if market is flat
- Increase frequency during high volatility

### 4. Model Selection by Task
| Task | Recommended Model | Reason |
|------|-------------------|--------|
| Initial Screening | GPT-4o-mini / DeepSeek | Cheapest |
| Trading Decision | All 7 models | Fair competition |
| Reasoning Explain | Gemini Flash | Free tier |

---

## 🚀 CO-FOUNDER VISION

### Expert Features (Beyond AlphaArena)

1. **AI Decision Timeline** - Real-time stream of AI thinking
2. **Head-to-Head Comparisons** - Direct model comparisons
3. **Strategy Breakdown Panel** - Detected trading styles
4. **Risk-Adjusted Leaderboard** - Sharpe, Sortino, Calmar ratios
5. **Live Position Heatmap** - Visual grid of positions
6. **Earnings Calendar Integration** - Track AI behavior around earnings
7. **Sector Allocation Chart** - Portfolio breakdown by sector
8. **Drawdown Alert System** - Real-time alerts

### Differentiation from AlphaArena

| AlphaArena | Mad2Arena Advantage |
|------------|---------------------|
| US/Crypto focus | Multi-market (MY, SG, HK, US, Crypto, Forex) |
| English only | Multi-language (EN, ZH, BM) |
| Real money only | Simulation + Real (safer, broader audience) |
| 4 modes, complex | Simple start, progressive complexity |
| No user interaction | User predictions via Mad2Market |
| No community | Community features, discussions |
| Paid only | Freemium model, accessible |

### Monetization Strategies

**Freemium Model**:
| Free | Premium (RM 29/mo) | Pro (RM 99/mo) |
|------|-------------------|----------------|
| Delayed data (15min) | Real-time data | Real-time + alerts |
| Basic leaderboard | Advanced analytics | Full API access |
| 3 predictions/day | Unlimited predictions | White-label reports |
| Ad-supported | Ad-free | Priority support |

---

## 🔗 SOURCE REFERENCES

1. **AlphaArena Analysis**: `/data/alphaarena.txt`
2. **Overall Stats UI**: `/data/modeldata.png`
3. **Advanced Analytics UI**: `/data/modeldata2.png`
4. **Polymarket**: https://polymarket.com/
5. **Existing Schema**: `/supabase/migrations/003_arena_schema.sql`
6. **Arena Store**: `/src/stores/arena.ts`
7. **Arena Page**: `/src/app/arena/page.tsx`
8. **Market Page**: `/src/app/arena/market/page.tsx`

---

## ✅ IMPLEMENTATION PRIORITY

### Phase 1: Core Platform (Dec 21-27, 2025)
1. **Day 1-2**: AI Provider Setup
2. **Day 3-4**: Trading Engine
3. **Day 5-6**: UI Development
4. **Day 7**: Testing & Launch (Dec 27, 2025)

### Phase 2: Analytics & Polish (Jan 2026)
### Phase 3: User Engagement (Feb 2026)
### Phase 4: Expansion (Mar 2026+)

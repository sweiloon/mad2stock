# Interactive Charts Implementation Plan

## Executive Summary

This plan outlines the implementation of professional, interactive TradingView-style charts across the Mad2Stock platform. The goal is to transform the platform into a professional-grade stock analysis tool with real-time data, technical indicators, and an intuitive user experience.

---

## Phase 1: Foundation & Infrastructure (Priority: HIGH)

### 1.1 TradingView Lightweight Charts Component

**File:** `src/components/charts/TradingViewChart.tsx`

**Features:**
- Candlestick, Line, Area, Bar chart types
- Dark/Light theme support (auto-detect from system)
- Responsive sizing with ResizeObserver
- Real-time data updates via WebSocket-ready architecture
- Crosshair with tooltip displaying OHLCV data

**Technical Indicators (Built-in):**
- Moving Averages (SMA, EMA - 5, 10, 20, 50, 200 periods)
- Volume histogram with color coding
- MACD (12, 26, 9 default)
- RSI (14 default)
- Bollinger Bands (20, 2)

### 1.2 Data Fetching Infrastructure

**File:** `src/lib/stock-data.ts`

**Data Sources (Priority Order):**
1. **KLSE Screener** - Primary source for Malaysian stocks
2. **Yahoo Finance API** - Fallback for historical data
3. **Alpha Vantage** - Additional technical data (if API key available)

**API Routes:**
- `GET /api/stocks/history?symbol=GAMUDA&range=1Y` - Historical OHLCV data
- `GET /api/stocks/intraday?symbol=GAMUDA` - Intraday data (5min intervals)
- `GET /api/stocks/quote?symbol=GAMUDA` - Real-time quote

**Caching Strategy:**
- Historical data: 24-hour cache in Supabase
- Intraday data: 5-minute cache
- Real-time quotes: 1-minute cache during market hours

---

## Phase 2: Company Profile Page Enhancement (Priority: HIGH)

### Current State:
- Simple SVG chart with mock data
- No interactivity
- No technical indicators

### Target State:
- Full TradingView-style interactive chart
- Timeline selector: 1D, 1W, 1M, 3M, 6M, 1Y, ALL
- Chart type selector: Candlestick, Line, Area
- Technical indicators panel
- Volume subplot

### Layout Structure:
```
┌─────────────────────────────────────────────────────────┐
│ [Company Header: GAMUDA - Gamuda Berhad]    [KLSE Link] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ Price   │ │ Change  │ │ Volume  │ │ Range   │        │
│ │ RM 4.50 │ │ +0.12   │ │ 2.5M    │ │ 4.38-   │        │
│ │         │ │ (+2.7%) │ │         │ │ 4.52    │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│ [1D] [1W] [1M] [3M] [6M] [1Y] [ALL]  │ [📊] [📈] [🔧] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │              MAIN PRICE CHART (400px)               │ │
│ │           Candlestick with Moving Averages          │ │
│ │                                                     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │              VOLUME SUBPLOT (80px)                  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │              MACD SUBPLOT (80px) [Optional]         │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │              RSI SUBPLOT (60px) [Optional]          │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [YoY Performance Card]    [QoQ Performance Card]        │
├─────────────────────────────────────────────────────────┤
│ [Company Info]            [Documents]                   │
└─────────────────────────────────────────────────────────┘
```

### Implementation Files:
1. `src/components/charts/TradingViewChart.tsx` - Main chart component
2. `src/components/charts/ChartToolbar.tsx` - Timeline & type selectors
3. `src/components/charts/IndicatorPanel.tsx` - Technical indicators toggle
4. `src/hooks/use-stock-history.ts` - Data fetching hook
5. `src/app/api/stocks/history/route.ts` - Historical data API

---

## Phase 3: Arena Page Redesign (Priority: HIGH)

### Current Issues:
- Chart is not the focal point
- Users can't see real-time trading action
- Layout doesn't emphasize the competition aspect

### Target State:
- Large, prominent chart showing all 5 AI models' portfolio performance
- Real-time trade markers on chart
- Live P&L comparison
- Stock-specific charts when AI makes trades

### Layout Structure (TradingView-inspired):
```
┌─────────────────────────────────────────────────────────────────┐
│ Mad2Arena - AI Trading Competition                    [LIVE] 🔴 │
├───────────────────────────────────┬─────────────────────────────┤
│                                   │  LEADERBOARD               │
│                                   │  ┌───────────────────────┐  │
│    MAIN PERFORMANCE CHART         │  │ 1. 🤖 Claude    +5.2% │  │
│    (Multi-line: 5 AI models)      │  │ 2. 🤖 DeepSeek +4.8% │  │
│    Portfolio Value Over Time      │  │ 3. 🤖 ChatGPT  +3.1% │  │
│    [500px height]                 │  │ 4. 🤖 Grok     +2.4% │  │
│                                   │  │ 5. 🤖 Gemini   +1.9% │  │
│    Trade markers: ▲ Buy ▼ Sell    │  └───────────────────────┘  │
│                                   │                             │
│                                   │  ACTIVE HOLDINGS            │
│                                   │  [Selected AI's positions]  │
├───────────────────────────────────┴─────────────────────────────┤
│  [1H] [4H] [1D] [1W] [ALL]              [Portfolio] [P&L Chart] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                   TRADE HISTORY STREAM                      │ │
│ │  🤖 Claude bought GAMUDA @ RM4.50 (1000 shares)   2min ago │ │
│ │  🤖 DeepSeek sold ECOWLD @ RM1.25 (+8.2%)         5min ago │ │
│ │  🤖 ChatGPT bought AEONCR @ RM15.20 (500 shares)  8min ago │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  AI MODEL CARDS (Horizontal scroll or Grid)                     │
│  [Claude] [DeepSeek] [ChatGPT] [Grok] [Gemini]                 │
│  Click to see individual model's trades & holdings              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features:
1. **Multi-line Performance Chart** - All 5 AIs on one chart with different colors
2. **Trade Markers** - Visual indicators when AI buys/sells
3. **Real-time Updates** - WebSocket or polling for live data
4. **AI Comparison** - Side-by-side performance metrics
5. **Stock Mini-Charts** - Show the stock chart when an AI trades it

---

## Phase 4: Dashboard Enhancement (Priority: MEDIUM)

### Current State:
- No stock charts
- Only performance metrics and tables

### Target State:
- Market overview chart (KLCI or top stocks composite)
- Mini sparkline charts for top performers
- Sector performance heatmap

### Layout Addition:
```
┌─────────────────────────────────────────────────────────┐
│ MARKET OVERVIEW                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │    KLCI / Top Movers Composite Chart (200px)        │ │
│ │    Simple line chart with 1W performance            │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ TOP PERFORMERS                                          │
│ [UWC  ▁▂▃▅▆ +8.2%] [GAMUDA ▃▄▅▆▇ +5.1%] [...]         │
│ Mini sparkline charts for quick visual                  │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 5: Technical Indicators Implementation

### Indicators to Implement:

| Indicator | Priority | Description |
|-----------|----------|-------------|
| SMA | HIGH | Simple Moving Average (10, 20, 50, 200) |
| EMA | HIGH | Exponential Moving Average |
| Volume | HIGH | Volume bars with color coding |
| MACD | HIGH | Moving Average Convergence Divergence |
| RSI | HIGH | Relative Strength Index (14) |
| Bollinger Bands | MEDIUM | Volatility bands |
| VWAP | MEDIUM | Volume Weighted Average Price |
| Stochastic | LOW | Momentum oscillator |
| ATR | LOW | Average True Range |

### Indicator Panel UI:
```
┌─────────────────────────────────────┐
│ Technical Indicators           [X]  │
├─────────────────────────────────────┤
│ OVERLAYS                            │
│ ☑ SMA (20)  ☐ SMA (50)  ☐ SMA (200)│
│ ☐ EMA (12)  ☐ EMA (26)             │
│ ☐ Bollinger Bands                   │
├─────────────────────────────────────┤
│ SUBPLOTS                            │
│ ☑ Volume                            │
│ ☐ MACD (12, 26, 9)                  │
│ ☐ RSI (14)                          │
│ ☐ Stochastic                        │
└─────────────────────────────────────┘
```

---

## Phase 6: Data Sources & API Integration

### 6.1 Historical Data API

**Endpoint:** `GET /api/stocks/history`

**Query Parameters:**
- `symbol` - Stock code (e.g., "GAMUDA", "5398")
- `range` - Time range: "1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"
- `interval` - Data interval: "1m", "5m", "15m", "1h", "1d", "1w"

**Response:**
```json
{
  "symbol": "GAMUDA",
  "data": [
    {
      "time": 1702339200,
      "open": 4.45,
      "high": 4.52,
      "low": 4.42,
      "close": 4.50,
      "volume": 2500000
    }
  ],
  "meta": {
    "currency": "MYR",
    "exchange": "KLSE",
    "lastUpdated": "2024-12-14T10:30:00Z"
  }
}
```

### 6.2 Data Source Integration

**Primary: KLSE Screener Scraping**
```typescript
// Scrape from: https://www.klsescreener.com/v2/stocks/chart/GAMUDA
// Extract: OHLCV data from embedded JSON
```

**Fallback: Yahoo Finance**
```typescript
// Use: yahoo-finance2 npm package
// Endpoint: chart endpoint with Malaysian stock suffix (.KL)
// Example: "5398.KL" for GAMUDA
```

**Caching Strategy:**
- Store historical data in Supabase `stock_history` table
- Refresh daily after market close (5:30pm MYT)
- Intraday data refreshed every 5 minutes during market hours

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Create TradingViewChart component with basic candlestick
- [ ] Implement historical data API with Yahoo Finance fallback
- [ ] Add volume subplot
- [ ] Create timeline selector component

### Week 2: Company Profile
- [ ] Replace SVG chart with TradingView component
- [ ] Add technical indicators (SMA, EMA)
- [ ] Implement MACD subplot
- [ ] Add RSI subplot

### Week 3: Arena Redesign
- [ ] Create multi-line performance chart
- [ ] Add trade markers on chart
- [ ] Redesign layout for chart prominence
- [ ] Implement real-time updates

### Week 4: Polish & Dashboard
- [ ] Add sparkline charts to dashboard
- [ ] Market overview widget
- [ ] Performance optimization
- [ ] Mobile responsiveness

---

## File Structure

```
src/
├── components/
│   └── charts/
│       ├── TradingViewChart.tsx      # Main chart component
│       ├── ChartToolbar.tsx          # Timeline & type selectors
│       ├── IndicatorPanel.tsx        # Technical indicators UI
│       ├── VolumeChart.tsx           # Volume subplot
│       ├── MACDChart.tsx             # MACD subplot
│       ├── RSIChart.tsx              # RSI subplot
│       ├── Sparkline.tsx             # Mini inline charts
│       └── index.ts                  # Exports
├── hooks/
│   ├── use-stock-history.ts          # Fetch historical data
│   ├── use-realtime-quote.ts         # WebSocket/polling quotes
│   └── use-technical-indicators.ts   # Calculate indicators
├── lib/
│   ├── stock-data.ts                 # Data fetching utilities
│   ├── indicators.ts                 # Technical indicator calculations
│   └── chart-utils.ts                # Chart helper functions
└── app/
    └── api/
        └── stocks/
            ├── history/route.ts      # Historical OHLCV data
            ├── intraday/route.ts     # Intraday data
            └── indicators/route.ts   # Pre-calculated indicators
```

---

## Technical Requirements

### Dependencies (Already Installed):
- `lightweight-charts` - TradingView chart library
- `recharts` - For simpler charts (Arena performance)

### May Need to Add:
- `yahoo-finance2` - Yahoo Finance API wrapper
- `technicalindicators` - Technical indicator calculations
- `date-fns` - Date manipulation

### Performance Considerations:
1. Use `useMemo` for indicator calculations
2. Implement data windowing for large datasets
3. Lazy load chart components
4. Use WebWorkers for heavy calculations

---

## Success Metrics

1. **Chart Load Time:** < 500ms for initial render
2. **Data Freshness:** Real-time quotes within 1 minute
3. **User Engagement:** Increased time on company profile pages
4. **Mobile Experience:** Fully responsive on tablets and phones
5. **Indicator Accuracy:** Match TradingView calculations within 0.01%

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| KLSE Screener blocking | High | Yahoo Finance fallback ready |
| Rate limiting | Medium | Aggressive caching, request queuing |
| Large data volume | Medium | Data windowing, pagination |
| Mobile performance | Medium | Lazy loading, reduced indicators |

---

## Approval Checklist

- [ ] Technical feasibility confirmed
- [ ] Data sources validated
- [ ] Performance requirements achievable
- [ ] Timeline realistic
- [ ] Resources available

---

*Plan Version: 1.0*
*Created: December 14, 2024*
*Author: Claude Code*

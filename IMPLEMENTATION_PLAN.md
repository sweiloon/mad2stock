# Mad2Stock - Complete Implementation Plan

*Last Updated: December 17, 2024*
*Version: 3.0*

---

## Platform Vision

**Mad2Stock** is a Stock Market Data Analysis and Community Platform focused on the Malaysian market (KLSE). The platform provides:

1. **Comprehensive Company Data** - All ~1,000 KLSE listed companies with real-time pricing, financials, and key metrics
2. **AI-Powered Signals** - Professional trading signals based on real-time data and news analysis
3. **Mad2Arena** - AI Trading Competition where different AI models compete (Launch: December 24, 2025)
4. **AI Chat** - Company-specific Q&A with intelligent insights
5. **Content Creator** - AI-generated content for social media (Phase 2)

**Future Expansion**: Other stock markets, Forex, Crypto

---

## Current Status Assessment

### What's Working
| Component | Status |
|-----------|--------|
| Next.js 14 Infrastructure | ✅ |
| Supabase Database (17 tables) | ✅ |
| UI Components (shadcn) | ✅ |
| Arena Page (Demo Mode) | ✅ |
| 83 Company Reports/PDFs | ✅ |
| Stock Code Mappings (~959) | ✅ |

### Critical Blockers
| Issue | Impact | Priority |
|-------|--------|----------|
| No real-time stock prices | Platform unusable | 🔴 CRITICAL |
| Company data not in database | Users can't see companies | 🔴 CRITICAL |
| Yahoo Finance API failing | No price updates | 🔴 CRITICAL |

### Sections to Remove
- **Add Companies Page** - Will be removed (backend manual entry only)

---

## Phase 0: Foundation - Real-Time Data Solution (PRIORITY)

### The Core Problem
We need real-time/near-real-time stock data for ~1,000 KLSE companies. This is the foundation for everything else.

### Solution Options Analysis

#### Option A: Yahoo Finance API (Current - NOT WORKING)
```
Endpoint: https://query1.finance.yahoo.com/v7/finance/quote?symbols={CODE}.KL
```

**Pros:**
- Free
- Covers all KLSE stocks
- 15-20 min delay (acceptable)

**Cons:**
- Currently failing (needs debugging)
- Rate limits unclear
- May block server IPs

**Status:** 🔴 Needs investigation - why are prices NULL?

---

#### Option B: KLSE Screener Scraping
```
URL: https://www.klsescreener.com/v2/stocks/view/{CODE}
```

**Pros:**
- Most accurate Malaysian data
- Real-time during market hours
- All company info available

**Cons:**
- Cloudflare protection
- May block automated requests
- Scraping terms of service

**Implementation:**
```typescript
// Use puppeteer/playwright for Cloudflare bypass
// Or use residential proxy service
```

---

#### Option C: Bursa Malaysia Official API
```
Contact: https://www.bursamalaysia.com/market_information/market_data_solutions
```

**Pros:**
- Official data source
- Most reliable
- Real-time available

**Cons:**
- Paid service (need quote)
- Requires business registration

**Action:** Contact for pricing

---

#### Option D: i3investor.com API/Scraping
```
URL: https://klse.i3investor.com/web/stock/overview/{CODE}
```

**Pros:**
- Good Malaysian stock data
- Community sentiment data
- News integration

**Cons:**
- Scraping required
- Rate limits

---

#### Option E: Investing.com Unofficial API
```
Endpoint: Through their widget/embed system
```

**Pros:**
- Global coverage
- Free tier available

**Cons:**
- Unofficial
- May change without notice

---

#### Option F: TradingView Widget (Display Only)
```html
<!-- TradingView Widget BEGIN -->
<script src="https://s3.tradingview.com/tv.js"></script>
<script>
new TradingView.widget({
  "symbol": "MYX:GAMUDA",
  "interval": "D",
  ...
});
</script>
```

**Pros:**
- Professional charts immediately
- Real-time data displayed
- No API needed for display

**Cons:**
- Cannot store data in our DB
- Limited customization
- External dependency

---

### Recommended Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DISPLAY LAYER (Immediate)                                       │
│  └─ TradingView Widgets for charts (no backend needed)          │
│                                                                  │
│  DATA LAYER (Priority Order)                                    │
│  └─ PRIMARY: Yahoo Finance API (fix current issue)              │
│  └─ BACKUP 1: i3investor.com scraping                           │
│  └─ BACKUP 2: Investing.com unofficial API                      │
│  └─ BACKUP 3: KLSE Screener (last resort - has protection)      │
│  └─ Store in Supabase: stock_prices table                       │
│                                                                  │
│  STATIC DATA (One-time import)                                  │
│  └─ Company info: Name, Sector, Description                     │
│  └─ Source: Manual import from all-klse-companies.txt           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 0 Tasks

#### 0.1 Debug Yahoo Finance (Day 1-2)
- [ ] Read and analyze `src/lib/yahoo-finance.ts`
- [ ] Test API call manually with curl
- [ ] Check if .KL suffix is correct
- [ ] Verify response parsing
- [ ] Fix and test with 5 stocks first
- [ ] Scale to all stocks

#### 0.2 Import Basic Company Data (Day 2-3)
- [ ] Parse `data/analysis/all-klse-companies.txt`
- [ ] Extract: Code, Name, Sector
- [ ] Import to `companies` table
- [ ] Verify all ~1000 companies imported

#### 0.3 TradingView Integration (Day 3-4)
- [ ] Create TradingViewWidget component
- [ ] Integrate into Company Profile page
- [ ] Add timeline controls (1D, 1W, 1M, 3M, 6M, 1Y)
- [ ] Add indicator toggles (RSI, MACD, etc.)

#### 0.4 Remove Add Companies Section (Day 4)
- [ ] Delete `src/app/add-company/` folder
- [ ] Remove navigation links
- [ ] Clean up related API routes
- [ ] Remove unused database tables (if any)

---

## Phase 1: Company Data & Profile

### 1.1 Company Data Requirements

Based on your Ecoworld example, each company needs:

| Data Point | Source | Priority |
|------------|--------|----------|
| Stock Code | all-klse-companies.txt | HIGH |
| Company Name | all-klse-companies.txt | HIGH |
| Current Price | Yahoo Finance / API | HIGH |
| Price Change (%) | Yahoo Finance / API | HIGH |
| Volume | Yahoo Finance / API | HIGH |
| Market Cap | Yahoo Finance / API | HIGH |
| P/E Ratio | Yahoo Finance / API | MEDIUM |
| Dividend Yield | Yahoo Finance / API | MEDIUM |
| 52-Week High/Low | Yahoo Finance / API | MEDIUM |
| Sector | all-klse-companies.txt | HIGH |
| Business Description | Manual / Scraped | LOW |
| Revenue (Latest) | Report files | MEDIUM |
| Profit (Latest) | Report files | MEDIUM |

### 1.2 Company Listing Page (`/companies`)

**Target UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  All Companies                      [Search] [Filter by Sector] │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ CODE    NAME           PRICE    CHANGE   VOLUME    SECTOR   ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ GAMUDA  Gamuda Bhd     4.50     +2.3%    2.5M     Construct ││
│  │ ECOWLD  Eco World      0.935    -0.5%    1.2M     Property  ││
│  │ MAYBANK Malayan Bank   9.85     +0.8%    5.1M     Finance   ││
│  │ ...                                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                         [1] [2] [3] ... [50]                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Company Profile Page (`/companies/[code]`)

**Target UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ECOWLD - Eco World Development Group Bhd           [★ Watch]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ RM 0.935 │ │ -0.53%   │ │ 1.2M Vol │ │ P/E 12.5 │           │
│  │ Price    │ │ Change   │ │ Volume   │ │ Ratio    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │           TRADINGVIEW CHART (Full Interactive)              ││
│  │           [1D] [1W] [1M] [3M] [6M] [1Y] [ALL]               ││
│  │           Indicators: [RSI] [MACD] [MA] [BB]                ││
│  │                                                              ││
│  │                        (400px height)                        ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  KEY METRICS                                                    │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │ Market Cap  │ 52W High    │ 52W Low     │ Div Yield   │     │
│  │ RM 2.5B     │ RM 1.25     │ RM 0.85     │ 2.5%        │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  AI INSIGHTS                                    [Ask AI ▶]      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Based on recent data analysis:                               ││
│  │ • Revenue grew 15% YoY in latest quarter                    ││
│  │ • Property sector showing recovery signals                   ││
│  │ • Technical: RSI at 45 (neutral), MACD bullish crossover    ││
│  │                                                              ││
│  │ ⚠️ Disclaimer: This is AI analysis, not investment advice   ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  ABOUT COMPANY                                                  │
│  Eco World Development Group Berhad is a property developer... │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Tasks
- [ ] Update companies table schema for all required fields
- [ ] Create data import script for ~1000 companies
- [ ] Implement company listing with pagination
- [ ] Integrate TradingView widget in profile
- [ ] Add key metrics display
- [ ] Create AI Insights component with disclaimer

---

## Phase 2: AI Signal Section

### 2.1 Signal Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SIGNAL GENERATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DATA INPUTS                                                     │
│  ├─ Real-time stock prices                                      │
│  ├─ Historical price data (technical analysis)                  │
│  ├─ Company financials (revenue, profit, margins)               │
│  ├─ News feeds (RSS, scraped headlines)                         │
│  └─ Market sentiment indicators                                  │
│                                                                  │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              EXPERT TRADER AI (OpenAI GPT-4)                ││
│  │                                                              ││
│  │  System Prompt: Professional Trader Persona                  ││
│  │  + Technical Analysis Rules                                  ││
│  │  + Risk Management Framework                                 ││
│  │  + Malaysian Market Context                                  ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│         ▼                                                        │
│  SIGNAL OUTPUT                                                   │
│  ├─ Signal Type: BUY / SELL / HOLD                              │
│  ├─ Confidence: Strong / Moderate / Weak                        │
│  ├─ Target Price                                                │
│  ├─ Stop Loss                                                   │
│  ├─ Time Horizon: Short / Medium / Long                         │
│  ├─ Analysis Summary                                            │
│  ├─ Data Sources Used                                           │
│  └─ Risk Warnings                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Signal Display Requirements

Each signal must show:
1. **Signal Details** - BUY/SELL/HOLD, target, stop loss
2. **Analysis Basis** - Why this signal was generated
3. **Data Sources** - What data/news triggered it
4. **Technical Indicators** - RSI, MACD, MA status
5. **Fundamental Data** - Revenue trends, P/E comparison
6. **News Impact** - Related news articles
7. **Risk Assessment** - Potential downside
8. **Disclaimer** - Not investment advice

### 2.3 Expert Trader Prompt (Secret Sauce)

**Location:** `src/lib/prompts/expert-trader.ts`

```typescript
export const EXPERT_TRADER_PROMPT = `
You are an Expert Malaysian Stock Market Analyst with 20+ years of experience trading on Bursa Malaysia (KLSE). You combine technical analysis, fundamental analysis, and market sentiment to generate professional trading signals.

## YOUR EXPERTISE
- Certified Technical Analyst (CMT)
- Deep understanding of Malaysian market dynamics
- Experience with KLSE sectors: Banking, Property, Technology, Plantation, Construction
- Risk management specialist

## ANALYSIS FRAMEWORK

### Technical Analysis (40% weight)
1. **Trend Analysis**
   - Identify primary trend (bullish/bearish/sideways)
   - Support and resistance levels
   - Moving averages (20, 50, 200 EMA)

2. **Momentum Indicators**
   - RSI: Overbought (>70), Oversold (<30)
   - MACD: Signal line crossovers, histogram divergence
   - Stochastic: %K and %D crossovers

3. **Volume Analysis**
   - Volume confirmation of price moves
   - Unusual volume spikes
   - Volume trend

4. **Chart Patterns**
   - Head & shoulders, double tops/bottoms
   - Triangles, flags, wedges
   - Breakout/breakdown signals

### Fundamental Analysis (35% weight)
1. **Financial Health**
   - Revenue growth (YoY, QoQ)
   - Profit margins
   - Debt-to-equity ratio
   - Cash flow status

2. **Valuation**
   - P/E ratio vs sector average
   - P/B ratio
   - Dividend yield

3. **Business Quality**
   - Market position
   - Competitive advantages
   - Management quality

### Market Sentiment (25% weight)
1. **News Impact**
   - Company announcements
   - Sector news
   - Economic indicators

2. **Market Context**
   - KLCI trend
   - Foreign fund flows
   - Ringgit movement

## SIGNAL GENERATION RULES

### BUY SIGNAL (Strong)
- Technical: Bullish breakout + RSI < 70 + MACD bullish crossover
- Fundamental: Revenue/Profit growth > 10% + P/E below sector average
- Sentiment: Positive news + sector tailwinds

### BUY SIGNAL (Moderate)
- Technical: Above 50 EMA + RSI 40-60 + Volume increasing
- Fundamental: Stable financials + reasonable valuation
- Sentiment: Neutral to slightly positive

### SELL SIGNAL (Strong)
- Technical: Breakdown below support + RSI > 70 + MACD bearish
- Fundamental: Declining revenue + deteriorating margins
- Sentiment: Negative news + sector headwinds

### HOLD SIGNAL
- Mixed technical signals
- Waiting for confirmation
- Sideways price action

## OUTPUT FORMAT

For each analysis, provide:
1. **SIGNAL**: [BUY/SELL/HOLD] - [STRONG/MODERATE/WEAK]
2. **ENTRY PRICE**: Current optimal entry
3. **TARGET PRICE**: Based on resistance/support
4. **STOP LOSS**: Risk management level
5. **TIME HORIZON**: [1-2 weeks / 1-3 months / 6+ months]

**ANALYSIS BREAKDOWN**:
- Technical Score: X/10
- Fundamental Score: X/10
- Sentiment Score: X/10
- Overall Confidence: X%

**KEY FACTORS**:
1. [Primary reason for signal]
2. [Secondary supporting factor]
3. [Third factor]

**RISKS TO CONSIDER**:
1. [Main risk]
2. [Secondary risk]

**DATA SOURCES USED**:
- Price data as of [date]
- Financial data from [quarter]
- News: [headline if relevant]

## IMPORTANT DISCLAIMERS
- This analysis is for educational purposes only
- Not a recommendation to buy or sell securities
- Past performance does not guarantee future results
- Always do your own research
- Consult a licensed financial advisor
- Trading involves risk of capital loss
`;
```

### 2.4 Signal Page Tasks
- [ ] Create Expert Trader prompt file
- [ ] Design signal card component with all required fields
- [ ] Implement signal generation API endpoint
- [ ] Add news feed integration (RSS/scraping)
- [ ] Create notification system for new signals
- [ ] Add disclaimer prominently on all signal displays
- [ ] Implement signal history/archive

---

## Phase 3: AI Chat Enhancement

### 3.1 Chat Requirements

**Current Issues:**
- Not company-specific
- Generic responses
- No context awareness

**Target State:**
- User selects a company first
- Chat has full context of that company
- Provides specific insights and data
- Answers any company-related question

### 3.2 Chat Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  AI CHAT - Company Analysis                                     │
├─────────────────────────────────────────────────────────────────┤
│  Select Company: [ECOWLD - Eco World ▼]                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🤖 Welcome! I'm your AI analyst for Eco World (ECOWLD).    ││
│  │    I have access to:                                        ││
│  │    • Real-time stock data                                   ││
│  │    • Historical financials                                  ││
│  │    • Recent news and announcements                          ││
│  │    • Technical indicators                                   ││
│  │                                                              ││
│  │    What would you like to know?                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [User]: What's the current financial health of this company?   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🤖 Based on the latest Q3 2024 financial report:           ││
│  │                                                              ││
│  │ **Revenue**: RM 2.3B (+15% YoY)                             ││
│  │ **Net Profit**: RM 180M (+8% YoY)                           ││
│  │ **Net Margin**: 7.8% (stable)                               ││
│  │ **Debt/Equity**: 0.65 (healthy)                             ││
│  │                                                              ││
│  │ The company shows solid financial health with improving     ││
│  │ revenue and stable margins. The debt level is manageable... ││
│  │                                                              ││
│  │ 📊 Source: Q3 2024 Financial Report                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Type your question...]                            [Send ▶]    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Chat System Prompt

```typescript
export const COMPANY_CHAT_PROMPT = (companyData: CompanyData) => `
You are an AI Financial Analyst assistant for Mad2Stock platform, specialized in Malaysian stock market analysis.

## CURRENT CONTEXT
You are analyzing: ${companyData.name} (${companyData.code})
Sector: ${companyData.sector}

## AVAILABLE DATA
- Current Price: RM ${companyData.price}
- Price Change: ${companyData.changePercent}%
- Market Cap: RM ${companyData.marketCap}
- P/E Ratio: ${companyData.peRatio}
- 52W High: RM ${companyData.high52w}
- 52W Low: RM ${companyData.low52w}
- Latest Revenue: RM ${companyData.revenue}
- Latest Profit: RM ${companyData.profit}

## YOUR ROLE
1. Answer questions specifically about this company
2. Provide data-backed insights
3. Explain financial metrics in simple terms
4. Offer technical analysis when asked
5. Reference specific data sources

## GUIDELINES
- Always cite the data you're using
- Be objective and balanced
- Highlight both opportunities and risks
- Use Malaysian Ringgit (RM) for all currency
- Include disclaimers for investment-related answers

## DISCLAIMER (Include when giving analysis)
"This information is for educational purposes only and should not be considered as investment advice. Please consult a licensed financial advisor before making investment decisions."
`;
```

### 3.4 Chat Tasks
- [ ] Add company selector to chat page
- [ ] Implement company context injection
- [ ] Create company-specific system prompts
- [ ] Add data visualization in chat responses
- [ ] Implement suggested questions
- [ ] Add chat history per company

---

## Phase 4: Mad2Arena Production

### 4.1 Current Status
- Demo mode with dummy data
- 5 AI participants configured
- Basic UI complete

### 4.2 Production Requirements

**Competition Start Date: December 24, 2025**

**Pre-Launch Checklist:**
- [ ] Real stock prices flowing (Phase 0)
- [ ] AI trading logic implemented
- [ ] Portfolio tracking working
- [ ] Leaderboard calculations accurate
- [ ] Trade history recording
- [ ] Performance charts with real data

### 4.3 AI Trading Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI TRADING FLOW (Per Model)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DAILY ROUTINE (9:00 AM MYT)                                    │
│  ├─ 1. Fetch market data (all tracked stocks)                   │
│  ├─ 2. Analyze portfolio performance                            │
│  ├─ 3. Generate trading decisions via AI API                    │
│  ├─ 4. Execute trades (simulated)                               │
│  ├─ 5. Update holdings and P&L                                  │
│  └─ 6. Log decision reasoning                                   │
│                                                                  │
│  TRADING RULES                                                   │
│  ├─ Initial Capital: RM 10,000                                  │
│  ├─ Max Position Size: 30% of portfolio                         │
│  ├─ Trading Fee: 0.15% per trade                                │
│  ├─ Min Trade Value: RM 100                                     │
│  └─ Universe: All KLSE stocks                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Arena Tasks
- [ ] Create daily trading cron job
- [ ] Implement AI decision API for each model
- [ ] Build trade execution system
- [ ] Create real-time leaderboard updates
- [ ] Add trade notification stream
- [ ] Implement portfolio snapshots

---

## Phase 5: Content Creator (LOW PRIORITY)

### 5.1 Basic Plan
- AI generates social media content based on:
  - Company signals
  - News events
  - Market data
- User can customize tone and platform
- Export for Facebook, Twitter, YouTube, etc.

### 5.2 Future Implementation
- Will be developed after Phases 0-4 are complete
- Basic UI skeleton exists
- Full implementation TBD

---

## Sections to Remove

### Add Companies Page Removal

**Files to Delete:**
- `src/app/add-company/page.tsx`
- `src/app/add-company/` (entire folder)

**Links to Remove:**
- Sidebar navigation link
- Any internal references

**Database Changes:**
- No tables to remove (companies table stays)
- Data will be added manually via scripts

---

## Implementation Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 0: Real-Time Data (Week 1-2)                 🔴 CRITICAL │
│  ├─ Day 1-2: Debug Yahoo Finance API                            │
│  ├─ Day 3: Import all company data to database                  │
│  ├─ Day 4: TradingView widget integration                       │
│  └─ Day 5: Remove Add Companies section                         │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 1: Company Data & Profile (Week 2-3)                     │
│  ├─ Company listing page with real data                         │
│  ├─ Company profile with TradingView charts                     │
│  └─ Key metrics and AI insights display                         │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: AI Signals (Week 3-4)                                 │
│  ├─ Expert Trader prompt implementation                         │
│  ├─ Signal generation system                                    │
│  └─ Professional signal display with sources                    │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3: AI Chat Enhancement (Week 4-5)                        │
│  ├─ Company-specific chat context                               │
│  └─ Enhanced responses with data                                │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 4: Arena Production (Before Dec 24, 2025)                │
│  ├─ AI trading logic                                            │
│  ├─ Real data integration                                       │
│  └─ Competition launch                                          │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 5: Content Creator (After core complete)                 │
│  └─ Basic implementation                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

| Metric | Target | Current |
|--------|--------|---------|
| Companies in database | 1,000+ | 1 |
| Companies with real-time prices | 1,000+ | 0 |
| TradingView charts working | Yes | No |
| Signal generation active | Yes | No |
| AI Chat company-aware | Yes | No |
| Arena ready for production | Yes | No (demo) |

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Yahoo Finance continues failing | Implement KLSE Screener scraping as backup |
| Rate limiting | Tiered update system (already designed) |
| Data accuracy | Cross-verify with multiple sources |
| AI hallucinations | Strict prompts + data grounding |
| Server costs | Efficient caching + batch operations |

---

## Next Immediate Actions

1. **TODAY**: Debug Yahoo Finance API - find why prices are NULL
2. **TODAY**: If Yahoo fails, implement alternative (KLSE Screener)
3. **TOMORROW**: Import all ~1000 companies to database
4. **DAY 3**: Integrate TradingView widget
5. **DAY 4**: Remove Add Companies section

---

*Plan Version: 3.0*
*Created: December 14, 2024*
*Major Update: December 17, 2024*

# Mad2Stock

**Stock Market Data Analysis and Community Platform**

---

## Platform Vision

Mad2Stock is a comprehensive stock market analysis platform focused on the **Malaysian market (KLSE)**. The platform provides:

1. **All Company Data** - View all ~1,000 KLSE listed companies with real-time prices, financials, and key metrics
2. **AI-Powered Signals** - Professional trading signals with full transparency on data sources and analysis
3. **Mad2Arena** - AI Trading Competition where 5 AI models compete in real stock trading
4. **AI Chat** - Company-specific Q&A assistant with intelligent insights
5. **Content Creator** - AI-generated social media content (Phase 2)

**Future Expansion**: Singapore, Hong Kong, US markets, Forex, and Crypto

---

## Core Features

### 1. Company Data & Profiles
- All ~1,000 KLSE listed companies
- Real-time stock prices (via Yahoo Finance / fallback sources)
- Key metrics: Price, Change%, Volume, Market Cap, P/E, Dividend Yield, 52W Range
- TradingView-style interactive charts with technical indicators (RSI, MACD, MA, Bollinger Bands)
- AI-generated insights with disclaimers

### 2. AI Signal Section
- AI analyzes real-time data + news to generate signals
- Professional signal format: BUY/SELL/HOLD with confidence levels
- Full transparency: Shows all data sources, technical indicators, news used
- Entry price, target price, stop loss, time horizon
- **Important**: All signals include disclaimer - NOT investment advice
- Secret sauce: Expert Trader Prompt (see `/src/lib/prompts/expert-trader.ts`)

### 3. Mad2Arena
- 5 AI models competing: Claude, GPT-4, DeepSeek, Gemini, Grok
- Each starts with RM 10,000 virtual capital
- Real stock trading simulation on KLSE stocks
- **Competition Start Date: December 24, 2025**
- Live leaderboard, trade history, performance charts

### 4. AI Chat
- User selects a company first
- Chat has full context: price, financials, news, technical data
- Answers any company-related question
- Provides insights with data citations
- Includes appropriate disclaimers

### 5. Content Creator (LOW PRIORITY)
- Generate social media content based on signals/news
- Multi-platform: Facebook, YouTube, Twitter, Telegram
- User customization options
- Will be developed after core features complete

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14+ (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| Charts | TradingView Widgets + Lightweight Charts |
| Tables | TanStack Table |
| AI | OpenAI API (GPT-4) |
| State | Zustand |
| Deployment | Vercel |

---

## Project Structure

```
/companyreport/
├── data/
│   ├── companies/              # 83 companies with PDFs and reports
│   │   └── {CODE}/
│   │       ├── {code}-report.txt
│   │       └── *.pdf
│   ├── analysis/
│   │   ├── report-summary.txt  # Analysis for 80 companies
│   │   └── all-klse-companies.txt  # All ~1000 KLSE companies
│   └── raw/
│       └── stock.txt
├── src/
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── companies/          # Company listing & profiles
│   │   ├── signals/            # AI signals
│   │   ├── chat/               # AI chat
│   │   ├── arena/              # Mad2Arena
│   │   ├── content/            # Content creator
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── layout/             # Navigation, sidebar
│   │   ├── charts/             # TradingView, indicators
│   │   └── dashboard/          # Dashboard widgets
│   ├── lib/
│   │   ├── supabase/           # Database clients
│   │   ├── openai.ts           # OpenAI integration
│   │   ├── prompts/            # AI prompts (expert-trader.ts)
│   │   ├── yahoo-finance.ts    # Price data API
│   │   ├── stock-codes.ts      # KLSE mappings (~959)
│   │   └── company-data.ts     # Company metadata
│   ├── types/
│   ├── hooks/
│   └── stores/
├── supabase/
│   └── migrations/
├── IMPLEMENTATION_PLAN.md      # Detailed development phases
└── CLAUDE.md                   # This file
```

---

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `companies` | All company master data |
| `stock_prices` | Cached real-time prices |
| `quarterly_financials` | Revenue, profit, margins |
| `yoy_analysis` | Year-over-Year analysis |
| `qoq_analysis` | Quarter-over-Quarter analysis |
| `signals` | AI-generated trading signals |
| `chat_history` | AI chat conversations |
| `generated_content` | Social media content |

### Arena Tables
| Table | Purpose |
|-------|---------|
| `arena_participants` | 5 AI model profiles |
| `arena_trades` | All trading history |
| `arena_holdings` | Current positions |
| `arena_daily_snapshots` | Daily portfolio values |
| `arena_config` | Competition settings |

---

## Real-Time Data Strategy

### Current Issue
Yahoo Finance API configured but returning NULL prices. Need investigation.

### Data Sources (Priority Order)
1. **Yahoo Finance API** - Primary, free, 15-20min delay, needs .KL suffix
2. **TradingView Widgets** - For display only, real-time charts
3. **i3investor.com** - Backup 1, scraping source
4. **Investing.com** - Backup 2, unofficial API
5. **KLSE Screener** - Backup 3, last resort (has scraping protection)
6. **Bursa Malaysia API** - Official paid option (future consideration)

### Hybrid Approach
```
DISPLAY: TradingView Widgets (immediate, no backend)
DATA:    Yahoo Finance → Store in Supabase → Use for AI analysis
BACKUP:  i3investor → Investing.com → KLSE Screener (last resort)
```

### Tiered Update System
| Tier | Companies | Frequency |
|------|-----------|-----------|
| 1 | 80 core stocks | Every 5 min |
| 2 | 100 mid-cap | Every 15 min |
| 3 | 820+ small-cap | Every 30 min |

---

## Key Files

### Data & Configuration
- `/src/lib/stock-codes.ts` - All KLSE stock code mappings
- `/src/lib/company-data.ts` - Company metadata
- `/data/analysis/all-klse-companies.txt` - Master company list

### AI Integration
- `/src/lib/openai.ts` - OpenAI client
- `/src/lib/prompts/expert-trader.ts` - Signal generation prompt
- `/src/lib/prompts/company-chat.ts` - Chat context prompt

### Price Data
- `/src/lib/yahoo-finance.ts` - Yahoo Finance API wrapper
- `/src/app/api/cron/update-prices/route.ts` - Price update cron

### Charts
- `/src/components/charts/TradingViewWidget.tsx` - TradingView embed
- `/src/components/charts/` - Custom chart components

---

## Development Phases

See `IMPLEMENTATION_PLAN.md` for detailed phases.

### Quick Summary
1. **Phase 0** (NOW): Fix real-time data, import all companies
2. **Phase 1**: Company profiles with TradingView charts
3. **Phase 2**: Professional AI signals
4. **Phase 3**: Enhanced AI chat
5. **Phase 4**: Arena production (Dec 24, 2025)
6. **Phase 5**: Content creator

---

## Important Disclaimers

All signal and analysis features MUST include:

```
This information is for educational purposes only and should not be
considered as investment advice. Past performance does not guarantee
future results. Always do your own research and consult a licensed
financial advisor before making investment decisions. Trading involves
risk of capital loss.
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
CRON_SECRET=
```

---

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Start production
npm run lint         # Lint code
```

---

## Removed Features

- **Add Companies Page** - Removed. All companies added via backend scripts only.

---

## Working Guidelines

### Data Research
- Don't get stuck on single data source
- If one approach fails, try alternatives immediately
- Use existing data files first before scraping
- Batch operations to avoid context limits

### Company Data Priority
Get basic info first (like Google search shows):
1. Stock Code
2. Company Name
3. Current Price
4. Price Change %
5. Market Cap
6. P/E Ratio
7. Sector

Advanced data can come later.

### AI Integration
- Always ground AI responses in actual data
- Include data sources in responses
- Add disclaimers for all investment-related content
- Use structured prompts for consistency

---

## Contact

Refer to `IMPLEMENTATION_PLAN.md` for detailed task breakdowns and progress tracking.

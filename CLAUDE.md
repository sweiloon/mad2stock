# Mad2Stock

Enterprise-grade data analysis platform for Malaysian KLSE stock market analysis.

## Project Overview

This platform provides comprehensive analysis of ~1,000 Malaysian KLSE listed companies, including:
- YoY and QoQ financial performance analysis
- 6-category performance classification system
- Real-time market signals
- AI-powered chat for data queries
- Social media content generation
- PDF report storage and management

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (PDFs)
- **Real-time**: Supabase Realtime
- **Charts**: Recharts + Lightweight Charts
- **Tables**: TanStack Table
- **AI**: OpenAI API (GPT-4)
- **State**: Zustand

---

## Project Structure

```
/companyreport/
├── data/
│   ├── companies/           # Company folders with PDFs and reports (80 core with full data)
│   │   └── {CODE}/
│   │       ├── {CODE}-report.txt    # Comprehensive analysis report
│   │       └── *.pdf                # Quarterly and annual reports
│   ├── analysis/
│   │   ├── report-summary.txt       # Master analysis file (80 companies)
│   │   ├── all-klse-companies.txt   # All ~1000 KLSE companies listing
│   │   └── 30.txt                   # Company listing with URLs
│   └── raw/
│       └── stock.txt                # Raw stock data
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── page.tsx                 # Dashboard
│   │   ├── companies/               # Company explorer
│   │   ├── signals/                 # Real-time signals
│   │   ├── chat/                    # AI chat
│   │   ├── add-company/             # Add new company
│   │   ├── content/                 # Content creator
│   │   └── api/                     # API routes
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── layout/                  # Sidebar, Header, MainLayout
│   │   ├── dashboard/               # Dashboard widgets
│   │   └── charts/                  # Chart components
│   ├── lib/
│   │   ├── supabase/                # Supabase clients
│   │   ├── openai.ts                # OpenAI integration
│   │   ├── yahoo-finance.ts         # Yahoo Finance batch API wrapper
│   │   ├── stock-tiers.ts           # Stock tier management system
│   │   ├── stock-codes.ts           # KLSE stock code mappings (~1000)
│   │   ├── company-data.ts          # Company data (~1000 companies)
│   │   └── utils.ts                 # Utility functions
│   ├── types/
│   │   └── database.ts              # TypeScript types
│   ├── hooks/                       # Custom React hooks
│   └── stores/                      # Zustand stores
├── scripts/
│   └── migrate-data.ts              # Data migration script
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema
├── .env.local.example               # Environment template
├── package.json
└── CLAUDE.md                        # This file
```

---

## Performance Categories

The platform uses 6 categories to classify company performance:

| Category | Name | Description |
|----------|------|-------------|
| 1 | Revenue UP, Profit UP | Strong growth - best performers |
| 2 | Revenue DOWN, Profit UP | Efficiency gains - cost optimization |
| 3 | Revenue UP, Profit DOWN | Margin pressure - growing but less profitable |
| 4 | Revenue DOWN, Profit DOWN | Declining - underperformers |
| 5 | Turnaround | Loss to Profit - recovery stories |
| 6 | Deteriorating | Profit to Loss - worsening condition |

---

## Data Sources

### report-summary.txt Structure
- **Location**: `/data/analysis/report-summary.txt`
- **Content**: Complete YoY and QoQ analysis for 80 companies
- **Format**: Structured text with company entries containing:
  - Latest quarter data (Revenue, Profit)
  - Previous period data
  - Percentage changes
  - Category classification
  - Analysis notes

### Company Reports
- **Location**: `/data/companies/{CODE}/{code}-report.txt`
- **Structure**:
  1. COMPANY OVERVIEW
  2. YoY & QoQ CATEGORY ANALYSIS
  3. SHORT-TERM AND LONG-TERM BUY/SELL SIGNALS
  4. PROFESSIONAL TRADER AI INSIGHTS
  5. MALAYSIA-LOCALIZED ANALYSIS
  6. CONTENT IDEAS FOR YOUTUBE/FACEBOOK INFLUENCERS

---

## Setup Instructions

### 1. Environment Configuration

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### 2. Supabase Setup

Run the migration SQL in Supabase SQL Editor:
```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
```

Create storage bucket:
1. Go to Supabase Dashboard > Storage
2. Create bucket named `company-documents`
3. Set to public access

Enable Realtime:
1. Go to Database > Replication
2. Enable realtime for `signals` table

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Data Migration

```bash
npx ts-node scripts/migrate-data.ts
```

---

## Database Schema

### Core Tables

- **companies**: Master company data (code, name, sector, market cap, etc.)
- **quarterly_financials**: Quarterly financial data (revenue, profit, margins)
- **yoy_analysis**: Year-over-Year analysis results
- **qoq_analysis**: Quarter-over-Quarter analysis results
- **company_documents**: PDF document metadata (links to Supabase Storage)
- **company_reports**: Analysis report content
- **signals**: Real-time market signals
- **chat_history**: AI chat conversation history
- **generated_content**: Social media content

---

## Features

### Dashboard
- Market overview with category distribution
- Top performers (YoY & QoQ)
- Category breakdown charts
- Quick navigation

### Company Explorer
- Filterable data table
- Multiple view modes (table, cards, excel)
- Sorting and search
- Category and sector filters

### Real-time Signals
- Live signal feed
- Signal types: Price Alert, News, Volume, Earnings, Recommendation
- Signal strength indicators
- Filtering and search

### AI Chat
- Context-aware financial assistant
- Company-specific analysis
- Sector comparisons
- Investment insights
- Chat history persistence

### Add Company
- Input stock code or number
- Automatic KLSE data fetch
- PDF report download
- Financial analysis generation
- Report generation

### Content Creator
- Multi-platform support (Facebook, Instagram, YouTube, Telegram, Twitter)
- AI-powered content generation
- Hashtag suggestions
- Copy-to-clipboard functionality

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/companies` | GET | List all companies |
| `/api/companies/[code]` | GET | Get single company |
| `/api/signals` | GET | List signals |
| `/api/signals` | POST | Create signal |
| `/api/chat` | POST | Send chat message |
| `/api/scrape/[code]` | POST | Scrape KLSE data |

---

## KLSE Data Extraction

### URL Patterns
- Stock page: `https://www.klsescreener.com/v2/stocks/view/{CODE}`
- Quarterly page: `https://www.klsescreener.com/v2/stocks/financial-report/{CODE}/{DATE}`
- PDF download: `https://disclosure.bursamalaysia.com/FileAccess/apbursaweb/download?id={ID}&name=EA_FR_ATTACHMENTS`
- Annual PDF: `https://disclosure.bursamalaysia.com/FileAccess/apbursaweb/download?id={ID}&name=EA_DS_ATTACHMENTS`

### Cloudflare Workaround

Bursa Malaysia uses Cloudflare protection. Solution:

1. User manually opens any PDF and completes Cloudflare verification
2. Browser session is established
3. Use JavaScript download technique:

```javascript
async () => {
  const pdfUrl = window.location.href;
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = 'FILENAME.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return { triggered: true };
}
```

### File Naming Convention
- Quarterly: `{COMPANY}_Q{N}_FY{YY}.pdf`
- Annual: `{COMPANY}_Annual_{YYYY}.pdf`
- Report: `{code}-report.txt` (lowercase)

---

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Data migration
npx ts-node scripts/migrate-data.ts
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Environment Variables for Production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `CRON_SECRET` - Secret for cron job authentication

---

## Stock Price System (Yahoo Finance Integration)

### Architecture Overview
The platform uses Yahoo Finance API as the primary real-time stock data source for ~1,000 Malaysian KLSE stocks with a tiered update strategy.

```
┌─────────────────────────────────────────────┐
│           TIERED UPDATE SYSTEM              │
├─────────────────────────────────────────────┤
│  Tier 1: 80 core stocks    → Every 5 min   │
│  Tier 2: 100 mid-cap       → Every 15 min  │
│  Tier 3: 820+ small-cap    → Every 30 min  │
└─────────────────────────────────────────────┘
                    │
                    ▼
        Yahoo Finance Batch API
        (50 symbols per request)
                    │
                    ▼
           Supabase Database
```

### Yahoo Finance API Details
- **Batch Endpoint**: `https://query1.finance.yahoo.com/v7/finance/quote?symbols={SYMBOLS}.KL`
- **Max Symbols**: 50 per request
- **Data Delay**: 15-20 minutes (acceptable for swing trading/trend analysis)
- **Rate Limit**: Stay under 1000 requests/hour
- **Cost**: FREE

### Tier Strategy
| Tier | Companies | Update Frequency | API Calls/Cycle |
|------|-----------|-----------------|-----------------|
| 1 | 80 core (original) | Every 5 min | 2 |
| 2 | 100 mid-cap | Every 15 min | 2 |
| 3 | 820+ small-cap | Every 30 min | 17 |

**Total Daily API Calls**: ~450 (well under 2000/hour limit)

### Current Configuration (Vercel Hobby - Free)
- **Vercel Cron**: Once daily at 5:30pm MYT (backup)
- **External Cron**: cron-job.org for every 5 minutes during market hours
- **Endpoint**: `/api/cron/update-prices`
- **Market Hours**: 9am-5pm MYT (1am-9am UTC), Monday-Friday

### External Cron Setup (cron-job.org)
1. Create free account at cron-job.org
2. Add job with URL: `https://your-domain.vercel.app/api/cron/update-prices`
3. Schedule: Every 5 minutes
4. Time restriction: 9:00 AM - 5:00 PM MYT
5. Days: Monday-Friday

### Vercel Pro Upgrade (Quick Switch)
When upgrading to Vercel Pro ($20/mo):

1. **Update vercel.json**:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-prices",
      "schedule": "*/5 1-9 * * 1-5"
    }
  ]
}
```

2. **Disable external cron service**

3. **Deploy** - changes take effect immediately

### Database Tables
- **stock_prices**: Cached price data (price, change, volume, tier, next_update_at)
- **stock_tiers**: Tier assignments for all companies
- **price_update_logs**: Audit trail for cron job runs

### Key Files
- `/src/lib/yahoo-finance.ts` - Yahoo Finance batch API wrapper
- `/src/lib/stock-tiers.ts` - Tier management logic
- `/src/lib/stock-codes.ts` - KLSE stock code mappings (~1000 companies)
- `/src/lib/company-data.ts` - Company data with optional fields
- `/src/app/api/cron/update-prices/route.ts` - Tiered cron job

### Migration Required
Run these migrations in Supabase SQL Editor:
- `/supabase/migrations/002_stock_prices.sql` - Stock prices table
- `/supabase/migrations/003_stock_tiers.sql` - Stock tiers table

---

## Troubleshooting

### Common Issues

1. **Build errors with shadcn components**
   - Ensure all dependencies installed: `npm install`
   - Check component imports match file structure

2. **Supabase connection errors**
   - Verify environment variables
   - Check RLS policies allow access

3. **KLSE scraping blocked**
   - User must complete Cloudflare verification first
   - Use JavaScript download technique

4. **PDF download fails**
   - Check if disclosure.bursamalaysia.com is accessible
   - Verify Cloudflare session is active

---

## Data Insights

### Top Performers (YoY Category 1)
- **UWC**: Profit +685.7%, Revenue +43.0%
- **PRKCORP**: Profit +352.7%, Revenue +19.6%
- **UMCCA**: Profit +184.2%, Revenue +16.9%
- **HIGHTEC**: Profit +180.6%, Revenue +44.2%
- **MYNEWS**: Profit +146.2%, Revenue +11.3%

### Sector Distribution
- Construction & Property: Dominant
- Manufacturing: Strong growth
- Plantation: Commodity-driven
- Technology: Emerging
- Healthcare: Post-pandemic normalization

---

## Contributing

1. Create feature branch
2. Make changes
3. Test with `npm run build`
4. Submit PR with description

---

## License

Private - All rights reserved

---

## Contact

For questions about the platform or data analysis methodology, refer to the generated company reports in `/data/companies/`.

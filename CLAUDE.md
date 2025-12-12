# Mad2Stock

Enterprise-grade data analysis platform for Malaysian KLSE stock market analysis.

## Project Overview

This platform provides comprehensive analysis of 80+ Malaysian listed companies, including:
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
│   ├── companies/           # 80 company folders with PDFs and reports
│   │   └── {CODE}/
│   │       ├── {CODE}-report.txt    # Comprehensive analysis report
│   │       └── *.pdf                # Quarterly and annual reports
│   ├── analysis/
│   │   ├── report-summary.txt       # Master analysis file (80 companies)
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

## Stock Price Cron Job

### Current Configuration (Vercel Hobby - Free)
- **Schedule**: Once daily at 5:30pm Malaysia Time (MYT)
- **Cron Expression**: `30 9 * * 1-5` (9:30 UTC = 5:30pm MYT)
- **Days**: Monday to Friday only (market days)
- **Endpoint**: `/api/cron/update-prices`

### How It Works
1. Scrapes 80 companies from KLSE Screener (primary) with Yahoo Finance fallback
2. Processes in batches of 5 with 500ms delay
3. Stores prices in `stock_prices` Supabase table
4. Logs results to `price_update_logs` table
5. Frontend reads cached prices with live fallback when cache unavailable

### Future Upgrade (Vercel Pro - $20/mo)
When upgraded to Vercel Pro, change cron schedule to every 30 minutes during market hours:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-prices",
      "schedule": "*/30 1-9 * * 1-5"
    }
  ]
}
```
This runs every 30 minutes from 9am-5pm MYT (1am-9am UTC), Monday-Friday.

### Database Tables
- **stock_prices**: Cached price data (price, change, volume, etc.)
- **price_update_logs**: Audit trail for cron job runs

### Migration Required
Run `/supabase/migrations/002_stock_prices.sql` in Supabase SQL Editor to create tables.

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

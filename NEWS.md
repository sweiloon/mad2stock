# Data Infrastructure - Implementation Guide

## Overview

Comprehensive data infrastructure for Mad2Stock platform:
- **Company News**: Daily news for ALL ~1000 KLSE companies
- **KLSE Market News**: Malaysian stock market news
- **Global Market News**: Worldwide financial news (economy, forex, crypto)
- **Image Extraction**: OG images from original articles

---

## News Categories

| Category | Description | Source | Retention |
|----------|-------------|--------|-----------|
| **Company News** | News for each KLSE company | EODHD (by ticker) | 30 per company |
| **KLSE Market** | Malaysian market news | EODHD (t=market) | 100 articles |
| **Global Market** | World financial news | EODHD (t=market,economy) | 100 articles |
| **Forex News** | Currency market news | EODHD (t=forex) | 50 articles |
| **Crypto News** | Cryptocurrency news | EODHD (t=crypto) | 50 articles |

---

## Configuration

| Setting | Value |
|---------|-------|
| EODHD Plan | $19.99/mo → 100K calls/day |
| Companies | ~1000 KLSE stocks |
| Retention | Last 30 articles per company |
| Market News | Last 100 articles per category |
| Images | Extract OG image from article URL |

---

## Two-Phase Fetching Strategy

### Phase A: Initial Historical Load (ONE-TIME)

```
Purpose:  Fetch last 30 articles for all 1000 companies
When:     Run ONCE (overnight or during off-hours)
Duration: ~50 minutes
API Calls: ~5,000 (5% of daily limit)
```

**How to run:**
```bash
# Run in batches of 50 companies
curl -X POST "https://yourdomain.com/api/admin/news-initial-load?batch=50&offset=0" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Continue with offset=50, 100, 150... until all companies loaded
```

### Phase B: Daily Maintenance (ONGOING)

```
Purpose:  Check for NEW news only (articles since last fetch)
When:     Once daily at 6am MYT
Reality:  Most KLSE companies have 0-2 new articles per day
API Calls: ~5,000/day (5% of limit)
```

### Fetch Logic

```
IF company.last_news_fetch IS NULL:
    → Fetch last 30 articles (initial load)
ELSE:
    → Fetch news WHERE published_at > last_news_fetch
    → If 0 articles returned, skip (nothing new)
    → Update last_news_fetch timestamp
```

---

## Image Extraction

EODHD provides text only. Images extracted separately:

### Strategy: Background OG Image Extraction

```
1. Save news articles WITHOUT images (fast)
2. Queue articles with image_status='pending'
3. Hourly cron extracts OG images from article URLs
4. UI shows placeholder until image loaded
```

### Code Pattern

```typescript
async function extractOGImage(articleUrl: string): Promise<string | null> {
  try {
    const response = await fetch(articleUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Mad2Stock/1.0)' }
    })
    const html = await response.text()

    // Try og:image first
    let match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    if (match) return match[1]

    // Fallback to twitter:image
    match = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (match) return match[1]

    return null
  } catch {
    return null
  }
}
```

---

## Global Market News

### EODHD Tag-Based News API

EODHD provides global news by **topic tags** (not just by ticker):

```
# By Tag (Global Topics)
https://eodhd.com/api/news?t={TAG}&api_token={KEY}&fmt=json&limit=50

# Available Tags:
t=market      → General market news (stocks, indices)
t=economy     → Economic news (GDP, inflation, rates)
t=forex       → Currency/FX news
t=crypto      → Cryptocurrency news
t=earnings    → Earnings reports
t=ipo         → IPO announcements
t=mergers     → M&A news
```

### Multiple Tags

```
# Combine multiple tags
https://eodhd.com/api/news?t=market,economy&api_token={KEY}&limit=50
```

### Global News Functions

```typescript
// src/lib/eodhd-news.ts

type NewsTag = 'market' | 'economy' | 'forex' | 'crypto' | 'earnings' | 'ipo' | 'mergers'

async function fetchGlobalNewsByTag(
  tag: NewsTag | NewsTag[],
  limit: number = 50
): Promise<NewsArticle[]> {
  const tags = Array.isArray(tag) ? tag.join(',') : tag
  const url = `${EODHD_BASE_URL}/news?t=${tags}&api_token=${EODHD_API_KEY}&fmt=json&limit=${limit}`

  const response = await fetch(url)
  return response.json()
}

// Usage
await fetchGlobalNewsByTag('market')           // General market
await fetchGlobalNewsByTag('economy')          // Economic news
await fetchGlobalNewsByTag(['market', 'economy']) // Combined
await fetchGlobalNewsByTag('forex')            // Currency news
await fetchGlobalNewsByTag('crypto')           // Crypto news
```

### Database: news_type Values

```sql
-- Updated news_type column values:
'company'      -- Company-specific news (by ticker)
'klse_market'  -- Malaysian market news
'global'       -- Global market news
'economy'      -- Economic news
'forex'        -- Forex news
'crypto'       -- Cryptocurrency news
```

### Global News Cron Endpoint

**File**: `/src/app/api/cron/update-global-news/route.ts`

```typescript
// Fetches global news by category
// Schedule: 3x daily (6am, 12pm, 6pm MYT)

const NEWS_CATEGORIES = [
  { tag: 'market', type: 'global', limit: 50 },
  { tag: 'economy', type: 'economy', limit: 30 },
  { tag: 'forex', type: 'forex', limit: 30 },
  { tag: 'crypto', type: 'crypto', limit: 30 },
]

for (const category of NEWS_CATEGORIES) {
  const articles = await fetchGlobalNewsByTag(category.tag, category.limit)
  await saveNewsToDatabase(articles, category.type)
}
```

### API Endpoints for Global News

```
# Get global market news
GET /api/news/global?limit=50&page=1

# Get news by category
GET /api/news/global?category=economy
GET /api/news/global?category=forex
GET /api/news/global?category=crypto

# Get all categories
GET /api/news/global?category=all
```

### Backup: Marketaux API (Optional)

If EODHD global news is insufficient, add Marketaux as backup:

```
Free Tier: 100 requests/day
Endpoint:  https://api.marketaux.com/v1/news/all
Features:  80+ markets, sentiment, better global coverage
```

```typescript
// src/lib/marketaux-news.ts (optional backup)

const MARKETAUX_API_KEY = process.env.MARKETAUX_API_KEY

async function fetchMarketauxGlobalNews(limit: number = 50) {
  const url = `https://api.marketaux.com/v1/news/all?api_token=${MARKETAUX_API_KEY}&limit=${limit}`
  const response = await fetch(url)
  return response.json()
}
```

---

## Database Schema

### Table: `company_news`

```sql
CREATE TABLE company_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Company reference
  stock_code VARCHAR(10),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Article data
  article_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,                    -- First 500 chars
  link TEXT NOT NULL,
  source VARCHAR(255),
  published_at TIMESTAMPTZ NOT NULL,

  -- Image
  image_url TEXT,
  image_status VARCHAR(20) DEFAULT 'pending',  -- pending/extracted/not_found

  -- Categorization
  tags TEXT[],
  related_symbols TEXT[],
  news_type VARCHAR(50) DEFAULT 'company',     -- company/market

  -- Sentiment from EODHD
  sentiment_score DECIMAL(5, 4),
  sentiment_label VARCHAR(20),                 -- positive/negative/neutral
  sentiment_positive DECIMAL(5, 4),
  sentiment_negative DECIMAL(5, 4),
  sentiment_neutral DECIMAL(5, 4),

  -- Metadata
  data_source VARCHAR(50) DEFAULT 'eodhd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT company_news_unique UNIQUE (stock_code, article_id)
);

-- Indexes
CREATE INDEX idx_company_news_stock_code ON company_news(stock_code);
CREATE INDEX idx_company_news_published ON company_news(published_at DESC);
CREATE INDEX idx_company_news_stock_recent ON company_news(stock_code, published_at DESC);
CREATE INDEX idx_company_news_image_status ON company_news(image_status) WHERE image_status = 'pending';
CREATE INDEX idx_company_news_market ON company_news(published_at DESC) WHERE news_type = 'market';
```

### Table: `news_fetch_status`

```sql
CREATE TABLE news_fetch_status (
  stock_code VARCHAR(10) PRIMARY KEY,
  company_name VARCHAR(255),
  last_fetch_at TIMESTAMPTZ,
  last_article_at TIMESTAMPTZ,
  articles_count INTEGER DEFAULT 0,
  fetch_status VARCHAR(20) DEFAULT 'pending',  -- pending/completed/failed
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `news_update_logs`

```sql
CREATE TABLE news_update_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR(50) NOT NULL,
  job_type VARCHAR(50) DEFAULT 'daily',        -- initial/daily/market/images

  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,

  total_companies INTEGER,
  companies_with_news INTEGER,
  companies_skipped INTEGER,
  articles_inserted INTEGER DEFAULT 0,
  articles_deleted INTEGER DEFAULT 0,
  images_extracted INTEGER DEFAULT 0,

  failed_codes TEXT[],
  error_summary TEXT,
  status VARCHAR(20) DEFAULT 'running',

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Cleanup Functions

```sql
-- Keep last 30 articles per company
CREATE OR REPLACE FUNCTION cleanup_old_company_news()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY stock_code ORDER BY published_at DESC
    ) as rn
    FROM company_news WHERE stock_code IS NOT NULL
  )
  DELETE FROM company_news WHERE id IN (
    SELECT id FROM ranked WHERE rn > 30
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Keep last 100 market news
CREATE OR REPLACE FUNCTION cleanup_old_market_news()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC) as rn
    FROM company_news WHERE news_type = 'market'
  )
  DELETE FROM company_news WHERE id IN (
    SELECT id FROM ranked WHERE rn > 100
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `/supabase/migrations/007_company_news.sql` | Database schema |
| `/src/lib/eodhd-news.ts` | EODHD News API service (company + global) |
| `/src/lib/news-image-extractor.ts` | OG image extraction |
| `/src/lib/marketaux-news.ts` | Marketaux backup (optional) |
| `/src/app/api/admin/news-initial-load/route.ts` | One-time historical load |
| `/src/app/api/cron/update-news/route.ts` | Daily company news check |
| `/src/app/api/cron/update-global-news/route.ts` | Global market news cron |
| `/src/app/api/cron/extract-news-images/route.ts` | Image extraction cron |
| `/src/app/api/companies/[code]/news/route.ts` | Get company news |
| `/src/app/api/news/market/route.ts` | Get KLSE market news |
| `/src/app/api/news/global/route.ts` | Get global news (all categories) |
| `/src/app/api/news/search/route.ts` | Search all news |

---

## EODHD News API

### Endpoint Format

```
https://eodhd.com/api/news?s={CODE}.KLSE&api_token={KEY}&fmt=json&limit=30
```

### With Date Filter (for daily updates)

```
https://eodhd.com/api/news?s={CODE}.KLSE&api_token={KEY}&fmt=json&from={YYYY-MM-DD}
```

### Response Format

```json
[
  {
    "date": "2025-01-15T08:30:00+00:00",
    "title": "Company XYZ Reports Record Quarterly Profits",
    "content": "Full article text...",
    "link": "https://news-source.com/article/123",
    "symbols": ["1155.KLSE", "5398.KLSE"],
    "tags": ["earnings", "quarterly", "profit"],
    "sentiment": {
      "polarity": 0.65,
      "pos": 0.70,
      "neg": 0.05,
      "neu": 0.25
    }
  }
]
```

### API Cost

- Each news request = 5 API calls
- $19.99 plan = 100,000 calls/day = 20,000 news requests

---

## Cron Schedule

| Job | Schedule (MYT) | Description |
|-----|----------------|-------------|
| Company News | `0 6 * * *` | 6am - Check all companies for new news |
| Global News | `0 6,12,18 * * *` | 3x daily - Global market/economy/forex/crypto |
| Image Extraction | `0 * * * *` | Every hour - Extract pending images |
| Cleanup | `0 3 * * *` | 3am - Remove old articles |

### Vercel Cron Config

```json
{
  "crons": [
    { "path": "/api/cron/update-news", "schedule": "0 22 * * *" },
    { "path": "/api/cron/update-global-news", "schedule": "0 22,4,10 * * *" },
    { "path": "/api/cron/extract-news-images", "schedule": "0 * * * *" },
    { "path": "/api/cron/update-news?cleanup=true", "schedule": "0 19 * * *" }
  ]
}
```

Note: Vercel cron uses UTC. MYT = UTC+8, so 6am MYT = 22:00 UTC (previous day)

### Global News Categories Fetched

Each `/api/cron/update-global-news` run fetches:
- `t=market` → 50 articles (global market)
- `t=economy` → 30 articles (economic news)
- `t=forex` → 30 articles (currency news)
- `t=crypto` → 30 articles (cryptocurrency)

---

## API Endpoints

### Get Company News

```
GET /api/companies/{code}/news?limit=30&page=1&sentiment=positive

Response:
{
  "news": [
    {
      "id": "uuid",
      "title": "...",
      "summary": "...",
      "link": "...",
      "image_url": "...",
      "source": "theedgemarkets.com",
      "published_at": "2025-01-15T08:30:00Z",
      "sentiment_label": "positive",
      "sentiment_score": 0.65
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 28,
    "pages": 1
  }
}
```

### Get KLSE Market News

```
GET /api/news/market?limit=50&page=1
```

### Get Global News

```
# All global news
GET /api/news/global?limit=50&page=1

# By category
GET /api/news/global?category=market    # World market news
GET /api/news/global?category=economy   # Economic news
GET /api/news/global?category=forex     # Currency news
GET /api/news/global?category=crypto    # Cryptocurrency news
GET /api/news/global?category=all       # All categories combined

Response:
{
  "news": [...],
  "categories": ["market", "economy", "forex", "crypto"],
  "pagination": {...}
}
```

### Search All News

```
GET /api/news/search?q=dividend&limit=30&type=all
GET /api/news/search?q=fed+rate&type=global
GET /api/news/search?q=maybank&type=company
```

---

## Storage Estimation

```
Company News:   30 per company × 1000 companies = 30,000 rows
KLSE Market:    100 rows
Global Market:  100 rows (50 market + 50 economy)
Forex News:     50 rows
Crypto News:    50 rows
─────────────────────────────────────────────────────────
Total:          ~30,300 rows
Row Size:       ~3KB (with content and image URL)
Storage:        ~90MB data + ~30MB indexes = ~120MB
```

---

## API Call Budget

```
Initial Load (one-time):
  Company news:   1000 companies × 5 calls = 5,000 calls

Daily Operations:
  Company news:   1000 × 5 = 5,000 calls (once daily)
  Global news:    4 categories × 3 times × 5 = 60 calls
  ───────────────────────────────────────────────────────
  Total:          ~5,060 calls/day (5% of 100K limit)

Remaining:        ~95,000 calls/day for other features
```

### Global News API Calls Breakdown

```
Per cron run (3x daily):
  t=market    → 1 request × 5 calls = 5 calls
  t=economy   → 1 request × 5 calls = 5 calls
  t=forex     → 1 request × 5 calls = 5 calls
  t=crypto    → 1 request × 5 calls = 5 calls
  ─────────────────────────────────────────────
  Per run:      20 calls
  Per day:      20 × 3 = 60 calls
```

---

## Implementation Order

### Day 1: Database
1. Create migration file
2. Run migration in Supabase
3. Verify tables created

### Day 2: Core Service
4. Create `/src/lib/eodhd-news.ts`
5. Test with single company
6. Test batch fetching

### Day 3: Initial Load
7. Create admin endpoint for initial load
8. Run initial load (can do overnight)
9. Verify data in database

### Day 4: Crons & Images
10. Create daily update cron
11. Create image extractor
12. Create market news cron
13. Test all crons

### Day 5: API & Integration
14. Create API endpoints
15. Test from frontend
16. Configure Vercel crons
17. Monitor for issues

---

## Testing Checklist

### Company News
- [ ] EODHD News API returns data for KLSE stocks
- [ ] Database migration runs successfully
- [ ] Initial load completes for all companies
- [ ] Daily check identifies only NEW articles
- [ ] Companies with no news are skipped
- [ ] 30-article retention enforced per company

### Global News
- [ ] EODHD tag-based API returns global news (t=market)
- [ ] Economy news fetched (t=economy)
- [ ] Forex news fetched (t=forex)
- [ ] Crypto news fetched (t=crypto)
- [ ] Global news cron completes successfully
- [ ] Category-based API filtering works

### Image & Infrastructure
- [ ] Image extraction works for common news sites
- [ ] API endpoints return correct data with pagination
- [ ] Cron jobs complete within 10s timeout
- [ ] Cleanup functions work correctly
- [ ] Search works across all news types

---

## Troubleshooting

### EODHD Returns Empty Array
- Some KLSE stocks may not have news coverage
- Mark as `fetch_status = 'no_news'` and skip in future

### Image Extraction Fails
- Some sites block scrapers
- Set `image_status = 'not_found'` after 3 attempts
- Use placeholder image in UI

### Cron Timeout
- Vercel has 10s limit
- Process in smaller batches
- Use offset-based pagination

### Rate Limiting
- EODHD: 5 concurrent requests max
- Add 200ms delay between batches
- Check API usage in EODHD dashboard

---

## Related Files

- `/src/lib/eodhd-api.ts` - Existing EODHD integration (follow patterns)
- `/src/app/api/cron/update-prices/route.ts` - Existing cron pattern
- `/src/lib/stock-codes.ts` - Stock code mappings

---

## Environment Variables

```env
# Required (already configured)
EODHD_API_KEY=your_eodhd_api_key

# Optional (for backup global news)
MARKETAUX_API_KEY=your_marketaux_api_key
```

---

## Quick Reference: EODHD News Endpoints

```bash
# Company News (by ticker)
curl "https://eodhd.com/api/news?s=1155.KLSE&api_token=${EODHD_API_KEY}&fmt=json&limit=30"

# Global Market News (by tag)
curl "https://eodhd.com/api/news?t=market&api_token=${EODHD_API_KEY}&fmt=json&limit=50"

# Economy News
curl "https://eodhd.com/api/news?t=economy&api_token=${EODHD_API_KEY}&fmt=json&limit=30"

# Forex News
curl "https://eodhd.com/api/news?t=forex&api_token=${EODHD_API_KEY}&fmt=json&limit=30"

# Crypto News
curl "https://eodhd.com/api/news?t=crypto&api_token=${EODHD_API_KEY}&fmt=json&limit=30"

# Combined Tags
curl "https://eodhd.com/api/news?t=market,economy&api_token=${EODHD_API_KEY}&fmt=json&limit=50"

# With Date Filter
curl "https://eodhd.com/api/news?s=1155.KLSE&from=2025-01-01&api_token=${EODHD_API_KEY}&fmt=json"
```

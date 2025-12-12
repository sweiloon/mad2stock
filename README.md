# Mad2Stock

Enterprise-grade Malaysian stock market analysis platform for KLSE (Bursa Malaysia).

## Features

- **80+ Companies**: Comprehensive analysis of Malaysian listed companies
- **YoY/QoQ Analysis**: Year-over-Year and Quarter-over-Quarter performance tracking
- **6-Category System**: Performance classification (Revenue UP/DOWN, Profit UP/DOWN, Turnaround, Deteriorating)
- **Real-time Signals**: Live market alerts and price notifications
- **AI Chat**: GPT-4 powered financial analysis assistant
- **Content Creator**: Social media content generation for multiple platforms
- **PDF Reports**: Quarterly and annual report storage

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key
- `CRON_SECRET` - Secret for cron job authentication

## Deployment

Deploy to Vercel with one click or connect your GitHub repository.

See [CLAUDE.md](./CLAUDE.md) for detailed documentation.

## License

Private - All rights reserved

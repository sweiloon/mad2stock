/**
 * Fetch missing stock prices for companies without price data
 * Run with: npx tsx scripts/fetch-missing-prices.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Companies missing prices (from database query)
const MISSING_STOCKS = [
  { code: 'A1AKK', numericCode: '0365', name: 'A1 A.K. Koh Group Berhad' },
  { code: 'AMEDIA', numericCode: '0159', name: 'Asia Media Group Berhad' },
  { code: 'AMLEX', numericCode: '03011', name: 'Amlex Holdings Berhad' },
  { code: 'AORB', numericCode: '0377', name: 'Alpha Ocean Resources Berhad' },
  { code: 'AQUAWALK', numericCode: '0380', name: 'Aquawalk Group Berhad' },
  { code: 'ASIAPAC', numericCode: '0361', name: 'Asia Pacific Higher Learning Sdn Bhd' },
  { code: 'ASM', numericCode: '0362', name: 'ASM Automation Group Berhad' },
  { code: 'ASTEEL', numericCode: '7020', name: 'Amalgamated Steel Mills Berhad' },
  { code: 'AUTORIS', numericCode: '03059', name: 'Autoris Group Holdings Berhad' },
  { code: 'AZAMJAYA', numericCode: '5329', name: 'Azam Jaya Berhad' },
  { code: 'BABA', numericCode: '03012', name: 'Baba Eco Group Berhad' },
  { code: 'BMS', numericCode: '0385', name: 'BMS Holdings Berhad' },
  { code: 'CETECH', numericCode: '03024', name: 'Cetech Group' },
  { code: 'CGB', numericCode: '8052', name: 'Central Global Berhad' },
  { code: 'CHEEDING', numericCode: '0372', name: 'Cheeding Holdings Berhad' },
  { code: 'CKI', numericCode: '5336', name: 'CUCKOO International (MAL) Berhad' },
  { code: 'COUNTRY', numericCode: '5738', name: 'Country Heights Holdings Berhad' },
  { code: 'ENCORP', numericCode: '6076', name: 'Encorp Berhad' },
  { code: 'FIHB', numericCode: '8605', name: 'FI Holdings Berhad' },
  { code: 'GENERGY', numericCode: '5343', name: 'Wasco Greenergy Berhad' },
  { code: 'GPHAROS', numericCode: '0330', name: 'Grand Pharos Holdings Berhad' },
  { code: 'HARNLEN', numericCode: '7501', name: 'Harn Len Corporation Bhd' },
  { code: 'HUMEIND', numericCode: '5000', name: 'Hume Cement Industries Berhad' },
  { code: 'JDIPC', numericCode: '0317', name: 'JD I Plus Corporation Berhad' },
  { code: 'JHM', numericCode: '0127', name: 'JHM Consolidation Berhad' },
  { code: 'JSSOLAR', numericCode: '0369', name: 'JS Solar' },
  { code: 'KIARA', numericCode: '0329', name: 'Kiara Glory Berhad' },
  { code: 'KLCC', numericCode: '5235', name: 'KLCC Property Holdings Berhad' },
  { code: 'KOTRA', numericCode: '0002', name: 'Kotra Industries Berhad' },
  { code: 'KTI', numericCode: '0308', name: 'KTI Landmark Berhad' },
  { code: 'KUANTAN', numericCode: '8303', name: 'Kuantan Flour Mills Berhad' },
  { code: 'LAGANG', numericCode: '0367', name: 'Lagang Holdings Berhad' },
  { code: 'LAMBO', numericCode: '0018', name: 'Lambo Group Berhad' },
  { code: 'LHI', numericCode: '6633', name: 'Leong Hup International Berhad' },
  { code: 'LIBERTY', numericCode: '0312', name: 'Liberty Resources Berhad' },
  { code: 'MASMALL', numericCode: '0331', name: 'Masterskill Holdings Berhad' },
  { code: 'MEGAFB', numericCode: '5327', name: 'Mega Fortris Berhad' },
  { code: 'MYAXIS', numericCode: '03064', name: 'MyAxis Group' },
  { code: 'NE', numericCode: '0325', name: 'Northeast Group Berhad' },
  { code: 'NIHSIN', numericCode: '7215', name: 'Nihsin Resources Berhad' },
  { code: 'ORKIM', numericCode: '5348', name: 'Orkim Berhad' },
  { code: 'PGF', numericCode: '8117', name: 'PGF Capital Berhad' },
  { code: 'PMCK', numericCode: '0363', name: 'PMCK Holdings' },
  { code: 'POLYMER', numericCode: '0381', name: 'Polymer Link Holdings Berhad' },
  { code: 'PTARAS', numericCode: '9598', name: 'Pintaras Jaya Berhad' },
  { code: 'SDCG', numericCode: '0321', name: 'Solar District Cooling Group Berhad' },
  { code: 'SMART', numericCode: '0306', name: 'SMART Berhad' },
  { code: 'STGROUP', numericCode: '0368', name: 'ST Group Food Industries Holdings Berhad' },
  { code: 'THMY', numericCode: '0375', name: 'THMY Holdings Berhad' },
  { code: 'ULICORP', numericCode: '7133', name: 'United U-LI Corporation Berhad' },
  { code: 'UMSINT', numericCode: '5340', name: 'UMS Integration Limited' },
  { code: 'VERDANT', numericCode: '0373', name: 'VERDANT Berhad' },
  { code: 'VTC', numericCode: '0319', name: 'VETECE Holdings Berhad' },
]

interface YahooQuote {
  price: number
  change: number
  changePercent: number
  previousClose: number
  open: number
  high: number
  low: number
  volume: number
}

async function fetchYahooPrice(symbol: string): Promise<YahooQuote | null> {
  try {
    // Try with numeric code first (e.g., 5235.KL)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.KL?interval=1d&range=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      return null
    }

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]

    if (!meta?.regularMarketPrice) {
      return null
    }

    return {
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - (meta.previousClose || meta.regularMarketPrice),
      changePercent: meta.previousClose
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
        : 0,
      previousClose: meta.previousClose || meta.regularMarketPrice,
      open: quote?.open?.[0] || meta.regularMarketPrice,
      high: quote?.high?.[0] || meta.regularMarketPrice,
      low: quote?.low?.[0] || meta.regularMarketPrice,
      volume: quote?.volume?.[0] || 0,
    }
  } catch (error) {
    return null
  }
}

async function fetchWithAlphaCode(code: string): Promise<YahooQuote | null> {
  try {
    // Try with alpha code (e.g., KLCC.KL)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.KL?interval=1d&range=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result?.meta?.regularMarketPrice) {
      return null
    }

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]

    return {
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - (meta.previousClose || meta.regularMarketPrice),
      changePercent: meta.previousClose
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
        : 0,
      previousClose: meta.previousClose || meta.regularMarketPrice,
      open: quote?.open?.[0] || meta.regularMarketPrice,
      high: quote?.high?.[0] || meta.regularMarketPrice,
      low: quote?.low?.[0] || meta.regularMarketPrice,
      volume: quote?.volume?.[0] || 0,
    }
  } catch (error) {
    return null
  }
}

async function main() {
  console.log(`\n📊 Fetching prices for ${MISSING_STOCKS.length} missing stocks...\n`)

  let successCount = 0
  let failedCount = 0
  const failedStocks: string[] = []

  for (const stock of MISSING_STOCKS) {
    // Try numeric code first
    let quote = await fetchYahooPrice(stock.numericCode)
    let source = 'numeric'

    // If that fails, try alpha code
    if (!quote) {
      quote = await fetchWithAlphaCode(stock.code)
      source = 'alpha'
    }

    if (quote) {
      // Update or insert into stock_prices
      const { error } = await supabase
        .from('stock_prices')
        .upsert({
          stock_code: stock.numericCode,
          price: quote.price,
          change: quote.change,
          change_percent: quote.changePercent,
          previous_close: quote.previousClose,
          day_open: quote.open,
          day_high: quote.high,
          day_low: quote.low,
          volume: quote.volume,
          data_source: 'yahoo',
          scrape_status: 'success',
          error_message: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stock_code' })

      if (error) {
        console.log(`❌ ${stock.code} (${stock.numericCode}): DB error - ${error.message}`)
        failedCount++
        failedStocks.push(stock.code)
      } else {
        console.log(`✅ ${stock.code} (${stock.numericCode}): RM ${quote.price.toFixed(2)} [${source}]`)
        successCount++
      }
    } else {
      // Mark as failed in database
      await supabase
        .from('stock_prices')
        .upsert({
          stock_code: stock.numericCode,
          scrape_status: 'failed',
          error_message: 'Yahoo Finance fetch failed - stock may be suspended or delisted',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stock_code' })

      console.log(`❌ ${stock.code} (${stock.numericCode}): No data found`)
      failedCount++
      failedStocks.push(stock.code)
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log(`\n📈 Results:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Failed: ${failedCount}`)

  if (failedStocks.length > 0) {
    console.log(`\n⚠️  Failed stocks (may be suspended/delisted):`)
    failedStocks.forEach(code => console.log(`   - ${code}`))
  }
}

main().catch(console.error)

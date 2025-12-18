#!/usr/bin/env npx tsx
/**
 * Historical Data Backfill Script
 *
 * Fetches historical stock data for all KLSE companies missing chart data.
 * Run with: npx tsx scripts/backfill-history.ts
 *
 * Options:
 *   --limit=N     Process only N companies (default: all)
 *   --offset=N    Start from offset N (default: 0)
 *   --dry-run     Show what would be processed without fetching
 *   --stock=CODE  Process single stock (e.g., --stock=5398)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const HAS_EODHD = !!process.env.EODHD_API_KEY
const EODHD_API_KEY = process.env.EODHD_API_KEY

// Rate limiting
const YAHOO_DELAY_MS = 2000 // 2s between Yahoo requests (conservative)
const EODHD_DELAY_MS = 200 // 200ms between EODHD requests

interface StockHistoryData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Fetch historical data from Yahoo Finance
 */
async function fetchYahooHistory(numericCode: string): Promise<StockHistoryData[]> {
  try {
    const symbol = `${numericCode}.KL`
    const url = `${YAHOO_CHART_URL}/${symbol}?range=1y&interval=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.log(`  ⚠️ Rate limited, waiting 10s...`)
        await sleep(10000)
        return fetchYahooHistory(numericCode) // Retry
      }
      return []
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
      return []
    }

    const { timestamp, indicators } = result
    const quote = indicators.quote[0]

    const history: StockHistoryData[] = []
    for (let i = 0; i < timestamp.length; i++) {
      if (quote.close?.[i] != null && quote.close[i] > 0) {
        history.push({
          date: new Date(timestamp[i] * 1000).toISOString(),
          open: quote.open?.[i] || quote.close[i],
          high: quote.high?.[i] || quote.close[i],
          low: quote.low?.[i] || quote.close[i],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0,
        })
      }
    }

    return history
  } catch (error) {
    console.error(`  ❌ Yahoo error: ${error}`)
    return []
  }
}

/**
 * Fetch historical data from EODHD
 */
async function fetchEODHDHistory(numericCode: string): Promise<StockHistoryData[]> {
  if (!EODHD_API_KEY) return []

  try {
    const symbol = `${numericCode}.KLSE`
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    startDate.setDate(startDate.getDate() - 14) // Buffer for holidays

    const url = `https://eodhd.com/api/eod/${symbol}?api_token=${EODHD_API_KEY}&fmt=json&from=${startDate.toISOString().split('T')[0]}&to=${endDate.toISOString().split('T')[0]}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return []
    }

    return data
      .filter((item: { close: number }) => item.close != null && item.close > 0)
      .sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: { date: string; open?: number; high?: number; low?: number; close: number; volume?: number }) => ({
        date: new Date(item.date).toISOString(),
        open: item.open || item.close,
        high: item.high || item.close,
        low: item.low || item.close,
        close: item.close,
        volume: item.volume || 0,
      }))
  } catch {
    return []
  }
}

/**
 * Store historical data in Supabase
 */
async function storeHistory(numericCode: string, data: StockHistoryData[]): Promise<boolean> {
  if (!data || data.length === 0) return false

  try {
    const records = data.map(item => ({
      stock_code: numericCode.toUpperCase(),
      date: new Date(item.date).toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      updated_at: new Date().toISOString(),
    }))

    // Upsert in batches
    const batchSize = 100
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)

      const { error } = await supabase
        .from('stock_history_cache')
        .upsert(batch, {
          onConflict: 'stock_code,date',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error(`  ❌ DB error: ${error.message}`)
        return false
      }
    }

    return true
  } catch (error) {
    console.error(`  ❌ Store error: ${error}`)
    return false
  }
}

/**
 * Get companies missing historical data
 */
async function getMissingCompanies(limit?: number, offset: number = 0): Promise<Array<{ code: string; numeric_code: string; name: string }>> {
  // Get all companies with numeric codes
  let query = supabase
    .from('companies')
    .select('code, numeric_code, name')
    .not('numeric_code', 'is', null)
    .order('code')

  if (limit) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data: companies, error } = await query

  if (error) {
    console.error('❌ Error fetching companies:', error)
    return []
  }

  // Get existing stock codes with sufficient data
  const { data: existingCodes } = await supabase
    .from('stock_history_cache')
    .select('stock_code')

  const codesWithData = new Set<string>()
  const codeCounts = new Map<string, number>()

  for (const row of existingCodes || []) {
    const code = row.stock_code
    codeCounts.set(code, (codeCounts.get(code) || 0) + 1)
  }

  // Consider having data if >= 50 data points
  for (const [code, count] of codeCounts) {
    if (count >= 50) {
      codesWithData.add(code)
    }
  }

  // Filter to only companies missing data
  return (companies || []).filter(c => !codesWithData.has(c.numeric_code))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseArgs(): { limit?: number; offset: number; dryRun: boolean; singleStock?: string } {
  const args = process.argv.slice(2)
  let limit: number | undefined
  let offset = 0
  let dryRun = false
  let singleStock: string | undefined

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1])
    } else if (arg.startsWith('--offset=')) {
      offset = parseInt(arg.split('=')[1])
    } else if (arg === '--dry-run') {
      dryRun = true
    } else if (arg.startsWith('--stock=')) {
      singleStock = arg.split('=')[1]
    }
  }

  return { limit, offset, dryRun, singleStock }
}

async function main() {
  const { limit, offset, dryRun, singleStock } = parseArgs()

  console.log('🚀 Historical Data Backfill Script')
  console.log('=' .repeat(50))
  console.log(`📊 Data Source: ${HAS_EODHD ? 'EODHD (primary) + Yahoo (fallback)' : 'Yahoo Finance only'}`)

  // Single stock mode
  if (singleStock) {
    console.log(`\n📈 Single stock mode: ${singleStock}`)

    if (dryRun) {
      console.log('  Would fetch historical data...')
      return
    }

    let history = HAS_EODHD ? await fetchEODHDHistory(singleStock) : []
    const source = history.length > 0 ? 'EODHD' : 'Yahoo'

    if (history.length === 0) {
      history = await fetchYahooHistory(singleStock)
    }

    if (history.length > 0) {
      const stored = await storeHistory(singleStock, history)
      console.log(`  ${stored ? '✅' : '❌'} ${source}: ${history.length} data points`)
    } else {
      console.log('  ❌ No data available')
    }
    return
  }

  // Batch mode
  console.log(`\n📊 Fetching companies missing historical data...`)
  const companies = await getMissingCompanies(limit, offset)

  console.log(`\n📋 Found ${companies.length} companies to process`)

  if (dryRun) {
    console.log('\n🔍 Dry run - Companies to process:')
    for (const company of companies.slice(0, 20)) {
      console.log(`  - ${company.code} (${company.numeric_code}): ${company.name}`)
    }
    if (companies.length > 20) {
      console.log(`  ... and ${companies.length - 20} more`)
    }
    return
  }

  // Process companies
  let success = 0
  let failed = 0
  const startTime = Date.now()

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    const progress = `[${i + 1}/${companies.length}]`

    process.stdout.write(`${progress} ${company.code} (${company.numeric_code})...`)

    // Try EODHD first
    let history = HAS_EODHD ? await fetchEODHDHistory(company.numeric_code) : []
    let source = 'EODHD'

    // Fallback to Yahoo
    if (history.length === 0) {
      source = 'Yahoo'
      history = await fetchYahooHistory(company.numeric_code)
    }

    if (history.length > 0) {
      const stored = await storeHistory(company.numeric_code, history)
      if (stored) {
        success++
        console.log(` ✅ ${source}: ${history.length} pts`)
      } else {
        failed++
        console.log(` ❌ Store failed`)
      }
    } else {
      failed++
      console.log(` ❌ No data`)
    }

    // Rate limiting delay
    const delay = HAS_EODHD ? EODHD_DELAY_MS : YAHOO_DELAY_MS
    await sleep(delay)

    // Progress update every 50 stocks
    if ((i + 1) % 50 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      const rate = Math.round((i + 1) / elapsed * 60)
      console.log(`\n📊 Progress: ${success} success, ${failed} failed, ~${rate} stocks/min\n`)
    }
  }

  // Final summary
  const totalTime = Math.round((Date.now() - startTime) / 1000)
  console.log('\n' + '=' .repeat(50))
  console.log('📊 Backfill Complete!')
  console.log(`  ✅ Success: ${success}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  ⏱️ Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`)

  // Show remaining
  const remaining = await getMissingCompanies()
  console.log(`  📈 Still missing: ${remaining.length} companies`)
}

main().catch(console.error)

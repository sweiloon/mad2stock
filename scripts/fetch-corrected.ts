#!/usr/bin/env npx tsx
/**
 * Fetch historical data for corrected companies
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

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

interface StockHistoryData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchYahooHistory(symbol: string): Promise<StockHistoryData[]> {
  try {
    const url = `${YAHOO_CHART_URL}/${symbol}?range=1y&interval=1d`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })
    if (!response.ok) return []
    const data = await response.json()
    const result = data?.chart?.result?.[0]
    if (!result?.timestamp || !result?.indicators?.quote?.[0]) return []

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
  } catch { return [] }
}

async function storeHistory(numericCode: string, data: StockHistoryData[]): Promise<boolean> {
  if (!data || data.length === 0) return false
  try {
    const records = data.map(item => ({
      stock_code: numericCode.toUpperCase(),
      date: new Date(item.date).toISOString().split('T')[0],
      open: item.open, high: item.high, low: item.low, close: item.close,
      volume: item.volume,
      updated_at: new Date().toISOString(),
    }))

    const batchSize = 100
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const { error } = await supabase.from('stock_history_cache').upsert(batch, {
        onConflict: 'stock_code,date', ignoreDuplicates: false,
      })
      if (error) { console.error(`  DB error: ${error.message}`); return false }
    }
    return true
  } catch (error) { console.error(`  Store error: ${error}`); return false }
}

// Corrected companies to fetch
const correctedCompanies = [
  { code: 'ASTEEL', numeric: '7020' },
  { code: 'COUNTRY', numeric: '5049' },
  { code: 'ECOMATE', numeric: '0239' },
  { code: 'ENCORP', numeric: '6076' },
  { code: 'FIHB', numeric: '8605' },
  { code: 'HARNLEN', numeric: '7501' },
  { code: 'HEXTECH', numeric: '5136' },
  { code: 'HUMEIND', numeric: '5000' },
  { code: 'JHM', numeric: '0127' },
  { code: 'JTGROUP', numeric: '0292' },
  { code: 'KOTRA', numeric: '0002' },
  { code: 'KUANTAN', numeric: '8303' },
  { code: 'MNHLDG', numeric: '0245' },
  { code: 'MTEC', numeric: '0295' },
  { code: 'NIHSIN', numeric: '7215' },
  { code: 'PGF', numeric: '8117' },
  { code: 'PROLEXU', numeric: '8966' },
  { code: 'PTARAS', numeric: '9598' },
  { code: 'RELIANCE', numeric: '8885' },
  { code: 'SDS', numeric: '0212' },
  { code: 'ULICORP', numeric: '7133' },
]

async function main() {
  console.log('🚀 Fetching historical data for corrected companies...\n')
  let success = 0, failed = 0
  const results: { code: string; status: string; points?: number }[] = []

  for (let i = 0; i < correctedCompanies.length; i++) {
    const company = correctedCompanies[i]
    const symbol = `${company.numeric}.KL`
    console.log(`[${i + 1}/${correctedCompanies.length}] ${company.code} (${symbol})...`)

    const data = await fetchYahooHistory(symbol)
    if (data.length > 0) {
      const stored = await storeHistory(company.numeric, data)
      if (stored) {
        success++
        console.log(`  ✅ ${data.length} data points`)
        results.push({ code: company.code, status: 'success', points: data.length })
      } else {
        failed++
        console.log('  ❌ Store failed')
        results.push({ code: company.code, status: 'store_failed' })
      }
    } else {
      failed++
      console.log('  ❌ No data')
      results.push({ code: company.code, status: 'no_data' })
    }

    await sleep(2000)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Results Summary')
  console.log(`  ✅ Success: ${success}`)
  console.log(`  ❌ Failed: ${failed}`)

  console.log('\nSuccessful:')
  results.filter(r => r.status === 'success').forEach(r => {
    console.log(`  ✅ ${r.code}: ${r.points} pts`)
  })

  if (results.some(r => r.status !== 'success')) {
    console.log('\nFailed:')
    results.filter(r => r.status !== 'success').forEach(r => {
      console.log(`  ❌ ${r.code}`)
    })
  }
}

main().catch(console.error)

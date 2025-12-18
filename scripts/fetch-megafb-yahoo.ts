#!/usr/bin/env npx tsx
/**
 * Fetch MEGAFB (5327) from Yahoo Finance since EODHD doesn't have it yet
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
  console.log('Fetching MEGAFB (5327) from Yahoo Finance...')

  const resp = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/5327.KL?range=max&interval=1d')
  const data = await resp.json()
  const result = data?.chart?.result?.[0]

  if (!result?.timestamp) {
    console.log('No data found')
    return
  }

  const timestamps = result.timestamp
  const quotes = result.indicators.quote[0]
  const adjClose = result.indicators.adjclose?.[0]?.adjclose

  console.log(`Found ${timestamps.length} records`)

  // Delete existing
  await supabase.from('stock_history_cache').delete().eq('stock_code', '5327')

  // Build records
  const records = timestamps.map((ts: number, i: number) => ({
    stock_code: '5327',
    date: new Date(ts * 1000).toISOString().split('T')[0],
    open: Number((quotes.open?.[i] || quotes.close?.[i] || 0).toFixed(4)),
    high: Number((quotes.high?.[i] || quotes.close?.[i] || 0).toFixed(4)),
    low: Number((quotes.low?.[i] || quotes.close?.[i] || 0).toFixed(4)),
    close: Number((adjClose?.[i] || quotes.close?.[i] || 0).toFixed(4)),
    volume: quotes.volume?.[i] || 0,
    updated_at: new Date().toISOString(),
  })).filter((r: { close: number }) => r.close > 0)

  // Insert
  const { error } = await supabase.from('stock_history_cache').insert(records)
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log(`✅ MEGAFB (5327): Inserted ${records.length} records`)
    console.log(`Date range: ${records[0].date} to ${records[records.length-1].date}`)
  }
}

main().catch(console.error)

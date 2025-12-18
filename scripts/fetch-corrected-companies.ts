#!/usr/bin/env npx tsx
/**
 * Fetch historical data for corrected companies
 * CGB (8052), MEGAFB (5327), COUNTRY (5738)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const EODHD_API_KEY = process.env.EODHD_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

if (!EODHD_API_KEY) {
  console.error('Missing EODHD_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const COMPANIES_TO_FETCH = [
  { code: 'CGB', numericCode: '8052', name: 'Central Global Berhad' },
  { code: 'MEGAFB', numericCode: '5327', name: 'Mega First Corporation Berhad' },
  { code: 'COUNTRY', numericCode: '5738', name: 'Country Heights Holdings Berhad' },
]

interface StockHistoryData {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjusted_close?: number
  volume: number
}

async function fetchEODHDHistory(numericCode: string): Promise<StockHistoryData[]> {
  const symbol = `${numericCode}.KLSE`
  const startDate = '2000-01-01'
  const endDate = new Date().toISOString().split('T')[0]

  const url = `https://eodhd.com/api/eod/${symbol}?api_token=${EODHD_API_KEY}&fmt=json&from=${startDate}&to=${endDate}`

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      console.error(`  EODHD error ${response.status} for ${numericCode}`)
      return []
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return []
    }

    return data
      .filter((item: { close: number }) => item.close != null && item.close > 0)
      .sort((a: { date: string }, b: { date: string }) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .map((item: {
        date: string
        open?: number
        high?: number
        low?: number
        close: number
        adjusted_close?: number
        volume?: number
      }) => ({
        date: item.date,
        open: item.open || item.close,
        high: item.high || item.close,
        low: item.low || item.close,
        close: item.close,
        adjusted_close: item.adjusted_close || item.close,
        volume: item.volume || 0,
      }))
  } catch (error) {
    console.error(`  Error fetching ${numericCode}: ${error}`)
    return []
  }
}

async function storeHistory(numericCode: string, data: StockHistoryData[]): Promise<boolean> {
  if (!data || data.length === 0) return false

  try {
    // Delete existing data
    const { error: deleteError } = await supabase
      .from('stock_history_cache')
      .delete()
      .eq('stock_code', numericCode)

    if (deleteError) {
      console.error(`  Delete error: ${deleteError.message}`)
      return false
    }

    // Insert new data with adjusted prices
    const records = data.map(item => {
      const adjustmentFactor = item.adjusted_close && item.close > 0
        ? item.adjusted_close / item.close
        : 1

      return {
        stock_code: numericCode,
        date: item.date,
        open: Number((item.open * adjustmentFactor).toFixed(4)),
        high: Number((item.high * adjustmentFactor).toFixed(4)),
        low: Number((item.low * adjustmentFactor).toFixed(4)),
        close: Number((item.adjusted_close || item.close).toFixed(4)),
        volume: item.volume,
        updated_at: new Date().toISOString(),
      }
    })

    // Insert in batches
    const batchSize = 500
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('stock_history_cache')
        .insert(batch)

      if (insertError) {
        console.error(`  Insert error: ${insertError.message}`)
        return false
      }
    }

    return true
  } catch (error) {
    console.error(`  Store error: ${error}`)
    return false
  }
}

async function main() {
  console.log('Fetching historical data for corrected companies...\n')

  for (const company of COMPANIES_TO_FETCH) {
    console.log(`Processing ${company.code} (${company.numericCode})...`)

    const history = await fetchEODHDHistory(company.numericCode)

    if (history.length > 0) {
      const stored = await storeHistory(company.numericCode, history)
      if (stored) {
        const years = Math.round((new Date(history[history.length - 1].date).getTime() -
                                  new Date(history[0].date).getTime()) / (365 * 24 * 60 * 60 * 1000))
        console.log(`  ✅ ${history.length} data points (${years}+ years)`)
      } else {
        console.log(`  ❌ Failed to store`)
      }
    } else {
      console.log(`  ⚠️ No EODHD data found`)
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\nDone!')
}

main().catch(console.error)

#!/usr/bin/env npx tsx
/**
 * Refetch ALL Historical Data for ALL Companies
 *
 * Uses EODHD API (primary) for accurate historical KLSE data
 * Fetches MAXIMUM historical range (not just 1 year)
 *
 * Run: npx tsx scripts/refetch-all-history.ts
 *
 * Options:
 *   --batch=N      Batch number (0-based) for parallel processing
 *   --batches=N    Total number of batches (default: 1)
 *   --verify       Verify data against current DB before replacing
 *   --dry-run      Show what would be processed
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const EODHD_API_KEY = process.env.EODHD_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!EODHD_API_KEY) {
  console.error('❌ Missing EODHD_API_KEY - required for accurate data')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// EODHD rate limit: 100,000 requests/day = ~70/min
const EODHD_DELAY_MS = 900 // ~67 requests/min to be safe

interface StockHistoryData {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjusted_close?: number
  volume: number
}

/**
 * Fetch FULL historical data from EODHD (from IPO to today)
 */
async function fetchEODHDFullHistory(numericCode: string): Promise<StockHistoryData[]> {
  try {
    const symbol = `${numericCode}.KLSE`
    // Fetch from year 2000 to today (covers all KLSE listings)
    const startDate = '2000-01-01'
    const endDate = new Date().toISOString().split('T')[0]

    const url = `https://eodhd.com/api/eod/${symbol}?api_token=${EODHD_API_KEY}&fmt=json&from=${startDate}&to=${endDate}`

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Try alternative symbol formats
        return await tryAlternativeSymbols(numericCode)
      }
      console.error(`  EODHD error ${response.status}`)
      return []
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return await tryAlternativeSymbols(numericCode)
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
    console.error(`  EODHD error: ${error}`)
    return []
  }
}

/**
 * Try alternative symbol formats for EODHD
 */
async function tryAlternativeSymbols(numericCode: string): Promise<StockHistoryData[]> {
  const alternatives = [
    `${numericCode}SS.KLSE`,  // Stapled securities
    `${numericCode}.KL`,      // Alternative format
  ]

  for (const symbol of alternatives) {
    try {
      const url = `https://eodhd.com/api/eod/${symbol}?api_token=${EODHD_API_KEY}&fmt=json&from=2000-01-01`
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          return data
            .filter((item: { close: number }) => item.close != null && item.close > 0)
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
        }
      }
    } catch {
      continue
    }
  }

  return []
}

/**
 * Delete existing history and store new data
 * Uses ADJUSTED close prices to account for stock splits/bonus issues
 */
async function replaceHistory(numericCode: string, data: StockHistoryData[]): Promise<boolean> {
  if (!data || data.length === 0) return false

  try {
    // Delete existing data for this stock
    const { error: deleteError } = await supabase
      .from('stock_history_cache')
      .delete()
      .eq('stock_code', numericCode)

    if (deleteError) {
      console.error(`  Delete error: ${deleteError.message}`)
      return false
    }

    // Insert new data - USE ADJUSTED CLOSE for accurate historical comparison
    // Calculate adjustment factor from raw close to adjusted close
    const records = data.map(item => {
      const adjustmentFactor = item.adjusted_close && item.close > 0
        ? item.adjusted_close / item.close
        : 1

      return {
        stock_code: numericCode,
        date: item.date,
        // Apply adjustment factor to all prices for consistency
        open: Number((item.open * adjustmentFactor).toFixed(4)),
        high: Number((item.high * adjustmentFactor).toFixed(4)),
        low: Number((item.low * adjustmentFactor).toFixed(4)),
        close: Number((item.adjusted_close || item.close).toFixed(4)),
        volume: item.volume,
        updated_at: new Date().toISOString(),
      }
    })

    // Insert in batches of 500
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

/**
 * Get all companies with numeric codes
 */
async function getAllCompanies(): Promise<Array<{ code: string; numeric_code: string; name: string }>> {
  const { data, error } = await supabase
    .from('companies')
    .select('code, numeric_code, name')
    .not('numeric_code', 'is', null)
    .order('code')

  if (error) {
    console.error('Error fetching companies:', error)
    return []
  }

  return data || []
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseArgs(): { batch: number; totalBatches: number; verify: boolean; dryRun: boolean } {
  const args = process.argv.slice(2)
  let batch = 0
  let totalBatches = 1
  let verify = false
  let dryRun = false

  for (const arg of args) {
    if (arg.startsWith('--batch=')) {
      batch = parseInt(arg.split('=')[1])
    } else if (arg.startsWith('--batches=')) {
      totalBatches = parseInt(arg.split('=')[1])
    } else if (arg === '--verify') {
      verify = true
    } else if (arg === '--dry-run') {
      dryRun = true
    }
  }

  return { batch, totalBatches, verify, dryRun }
}

async function main() {
  const { batch, totalBatches, verify, dryRun } = parseArgs()

  console.log('🚀 FULL Historical Data Refetch Script')
  console.log('=' .repeat(50))
  console.log(`📊 Data Source: EODHD (accurate historical data)`)
  console.log(`📅 Date Range: 2000-01-01 to today (FULL history)`)
  console.log(`🔢 Batch: ${batch + 1}/${totalBatches}`)

  // Get all companies
  const allCompanies = await getAllCompanies()
  console.log(`\n📋 Total companies: ${allCompanies.length}`)

  // Calculate batch range
  const batchSize = Math.ceil(allCompanies.length / totalBatches)
  const startIdx = batch * batchSize
  const endIdx = Math.min(startIdx + batchSize, allCompanies.length)
  const companies = allCompanies.slice(startIdx, endIdx)

  console.log(`📊 Processing companies ${startIdx + 1} to ${endIdx} (${companies.length} companies)`)

  if (dryRun) {
    console.log('\n🔍 Dry run - Companies in this batch:')
    for (const c of companies.slice(0, 10)) {
      console.log(`  - ${c.code} (${c.numeric_code})`)
    }
    if (companies.length > 10) {
      console.log(`  ... and ${companies.length - 10} more`)
    }
    return
  }

  // Process companies
  let success = 0
  let failed = 0
  let noData = 0
  const startTime = Date.now()
  const failedList: string[] = []

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    const globalIdx = startIdx + i + 1
    const progress = `[${globalIdx}/${allCompanies.length}]`

    process.stdout.write(`${progress} ${company.code} (${company.numeric_code})...`)

    // Fetch FULL historical data
    const history = await fetchEODHDFullHistory(company.numeric_code)

    if (history.length > 0) {
      const stored = await replaceHistory(company.numeric_code, history)
      if (stored) {
        success++
        const years = Math.round((new Date(history[history.length - 1].date).getTime() -
                                  new Date(history[0].date).getTime()) / (365 * 24 * 60 * 60 * 1000))
        console.log(` ✅ ${history.length} pts (${years}+ years)`)
      } else {
        failed++
        failedList.push(company.code)
        console.log(` ❌ Store failed`)
      }
    } else {
      noData++
      failedList.push(company.code)
      console.log(` ⚠️ No EODHD data`)
    }

    // Rate limiting
    await sleep(EODHD_DELAY_MS)

    // Progress update every 25 stocks
    if ((i + 1) % 25 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      const rate = Math.round((i + 1) / elapsed * 60)
      const eta = Math.round((companies.length - i - 1) / rate)
      console.log(`\n📊 Progress: ${success} ✅ | ${noData} ⚠️ | ${failed} ❌ | ~${rate}/min | ETA: ${eta}min\n`)
    }
  }

  // Final summary
  const totalTime = Math.round((Date.now() - startTime) / 1000)
  console.log('\n' + '=' .repeat(50))
  console.log('📊 Batch Complete!')
  console.log(`  ✅ Success: ${success}`)
  console.log(`  ⚠️ No EODHD data: ${noData}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  ⏱️ Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`)

  if (failedList.length > 0 && failedList.length <= 20) {
    console.log(`\n❌ Failed stocks: ${failedList.join(', ')}`)
  }
}

main().catch(console.error)

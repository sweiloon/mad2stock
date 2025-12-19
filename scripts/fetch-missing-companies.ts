#!/usr/bin/env npx tsx
/**
 * Fetch Missing Company Analysis Data
 *
 * This script fetches quarterly financial data for companies missing YoY/QoQ analysis
 * from i3investor and updates the database.
 */

import puppeteer, { Page } from 'puppeteer'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Missing companies to fetch - with correct stock codes
const MISSING_COMPANIES = [
  { code: 'ACO', numericCode: '0218', name: 'ACO Group Berhad' },
  { code: 'AMEDIA', numericCode: '0159', name: 'Asia Media Group Berhad' },
  { code: 'AXREIT', numericCode: '5106', name: 'Axis Real Estate Investment Trust' },
  { code: 'EDUSPEC', numericCode: '0107', name: 'Eduspec Holdings Berhad' },
  { code: 'KLCC', numericCode: '5235SS', name: 'KLCC Property Holdings Berhad' }, // Stapled Security - SS suffix
  { code: 'LHI', numericCode: '6633', name: 'Leong Hup International Berhad' }, // Correct code is 6633
  { code: 'MYAXIS', numericCode: '03064', name: 'MyAxis Group' }, // New company - may not have data
  { code: 'OMH', numericCode: '5298', name: 'OM Holdings Limited' },
  { code: 'UMSINT', numericCode: '5340', name: 'UMS Integration Limited' }, // Secondary listing
]

interface QuarterData {
  endDate: string
  revenue: number
  profit: number
  qoqRevenue: number | null
  qoqProfit: number | null
  yoyRevenue: number | null
  yoyProfit: number | null
}

function parseNumber(str: string): number {
  if (!str || str === '-' || str === 'N/A') return 0
  return parseFloat(str.replace(/,/g, '').replace(/[()]/g, ''))
}

function parsePercent(str: string): number | null {
  if (!str || str === '-' || str === 'N/A' || str.trim() === '') return null
  const num = parseFloat(str.replace('%', '').replace(/,/g, ''))
  return isNaN(num) ? null : num
}

function determineCategory(revenueChange: number | null, profitChange: number | null): number {
  if (revenueChange === null || profitChange === null) return 5

  const revUp = revenueChange > 0
  const profUp = profitChange > 0

  if (revUp && profUp) return 1  // Revenue UP, Profit UP
  if (revUp && !profUp) return 2 // Revenue UP, Profit DOWN
  if (!revUp && profUp) return 3 // Revenue DOWN, Profit UP
  return 4                        // Revenue DOWN, Profit DOWN
}

async function fetchCompanyData(page: Page, numericCode: string): Promise<QuarterData[]> {
  const url = `https://klse.i3investor.com/web/stock/financial-quarter/${numericCode}`

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await page.waitForSelector('table.dataTable tbody tr', { timeout: 10000 }).catch(() => null)

    const quarters = await page.evaluate(() => {
      const table = document.querySelector('table.dataTable')
      if (!table) return []

      const rows = table.querySelectorAll('tbody tr')
      const data: any[] = []

      rows.forEach(row => {
        const cells = row.querySelectorAll('td')
        if (cells.length >= 13) {
          data.push({
            endDate: cells[1]?.textContent?.trim() || '',
            revenue: cells[2]?.textContent?.trim() || '0',
            profit: cells[4]?.textContent?.trim() || '0',
            qoqRevenue: cells[10]?.textContent?.trim() || '',
            qoqProfit: cells[11]?.textContent?.trim() || '',
            yoyRevenue: cells[12]?.textContent?.trim() || '',
            yoyProfit: cells[12]?.textContent?.trim() || '' // Using same column for simplicity
          })
        }
      })

      return data
    })

    return quarters.map(q => ({
      endDate: q.endDate,
      revenue: parseNumber(q.revenue) * 1000, // Convert to actual value (thousands)
      profit: parseNumber(q.profit) * 1000,
      qoqRevenue: parsePercent(q.qoqRevenue),
      qoqProfit: parsePercent(q.qoqProfit),
      yoyRevenue: parsePercent(q.yoyRevenue),
      yoyProfit: parsePercent(q.yoyProfit)
    }))
  } catch (error) {
    console.error(`Error fetching ${numericCode}:`, error)
    return []
  }
}

async function calculateAnalysis(quarters: QuarterData[]) {
  if (quarters.length < 2) return null

  const latest = quarters[0]
  const previous = quarters[1]

  // Calculate QoQ
  const qoqRevenueChange = previous.revenue !== 0
    ? ((latest.revenue - previous.revenue) / Math.abs(previous.revenue)) * 100
    : null
  const qoqProfitChange = previous.profit !== 0
    ? ((latest.profit - previous.profit) / Math.abs(previous.profit)) * 100
    : null

  // Find same quarter last year for YoY
  let yoyRevenueChange: number | null = null
  let yoyProfitChange: number | null = null

  // Look for quarter from ~1 year ago (4 quarters back)
  if (quarters.length >= 5) {
    const yearAgo = quarters[4]
    yoyRevenueChange = yearAgo.revenue !== 0
      ? ((latest.revenue - yearAgo.revenue) / Math.abs(yearAgo.revenue)) * 100
      : null
    yoyProfitChange = yearAgo.profit !== 0
      ? ((latest.profit - yearAgo.profit) / Math.abs(yearAgo.profit)) * 100
      : null
  }

  return {
    yoy: {
      revenueChange: yoyRevenueChange,
      profitChange: yoyProfitChange,
      revenueCurrent: latest.revenue,
      profitCurrent: latest.profit,
      category: determineCategory(yoyRevenueChange, yoyProfitChange)
    },
    qoq: {
      revenueChange: qoqRevenueChange,
      profitChange: qoqProfitChange,
      category: determineCategory(qoqRevenueChange, qoqProfitChange)
    }
  }
}

async function main() {
  console.log('🚀 Fetching Missing Company Data')
  console.log('='.repeat(50))

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

  let successCount = 0
  let failCount = 0

  for (const company of MISSING_COMPANIES) {
    console.log(`\n📊 Processing ${company.code} (${company.numericCode})...`)

    // Get company ID from database
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('code', company.code)
      .single()

    if (companyError || !companyData) {
      console.log(`  ❌ Company not found in database: ${company.code}`)
      failCount++
      continue
    }

    const companyId = companyData.id

    // Fetch quarterly data
    const quarters = await fetchCompanyData(page, company.numericCode)

    if (quarters.length === 0) {
      console.log(`  ⚠️  No quarterly data found`)
      failCount++
      continue
    }

    console.log(`  Found ${quarters.length} quarters`)

    // Calculate analysis
    const analysis = await calculateAnalysis(quarters)

    if (!analysis) {
      console.log(`  ⚠️  Could not calculate analysis`)
      failCount++
      continue
    }

    // Check if YoY record exists
    const { data: existingYoY } = await supabase
      .from('yoy_analysis')
      .select('id')
      .eq('company_id', companyId)
      .single()

    let yoyError: any = null
    if (existingYoY) {
      // Update existing record
      const { error } = await supabase
        .from('yoy_analysis')
        .update({
          category: analysis.yoy.category,
          revenue_change_pct: analysis.yoy.revenueChange,
          profit_change_pct: analysis.yoy.profitChange,
          revenue_current: analysis.yoy.revenueCurrent,
          profit_current: analysis.yoy.profitCurrent,
          analysis_date: new Date().toISOString().split('T')[0]
        })
        .eq('company_id', companyId)
      yoyError = error
    } else {
      // Insert new record
      const { error } = await supabase
        .from('yoy_analysis')
        .insert({
          company_id: companyId,
          category: analysis.yoy.category,
          revenue_change_pct: analysis.yoy.revenueChange,
          profit_change_pct: analysis.yoy.profitChange,
          revenue_current: analysis.yoy.revenueCurrent,
          profit_current: analysis.yoy.profitCurrent,
          analysis_date: new Date().toISOString().split('T')[0]
        })
      yoyError = error
    }

    if (yoyError) {
      console.log(`  ❌ YoY insert error: ${yoyError.message}`)
    } else {
      console.log(`  ✅ YoY: Category ${analysis.yoy.category}, Rev: ${analysis.yoy.revenueChange?.toFixed(1)}%, Profit: ${analysis.yoy.profitChange?.toFixed(1)}%`)
    }

    // Check if QoQ record exists
    const { data: existingQoQ } = await supabase
      .from('qoq_analysis')
      .select('id')
      .eq('company_id', companyId)
      .single()

    let qoqError: any = null
    if (existingQoQ) {
      // Update existing record
      const { error } = await supabase
        .from('qoq_analysis')
        .update({
          category: analysis.qoq.category,
          revenue_change_pct: analysis.qoq.revenueChange,
          profit_change_pct: analysis.qoq.profitChange,
          analysis_date: new Date().toISOString().split('T')[0]
        })
        .eq('company_id', companyId)
      qoqError = error
    } else {
      // Insert new record
      const { error } = await supabase
        .from('qoq_analysis')
        .insert({
          company_id: companyId,
          category: analysis.qoq.category,
          revenue_change_pct: analysis.qoq.revenueChange,
          profit_change_pct: analysis.qoq.profitChange,
          analysis_date: new Date().toISOString().split('T')[0]
        })
      qoqError = error
    }

    if (qoqError) {
      console.log(`  ❌ QoQ insert error: ${qoqError.message}`)
    } else {
      console.log(`  ✅ QoQ: Category ${analysis.qoq.category}, Rev: ${analysis.qoq.revenueChange?.toFixed(1)}%, Profit: ${analysis.qoq.profitChange?.toFixed(1)}%`)
    }

    if (!yoyError && !qoqError) {
      successCount++
    } else {
      failCount++
    }

    // Small delay to be nice to the server
    await new Promise(r => setTimeout(r, 1000))
  }

  await browser.close()

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`  Success: ${successCount}`)
  console.log(`  Failed: ${failCount}`)
  console.log('\n✅ Done!')
}

main().catch(console.error)

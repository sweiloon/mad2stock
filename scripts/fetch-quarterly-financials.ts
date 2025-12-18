#!/usr/bin/env npx tsx
/**
 * Fetch Quarterly Financial Data from i3investor using Puppeteer
 *
 * Scrapes quarterly financial data for all KLSE companies and populates:
 * - yoy_analysis table (current quarter vs same quarter previous year)
 * - qoq_analysis table (current quarter vs previous quarter)
 *
 * Run: npx tsx scripts/fetch-quarterly-financials.ts
 *
 * Options:
 *   --batch=N      Batch number (0-based) for parallel processing
 *   --batches=N    Total number of batches (default: 1)
 *   --dry-run      Show what would be processed
 *   --start=N      Start from company index N
 *   --limit=N      Process only N companies
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import puppeteer, { Browser, Page } from 'puppeteer'

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

// Rate limiting to avoid being blocked
const REQUEST_DELAY_MS = 2000 // 2 seconds between requests

interface QuarterlyData {
  quarter: string
  endDate: string
  revenue: number
  profit: number
  qoq: string
  yoy: string
}

interface Company {
  id: string
  code: string
  numeric_code: string
  name: string
}

/**
 * Category definitions:
 * 1 = Revenue UP, Profit UP (Best)
 * 2 = Revenue UP, Profit DOWN
 * 3 = Revenue DOWN, Profit UP
 * 4 = Revenue DOWN, Profit DOWN (Worst)
 * 5 = Insufficient data
 */
function calculateCategory(revenueChange: number | null, profitChange: number | null): { category: number; name: string } {
  if (revenueChange === null || profitChange === null) {
    return { category: 5, name: 'Insufficient Data' }
  }

  if (revenueChange >= 0 && profitChange >= 0) {
    return { category: 1, name: 'Revenue UP, Profit UP' }
  } else if (revenueChange >= 0 && profitChange < 0) {
    return { category: 2, name: 'Revenue UP, Profit DOWN' }
  } else if (revenueChange < 0 && profitChange >= 0) {
    return { category: 3, name: 'Revenue DOWN, Profit UP' }
  } else {
    return { category: 4, name: 'Revenue DOWN, Profit DOWN' }
  }
}

/**
 * Parse number from string, handling Malaysian format
 */
function parseNumber(str: string): number {
  if (!str || str === '-' || str === 'N/A') return 0
  let cleaned = str.replace(/,/g, '').trim()
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1)
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Parse percentage from string
 */
function parsePercentage(str: string): number | null {
  if (!str || str === '-' || str === 'N/A' || str === '') return null
  let cleaned = str.replace(/%/g, '').replace(/,/g, '').trim()
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1)
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/**
 * Extract quarterly data from page using Puppeteer
 */
async function extractQuarterlyData(page: Page, numericCode: string): Promise<QuarterlyData[]> {
  try {
    const url = `https://klse.i3investor.com/web/stock/financial-quarter/${numericCode}`
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for the DataTable to load
    await page.waitForSelector('table.dataTable tbody tr', { timeout: 10000 }).catch(() => null)

    // Extract data using page.evaluate
    const quarters = await page.evaluate(() => {
      const table = document.querySelector('table.dataTable')
      if (!table) return []

      const rows = table.querySelectorAll('tbody tr')
      const data: Array<{
        quarter: string
        endDate: string
        revenue: string
        profit: string
        qoq: string
        yoy: string
      }> = []

      rows.forEach(row => {
        const cells = row.querySelectorAll('td')
        if (cells.length >= 13) {
          const endDate = cells[1]?.textContent?.trim() || ''
          const revenue = cells[2]?.textContent?.trim() || ''
          const np = cells[4]?.textContent?.trim() || ''
          const qoq = cells[11]?.textContent?.trim() || ''
          const yoy = cells[12]?.textContent?.trim() || ''

          if (endDate && revenue) {
            // Derive quarter from end date
            const dateMatch = endDate.match(/(\d{2})-(\w{3})-(\d{4})/)
            let quarter = ''
            if (dateMatch) {
              const month = dateMatch[2].toLowerCase()
              const year = dateMatch[3]
              const monthMap: Record<string, string> = {
                'jan': 'Q4', 'feb': 'Q4', 'mar': 'Q1',
                'apr': 'Q1', 'may': 'Q1', 'jun': 'Q2',
                'jul': 'Q2', 'aug': 'Q2', 'sep': 'Q3',
                'oct': 'Q3', 'nov': 'Q3', 'dec': 'Q4'
              }
              quarter = `${monthMap[month] || 'Q?'} ${year}`
            }

            data.push({ quarter, endDate, revenue, profit: np, qoq, yoy })
          }
        }
      })

      return data.slice(0, 20) // Get last 20 quarters (5 years)
    })

    // Parse the data
    return quarters.map(q => ({
      quarter: q.quarter,
      endDate: q.endDate,
      revenue: parseNumber(q.revenue) * 1000, // Convert from '000 to actual
      profit: parseNumber(q.profit) * 1000,
      qoq: q.qoq,
      yoy: q.yoy,
    }))
  } catch (error) {
    console.error(`  Error extracting data: ${error}`)
    return []
  }
}

/**
 * Store YoY analysis data
 */
async function storeYoYAnalysis(
  companyId: string,
  currentQuarter: QuarterlyData,
  previousYearQuarter: QuarterlyData | null
): Promise<boolean> {
  try {
    await supabase.from('yoy_analysis').delete().eq('company_id', companyId)

    let revenueChange: number | null = null
    let profitChange: number | null = null

    if (previousYearQuarter && previousYearQuarter.revenue !== 0) {
      revenueChange = ((currentQuarter.revenue - previousYearQuarter.revenue) / Math.abs(previousYearQuarter.revenue)) * 100
    } else {
      revenueChange = parsePercentage(currentQuarter.yoy)
    }

    if (previousYearQuarter && previousYearQuarter.profit !== 0) {
      profitChange = ((currentQuarter.profit - previousYearQuarter.profit) / Math.abs(previousYearQuarter.profit)) * 100
    } else {
      profitChange = parsePercentage(currentQuarter.yoy)
    }

    const { category, name } = calculateCategory(revenueChange, profitChange)

    const { error } = await supabase.from('yoy_analysis').insert({
      company_id: companyId,
      analysis_date: new Date().toISOString().split('T')[0],
      current_quarter: currentQuarter.quarter,
      previous_year_quarter: previousYearQuarter?.quarter || `${currentQuarter.quarter.replace(/20\d{2}/, (y) => String(parseInt(y) - 1))}`,
      revenue_current: currentQuarter.revenue,
      revenue_previous: previousYearQuarter?.revenue || null,
      revenue_change_pct: revenueChange !== null ? Number(revenueChange.toFixed(2)) : null,
      profit_current: currentQuarter.profit,
      profit_previous: previousYearQuarter?.profit || null,
      profit_change_pct: profitChange !== null ? Number(profitChange.toFixed(2)) : null,
      category,
      category_name: name,
      notes: previousYearQuarter ? null : 'YoY data from i3investor',
    })

    return !error
  } catch (error) {
    console.error(`  YoY store error: ${error}`)
    return false
  }
}

/**
 * Store QoQ analysis data
 */
async function storeQoQAnalysis(
  companyId: string,
  currentQuarter: QuarterlyData,
  previousQuarter: QuarterlyData | null
): Promise<boolean> {
  try {
    await supabase.from('qoq_analysis').delete().eq('company_id', companyId)

    let revenueChange: number | null = null
    let profitChange: number | null = null

    if (previousQuarter && previousQuarter.revenue !== 0) {
      revenueChange = ((currentQuarter.revenue - previousQuarter.revenue) / Math.abs(previousQuarter.revenue)) * 100
    } else {
      revenueChange = parsePercentage(currentQuarter.qoq)
    }

    if (previousQuarter && previousQuarter.profit !== 0) {
      profitChange = ((currentQuarter.profit - previousQuarter.profit) / Math.abs(previousQuarter.profit)) * 100
    } else {
      profitChange = parsePercentage(currentQuarter.qoq)
    }

    const { category, name } = calculateCategory(revenueChange, profitChange)

    let prevQuarterName = previousQuarter?.quarter
    if (!prevQuarterName && currentQuarter.quarter) {
      const match = currentQuarter.quarter.match(/Q([1-4])\s*(\d{4})/i)
      if (match) {
        const q = parseInt(match[1])
        const year = parseInt(match[2])
        prevQuarterName = q === 1 ? `Q4 ${year - 1}` : `Q${q - 1} ${year}`
      }
    }

    const { error } = await supabase.from('qoq_analysis').insert({
      company_id: companyId,
      analysis_date: new Date().toISOString().split('T')[0],
      current_quarter: currentQuarter.quarter,
      previous_quarter: prevQuarterName || 'Previous Quarter',
      revenue_current: currentQuarter.revenue,
      revenue_previous: previousQuarter?.revenue || null,
      revenue_change_pct: revenueChange !== null ? Number(revenueChange.toFixed(2)) : null,
      profit_current: currentQuarter.profit,
      profit_previous: previousQuarter?.profit || null,
      profit_change_pct: profitChange !== null ? Number(profitChange.toFixed(2)) : null,
      category,
      category_name: name,
      notes: previousQuarter ? null : 'QoQ data from i3investor',
    })

    return !error
  } catch (error) {
    console.error(`  QoQ store error: ${error}`)
    return false
  }
}

/**
 * Get all companies
 */
async function getAllCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, code, numeric_code, name')
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

function parseArgs(): { batch: number; totalBatches: number; dryRun: boolean; start: number; limit: number } {
  const args = process.argv.slice(2)
  let batch = 0
  let totalBatches = 1
  let dryRun = false
  let start = 0
  let limit = 0

  for (const arg of args) {
    if (arg.startsWith('--batch=')) batch = parseInt(arg.split('=')[1])
    else if (arg.startsWith('--batches=')) totalBatches = parseInt(arg.split('=')[1])
    else if (arg === '--dry-run') dryRun = true
    else if (arg.startsWith('--start=')) start = parseInt(arg.split('=')[1])
    else if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1])
  }

  return { batch, totalBatches, dryRun, start, limit }
}

async function main() {
  const { batch, totalBatches, dryRun, start, limit } = parseArgs()

  console.log('🚀 Quarterly Financial Data Fetch Script (Puppeteer)')
  console.log('=' .repeat(50))
  console.log(`📊 Data Source: i3investor.com`)
  console.log(`🔢 Batch: ${batch + 1}/${totalBatches}`)

  let allCompanies = await getAllCompanies()
  console.log(`\n📋 Total companies: ${allCompanies.length}`)

  if (start > 0) {
    allCompanies = allCompanies.slice(start)
    console.log(`📍 Starting from index ${start}`)
  }
  if (limit > 0) {
    allCompanies = allCompanies.slice(0, limit)
    console.log(`📍 Limited to ${limit} companies`)
  }

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
    if (companies.length > 10) console.log(`  ... and ${companies.length - 10} more`)
    return
  }

  // Launch browser
  console.log('\n🌐 Launching browser...')
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const page: Page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  let success = 0
  let failed = 0
  let noData = 0
  const startTime = Date.now()
  const failedList: string[] = []

  try {
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i]
      const globalIdx = startIdx + i + 1
      const progress = `[${globalIdx}/${allCompanies.length}]`

      process.stdout.write(`${progress} ${company.code} (${company.numeric_code})...`)

      const quarters = await extractQuarterlyData(page, company.numeric_code)

      if (quarters.length > 0) {
        const currentQuarter = quarters[0]
        const previousQuarter = quarters.length > 1 ? quarters[1] : null

        // Find same quarter previous year for YoY
        const currentMatch = currentQuarter.quarter.match(/Q([1-4])\s*(\d{4})/i)
        let previousYearQuarter: QuarterlyData | null = null

        if (currentMatch) {
          const targetQ = currentMatch[1]
          const targetYear = parseInt(currentMatch[2]) - 1
          previousYearQuarter = quarters.find(q => {
            const m = q.quarter.match(/Q([1-4])\s*(\d{4})/i)
            return m && m[1] === targetQ && parseInt(m[2]) === targetYear
          }) || null
        }

        const yoyStored = await storeYoYAnalysis(company.id, currentQuarter, previousYearQuarter)
        const qoqStored = await storeQoQAnalysis(company.id, currentQuarter, previousQuarter)

        if (yoyStored && qoqStored) {
          success++
          console.log(` ✅ ${quarters.length}Q`)
        } else {
          failed++
          failedList.push(company.code)
          console.log(` ⚠️ Partial`)
        }
      } else {
        noData++
        failedList.push(company.code)
        console.log(` ❌ No data`)
      }

      await sleep(REQUEST_DELAY_MS)

      if ((i + 1) % 25 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        const rate = Math.round((i + 1) / elapsed * 60)
        const eta = Math.round((companies.length - i - 1) / rate)
        console.log(`\n📊 Progress: ${success} ✅ | ${noData} ❌ | ${failed} ⚠️ | ~${rate}/min | ETA: ${eta}min\n`)
      }
    }
  } finally {
    await browser.close()
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000)
  console.log('\n' + '=' .repeat(50))
  console.log('📊 Batch Complete!')
  console.log(`  ✅ Success: ${success}`)
  console.log(`  ❌ No data: ${noData}`)
  console.log(`  ⚠️ Partial: ${failed}`)
  console.log(`  ⏱️ Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`)

  if (failedList.length > 0 && failedList.length <= 30) {
    console.log(`\n❌ Failed stocks: ${failedList.join(', ')}`)
  }
}

main().catch(console.error)

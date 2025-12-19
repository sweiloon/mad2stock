/**
 * Company Verification Script
 *
 * Verifies all 768 companies against Yahoo Finance to detect name/code mismatches.
 * Generates Markdown + CSV reports for user review.
 *
 * Usage: npx tsx scripts/verify-companies.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Configuration
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const REQUEST_DELAY_MS = 1500
const MAX_RETRIES = 2
const CHECKPOINT_INTERVAL = 50
const SIMILARITY_THRESHOLD = 80 // Only flag if below this

// Paths
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'verification')
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progress.json')

// Types
interface Company {
  code: string
  name: string
  numeric_code: string
}

interface VerificationResult {
  code: string
  numericCode: string
  ourName: string
  yahooName: string | null
  similarity: number
  category: 'MATCH' | 'MISMATCH' | 'NOT_FOUND' | 'ERROR'
  normalizedOurs: string
  normalizedYahoo: string
}

interface Progress {
  startedAt: string
  lastIndex: number
  results: VerificationResult[]
}

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Normalize company name for comparison
 */
function normalize(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s*BERHAD\s*/gi, ' BHD ')
    .replace(/\s*SDN\.?\s*BHD\.?\s*/gi, ' ')
    .replace(/\s*\(M\)\s*/gi, ' ')
    .replace(/\s*\(MALAYSIA\)\s*/gi, ' ')
    .replace(/\s*HOLDINGS?\s*/gi, ' ')
    .replace(/\s*GROUP\s*/gi, ' ')
    .replace(/\s*CORPORATION\s*/gi, ' CORP ')
    .replace(/\s*INTERNATIONAL\s*/gi, ' INTL ')
    .replace(/[.\-'"(),&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity percentage
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 100
  const distance = levenshteinDistance(str1, str2)
  return Math.round((1 - distance / maxLen) * 100)
}

/**
 * Fetch stock data from Yahoo Finance
 */
async function fetchYahooData(numericCode: string, retries = MAX_RETRIES): Promise<string | null> {
  const symbol = `${numericCode}.KL`
  const url = `${YAHOO_CHART_URL}/${symbol}?interval=1d&range=1d`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    if (response.status === 429 && retries > 0) {
      console.warn(`  Rate limited for ${symbol}, waiting 10s...`)
      await delay(10000)
      return fetchYahooData(numericCode, retries - 1)
    }

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const meta = data?.chart?.result?.[0]?.meta

    if (!meta) {
      return null
    }

    return meta.shortName || meta.longName || null
  } catch (error) {
    if (retries > 0) {
      await delay(5000)
      return fetchYahooData(numericCode, retries - 1)
    }
    return null
  }
}

/**
 * Load progress from checkpoint
 */
function loadProgress(): Progress | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch {
    // Ignore errors
  }
  return null
}

/**
 * Save progress checkpoint
 */
function saveProgress(progress: Progress): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(results: VerificationResult[]): string {
  const date = new Date().toISOString().split('T')[0]
  const mismatches = results.filter(r => r.category === 'MISMATCH')
  const notFound = results.filter(r => r.category === 'NOT_FOUND')
  const matches = results.filter(r => r.category === 'MATCH')
  const errors = results.filter(r => r.category === 'ERROR')

  // Sort mismatches by similarity (lowest first = most critical)
  mismatches.sort((a, b) => a.similarity - b.similarity)

  let md = `# Company Verification Report
Generated: ${new Date().toISOString()}

## Summary
| Category | Count | Percentage |
|----------|-------|------------|
| Matches (80%+) | ${matches.length} | ${((matches.length / results.length) * 100).toFixed(1)}% |
| **Mismatches (<80%)** | **${mismatches.length}** | **${((mismatches.length / results.length) * 100).toFixed(1)}%** |
| Not Found | ${notFound.length} | ${((notFound.length / results.length) * 100).toFixed(1)}% |
| Errors | ${errors.length} | ${((errors.length / results.length) * 100).toFixed(1)}% |
| **Total** | **${results.length}** | 100% |

---

`

  if (mismatches.length > 0) {
    md += `## MISMATCHES - Requires Review (${mismatches.length} companies)

| Code | Numeric | Our Name | Yahoo Name | Similarity |
|------|---------|----------|------------|------------|
`
    for (const r of mismatches) {
      md += `| ${r.code} | ${r.numericCode} | ${r.ourName} | ${r.yahooName || 'N/A'} | ${r.similarity}% |\n`
    }
    md += '\n---\n\n'
  }

  if (notFound.length > 0) {
    md += `## NOT FOUND - Manual Check Required (${notFound.length} companies)

| Code | Numeric | Our Name |
|------|---------|----------|
`
    for (const r of notFound) {
      md += `| ${r.code} | ${r.numericCode} | ${r.ourName} |\n`
    }
    md += '\n---\n\n'
  }

  md += `## Verified OK (${matches.length} companies)

These companies matched with 80%+ similarity - no action needed.

<details>
<summary>Click to expand full list</summary>

| Code | Numeric | Our Name | Yahoo Name | Similarity |
|------|---------|----------|------------|------------|
`
  for (const r of matches) {
    md += `| ${r.code} | ${r.numericCode} | ${r.ourName} | ${r.yahooName || 'N/A'} | ${r.similarity}% |\n`
  }
  md += '\n</details>\n'

  return md
}

/**
 * Generate CSV report
 */
function generateCsvReport(results: VerificationResult[]): string {
  let csv = 'code,numeric_code,our_name,yahoo_name,similarity,category,normalized_ours,normalized_yahoo\n'

  for (const r of results) {
    const escapeCsv = (s: string | null) => {
      if (!s) return ''
      return `"${s.replace(/"/g, '""')}"`
    }

    csv += `${r.code},${r.numericCode},${escapeCsv(r.ourName)},${escapeCsv(r.yahooName)},${r.similarity},${r.category},${escapeCsv(r.normalizedOurs)},${escapeCsv(r.normalizedYahoo)}\n`
  }

  return csv
}

/**
 * Main verification function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('Company Verification Script')
  console.log('='.repeat(60))

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Fetch all companies from database
  console.log('\nFetching companies from database...')
  const { data: companies, error } = await supabase
    .from('companies')
    .select('code, name, numeric_code')
    .order('code')

  if (error || !companies) {
    console.error('Failed to fetch companies:', error)
    process.exit(1)
  }

  console.log(`Found ${companies.length} companies`)

  // Check for existing progress
  let progress = loadProgress()
  let startIndex = 0
  let results: VerificationResult[] = []

  if (progress && progress.results.length > 0) {
    const resume = process.argv.includes('--resume')
    if (resume) {
      startIndex = progress.lastIndex + 1
      results = progress.results
      console.log(`\nResuming from company ${startIndex + 1}/${companies.length}`)
    } else {
      console.log(`\nFound previous progress at ${progress.lastIndex + 1}/${companies.length}`)
      console.log('Use --resume to continue, or starting fresh...')
    }
  }

  // Estimate time
  const remaining = companies.length - startIndex
  const estimatedMinutes = Math.ceil((remaining * REQUEST_DELAY_MS) / 60000)
  console.log(`\nEstimated time: ~${estimatedMinutes} minutes for ${remaining} companies`)
  console.log('Progress saved every 50 companies\n')

  // Process each company
  for (let i = startIndex; i < companies.length; i++) {
    const company = companies[i] as Company

    if (!company.numeric_code) {
      console.log(`[${i + 1}/${companies.length}] ${company.code}: No numeric code, skipping`)
      results.push({
        code: company.code,
        numericCode: '',
        ourName: company.name,
        yahooName: null,
        similarity: 0,
        category: 'ERROR',
        normalizedOurs: normalize(company.name),
        normalizedYahoo: '',
      })
      continue
    }

    process.stdout.write(`[${i + 1}/${companies.length}] ${company.code} (${company.numeric_code}): `)

    // Fetch from Yahoo
    const yahooName = await fetchYahooData(company.numeric_code)

    if (!yahooName) {
      console.log('NOT FOUND')
      results.push({
        code: company.code,
        numericCode: company.numeric_code,
        ourName: company.name,
        yahooName: null,
        similarity: 0,
        category: 'NOT_FOUND',
        normalizedOurs: normalize(company.name),
        normalizedYahoo: '',
      })
    } else {
      const normalizedOurs = normalize(company.name)
      const normalizedYahoo = normalize(yahooName)
      const similarity = calculateSimilarity(normalizedOurs, normalizedYahoo)
      const category = similarity >= SIMILARITY_THRESHOLD ? 'MATCH' : 'MISMATCH'

      if (category === 'MISMATCH') {
        console.log(`MISMATCH (${similarity}%) - Yahoo: "${yahooName}"`)
      } else {
        console.log(`OK (${similarity}%)`)
      }

      results.push({
        code: company.code,
        numericCode: company.numeric_code,
        ourName: company.name,
        yahooName,
        similarity,
        category,
        normalizedOurs,
        normalizedYahoo,
      })
    }

    // Save checkpoint
    if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
      saveProgress({
        startedAt: progress?.startedAt || new Date().toISOString(),
        lastIndex: i,
        results,
      })
      console.log(`  [Checkpoint saved at ${i + 1}]`)
    }

    // Delay between requests
    if (i < companies.length - 1) {
      await delay(REQUEST_DELAY_MS)
    }
  }

  // Generate reports
  console.log('\n' + '='.repeat(60))
  console.log('Generating reports...')

  const date = new Date().toISOString().split('T')[0]
  const mdPath = path.join(OUTPUT_DIR, `report-${date}.md`)
  const csvPath = path.join(OUTPUT_DIR, `report-${date}.csv`)

  fs.writeFileSync(mdPath, generateMarkdownReport(results))
  fs.writeFileSync(csvPath, generateCsvReport(results))

  // Summary
  const mismatches = results.filter(r => r.category === 'MISMATCH')
  const notFound = results.filter(r => r.category === 'NOT_FOUND')
  const matches = results.filter(r => r.category === 'MATCH')

  console.log('\n' + '='.repeat(60))
  console.log('VERIFICATION COMPLETE')
  console.log('='.repeat(60))
  console.log(`\nResults:`)
  console.log(`  Matches (80%+):     ${matches.length} (${((matches.length / results.length) * 100).toFixed(1)}%)`)
  console.log(`  MISMATCHES (<80%):  ${mismatches.length} (${((mismatches.length / results.length) * 100).toFixed(1)}%)`)
  console.log(`  Not Found:          ${notFound.length} (${((notFound.length / results.length) * 100).toFixed(1)}%)`)
  console.log(`\nReports saved:`)
  console.log(`  Markdown: ${mdPath}`)
  console.log(`  CSV:      ${csvPath}`)

  if (mismatches.length > 0) {
    console.log(`\n${'!'.repeat(60)}`)
    console.log(`ACTION REQUIRED: ${mismatches.length} companies need review!`)
    console.log(`Check the Markdown report for details.`)
    console.log(`${'!'.repeat(60)}`)
  }

  // Clean up progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE)
  }
}

main().catch(console.error)

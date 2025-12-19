/**
 * Fix Company Mismatches Script
 *
 * Updates database, stock-codes.ts, and company-data.ts for companies
 * where the stock code has been reassigned to a different company.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Critical mismatches - our code, numeric code, Yahoo's correct code
const CRITICAL_MISMATCHES = [
  // 0% similarity - definitely wrong
  { oldCode: 'FTES', numericCode: '0373', newCode: 'VERDANT' },
  { oldCode: 'DGB', numericCode: '7208', newCode: 'EURO' },
  { oldCode: 'ECOHLDG', numericCode: '0229', newCode: 'MOBILIA' },
  { oldCode: 'EFORCE', numericCode: '0297', newCode: 'TSA' },
  { oldCode: 'EWEIN', numericCode: '7249', newCode: 'SKYGATE' },
  { oldCode: 'FCW', numericCode: '8486', newCode: 'LIONPSIM' },
  { oldCode: 'FUCEHS', numericCode: '0302', newCode: 'TOPMIX' },
  { oldCode: 'IGBB', numericCode: '5160', newCode: 'HOMERIZ' },
  { oldCode: 'KRONOS', numericCode: '0352', newCode: 'WTEC' },
  { oldCode: 'LDMD', numericCode: '0289', newCode: 'PLYTEC' },
  { oldCode: 'LEGEND', numericCode: '0313', newCode: 'BWYS' },
  { oldCode: 'LIMKOKW', numericCode: '0319', newCode: 'VTC' },
  { oldCode: 'MINDA', numericCode: '0337', newCode: 'SET' },
  { oldCode: 'OPERON', numericCode: '0321', newCode: 'SDCG' },
  { oldCode: 'PEKAT', numericCode: '0219', newCode: 'RL' },
  { oldCode: 'PJBUMI', numericCode: '0366', newCode: 'ICENTS' },
  { oldCode: 'UUE', numericCode: '0240', newCode: 'CORAZA' },

  // Very low similarity (4-10%) - likely reassignments
  { oldCode: 'GCSB', numericCode: '0310', newCode: 'UUE' },
  { oldCode: 'IEPMECH', numericCode: '0306', newCode: 'SMART' },
  { oldCode: 'CERATEC', numericCode: '0165', newCode: 'XOX' },
  { oldCode: 'DKLS', numericCode: '7173', newCode: 'TOYOVEN' },
  { oldCode: 'BLDPLNT', numericCode: '5163', newCode: 'SEB' },
  { oldCode: 'GIGASUNS', numericCode: '0308', newCode: 'KTI' },
  { oldCode: 'GSTEEL', numericCode: '0288', newCode: 'MINOX' },
  { oldCode: 'JIANKUN', numericCode: '0199', newCode: 'TRIMODE' },
  { oldCode: 'JTKBHD', numericCode: '0325', newCode: 'NE' },
  { oldCode: 'KINRARA', numericCode: '0282', newCode: 'KGW' },
  { oldCode: 'LATITUDE', numericCode: '7006', newCode: 'RKI' },
  { oldCode: 'NHFATT', numericCode: '5085', newCode: 'MUDAJYA' },
  { oldCode: 'PGLOBE', numericCode: '0281', newCode: 'DAY3' },
]

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch full company name from Yahoo Finance
 */
async function fetchYahooName(numericCode: string): Promise<{ shortName: string; longName: string } | null> {
  const symbol = `${numericCode}.KL`
  const url = `${YAHOO_CHART_URL}/${symbol}?interval=1d&range=1d`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    const meta = data?.chart?.result?.[0]?.meta

    if (!meta) return null

    return {
      shortName: meta.shortName || '',
      longName: meta.longName || meta.shortName || ''
    }
  } catch {
    return null
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('Fix Company Mismatches')
  console.log('='.repeat(60))

  const updates: Array<{
    oldCode: string
    newCode: string
    numericCode: string
    newName: string
  }> = []

  // Step 1: Fetch correct names from Yahoo
  console.log('\n1. Fetching correct company names from Yahoo Finance...\n')

  for (const mismatch of CRITICAL_MISMATCHES) {
    process.stdout.write(`   ${mismatch.oldCode} (${mismatch.numericCode}) → ${mismatch.newCode}: `)

    const yahooData = await fetchYahooName(mismatch.numericCode)

    if (yahooData) {
      // Construct proper name: shortName + "Berhad" if not present
      let newName = yahooData.longName || yahooData.shortName
      if (!newName.toLowerCase().includes('berhad') && !newName.toLowerCase().includes('bhd')) {
        newName = `${yahooData.shortName} Berhad`
      }

      console.log(`"${newName}"`)
      updates.push({
        oldCode: mismatch.oldCode,
        newCode: mismatch.newCode,
        numericCode: mismatch.numericCode,
        newName
      })
    } else {
      console.log('FAILED to fetch')
    }

    await delay(1500)
  }

  console.log(`\n   Found ${updates.length} companies to update\n`)

  // Step 2: Update database
  console.log('2. Updating database...\n')

  let dbSuccessCount = 0
  for (const update of updates) {
    const { error } = await supabase
      .from('companies')
      .update({
        code: update.newCode,
        name: update.newName
      })
      .eq('numeric_code', update.numericCode)

    if (error) {
      console.log(`   ERROR updating ${update.oldCode}: ${error.message}`)
    } else {
      console.log(`   Updated: ${update.oldCode} → ${update.newCode}`)
      dbSuccessCount++
    }
  }

  console.log(`\n   Database: ${dbSuccessCount}/${updates.length} updated\n`)

  // Step 3: Generate stock-codes.ts changes
  console.log('3. Stock-codes.ts changes needed:\n')
  console.log('   // REMOVE these lines:')
  for (const update of updates) {
    console.log(`   "${update.oldCode}": "${update.numericCode}",`)
  }
  console.log('\n   // ADD these lines:')
  for (const update of updates) {
    console.log(`   "${update.newCode}": "${update.numericCode}",`)
  }

  // Step 4: Generate company-data.ts changes
  console.log('\n4. Company-data.ts entries to update:\n')
  for (const update of updates) {
    console.log(`   { code: "${update.newCode}", name: "${update.newName}", stockCode: "${update.numericCode}", ... },`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`\nTotal companies fixed: ${updates.length}`)
  console.log(`Database updates: ${dbSuccessCount}`)
  console.log('\nNext steps:')
  console.log('1. Update stock-codes.ts with the changes above')
  console.log('2. Run sync-analysis-to-frontend.ts to regenerate company-data.ts')
  console.log('3. Restart the dev server')
}

main().catch(console.error)

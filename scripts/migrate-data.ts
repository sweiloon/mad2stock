/**
 * Data Migration Script
 * Parses report-summary.txt and migrates data to Supabase
 *
 * Usage: npx ts-node scripts/migrate-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Types
interface CompanyData {
  code: string
  name: string
  sector?: string
}

interface AnalysisData {
  code: string
  category: number
  categoryName: string
  currentQuarter: string
  previousQuarter: string
  revenueCurrent: number
  revenuePrevious: number
  revenueChangePct: number
  profitCurrent: number
  profitPrevious: number
  profitChangePct: number
  notes?: string
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Parse money values like "617.9m", "72.2m", "392k"
function parseMoney(value: string): number {
  if (!value) return 0

  const cleaned = value.toLowerCase().replace(/[,\s]/g, '')

  if (cleaned.includes('m')) {
    return parseFloat(cleaned.replace('m', '')) * 1000000
  } else if (cleaned.includes('k')) {
    return parseFloat(cleaned.replace('k', '')) * 1000
  } else if (cleaned.includes('b')) {
    return parseFloat(cleaned.replace('b', '')) * 1000000000
  }

  return parseFloat(cleaned) || 0
}

// Parse percentage values like "+14.1%", "-5.2%"
function parsePercentage(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[%\s]/g, '')
  return parseFloat(cleaned) || 0
}

// Parse company code from format "AEONCR (5139)" or "BNASTRA (7195)"
function parseCompanyCode(text: string): { code: string; stockCode: string } {
  const match = text.match(/^(\w+(?:&\w+)?)\s*\((\d+)\)/)
  if (match) {
    return { code: match[1], stockCode: match[2] }
  }
  return { code: text.trim(), stockCode: '' }
}

// Parse a single company entry from report
function parseCompanyEntry(lines: string[]): AnalysisData | null {
  try {
    const headerLine = lines[0]
    const { code } = parseCompanyCode(headerLine.replace(/^\d+\.\s*/, ''))

    // Find the relevant data lines
    let revenueCurrent = 0, profitCurrent = 0
    let revenuePrevious = 0, profitPrevious = 0
    let revenueChangePct = 0, profitChangePct = 0
    let currentQuarter = '', previousQuarter = ''
    let notes = ''

    for (const line of lines) {
      // Parse "Latest Q2 2025-08-31: Rev 617.9m, Profit 72.2m"
      const latestMatch = line.match(/Latest\s+(Q\d\s+\d{4}[-\d]+):\s+Rev\s+([\d.]+[mkb]?),?\s+Profit\s+([-\d.]+[mkb]?)/)
      if (latestMatch) {
        currentQuarter = latestMatch[1].replace(/-/g, '')
        revenueCurrent = parseMoney(latestMatch[2])
        profitCurrent = parseMoney(latestMatch[3])
      }

      // Parse "vs Q2 2024-08-31: Rev 541.4m, Profit 71.2m"
      const vsMatch = line.match(/vs\s+(Q\d\s+\d{4}[-\d]+):\s+Rev\s+([\d.]+[mkb]?),?\s+Profit\s+([-\d.]+[mkb]?)/)
      if (vsMatch) {
        previousQuarter = vsMatch[1].replace(/-/g, '')
        revenuePrevious = parseMoney(vsMatch[2])
        profitPrevious = parseMoney(vsMatch[3])
      }

      // Parse "Change: Rev +14.1%, Profit +1.4%"
      const changeMatch = line.match(/Change:\s+Rev\s+([-+]?[\d.]+)%,?\s+Profit\s+([-+]?[\d.]+)%/)
      if (changeMatch) {
        revenueChangePct = parseFloat(changeMatch[1])
        profitChangePct = parseFloat(changeMatch[2])
      }

      // Parse Analysis line
      const analysisMatch = line.match(/Analysis:\s*(.+)/)
      if (analysisMatch) {
        notes = analysisMatch[1].trim()
      }
    }

    return {
      code,
      category: 0, // Will be set by caller
      categoryName: '',
      currentQuarter,
      previousQuarter,
      revenueCurrent,
      revenuePrevious,
      revenueChangePct,
      profitCurrent,
      profitPrevious,
      profitChangePct,
      notes
    }
  } catch (error) {
    console.error('Error parsing company entry:', error)
    return null
  }
}

// Parse the entire report file
function parseReportSummary(content: string): { yoy: AnalysisData[], qoq: AnalysisData[] } {
  const lines = content.split('\n')
  const yoyData: AnalysisData[] = []
  const qoqData: AnalysisData[] = []

  let currentSection: 'yoy' | 'qoq' | null = null
  let currentCategory = 0
  let currentCategoryName = ''
  let companyLines: string[] = []

  const categoryMapping: Record<string, { id: number; name: string }> = {
    'REVENUE UP, PROFIT UP': { id: 1, name: 'Revenue UP, Profit UP' },
    'REVENUE DOWN, PROFIT UP': { id: 2, name: 'Revenue DOWN, Profit UP' },
    'REVENUE UP, PROFIT DOWN': { id: 3, name: 'Revenue UP, Profit DOWN' },
    'REVENUE DOWN, PROFIT DOWN': { id: 4, name: 'Revenue DOWN, Profit DOWN' },
    'TURNAROUND': { id: 5, name: 'Turnaround - Loss to Profit' },
    'DETERIORATING': { id: 6, name: 'Deteriorating - Profit to Loss' }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect YoY section
    if (line.includes('YEAR-OVER-YEAR (YoY) ANALYSIS')) {
      currentSection = 'yoy'
      continue
    }

    // Detect QoQ section
    if (line.includes('QUARTER-OVER-QUARTER (QoQ) ANALYSIS')) {
      // Save any pending company
      if (companyLines.length > 0 && currentSection === 'yoy') {
        const data = parseCompanyEntry(companyLines)
        if (data) {
          data.category = currentCategory
          data.categoryName = currentCategoryName
          yoyData.push(data)
        }
        companyLines = []
      }
      currentSection = 'qoq'
      continue
    }

    // Detect category headers
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (line.includes(`CATEGORY ${value.id}:`) || line.includes(key)) {
        // Save any pending company
        if (companyLines.length > 0) {
          const data = parseCompanyEntry(companyLines)
          if (data) {
            data.category = currentCategory
            data.categoryName = currentCategoryName
            if (currentSection === 'yoy') yoyData.push(data)
            else if (currentSection === 'qoq') qoqData.push(data)
          }
          companyLines = []
        }
        currentCategory = value.id
        currentCategoryName = value.name
        break
      }
    }

    // Detect company entry start (numbered like "1. AEONCR" or "22. UWC")
    const companyStart = line.match(/^\d+\.\s+([A-Z&]+)\s*\(/)
    if (companyStart && currentSection) {
      // Save previous company
      if (companyLines.length > 0) {
        const data = parseCompanyEntry(companyLines)
        if (data) {
          data.category = currentCategory
          data.categoryName = currentCategoryName
          if (currentSection === 'yoy') yoyData.push(data)
          else if (currentSection === 'qoq') qoqData.push(data)
        }
      }
      companyLines = [line]
    } else if (companyLines.length > 0 && line.trim() && !line.startsWith('---') && !line.startsWith('===')) {
      companyLines.push(line)
    }
  }

  // Save last company
  if (companyLines.length > 0 && currentSection) {
    const data = parseCompanyEntry(companyLines)
    if (data) {
      data.category = currentCategory
      data.categoryName = currentCategoryName
      if (currentSection === 'yoy') yoyData.push(data)
      else if (currentSection === 'qoq') qoqData.push(data)
    }
  }

  return { yoy: yoyData, qoq: qoqData }
}

// Get company list from 30.txt
function parseCompanyList(content: string): CompanyData[] {
  const companies: CompanyData[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    // Parse format like "1. AEONCR (5139) - https://..."
    const match = line.match(/^\d+\.\s+([A-Z&]+)\s*\((\d+)\)/)
    if (match) {
      companies.push({
        code: match[1],
        name: match[1], // Will be updated later with full name
      })
    }
  }

  return companies
}

// Main migration function
async function migrateData() {
  console.log('Starting data migration...\n')

  // Read source files
  const reportPath = path.join(__dirname, '../data/analysis/report-summary.txt')
  const listPath = path.join(__dirname, '../data/analysis/30.txt')

  if (!fs.existsSync(reportPath)) {
    console.error('report-summary.txt not found!')
    return
  }

  const reportContent = fs.readFileSync(reportPath, 'utf-8')
  const listContent = fs.existsSync(listPath) ? fs.readFileSync(listPath, 'utf-8') : ''

  // Parse data
  console.log('Parsing report data...')
  const { yoy, qoq } = parseReportSummary(reportContent)
  const companyList = parseCompanyList(listContent)

  console.log(`Found ${yoy.length} YoY entries`)
  console.log(`Found ${qoq.length} QoQ entries`)
  console.log(`Found ${companyList.length} companies in list\n`)

  // Get unique company codes from analysis
  const allCodes = new Set([...yoy.map(d => d.code), ...qoq.map(d => d.code)])

  // Insert companies first
  console.log('Inserting companies...')
  for (const code of allCodes) {
    const { error } = await supabase
      .from('companies')
      .upsert({
        code,
        name: code // Placeholder, can be updated later
      }, {
        onConflict: 'code'
      })

    if (error) {
      console.error(`Error inserting company ${code}:`, error.message)
    }
  }

  // Get company IDs
  const { data: companies } = await supabase
    .from('companies')
    .select('id, code')

  const companyIdMap = new Map(companies?.map(c => [c.code, c.id]) || [])

  // Insert YoY analysis
  console.log('\nInserting YoY analysis...')
  for (const data of yoy) {
    const companyId = companyIdMap.get(data.code)
    if (!companyId) {
      console.log(`Company not found: ${data.code}`)
      continue
    }

    const { error } = await supabase
      .from('yoy_analysis')
      .insert({
        company_id: companyId,
        analysis_date: new Date().toISOString().split('T')[0],
        current_quarter: data.currentQuarter,
        previous_year_quarter: data.previousQuarter,
        revenue_current: data.revenueCurrent,
        revenue_previous: data.revenuePrevious,
        revenue_change_pct: data.revenueChangePct,
        profit_current: data.profitCurrent,
        profit_previous: data.profitPrevious,
        profit_change_pct: data.profitChangePct,
        category: data.category,
        category_name: data.categoryName,
        notes: data.notes
      })

    if (error) {
      console.error(`Error inserting YoY for ${data.code}:`, error.message)
    } else {
      console.log(`  ✓ ${data.code} - Category ${data.category}`)
    }
  }

  // Insert QoQ analysis
  console.log('\nInserting QoQ analysis...')
  for (const data of qoq) {
    const companyId = companyIdMap.get(data.code)
    if (!companyId) {
      console.log(`Company not found: ${data.code}`)
      continue
    }

    const { error } = await supabase
      .from('qoq_analysis')
      .insert({
        company_id: companyId,
        analysis_date: new Date().toISOString().split('T')[0],
        current_quarter: data.currentQuarter,
        previous_quarter: data.previousQuarter,
        revenue_current: data.revenueCurrent,
        revenue_previous: data.revenuePrevious,
        revenue_change_pct: data.revenueChangePct,
        profit_current: data.profitCurrent,
        profit_previous: data.profitPrevious,
        profit_change_pct: data.profitChangePct,
        category: data.category,
        category_name: data.categoryName,
        notes: data.notes
      })

    if (error) {
      console.error(`Error inserting QoQ for ${data.code}:`, error.message)
    } else {
      console.log(`  ✓ ${data.code} - Category ${data.category}`)
    }
  }

  console.log('\n✅ Migration complete!')
}

// Run if called directly
migrateData().catch(console.error)

export { parseReportSummary, parseCompanyList, parseMoney, parsePercentage }

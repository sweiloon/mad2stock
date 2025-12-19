#!/usr/bin/env npx tsx
/**
 * Sync YoY/QoQ Analysis Data from Database to Frontend
 *
 * This script fetches all analysis data from Supabase and updates
 * the company-data.ts file so the frontend displays the data.
 *
 * Run: npx tsx scripts/sync-analysis-to-frontend.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'

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

interface AnalysisData {
  company_id: string
  company_code: string
  company_name: string
  numeric_code: string
  sector: string
  market: string | null
  yoy_category: number | null
  yoy_revenue_pct: number | null
  yoy_profit_pct: number | null
  yoy_revenue_current: number | null
  yoy_profit_current: number | null
  qoq_category: number | null
  qoq_revenue_pct: number | null
  qoq_profit_pct: number | null
}

async function fetchAllAnalysisData(): Promise<AnalysisData[]> {
  console.log('📊 Fetching analysis data from database...')

  // Get all companies with their YoY and QoQ data
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('id, code, name, numeric_code, sector')
    .not('numeric_code', 'is', null)
    .order('code')

  if (compError || !companies) {
    console.error('Error fetching companies:', compError)
    return []
  }

  console.log(`  Found ${companies.length} companies`)

  // Get all YoY analysis
  const { data: yoyData, error: yoyError } = await supabase
    .from('yoy_analysis')
    .select('company_id, category, revenue_change_pct, profit_change_pct, revenue_current, profit_current')

  if (yoyError) {
    console.error('Error fetching YoY data:', yoyError)
    return []
  }

  console.log(`  Found ${yoyData?.length || 0} YoY records`)

  // Get all QoQ analysis
  const { data: qoqData, error: qoqError } = await supabase
    .from('qoq_analysis')
    .select('company_id, category, revenue_change_pct, profit_change_pct')

  if (qoqError) {
    console.error('Error fetching QoQ data:', qoqError)
    return []
  }

  console.log(`  Found ${qoqData?.length || 0} QoQ records`)

  // Create lookup maps
  const yoyMap = new Map(yoyData?.map(y => [y.company_id, y]) || [])
  const qoqMap = new Map(qoqData?.map(q => [q.company_id, q]) || [])

  // Combine data
  const result: AnalysisData[] = companies.map(c => {
    const yoy = yoyMap.get(c.id)
    const qoq = qoqMap.get(c.id)

    return {
      company_id: c.id,
      company_code: c.code,
      company_name: c.name,
      numeric_code: c.numeric_code,
      sector: c.sector || 'Other',
      market: null, // Will be determined from existing data or set to Main
      yoy_category: yoy?.category || null,
      yoy_revenue_pct: yoy?.revenue_change_pct || null,
      yoy_profit_pct: yoy?.profit_change_pct || null,
      yoy_revenue_current: yoy?.revenue_current || null,
      yoy_profit_current: yoy?.profit_current || null,
      qoq_category: qoq?.category || null,
      qoq_revenue_pct: qoq?.revenue_change_pct || null,
      qoq_profit_pct: qoq?.profit_change_pct || null,
    }
  })

  return result
}

function generateCompanyDataTs(data: AnalysisData[]): string {
  const header = `/**
 * Company Performance Data
 * Mad2Stock Platform - Malaysian Stock Analysis
 *
 * Last Updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
 * - ${data.length} companies tracked
 * - ${data.filter(d => d.yoy_category !== null).length} companies with YoY analysis
 * - ${data.filter(d => d.qoq_category !== null).length} companies with QoQ analysis
 *
 * Data synced from Supabase database (yoy_analysis, qoq_analysis tables)
 */

export interface CompanyData {
  code: string
  name: string
  stockCode: string
  sector: string
  market?: "Main" | "ACE" | "LEAP"  // Bursa Malaysia market classification
  // Financial data - optional for new companies without analysis
  yoyCategory?: number
  qoqCategory?: number
  revenueYoY?: number
  profitYoY?: number
  revenueQoQ?: number
  profitQoQ?: number
  latestRevenue?: number // in millions
  latestProfit?: number // in millions
  marketCap?: number // in millions
  // New fields for Yahoo Finance data
  currentPrice?: number
  priceChange?: number
  priceChangePercent?: number
  volume?: number
  lastUpdated?: string
  // Whether this company has full financial analysis data
  hasAnalysis?: boolean
}

// Sector mappings - Malaysian stock market sectors
export const SECTORS = [
  "Finance",          // Banking, Financial Services, Insurance
  "Construction",     // Construction, Building Materials
  "Technology",       // Technology, IT Services, Semiconductors
  "Property",         // Property Development, REITs
  "Plantation",       // Palm Oil, Rubber, Agriculture
  "Manufacturing",    // Manufacturing, Industrial Products
  "Consumer",         // Consumer Products, F&B, Retail
  "Healthcare",       // Healthcare, Pharmaceuticals, Medical
  "Industrial",       // Industrial Products, Chemicals
  "Energy",           // Oil & Gas, Utilities, Power
  "Media",            // Media, Entertainment
  "Retail",           // Retail Trade
  "Education",        // Education Services
  "Automotive",       // Automotive, Transportation Equipment
  "Offshore",         // Offshore, Marine, Shipping
  "Services",         // Services, Logistics, Telecommunications
  "Transportation",   // Transportation, Logistics
  "Utilities",        // Utilities, Water, Power
  "Telecommunications", // Telecommunications, Mobile
  "REIT",             // Real Estate Investment Trusts
] as const

// All companies with analysis data from database
export const COMPANY_DATA: CompanyData[] = [
`

  const companyLines = data.map(c => {
    const hasAnalysis = c.yoy_category !== null || c.qoq_category !== null
    const latestRevenue = c.yoy_revenue_current ? Number((c.yoy_revenue_current / 1000000).toFixed(2)) : undefined
    const latestProfit = c.yoy_profit_current ? Number((c.yoy_profit_current / 1000000).toFixed(2)) : undefined

    const fields: string[] = [
      `code: "${c.company_code}"`,
      `name: "${c.company_name.replace(/"/g, '\\"')}"`,
      `stockCode: "${c.numeric_code}"`,
      `sector: "${c.sector}"`,
      `market: "Main"`,
    ]

    if (c.yoy_category !== null) {
      fields.push(`yoyCategory: ${c.yoy_category}`)
    }
    if (c.qoq_category !== null) {
      fields.push(`qoqCategory: ${c.qoq_category}`)
    }
    if (c.yoy_revenue_pct !== null) {
      fields.push(`revenueYoY: ${Number(c.yoy_revenue_pct.toFixed(2))}`)
    }
    if (c.yoy_profit_pct !== null) {
      fields.push(`profitYoY: ${Number(c.yoy_profit_pct.toFixed(2))}`)
    }
    if (c.qoq_revenue_pct !== null) {
      fields.push(`revenueQoQ: ${Number(c.qoq_revenue_pct.toFixed(2))}`)
    }
    if (c.qoq_profit_pct !== null) {
      fields.push(`profitQoQ: ${Number(c.qoq_profit_pct.toFixed(2))}`)
    }
    if (latestRevenue !== undefined) {
      fields.push(`latestRevenue: ${latestRevenue}`)
    }
    if (latestProfit !== undefined) {
      fields.push(`latestProfit: ${latestProfit}`)
    }
    if (hasAnalysis) {
      fields.push(`hasAnalysis: true`)
    }

    return `  { ${fields.join(', ')} },`
  })

  const footer = `
]

// Helper functions
export function getAllSectors(): string[] {
  const sectors = new Set(COMPANY_DATA.map(c => c.sector))
  return Array.from(sectors).sort()
}

export function getCompaniesBySector(sector: string): CompanyData[] {
  return COMPANY_DATA.filter(c => c.sector === sector)
}

export function getCompanyByCode(code: string): CompanyData | undefined {
  return COMPANY_DATA.find(c => c.code.toLowerCase() === code.toLowerCase())
}

export function hasFinancialData(company: CompanyData): boolean {
  return company.hasAnalysis === true || (
    company.yoyCategory !== undefined ||
    company.qoqCategory !== undefined ||
    company.revenueYoY !== undefined ||
    company.profitYoY !== undefined
  )
}

export function getTotalCompanyCount(): number {
  return COMPANY_DATA.length
}

export function getAnalyzedCompanyCount(): number {
  return COMPANY_DATA.filter(c => hasFinancialData(c)).length
}
`

  return header + companyLines.join('\n') + footer
}

async function main() {
  console.log('🚀 Syncing Analysis Data to Frontend')
  console.log('=' .repeat(50))

  // Fetch data from database
  const data = await fetchAllAnalysisData()

  if (data.length === 0) {
    console.error('❌ No data fetched from database')
    process.exit(1)
  }

  console.log(`\n📝 Generating company-data.ts...`)

  // Generate the TypeScript file content
  const tsContent = generateCompanyDataTs(data)

  // Write to file
  const filePath = resolve(__dirname, '../src/lib/company-data.ts')
  fs.writeFileSync(filePath, tsContent, 'utf-8')

  console.log(`✅ Written to ${filePath}`)

  // Summary
  const withYoY = data.filter(d => d.yoy_category !== null).length
  const withQoQ = data.filter(d => d.qoq_category !== null).length

  console.log('\n' + '=' .repeat(50))
  console.log('📊 Summary:')
  console.log(`  Total companies: ${data.length}`)
  console.log(`  With YoY data: ${withYoY}`)
  console.log(`  With QoQ data: ${withQoQ}`)
  console.log('\n✅ Done! Frontend will now show all analysis data.')
}

main().catch(console.error)

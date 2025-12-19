import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { COMPANY_DATA, hasAnalysisData } from '@/lib/company-data'

// Security: Only allow in development or with admin secret
function validateRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true

  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    return token === process.env.ADMIN_SECRET || token === process.env.CRON_SECRET
  }

  return false
}

export async function POST(request: NextRequest) {
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const startTime = Date.now()

  let companiesInserted = 0
  let companiesUpdated = 0
  let tiersInserted = 0
  let stockPricesInserted = 0
  const errors: string[] = []

  console.log(`[Import] Starting import of ${COMPANY_DATA.length} companies...`)

  // Process in batches of 50 to avoid timeout
  const batchSize = 50

  for (let i = 0; i < COMPANY_DATA.length; i += batchSize) {
    const batch = COMPANY_DATA.slice(i, i + batchSize)

    for (const company of batch) {
      try {
        // 1. Upsert company
        const companyData = {
          code: company.code,
          name: company.name,
          sector: company.sector,
          market_cap: company.marketCap ? company.marketCap * 1000000 : null, // Convert from millions
          current_price: company.currentPrice || null,
          business_description: `${company.name} - ${company.sector} sector company listed on Bursa Malaysia.`,
          updated_at: new Date().toISOString(),
        }

        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('code', company.code)
          .single()

        if (existingCompany) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('companies') as any)
            .update(companyData)
            .eq('code', company.code)
          companiesUpdated++
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('companies') as any)
            .insert(companyData)
          companiesInserted++
        }

        // 2. Upsert stock tier
        // Use hasAnalysisData to determine tier (replaces old isCore80Stock)
        const hasAnalysis = hasAnalysisData(company)
        const tier = hasAnalysis ? 1 : 3

        const tierData = {
          stock_code: company.stockCode,
          company_name: company.name,
          tier: tier,
          is_core: hasAnalysis, // Now represents "has analysis data" instead of "core 80"
          market_cap: company.marketCap ? company.marketCap * 1000000 : null,
          updated_at: new Date().toISOString(),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: tierError } = await (supabase.from('stock_tiers') as any)
          .upsert(tierData, { onConflict: 'stock_code' })

        if (tierError) {
          errors.push(`Tier error for ${company.code}: ${tierError.message}`)
        } else {
          tiersInserted++
        }

        // 3. Upsert stock price placeholder (if not exists)
        const priceData = {
          stock_code: company.stockCode,
          tier: tier,
          data_source: 'pending',
          scrape_status: 'pending',
          updated_at: new Date().toISOString(),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: priceError } = await (supabase.from('stock_prices') as any)
          .upsert(priceData, { onConflict: 'stock_code' })

        if (!priceError) {
          stockPricesInserted++
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Error for ${company.code}: ${errorMsg}`)
      }
    }

    // Log progress
    console.log(`[Import] Processed ${Math.min(i + batchSize, COMPANY_DATA.length)}/${COMPANY_DATA.length} companies`)
  }

  const executionTime = Date.now() - startTime

  console.log(`[Import] Complete: ${companiesInserted} inserted, ${companiesUpdated} updated in ${executionTime}ms`)

  return NextResponse.json({
    success: true,
    summary: {
      totalCompanies: COMPANY_DATA.length,
      companiesInserted,
      companiesUpdated,
      tiersInserted,
      stockPricesInserted,
      errors: errors.length,
      executionTimeMs: executionTime,
    },
    errors: errors.length > 0 ? errors.slice(0, 20) : undefined, // Show first 20 errors
  })
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}

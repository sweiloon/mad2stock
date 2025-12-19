import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

async function checkYahoo(numericCode: string): Promise<string | null> {
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
    return meta?.shortName || null
  } catch {
    return null
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  // Check conflicting numeric codes
  const codes = [
    // Conflict group 1: ECOHLDG/MOBILIA
    { code: '0229', expected: 'MOBILIA (from ECOHLDG)' },
    { code: '0333', expected: 'MOBILIA (existing)' },
    // Conflict group 2: IGBB/HOMERIZ
    { code: '5160', expected: 'HOMERIZ (from IGBB)' },
    { code: '7132', expected: 'HOMERIZ (existing)' },
    // Conflict group 3: UUE/CORAZA
    { code: '0240', expected: 'CORAZA (from UUE)' },
    { code: '0211', expected: 'CORAZA (existing)' },
    // Conflict group 4: GCSB/UUE
    { code: '0310', expected: 'UUE (from GCSB)' },
    // Conflict group 5: GIGASUNS/KTI
    { code: '0308', expected: 'KTI (from GIGASUNS)' },
    { code: '0243', expected: 'KTI (existing)' },
    // Conflict group 6: JTKBHD/NE
    { code: '0325', expected: 'NE (from JTKBHD)' },
    { code: '0272', expected: 'NE (existing)' },
  ]

  console.log('Verifying numeric codes with Yahoo Finance:\n')

  for (const { code, expected } of codes) {
    const name = await checkYahoo(code)
    console.log(`${code}.KL → ${name || 'NOT FOUND'} (expected: ${expected})`)
    await delay(1500)
  }
}

main()

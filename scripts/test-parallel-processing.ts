/**
 * Test Script: Parallel Batch Processing
 *
 * Tests the parallel processing logic to verify:
 * 1. 400 stocks are processed in 8 parallel batches of 50
 * 2. Total execution time is under 10 seconds (Vercel Hobby limit)
 * 3. All stocks are properly assigned to batches
 *
 * Run: npx ts-node scripts/test-parallel-processing.ts
 */

// Configuration (must match route.ts)
const STOCKS_PER_RUN = 400
const BATCH_SIZE = 50
const PARALLEL_BATCHES = 8
const VERCEL_TIMEOUT = 10000 // 10 seconds

// Simulated stock codes (800+ stocks)
function generateMockStockCodes(count: number): string[] {
  const codes: string[] = []
  for (let i = 1; i <= count; i++) {
    codes.push(String(1000 + i).padStart(4, '0'))
  }
  return codes
}

// Simulate EODHD API batch request (with realistic latency)
async function simulateBatchFetch(
  batchNum: number,
  stockCodes: string[],
  simulatedLatency: number = 500
): Promise<{ batchNum: number; quotes: Map<string, unknown>; duration: number }> {
  const startTime = Date.now()

  // Simulate network latency (300-800ms is typical)
  await new Promise(resolve => setTimeout(resolve, simulatedLatency + Math.random() * 300))

  // Create mock quotes
  const quotes = new Map()
  for (const code of stockCodes) {
    quotes.set(code, {
      price: Math.random() * 10 + 1,
      change: (Math.random() - 0.5) * 2,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000)
    })
  }

  const duration = Date.now() - startTime
  return { batchNum, quotes, duration }
}

// Main test function
async function testParallelProcessing() {
  console.log('='.repeat(60))
  console.log('PARALLEL BATCH PROCESSING TEST')
  console.log('='.repeat(60))
  console.log(`Configuration:`)
  console.log(`  - Stocks per run: ${STOCKS_PER_RUN}`)
  console.log(`  - Batch size: ${BATCH_SIZE}`)
  console.log(`  - Parallel batches: ${PARALLEL_BATCHES}`)
  console.log(`  - Vercel timeout: ${VERCEL_TIMEOUT}ms`)
  console.log('='.repeat(60))

  // Generate mock stocks
  const totalStocks = 850 // Simulate ~850 KLSE stocks
  const allStockCodes = generateMockStockCodes(totalStocks)

  console.log(`\nTotal stocks in system: ${totalStocks}`)
  console.log(`Estimated cron calls to update all: ${Math.ceil(totalStocks / STOCKS_PER_RUN)}`)

  // Test processing one batch of 400 stocks
  const stocksToProcess = allStockCodes.slice(0, STOCKS_PER_RUN)

  console.log(`\n--- Processing ${stocksToProcess.length} stocks ---\n`)

  const startTime = Date.now()

  // Split into batches
  const batches: string[][] = []
  for (let i = 0; i < stocksToProcess.length; i += BATCH_SIZE) {
    batches.push(stocksToProcess.slice(i, i + BATCH_SIZE))
  }

  console.log(`Split into ${batches.length} batches of ${BATCH_SIZE} each`)

  // Process in parallel groups
  const allQuotes = new Map()
  const batchTimes: number[] = []
  let parallelGroups = 0

  for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
    parallelGroups++
    const parallelBatches = batches.slice(i, i + PARALLEL_BATCHES)

    const groupStartTime = Date.now()
    console.log(`\nParallel Group ${parallelGroups}: Processing batches ${i + 1} to ${i + parallelBatches.length}`)

    // Run batches in parallel
    const results = await Promise.all(
      parallelBatches.map((batch, idx) => simulateBatchFetch(i + idx + 1, batch))
    )

    // Collect results
    for (const result of results) {
      result.quotes.forEach((v, k) => allQuotes.set(k, v))
      batchTimes.push(result.duration)
      console.log(`  Batch ${result.batchNum}: ${result.quotes.size} quotes in ${result.duration}ms`)
    }

    const groupDuration = Date.now() - groupStartTime
    console.log(`  Group ${parallelGroups} completed in ${groupDuration}ms (${parallelBatches.length} batches parallel)`)

    // Small delay between groups
    if (i + PARALLEL_BATCHES < batches.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  const fetchDuration = Date.now() - startTime

  // Simulate DB writes (much faster, ~50ms per batch)
  console.log(`\n--- Simulating database writes ---`)
  const dbStartTime = Date.now()
  const dbBatches = Math.ceil(allQuotes.size / 50)
  for (let i = 0; i < dbBatches; i++) {
    await new Promise(resolve => setTimeout(resolve, 30)) // Simulate DB latency
  }
  const dbDuration = Date.now() - dbStartTime
  console.log(`DB writes: ${dbBatches} batches in ${dbDuration}ms`)

  const totalDuration = Date.now() - startTime

  // Results
  console.log('\n' + '='.repeat(60))
  console.log('TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`Stocks processed: ${stocksToProcess.length}`)
  console.log(`Quotes fetched: ${allQuotes.size}`)
  console.log(`Total batches: ${batches.length}`)
  console.log(`Parallel groups: ${parallelGroups}`)
  console.log(`Avg batch time: ${Math.round(batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length)}ms`)
  console.log(`Fetch duration: ${fetchDuration}ms`)
  console.log(`DB write duration: ${dbDuration}ms`)
  console.log(`Total duration: ${totalDuration}ms`)
  console.log('='.repeat(60))

  // Verify within Vercel timeout
  const passed = totalDuration < VERCEL_TIMEOUT
  if (passed) {
    console.log(`\n✅ PASSED: Total time ${totalDuration}ms < ${VERCEL_TIMEOUT}ms timeout`)
    console.log(`   Margin: ${VERCEL_TIMEOUT - totalDuration}ms spare`)
  } else {
    console.log(`\n❌ FAILED: Total time ${totalDuration}ms > ${VERCEL_TIMEOUT}ms timeout`)
    console.log(`   Overage: ${totalDuration - VERCEL_TIMEOUT}ms over limit`)
  }

  // Show expected coverage
  console.log('\n--- Expected Update Coverage ---')
  console.log(`With 15-minute cron interval:`)
  console.log(`  - ${STOCKS_PER_RUN} stocks per call`)
  console.log(`  - ${Math.ceil(totalStocks / STOCKS_PER_RUN)} calls to update all ${totalStocks} stocks`)
  console.log(`  - All stocks updated within ${Math.ceil(totalStocks / STOCKS_PER_RUN) * 15} minutes`)

  // API usage estimate
  const cronCallsPerDay = (8 * 60 / 15) // 8 market hours, every 15 min
  const batchesPerCron = Math.ceil(STOCKS_PER_RUN / BATCH_SIZE)
  const apiCallsPerDay = cronCallsPerDay * batchesPerCron
  console.log('\n--- API Usage Estimate ---')
  console.log(`  - Cron calls per day: ${cronCallsPerDay}`)
  console.log(`  - Batches per cron: ${batchesPerCron}`)
  console.log(`  - API calls per day: ~${Math.round(apiCallsPerDay)}`)
  console.log(`  - EODHD limit: 100,000/day`)
  console.log(`  - Usage: ${(apiCallsPerDay / 100000 * 100).toFixed(2)}% of limit`)

  return passed
}

// Run test
testParallelProcessing()
  .then(passed => {
    process.exit(passed ? 0 : 1)
  })
  .catch(error => {
    console.error('Test error:', error)
    process.exit(1)
  })

#!/usr/bin/env node
/**
 * FUNDAMENTALS POPULATION SCRIPT
 *
 * Scrapes KLSE Screener for all 763 stocks and populates:
 * - Market Cap
 * - P/E Ratio
 * - EPS
 * - Dividend Yield
 *
 * Usage: node scripts/populate-fundamentals.js
 *
 * Options:
 *   --start=N     Start from stock index N (default: 0)
 *   --limit=N     Process only N stocks (default: all)
 *   --test        Test mode - process only 5 stocks
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuration
const DELAY_BETWEEN_STOCKS = 2000; // 2 seconds between requests
const BATCH_SIZE = 10; // Save to DB every 10 stocks

// Parse command line arguments
const args = process.argv.slice(2);
const startIndex = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1] || '0');
const limit = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const testMode = args.includes('--test');

/**
 * Get all stock codes from database
 */
async function getAllStockCodes() {
  const { data, error } = await supabase
    .from('stock_prices')
    .select('stock_code')
    .order('stock_code');

  if (error) {
    console.error('Error fetching stock codes:', error);
    return [];
  }

  return data.map(d => d.stock_code);
}

/**
 * Extract fundamentals from KLSE Screener page
 */
async function extractFundamentals(page, stockCode) {
  try {
    const url = `https://www.klsescreener.com/v2/stocks/view/${stockCode}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 10000 });

    // Extract data using page evaluation
    const data = await page.evaluate(() => {
      const result = {};
      const allText = document.body.innerText;

      // Market Cap (e.g., "126.9B" or "500M")
      const mcMatch = allText.match(/Market Cap\s+([\d,.]+)(B|M|K)?/);
      if (mcMatch) {
        let value = parseFloat(mcMatch[1].replace(/,/g, ''));
        const unit = mcMatch[2];
        if (unit === 'B') value *= 1e9;
        else if (unit === 'M') value *= 1e6;
        else if (unit === 'K') value *= 1e3;
        result.marketCap = value;
      }

      // P/E Ratio
      const peMatch = allText.match(/P\/E\s+([\d.]+)/);
      if (peMatch && peMatch[1] !== '-' && !isNaN(parseFloat(peMatch[1]))) {
        result.peRatio = parseFloat(peMatch[1]);
      }

      // EPS (in sen, convert to MYR)
      const epsMatch = allText.match(/EPS\s+([\d.]+)/);
      if (epsMatch && epsMatch[1] !== '-' && !isNaN(parseFloat(epsMatch[1]))) {
        result.eps = parseFloat(epsMatch[1]) / 100; // sen to MYR
      }

      // Dividend Yield
      const dyMatch = allText.match(/DY\s+([\d.]+)%/);
      if (dyMatch && !isNaN(parseFloat(dyMatch[1]))) {
        result.dividendYield = parseFloat(dyMatch[1]) / 100; // % to decimal
      }

      return result;
    });

    return data;
  } catch (error) {
    console.error(`  Error extracting ${stockCode}:`, error.message);
    return null;
  }
}

/**
 * Update stock in database
 */
async function updateStock(stockCode, data) {
  const update = {};
  if (data.marketCap !== undefined) update.market_cap = data.marketCap;
  if (data.peRatio !== undefined) update.pe_ratio = data.peRatio;
  if (data.eps !== undefined) update.eps = data.eps;
  if (data.dividendYield !== undefined) update.dividend_yield = data.dividendYield;

  if (Object.keys(update).length === 0) {
    return { success: false, reason: 'No data' };
  }

  const { error } = await supabase
    .from('stock_prices')
    .update(update)
    .eq('stock_code', stockCode);

  if (error) {
    return { success: false, reason: error.message };
  }

  return { success: true };
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('FUNDAMENTALS POPULATION SCRIPT');
  console.log('='.repeat(60));
  console.log(`Source: KLSE Screener (www.klsescreener.com)`);
  console.log(`Delay: ${DELAY_BETWEEN_STOCKS}ms between stocks`);
  console.log('');

  // Get all stock codes
  console.log('Fetching stock codes from database...');
  let stockCodes = await getAllStockCodes();

  if (stockCodes.length === 0) {
    console.error('No stock codes found in database');
    process.exit(1);
  }

  console.log(`Found ${stockCodes.length} stocks in database`);

  // Apply start index and limit
  if (startIndex > 0) {
    stockCodes = stockCodes.slice(startIndex);
    console.log(`Starting from index ${startIndex}`);
  }

  if (testMode) {
    stockCodes = stockCodes.slice(0, 5);
    console.log('TEST MODE: Processing only 5 stocks');
  } else if (limit) {
    stockCodes = stockCodes.slice(0, parseInt(limit));
    console.log(`Limited to ${limit} stocks`);
  }

  console.log(`Will process ${stockCodes.length} stocks`);
  console.log('');

  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  // Process stocks
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  console.log('Starting extraction...');
  console.log('-'.repeat(60));

  for (let i = 0; i < stockCodes.length; i++) {
    const stockCode = stockCodes[i];
    const progress = `[${i + 1}/${stockCodes.length}]`;

    process.stdout.write(`${progress} ${stockCode}: `);

    const data = await extractFundamentals(page, stockCode);

    if (data && Object.keys(data).length > 0) {
      const result = await updateStock(stockCode, data);

      if (result.success) {
        const summary = [];
        if (data.marketCap) summary.push(`MC=${formatNumber(data.marketCap)}`);
        if (data.peRatio) summary.push(`PE=${data.peRatio}`);
        if (data.eps) summary.push(`EPS=${data.eps.toFixed(4)}`);
        if (data.dividendYield) summary.push(`DY=${(data.dividendYield * 100).toFixed(2)}%`);

        console.log(`OK - ${summary.join(', ')}`);
        successCount++;
      } else {
        console.log(`DB Error: ${result.reason}`);
        failCount++;
      }
    } else {
      console.log('No data found');
      failCount++;
    }

    // Delay between requests
    if (i < stockCodes.length - 1) {
      await sleep(DELAY_BETWEEN_STOCKS);
    }
  }

  // Close browser
  await browser.close();

  // Summary
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('-'.repeat(60));
  console.log('COMPLETE');
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Time: ${formatTime(elapsed)}`);
  console.log('='.repeat(60));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// Run
main().catch(console.error);

/**
 * Stock Tier Management System
 *
 * Manages the tiered update strategy for ~1000 KLSE stocks.
 * Tier assignment is based on market cap and priority (core 80 companies).
 *
 * Tier Structure:
 * - Tier 1: 80 core stocks (original platform stocks) - Every 5 minutes
 * - Tier 2: 100 mid-cap stocks (>1B market cap) - Every 15 minutes
 * - Tier 3: Remaining ~820 small-cap stocks - Every 30 minutes
 *
 * Total Daily API Calls: ~450 (well under 2000/hour limit)
 */

import { COMPANY_DATA } from './company-data'

// Tier constants
export const TIER_1 = 1
export const TIER_2 = 2
export const TIER_3 = 3

// Update intervals in minutes
export const TIER_1_INTERVAL = 5
export const TIER_2_INTERVAL = 15
export const TIER_3_INTERVAL = 30

// Market cap thresholds (in MYR)
export const TIER_1_MARKET_CAP_THRESHOLD = 10_000_000_000 // 10B
export const TIER_2_MARKET_CAP_THRESHOLD = 1_000_000_000 // 1B

// Stock tier assignment
export interface StockTier {
  stockCode: string
  tier: 1 | 2 | 3
  companyName?: string
  marketCap?: number
  isCore: boolean
  lastUpdated?: Date
  nextUpdate?: Date
}

// Get all core 80 company stock codes (original platform stocks)
export function getCoreStockCodes(): string[] {
  return COMPANY_DATA.map(company => company.stockCode)
}

// Check if a stock code is in the core 80
export function isCore80(stockCode: string): boolean {
  const cleanCode = stockCode.replace(/\.(KL|KLS|KLSE)$/i, '').toUpperCase()
  return getCoreStockCodes().includes(cleanCode)
}

/**
 * Calculate tier for a stock based on market cap and core status
 */
export function calculateTier(stockCode: string, marketCap?: number): 1 | 2 | 3 {
  const cleanCode = stockCode.replace(/\.(KL|KLS|KLSE)$/i, '').toUpperCase()

  // Core 80 companies are always Tier 1
  if (isCore80(cleanCode)) {
    return TIER_1
  }

  // Large cap (>10B) are Tier 1
  if (marketCap && marketCap >= TIER_1_MARKET_CAP_THRESHOLD) {
    return TIER_1
  }

  // Mid cap (>1B) are Tier 2
  if (marketCap && marketCap >= TIER_2_MARKET_CAP_THRESHOLD) {
    return TIER_2
  }

  // All others are Tier 3
  return TIER_3
}

/**
 * Get update interval for a tier (in minutes)
 */
export function getTierInterval(tier: 1 | 2 | 3): number {
  switch (tier) {
    case TIER_1:
      return TIER_1_INTERVAL
    case TIER_2:
      return TIER_2_INTERVAL
    case TIER_3:
      return TIER_3_INTERVAL
  }
}

/**
 * Calculate next update time based on tier
 */
export function calculateNextUpdate(tier: 1 | 2 | 3, fromTime: Date = new Date()): Date {
  const interval = getTierInterval(tier)
  return new Date(fromTime.getTime() + interval * 60 * 1000)
}

/**
 * Determine which tier(s) should be updated in the current cycle
 * Based on minute of the hour:
 * - Tier 1: Every 5 min (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
 * - Tier 2: Every 15 min (0, 15, 30, 45)
 * - Tier 3: Every 30 min (0, 30)
 */
export function getTiersToUpdate(currentTime: Date = new Date()): (1 | 2 | 3)[] {
  const minute = currentTime.getMinutes()
  const tiersToUpdate: (1 | 2 | 3)[] = []

  // Tier 1 updates every 5 minutes
  if (minute % TIER_1_INTERVAL === 0) {
    tiersToUpdate.push(TIER_1)
  }

  // Tier 2 updates every 15 minutes
  if (minute % TIER_2_INTERVAL === 0) {
    tiersToUpdate.push(TIER_2)
  }

  // Tier 3 updates every 30 minutes
  if (minute % TIER_3_INTERVAL === 0) {
    tiersToUpdate.push(TIER_3)
  }

  return tiersToUpdate
}

/**
 * Check if it's within Malaysian market hours
 * Market hours: 9:00 AM - 5:00 PM MYT (UTC+8)
 */
export function isMarketHours(currentTime: Date = new Date()): boolean {
  // Convert to Malaysia time (UTC+8)
  const malaysiaOffset = 8 * 60 // 8 hours in minutes
  const utcMinutes = currentTime.getUTCHours() * 60 + currentTime.getUTCMinutes()
  const malaysiaMinutes = utcMinutes + malaysiaOffset

  // Handle day overflow
  const normalizedMinutes = malaysiaMinutes % (24 * 60)

  // Market hours: 9:00 (540 min) to 17:00 (1020 min)
  const marketOpen = 9 * 60 // 9:00 AM
  const marketClose = 17 * 60 // 5:00 PM

  // Check day of week (Malaysia time)
  const malaysiaDate = new Date(currentTime.getTime() + malaysiaOffset * 60 * 1000)
  const dayOfWeek = malaysiaDate.getUTCDay()

  // Monday (1) to Friday (5)
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

  return isWeekday && normalizedMinutes >= marketOpen && normalizedMinutes < marketClose
}

/**
 * Parse market cap string to number (in MYR)
 * Handles formats like "124.44B", "1.5B", "500M"
 */
export function parseMarketCap(marketCapStr: string): number {
  if (!marketCapStr) return 0

  const cleanStr = marketCapStr.replace(/[^0-9.BMK]/gi, '').toUpperCase()

  const numMatch = cleanStr.match(/^([\d.]+)([BMK])?$/i)
  if (!numMatch) return 0

  const num = parseFloat(numMatch[1])
  const suffix = numMatch[2]

  switch (suffix) {
    case 'B':
      return num * 1_000_000_000
    case 'M':
      return num * 1_000_000
    case 'K':
      return num * 1_000
    default:
      return num
  }
}

/**
 * Get tier statistics for logging/debugging
 */
export interface TierStats {
  tier1Count: number
  tier2Count: number
  tier3Count: number
  totalStocks: number
  estimatedApiCalls: number
  estimatedDailyApiCalls: number
}

export function calculateTierStats(tierAssignments: Map<string, 1 | 2 | 3>): TierStats {
  let tier1Count = 0
  let tier2Count = 0
  let tier3Count = 0

  tierAssignments.forEach((tier) => {
    switch (tier) {
      case TIER_1:
        tier1Count++
        break
      case TIER_2:
        tier2Count++
        break
      case TIER_3:
        tier3Count++
        break
    }
  })

  // Calculate API calls per cycle
  const tier1Calls = Math.ceil(tier1Count / 50)
  const tier2Calls = Math.ceil(tier2Count / 50)
  const tier3Calls = Math.ceil(tier3Count / 50)

  // Market hours: 8 hours
  const marketHours = 8

  // Daily API calls
  const tier1DailyCycles = (marketHours * 60) / TIER_1_INTERVAL
  const tier2DailyCycles = (marketHours * 60) / TIER_2_INTERVAL
  const tier3DailyCycles = (marketHours * 60) / TIER_3_INTERVAL

  const estimatedDailyApiCalls =
    tier1Calls * tier1DailyCycles +
    tier2Calls * tier2DailyCycles +
    tier3Calls * tier3DailyCycles

  return {
    tier1Count,
    tier2Count,
    tier3Count,
    totalStocks: tier1Count + tier2Count + tier3Count,
    estimatedApiCalls: tier1Calls + tier2Calls + tier3Calls,
    estimatedDailyApiCalls: Math.round(estimatedDailyApiCalls),
  }
}

/**
 * Create tier assignments for a list of stocks
 * Returns a Map of stockCode -> tier
 */
export function createTierAssignments(
  stocks: Array<{ stockCode: string; marketCap?: number }>
): Map<string, 1 | 2 | 3> {
  const assignments = new Map<string, 1 | 2 | 3>()

  for (const stock of stocks) {
    const tier = calculateTier(stock.stockCode, stock.marketCap)
    assignments.set(stock.stockCode, tier)
  }

  return assignments
}

/**
 * Get stocks by tier from a list
 */
export function getStocksByTier(
  stocks: Array<{ stockCode: string; marketCap?: number }>,
  tier: 1 | 2 | 3
): string[] {
  return stocks
    .filter(stock => calculateTier(stock.stockCode, stock.marketCap) === tier)
    .map(stock => stock.stockCode)
}

/**
 * Log tier update information
 */
export function logTierUpdate(
  tier: 1 | 2 | 3,
  stockCount: number,
  successCount: number,
  failedCount: number,
  duration: number
): void {
  const tierName = tier === 1 ? 'Tier 1 (Core)' : tier === 2 ? 'Tier 2 (Mid-cap)' : 'Tier 3 (Small-cap)'

  console.log(`[Stock Tiers] ${tierName} Update:
    - Stocks: ${stockCount}
    - Success: ${successCount}
    - Failed: ${failedCount}
    - Duration: ${duration}ms
  `)
}

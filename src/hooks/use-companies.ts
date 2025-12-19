'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface CompanyData {
  code: string
  name: string
  stockCode: string
  sector: string
  market?: "Main" | "ACE" | "LEAP"
  yoyCategory?: number
  qoqCategory?: number
  revenueYoY?: number
  profitYoY?: number
  revenueQoQ?: number
  profitQoQ?: number
  latestRevenue?: number
  latestProfit?: number
  marketCap?: number
  currentPrice?: number
  hasAnalysis?: boolean
}

export interface CompanyStats {
  totalCompanies: number
  analyzedCompanies: number
  yoyCategoryCounts: Record<number, number>
  qoqCategoryCounts: Record<number, number>
  gainersLosers: { gainers: number; losers: number; unchanged: number }
  sectorStats: { sector: string; count: number; gainers: number; avgProfitGrowth: number }[]
  topYoYPerformers: CompanyData[]
  topQoQPerformers: CompanyData[]
  sectors: string[]
}

// Simple client-side cache
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute client-side cache

function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() })
}

interface UseCompaniesOptions {
  sector?: string
  category?: string
  market?: string
  search?: string
  limit?: number
  offset?: number
}

interface UseCompaniesResult {
  companies: CompanyData[]
  isLoading: boolean
  error: string | null
  total: number
  hasMore: boolean
  refetch: () => void
}

/**
 * Hook to fetch companies from the database API
 * Includes client-side caching for better performance
 */
export function useCompanies(options: UseCompaniesOptions = {}): UseCompaniesResult {
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchCompanies = useCallback(async (skipCache = false) => {
    // Create cache key from options
    const cacheKey = `companies:${JSON.stringify(options)}`

    // Check cache first (unless skipCache is true for refetch)
    if (!skipCache) {
      const cached = getCached<{ companies: CompanyData[]; total: number; hasMore: boolean }>(cacheKey)
      if (cached) {
        setCompanies(cached.companies)
        setTotal(cached.total)
        setHasMore(cached.hasMore)
        setIsLoading(false)
        return
      }
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.sector) params.set('sector', options.sector)
      if (options.category) params.set('category', options.category)
      if (options.market) params.set('market', options.market)
      if (options.search) params.set('search', options.search)
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())

      const response = await fetch(`/api/companies?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }

      const data = await response.json()

      // Update cache
      setCache(cacheKey, data)

      setCompanies(data.companies || [])
      setTotal(data.total || 0)
      setHasMore(data.hasMore || false)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Ignore abort errors
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCompanies([])
    } finally {
      setIsLoading(false)
    }
  }, [options.sector, options.category, options.market, options.search, options.limit, options.offset])

  useEffect(() => {
    fetchCompanies()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchCompanies])

  const refetch = useCallback(() => {
    fetchCompanies(true) // Skip cache on manual refetch
  }, [fetchCompanies])

  return { companies, isLoading, error, total, hasMore, refetch }
}

interface UseCompanyStatsResult {
  stats: CompanyStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook to fetch company statistics from the database API
 * Includes client-side caching for better performance
 */
export function useCompanyStats(): UseCompanyStatsResult {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const fetchStats = useCallback(async (skipCache = false) => {
    const cacheKey = 'stats'

    // Check cache first
    if (!skipCache) {
      const cached = getCached<CompanyStats>(cacheKey)
      if (cached) {
        setStats(cached)
        setIsLoading(false)
        return
      }
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/companies/stats', {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Update cache
        setCache(cacheKey, data)
        setStats(data)
        setIsLoading(false)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Ignore abort errors
      }
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStats(null)
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchStats()

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchStats])

  const refetch = useCallback(() => {
    fetchStats(true) // Skip cache on manual refetch
  }, [fetchStats])

  return { stats, isLoading, error, refetch }
}

/**
 * Helper function to check if a company has financial data
 */
export function hasFinancialData(company: CompanyData): boolean {
  return company.hasAnalysis === true || (
    company.yoyCategory !== undefined ||
    company.qoqCategory !== undefined ||
    company.revenueYoY !== undefined ||
    company.profitYoY !== undefined
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

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
 */
export function useCompanies(options: UseCompaniesOptions = {}): UseCompaniesResult {
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchCompanies = useCallback(async () => {
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

      const response = await fetch(`/api/companies?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }

      const data = await response.json()
      setCompanies(data.companies || [])
      setTotal(data.total || 0)
      setHasMore(data.hasMore || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCompanies([])
    } finally {
      setIsLoading(false)
    }
  }, [options.sector, options.category, options.market, options.search, options.limit, options.offset])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  return { companies, isLoading, error, total, hasMore, refetch: fetchCompanies }
}

interface UseCompanyStatsResult {
  stats: CompanyStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook to fetch company statistics from the database API
 */
export function useCompanyStats(): UseCompanyStatsResult {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/companies/stats')

      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, isLoading, error, refetch: fetchStats }
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

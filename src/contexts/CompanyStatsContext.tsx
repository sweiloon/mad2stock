'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCompanyStats as useCompanyStatsHook, CompanyStats } from '@/hooks/use-companies'

interface CompanyStatsContextType {
  stats: CompanyStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Default context value for SSR/static generation
const defaultContextValue: CompanyStatsContextType = {
  stats: null,
  isLoading: true,
  error: null,
  refetch: () => {},
}

const CompanyStatsContext = createContext<CompanyStatsContextType>(defaultContextValue)

interface CompanyStatsProviderProps {
  children: ReactNode
}

/**
 * Provider that fetches company stats once and shares across all child components.
 * This prevents multiple API calls when Header, Sidebar, and Dashboard all need stats.
 */
export function CompanyStatsProvider({ children }: CompanyStatsProviderProps) {
  const { stats, isLoading, error, refetch } = useCompanyStatsHook()

  return (
    <CompanyStatsContext.Provider value={{ stats, isLoading, error, refetch }}>
      {children}
    </CompanyStatsContext.Provider>
  )
}

/**
 * Hook to access company stats from context.
 * Returns default loading state if used outside provider (during SSR).
 */
export function useCompanyStatsContext(): CompanyStatsContextType {
  return useContext(CompanyStatsContext)
}

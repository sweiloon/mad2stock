'use client'

import { formatLastUpdated } from '@/hooks/use-cached-prices'
import { cn } from '@/lib/utils'

interface LastUpdatedBadgeProps {
  updatedAt: Date | null
  staleness: 'fresh' | 'stale' | 'very-stale'
  dataSource?: 'klsescreener' | 'yahoo' | 'live' | null
  scrapeStatus?: 'success' | 'failed' | null
  className?: string
  showSource?: boolean
  compact?: boolean
}

export function LastUpdatedBadge({
  updatedAt,
  staleness,
  dataSource,
  scrapeStatus,
  className,
  showSource = false,
  compact = false,
}: LastUpdatedBadgeProps) {
  const stalenessColors = {
    fresh: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    stale: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'very-stale': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  const stalenessIcons = {
    fresh: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    stale: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'very-stale': (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  }

  const sourceColors: Record<string, string> = {
    klsescreener: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    yahoo: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    live: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  }

  const sourceLabels: Record<string, string> = {
    klsescreener: 'KLSE',
    yahoo: 'Yahoo',
    live: 'Live',
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
            stalenessColors[staleness]
          )}
        >
          {stalenessIcons[staleness]}
          {formatLastUpdated(updatedAt)}
        </span>
        {showSource && dataSource && (
          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
              sourceColors[dataSource]
            )}
          >
            {sourceLabels[dataSource]}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
            stalenessColors[staleness]
          )}
        >
          {stalenessIcons[staleness]}
          <span>Updated {formatLastUpdated(updatedAt)}</span>
        </span>

        {showSource && dataSource && (
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
              sourceColors[dataSource]
            )}
          >
            {sourceLabels[dataSource]}
          </span>
        )}

        {scrapeStatus === 'failed' && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Update Failed
          </span>
        )}
      </div>

      {staleness === 'very-stale' && (
        <p className="text-xs text-muted-foreground">
          Price data may be outdated. Updates run every 30 minutes during market hours.
        </p>
      )}
    </div>
  )
}

// Simple inline version for tables/cards
export function LastUpdatedDot({
  staleness,
  className,
}: {
  staleness: 'fresh' | 'stale' | 'very-stale'
  className?: string
}) {
  const colors = {
    fresh: 'bg-green-500',
    stale: 'bg-yellow-500',
    'very-stale': 'bg-red-500',
  }

  const titles = {
    fresh: 'Price updated within 30 minutes',
    stale: 'Price updated 30-60 minutes ago',
    'very-stale': 'Price may be outdated (> 60 minutes)',
  }

  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full animate-pulse', colors[staleness], className)}
      title={titles[staleness]}
    />
  )
}

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { OverviewStats } from '../types/stats'
import { fetchOverviewStats, type StatsApiError } from '../api/statsApi'
import { QUERY_KEYS, OVERVIEW_STATS_QUERY_OPTIONS } from '../config/queryConfig'

export interface EnhancedOverviewStatsResult extends Omit<UseQueryResult<OverviewStats>, 'error'> {
  error: StatsApiError | null
  retry: () => void
  isRetrying: boolean
  errorMessage?: string
  canRetry: boolean
}

/**
 * Enhanced version of useOverviewStats with better error handling and retry logic
 * 
 * This hook extends the basic useOverviewStats with enhanced error handling,
 * automatic retry logic for recoverable errors, and better TypeScript support
 * for error states.
 * 
 * @returns {EnhancedOverviewStatsResult} Enhanced React Query result with improved error handling
 * 
 * @example
 * ```typescript
 * function Dashboard() {
 *   const { 
 *     data, 
 *     isLoading, 
 *     error, 
 *     retry, 
 *     canRetry,
 *     errorMessage 
 *   } = useEnhancedOverviewStats()
 * 
 *   if (isLoading) return <LoadingSpinner />
 *   if (error) return <ErrorDisplay error={error} onRetry={canRetry ? retry : undefined} />
 *   if (!data) return null
 * 
 *   return <StatsDisplay stats={data} />
 * }
 * ```
 */
export function useEnhancedOverviewStats(): EnhancedOverviewStatsResult {
  const baseOptions = {
    queryKey: QUERY_KEYS.OVERVIEW_STATS,
    queryFn: fetchOverviewStats,
    ...OVERVIEW_STATS_QUERY_OPTIONS
  }

  // Only apply enhanced retry logic if retry is not explicitly disabled
  const enhancedOptions = OVERVIEW_STATS_QUERY_OPTIONS.retry !== false ? {
    ...baseOptions,
    // Enhanced retry logic based on error type
    retry: (failureCount: number, error: unknown) => {
      const statsError = error as StatsApiError
      
      // Don't retry non-retryable errors
      if (statsError.isRetryable === false) {
        return false
      }
      
      // Limit retries to 3 attempts
      if (failureCount >= 3) {
        return false
      }
      
      // For rate limiting, don't retry automatically
      if (statsError.errorType === 'rate_limit') {
        return false
      }
      
      return true
    },
    // Custom retry delay based on error type
    retryDelay: (attemptIndex: number, error: unknown) => {
      const statsError = error as StatsApiError
      
      // For server errors, use exponential backoff
      if (statsError.errorType === 'server' || statsError.errorType === 'network') {
        return Math.min(1000 * 2 ** attemptIndex, 30000)
      }
      
      // Default delay
      return 1000
    }
  } : baseOptions

  const queryResult = useQuery<OverviewStats>(enhancedOptions)

  const { error, refetch, isRefetching, ...rest } = queryResult

  // Type-safe error casting
  const statsError = error as StatsApiError | null

  // Determine if manual retry is available
  const canRetry = !statsError || statsError.isRetryable !== false

  // Get user-friendly error message
  const errorMessage = statsError?.userMessage || error?.message

  // Enhanced retry function
  const retry = () => {
    refetch()
  }

  return {
    ...rest,
    error: statsError,
    retry,
    isRetrying: isRefetching,
    errorMessage,
    canRetry
  }
}

/**
 * Hook for getting error recovery suggestions based on error type
 */
export function useErrorRecovery(error?: StatsApiError | null) {
  if (!error) return null

  const getSuggestions = () => {
    switch (error.errorType) {
      case 'authentication':
        return [
          'Please log in to your account',
          'Check if your session has expired',
          'Clear your browser cache and try again'
        ]
      
      case 'authorization':
        return [
          'Contact your administrator for access',
          'Verify you have the correct permissions',
          'Try logging out and logging back in'
        ]
      
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable any VPN or proxy if active'
        ]
      
      case 'rate_limit':
        return [
          `Wait ${error.retryAfter || 60} seconds before trying again`,
          'Reduce the frequency of your requests',
          'Consider upgrading your plan if limits are too low'
        ]
      
      case 'server':
        return [
          'The issue is on our end, please try again later',
          'Check our status page for any ongoing issues',
          'Contact support if the problem persists'
        ]
      
      default:
        return [
          'Try refreshing the page',
          'Check your internet connection',
          'Contact support if the problem continues'
        ]
    }
  }

  return {
    suggestions: getSuggestions(),
    isRetryable: error.isRetryable,
    retryAfter: error.retryAfter,
    errorCode: error.errorCode
  }
}
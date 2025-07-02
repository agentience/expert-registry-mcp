import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { OverviewStats } from '../types/stats'
import { fetchOverviewStats, type StatsApiError } from '../api/statsApi'
import { QUERY_KEYS, OVERVIEW_STATS_QUERY_OPTIONS } from '../config/queryConfig'

// Re-export types for convenience
export type { StatsApiError, ErrorType } from '../api/statsApi'

/**
 * Custom hook for fetching overview statistics
 * 
 * This hook uses React Query to fetch and cache overview statistics data.
 * It includes proper error handling, caching configuration, and TypeScript support.
 * 
 * @returns {UseQueryResult<OverviewStats>} React Query result object containing:
 *   - data: The overview statistics data (when successfully loaded)
 *   - isLoading: Boolean indicating if the initial request is in progress
 *   - isError: Boolean indicating if an error occurred
 *   - error: Error object (if any)
 *   - refetch: Function to manually trigger a refetch
 *   - Additional React Query properties
 * 
 * @example
 * ```typescript
 * function Dashboard() {
 *   const { data, isLoading, isError, error } = useOverviewStats()
 * 
 *   if (isLoading) return <LoadingSpinner />
 *   if (isError) return <ErrorMessage error={error} />
 *   if (!data) return null
 * 
 *   return <StatsDisplay stats={data} />
 * }
 * ```
 */
export function useOverviewStats(): UseQueryResult<OverviewStats> {
  return useQuery<OverviewStats>({
    queryKey: QUERY_KEYS.OVERVIEW_STATS,
    queryFn: fetchOverviewStats,
    ...OVERVIEW_STATS_QUERY_OPTIONS,
  })
}
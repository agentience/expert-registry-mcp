/**
 * React Query configuration constants and settings
 */

/**
 * Default stale time for cache (5 minutes)
 * Data will be considered fresh for this duration
 */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000 // 5 minutes

/**
 * Default cache time for unused queries (10 minutes)
 * Queries will remain in cache for this duration after becoming unused
 */
export const DEFAULT_CACHE_TIME = 10 * 60 * 1000 // 10 minutes

/**
 * Stale time for overview stats specifically (2 minutes)
 * Overview stats can become stale quicker as they change more frequently
 */
export const OVERVIEW_STATS_STALE_TIME = 2 * 60 * 1000 // 2 minutes

/**
 * Query key constants for consistency across the application
 */
export const QUERY_KEYS = {
  OVERVIEW_STATS: ['overview', 'stats'] as const,
  EXPERTS: ['experts'] as const,
  EXPERT_CONTEXT: ['expert', 'context'] as const,
  PERFORMANCE: ['performance'] as const,
} as const

/**
 * Check if we're in a test environment
 */
export const isTestEnvironment = () => {
  return typeof window !== 'undefined' && (
    // @ts-ignore - vitest global
    typeof (globalThis as any)?.vi !== 'undefined' || 
    // @ts-ignore - jest global
    typeof (globalThis as any)?.jest !== 'undefined' ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')
  )
}

/**
 * Default query options for React Query
 */
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: DEFAULT_STALE_TIME,
  cacheTime: DEFAULT_CACHE_TIME,
  refetchOnWindowFocus: false,
  retry: isTestEnvironment() ? false : 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const

/**
 * Overview stats specific query options
 */
export const OVERVIEW_STATS_QUERY_OPTIONS = {
  staleTime: OVERVIEW_STATS_STALE_TIME,
  cacheTime: DEFAULT_CACHE_TIME,
  refetchOnWindowFocus: false,
  retry: isTestEnvironment() ? false : 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const
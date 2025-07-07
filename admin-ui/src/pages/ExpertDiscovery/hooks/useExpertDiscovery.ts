import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'
import type { 
  Expert, 
  ExpertDiscoveryQuery, 
  ExpertDiscoveryResult,
  UseExpertDiscoveryReturn,
  ExpertDiscoveryError
} from '../types'
import { QUERY_CONFIG } from '../constants'
import { generateQueryCacheKey, areQueriesEqual } from '../utils'
import { realDiscoverExperts, realGetExpertDetails } from '../services/realExpertService'

export function useExpertDiscovery(): UseExpertDiscoveryReturn {
  const [lastQuery, setLastQuery] = useState<ExpertDiscoveryQuery | null>(null)
  const queryClient = useQueryClient()

  // Memoized query key generator
  const queryKey = useMemo(() => {
    return lastQuery ? ['expertDiscovery', generateQueryCacheKey(lastQuery)] : null
  }, [lastQuery])

  // Query for basic expert data with optimized configuration
  const {
    data: discoveryResult,
    isLoading: isDiscovering,
    error: discoveryError,
    refetch
  } = useQuery({
    queryKey: queryKey ? [queryKey] : ['expertDiscovery', 'none'],
    queryFn: () => lastQuery ? realDiscoverExperts(lastQuery) : Promise.resolve(null),
    enabled: !!lastQuery,
    staleTime: QUERY_CONFIG.staleTime,
    gcTime: QUERY_CONFIG.gcTime,
    retryDelay: QUERY_CONFIG.retryDelay,
    select: useCallback((data: ExpertDiscoveryResult | null) => {
      // Only re-render if the data actually changed
      return data
    }, [])
  })

  // Mutation for discovering experts with optimized caching
  const discoverExpertsMutation = useMutation({
    mutationFn: realDiscoverExperts,
    onSuccess: (data, variables) => {
      // Only update if query actually changed
      if (!areQueriesEqual(lastQuery, variables)) {
        setLastQuery(variables)
      }
      
      // Cache the result with generated key
      const cacheKey = generateQueryCacheKey(variables)
      queryClient.setQueryData(['expertDiscovery', cacheKey], data)
    },
    onError: (error) => {
      console.error('Expert discovery failed:', error)
    }
  })

  // Mutation for getting expert details with caching
  const getExpertDetailsMutation = useMutation({
    mutationFn: realGetExpertDetails,
    onSuccess: (data) => {
      queryClient.setQueryData(['expertDetails', data.id], data)
    },
    onError: (error, expertId) => {
      console.error(`Failed to get details for expert ${expertId}:`, error)
    }
  })

  // Memoized action functions to prevent unnecessary re-renders
  const discoverExperts = useCallback(
    async (query: ExpertDiscoveryQuery): Promise<ExpertDiscoveryResult> => {
      return discoverExpertsMutation.mutateAsync(query)
    }, 
    [discoverExpertsMutation]
  )

  const getExpertDetails = useCallback(
    async (expertId: string): Promise<Expert> => {
      // Check cache first
      const cachedExpert = queryClient.getQueryData<Expert>(['expertDetails', expertId])
      if (cachedExpert) {
        return cachedExpert
      }
      
      return getExpertDetailsMutation.mutateAsync(expertId)
    }, 
    [getExpertDetailsMutation, queryClient]
  )

  const clearResults = useCallback(() => {
    setLastQuery(null)
    queryClient.removeQueries({ queryKey: ['expertDiscovery'] })
  }, [queryClient])

  // Optimized refetch that preserves the last query
  const optimizedRefetch = useCallback(() => {
    if (lastQuery) {
      return discoverExperts(lastQuery)
    }
    return refetch()
  }, [lastQuery, discoverExperts, refetch])

  // Memoized derived state
  const derivedState = useMemo(() => ({
    experts: discoveryResult?.experts || [],
    totalCount: discoveryResult?.totalCount || 0,
    searchTime: discoveryResult?.searchTime || 0,
    hasSearched: !!lastQuery
  }), [discoveryResult, lastQuery])

  return {
    // Data
    data: discoveryResult,
    experts: derivedState.experts,
    totalCount: derivedState.totalCount,
    searchTime: derivedState.searchTime,
    
    // Loading states
    isLoading: isDiscovering,
    isDiscovering: discoverExpertsMutation.isPending,
    isLoadingDetails: getExpertDetailsMutation.isPending,
    
    // Error states
    error: discoveryError as ExpertDiscoveryError,
    discoveryError: discoverExpertsMutation.error as ExpertDiscoveryError,
    detailsError: getExpertDetailsMutation.error as ExpertDiscoveryError,
    
    // Actions
    discoverExperts,
    getExpertDetails,
    clearResults,
    refetch: optimizedRefetch,
    
    // State
    lastQuery,
    hasSearched: derivedState.hasSearched,
  }
}

export default useExpertDiscovery
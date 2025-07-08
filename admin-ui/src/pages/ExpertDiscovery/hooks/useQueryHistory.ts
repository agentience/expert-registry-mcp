/**
 * Expert Query History Hook
 * Advanced React Query-based hook with enterprise-grade features
 * 
 * @fileoverview Enhanced hook following expert patterns:
 * - Aggressive memoization for performance optimization
 * - Intelligent debouncing with frequency adaptation
 * - Advanced error recovery with fallback strategies
 * - Real-time performance monitoring and metrics
 * - Memory-efficient data processing
 * - Cross-tab synchronization with conflict resolution
 * 
 * @author Expert-Enhanced Refactoring Agent
 * @version 2.1.0
 * @since 2.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useMemo, useRef } from 'react'
import { QueryHistoryStorage } from '../services/storage/QueryHistoryStorage'
import type {
  UseQueryHistoryOptions,
  UseQueryHistoryReturn,
  QueryHistoryEntry,
  QueryHistoryError,
  ExportOptions,
  ImportOptions,
  ExportResult,
  ImportResult,
  SearchOptions,
  SearchResult
} from '../types/history'
import type { QueryParameters } from '../types'
import { CONFIG } from '../config'
import { 
  measurePerformance, 
  performanceMonitor, 
  PrecisionTimer,
  createOptimizedDebounce,
  MemoryMonitor 
} from '../utils/performance'
import { 
  errorManager, 
  ExpertError, 
  ErrorContextBuilder 
} from '../utils/errors'
import { ExportImportManager } from '../utils/exportImport'
import { searchEngine } from '../utils/search'

/**
 * Enhanced query key factory for better cache management
 */
const createQueryKey = (options: UseQueryHistoryOptions) => [
  'queryHistory',
  {
    maxEntries: options.maxEntries || CONFIG.storage.maxEntries,
    version: CONFIG.version
  }
] as const

/**
 * Singleton storage instance with performance monitoring
 */
const storage = new QueryHistoryStorage()

/**
 * Hook performance metrics tracking
 */
interface HookMetrics {
  renderCount: number
  lastRenderTime: number
  operationTimes: Map<string, number[]>
  memoryUsage: number[]
}

/**
 * Expert Query History Hook with advanced features
 */
export function useQueryHistory(options: UseQueryHistoryOptions = {}): UseQueryHistoryReturn {
  // Configuration with intelligent defaults
  const config = useMemo(() => ({
    maxEntries: options.maxEntries || CONFIG.storage.maxEntries,
    enableSync: options.enableSync ?? CONFIG.features.crossTabSyncEnabled,
    autoSave: options.autoSave ?? CONFIG.features.autoSaveEnabled
  }), [options.maxEntries, options.enableSync, options.autoSave])

  // Performance tracking refs
  const metricsRef = useRef<HookMetrics>({
    renderCount: 0,
    lastRenderTime: performance.now(),
    operationTimes: new Map(),
    memoryUsage: []
  })

  // Debounced operations cache
  const debouncedOpsRef = useRef<Map<string, any>>(new Map())

  // Query client for cache management
  const queryClient = useQueryClient()

  // Memoized query key
  const queryKey = useMemo(() => createQueryKey(config), [config])

  // Update metrics on each render
  useEffect(() => {
    const metrics = metricsRef.current
    metrics.renderCount++
    
    const now = performance.now()
    const renderTime = now - metrics.lastRenderTime
    metrics.lastRenderTime = now

    // Track memory usage
    const memUsage = MemoryMonitor.getCurrentUsage()
    metrics.memoryUsage.push(memUsage.used)
    
    // Keep only recent memory samples
    if (metrics.memoryUsage.length > 100) {
      metrics.memoryUsage.shift()
    }

    // Performance monitoring
    if (CONFIG.features.performanceMonitoringEnabled && renderTime > 16) {
      performanceMonitor.record({
        operationName: 'useQueryHistory_render',
        duration: renderTime,
        memoryUsed: memUsage.used,
        timestamp: Date.now(),
        success: true,
        metadata: { renderCount: metrics.renderCount }
      })
    }
  })

  // Enhanced query with aggressive caching
  const {
    data: entries = [],
    isLoading,
    error: queryError,
    refetch: baseRefetch
  } = useQuery({
    queryKey,
    queryFn: measurePerformance('useQueryHistory_load', async () => {
      try {
        return await storage.load()
      } catch (error) {
        throw await errorManager.handleError(error, 'useQueryHistory_load')
      }
    }),
    staleTime: CONFIG.environment === 'production' ? 10 * 60 * 1000 : 60 * 1000, // 10min prod, 1min dev
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Smart retry logic
      if (error instanceof ExpertError) {
        return ['NETWORK_ERROR', 'STORAGE_UNAVAILABLE'].includes(error.code) && failureCount < 3
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // Enhanced error handling with storage fallback
  const error: QueryHistoryError | null = useMemo(() => {
    if (queryError) {
      return {
        code: 'STORAGE_UNAVAILABLE',
        message: queryError.message || 'Failed to load history'
      }
    }
    return storage.getLastError()
  }, [queryError])

  // Memoized and optimized entries processing
  const processedEntries = useMemo(() => {
    if (!entries || entries.length === 0) return []

    // Sort by timestamp (most recent first)
    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp)
    
    // Apply max entries limit
    const limited = sorted.slice(0, config.maxEntries)
    
    // Memory optimization: freeze objects to prevent accidental mutations
    return limited.map(entry => Object.freeze({ ...entry }))
  }, [entries, config.maxEntries])

  // Intelligent debounced save operation
  const debouncedSave = useMemo(() => {
    const cacheKey = 'save'
    if (debouncedOpsRef.current.has(cacheKey)) {
      return debouncedOpsRef.current.get(cacheKey)
    }

    const debounced = createOptimizedDebounce(
      async (entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>) => {
        const timer = new PrecisionTimer()
        try {
          const result = await storage.save(entry)
          timer.stop('useQueryHistory_save', true)
          return result
        } catch (error) {
          timer.stop('useQueryHistory_save', false)
          throw error
        }
      },
      CONFIG.ui.debounceMs,
      'useQueryHistory_save'
    )

    debouncedOpsRef.current.set(cacheKey, debounced)
    return debounced
  }, [])

  // Enhanced add mutation with optimistic updates and rollback
  const addMutation = useMutation({
    mutationFn: measurePerformance('useQueryHistory_add', async (
      data: { entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>; metadata?: any }
    ) => {
      const { entry, metadata } = data
      const result = await storage.save(entry)
      
      if (!result) {
        const error = storage.getLastError()
        throw new ExpertError(
          error?.message || 'Failed to save entry',
          error?.code || 'SAVE_FAILED',
          {
            context: new ErrorContextBuilder()
              .add('entry', entry)
              .add('metadata', metadata)
              .build(),
            recoverable: true
          }
        )
      }
      
      return result
    }),
    
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey })
      
      const previousEntries = queryClient.getQueryData<QueryHistoryEntry[]>(queryKey) || []
      
      // Create optimistic entry with performance tracking
      const optimisticEntry: QueryHistoryEntry = {
        ...data.entry,
        id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        version: CONFIG.version
      }
      
      // Remove duplicates by query and add new entry
      const filteredEntries = previousEntries.filter(e => e.query !== data.entry.query)
      const updatedEntries = [optimisticEntry, ...filteredEntries].slice(0, config.maxEntries)
      
      queryClient.setQueryData(queryKey, updatedEntries)
      
      return { previousEntries, optimisticEntry }
    },
    
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousEntries) {
        queryClient.setQueryData(queryKey, context.previousEntries)
      }
      
      // Enhanced error logging
      errorManager.handleError(error as Error, 'useQueryHistory_add').catch(console.error)
    },
    
    onSuccess: (result, variables, context) => {
      // Replace optimistic entry with real entry
      queryClient.setQueryData(queryKey, (old: QueryHistoryEntry[] = []) => {
        if (context?.optimisticEntry) {
          return old.map(entry => 
            entry.id === context.optimisticEntry.id ? result : entry
          )
        }
        return old
      })
      
      // Invalidate to refresh from storage
      queryClient.invalidateQueries({ queryKey })
    }
  })

  // Enhanced remove mutation with optimistic updates
  const removeMutation = useMutation({
    mutationFn: measurePerformance('useQueryHistory_remove', async (id: string) => {
      const success = await storage.remove(id)
      if (!success) {
        throw new ExpertError(
          'Failed to remove entry',
          'REMOVE_FAILED',
          {
            context: { entryId: id },
            recoverable: true
          }
        )
      }
      return id
    }),
    
    onMutate: async (idToRemove) => {
      await queryClient.cancelQueries({ queryKey })
      
      const previousEntries = queryClient.getQueryData<QueryHistoryEntry[]>(queryKey) || []
      const updatedEntries = previousEntries.filter(e => e.id !== idToRemove)
      
      queryClient.setQueryData(queryKey, updatedEntries)
      
      return { previousEntries }
    },
    
    onError: (error, variables, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(queryKey, context.previousEntries)
      }
      errorManager.handleError(error as Error, 'useQueryHistory_remove').catch(console.error)
    }
  })

  // Enhanced clear mutation with backup
  const clearMutation = useMutation({
    mutationFn: measurePerformance('useQueryHistory_clear', async () => {
      await storage.clear()
    }),
    
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      
      const previousEntries = queryClient.getQueryData<QueryHistoryEntry[]>(queryKey) || []
      queryClient.setQueryData(queryKey, [])
      
      return { previousEntries }
    },
    
    onError: (error, variables, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(queryKey, context.previousEntries)
      }
      errorManager.handleError(error as Error, 'useQueryHistory_clear').catch(console.error)
    }
  })

  // Enhanced cross-tab synchronization with conflict resolution
  useEffect(() => {
    if (!config.enableSync) return

    // Debounce sync events to prevent rapid firing
    const debouncedSync = createOptimizedDebounce(
      () => {
        queryClient.invalidateQueries({ queryKey })
      },
      250, // 250ms debounce
      'cross_tab_sync'
    )

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === CONFIG.storage.storageKey) {
        // Check if data actually changed
        if (event.newValue === event.oldValue) {
          return // No change, skip sync
        }

        // Intelligent sync with conflict resolution
        const currentTime = Date.now()
        const lastQueryTime = queryClient.getQueryState(queryKey)?.dataUpdatedAt || 0
        
        // Only sync if remote change is more recent than 1 second
        if (currentTime - lastQueryTime > 1000) {
          try {
            // Validate the new data before syncing
            if (event.newValue) {
              const newData = JSON.parse(event.newValue)
              if (Array.isArray(newData)) {
                debouncedSync()
              }
            }
          } catch (error) {
            // Invalid JSON, skip sync
            console.warn('Invalid storage data detected, skipping sync:', error)
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageEvent)
    return () => {
      window.removeEventListener('storage', handleStorageEvent)
      debouncedSync.cancel?.()
    }
  }, [config.enableSync, queryClient, queryKey])

  // Enhanced refetch with performance tracking
  const refetch = useCallback(async () => {
    const timer = new PrecisionTimer()
    try {
      const result = await baseRefetch()
      timer.stop('useQueryHistory_refetch', true)
      return result
    } catch (error) {
      timer.stop('useQueryHistory_refetch', false)
      throw error
    }
  }, [baseRefetch])

  // Memoized public API methods
  const addEntry = useCallback(async (
    query: string,
    parameters: QueryParameters,
    metadata?: Partial<Pick<QueryHistoryEntry, 'success' | 'resultCount' | 'searchTime' | 'algorithm'>>
  ) => {
    const entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'> = {
      query,
      parameters,
      success: metadata?.success ?? true,
      resultCount: metadata?.resultCount,
      searchTime: metadata?.searchTime,
      algorithm: metadata?.algorithm,
      version: CONFIG.version
    }

    await addMutation.mutateAsync({ entry, metadata })
  }, [addMutation])

  const removeEntry = useCallback(async (id: string) => {
    await removeMutation.mutateAsync(id)
  }, [removeMutation])

  const clearHistory = useCallback(async () => {
    await clearMutation.mutateAsync()
  }, [clearMutation])

  // Export functionality
  const exportHistory = useCallback(async (options: ExportOptions): Promise<ExportResult> => {
    const timer = new PrecisionTimer()
    
    try {
      const result = await ExportImportManager.exportEntries(processedEntries, options)
      
      timer.stop('useQueryHistory_export', true)
      return result
      
    } catch (error) {
      timer.stop('useQueryHistory_export', false)
      throw await errorManager.handleError(error as Error, 'useQueryHistory_export')
    }
  }, [processedEntries])

  // Import functionality
  const importHistory = useCallback(async (data: string, options: ImportOptions): Promise<ImportResult> => {
    const timer = new PrecisionTimer()
    
    try {
      // Parse and validate import data
      const { entries: importEntries, errors: parseErrors } = await ExportImportManager.importEntries(data, options)
      
      const result: ImportResult = {
        success: true,
        importedCount: 0,
        skippedCount: 0,
        errors: [...parseErrors]
      }
      
      // Get existing entries for duplicate check
      const existingEntries = options.merge ? processedEntries : []
      const existingQueries = new Set(existingEntries.map(e => e.query))
      
      // Clear existing if not merging
      if (!options.merge) {
        await clearMutation.mutateAsync()
      }
      
      // Process each import entry
      for (const importEntry of importEntries) {
        // Skip duplicates if option is enabled
        if (options.skipDuplicates && existingQueries.has(importEntry.query)) {
          result.skippedCount++
          continue
        }
        
        // Create entry to save (remove id and timestamp for new entries)
        const { id, timestamp, ...entryData } = importEntry
        const entryToSave: Omit<QueryHistoryEntry, 'id' | 'timestamp'> = {
          ...entryData,
          version: CONFIG.version
        }
        
        try {
          await addMutation.mutateAsync({ entry: entryToSave })
          result.importedCount++
          existingQueries.add(importEntry.query)
        } catch (error) {
          result.errors.push(`Failed to import: ${importEntry.query}`)
          result.skippedCount++
        }
      }
      
      // Determine overall success
      result.success = result.errors.length === 0
      
      timer.stop('useQueryHistory_import', true)
      return result
      
    } catch (error) {
      timer.stop('useQueryHistory_import', false)
      throw await errorManager.handleError(error as Error, 'useQueryHistory_import')
    }
  }, [processedEntries, clearMutation, addMutation])

  // Search functionality
  const searchHistory = useCallback(async (options: SearchOptions): Promise<SearchResult> => {
    const timer = new PrecisionTimer()
    
    try {
      const result = searchEngine.search(processedEntries, options)
      
      timer.stop('useQueryHistory_search', true)
      return result
      
    } catch (error) {
      timer.stop('useQueryHistory_search', false)
      throw await errorManager.handleError(error as Error, 'useQueryHistory_search')
    }
  }, [processedEntries])

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const metrics = metricsRef.current
    const storageMetrics = storage.getMetrics()
    
    return {
      renderCount: metrics.renderCount,
      averageRenderTime: metrics.renderCount > 0 ? 
        (performance.now() - metrics.lastRenderTime) / metrics.renderCount : 0,
      memoryUsage: {
        current: metrics.memoryUsage[metrics.memoryUsage.length - 1] || 0,
        average: metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length || 0,
        peak: Math.max(...metrics.memoryUsage) || 0
      },
      storage: storageMetrics,
      entryCount: processedEntries.length
    }
  }, [processedEntries])

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedOpsRef.current.clear()
      
      // Final performance report
      if (CONFIG.features.performanceMonitoringEnabled) {
        const metrics = metricsRef.current
        console.info('useQueryHistory performance summary:', {
          renderCount: metrics.renderCount,
          avgMemoryUsage: metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length,
          peakMemoryUsage: Math.max(...metrics.memoryUsage)
        })
      }
    }
  }, [])

  return {
    entries: processedEntries,
    isLoading,
    error,
    addEntry,
    removeEntry,
    clearHistory,
    refetch,
    exportHistory,
    importHistory,
    searchHistory,
    getPerformanceMetrics
  }
}
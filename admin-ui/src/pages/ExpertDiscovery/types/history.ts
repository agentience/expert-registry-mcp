/**
 * Query History Enhancement Types
 * Defines TypeScript interfaces and types for query history functionality
 */

import type { QueryParameters } from './index'

// Core query history entry interface
export interface QueryHistoryEntry {
  id: string
  query: string
  parameters: QueryParameters
  timestamp: number
  success: boolean
  resultCount?: number
  searchTime?: number
  algorithm?: string
  version: string
  notes?: string
}

// Storage service interfaces
export interface QueryHistoryStorage {
  save(entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>): Promise<QueryHistoryEntry | null>
  load(): Promise<QueryHistoryEntry[]>
  remove(id: string): Promise<boolean>
  clear(): Promise<void>
  isAvailable(): boolean
  getLastError(): QueryHistoryError | null
}

// Error handling types
export interface QueryHistoryError {
  code: 'QUOTA_EXCEEDED' | 'PARSE_ERROR' | 'STORAGE_UNAVAILABLE' | 'VALIDATION_ERROR'
  message: string
  details?: any
}

// Hook interfaces
export interface UseQueryHistoryOptions {
  maxEntries?: number
  enableSync?: boolean
  autoSave?: boolean
}

export interface UseQueryHistoryReturn {
  entries: QueryHistoryEntry[]
  isLoading: boolean
  error: QueryHistoryError | null
  addEntry: (
    query: string, 
    parameters: QueryParameters, 
    metadata?: Partial<Pick<QueryHistoryEntry, 'success' | 'resultCount' | 'searchTime' | 'algorithm'>>
  ) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  refetch: () => Promise<void>
  exportHistory: (options: ExportOptions) => Promise<ExportResult>
  importHistory: (data: string, options: ImportOptions) => Promise<ImportResult>
  searchHistory: (options: SearchOptions) => Promise<SearchResult>
  getPerformanceMetrics: () => {
    renderCount: number
    averageRenderTime: number
    memoryUsage: {
      current: number
      average: number
      peak: number
    }
    storage: any
    entryCount: number
  }
}

// Component prop interfaces
export interface ExpandableHistoryProps {
  entries: QueryHistoryEntry[]
  isLoading?: boolean
  error?: QueryHistoryError | null
  maxVisibleItems?: number
  onSelect?: (entry: QueryHistoryEntry) => void
  onDelete?: (id: string) => void
  onClear?: () => void
  className?: string
}

export interface HistoryItemProps {
  entry: QueryHistoryEntry
  index: number
  isSelected?: boolean
  onSelect?: (entry: QueryHistoryEntry) => void
  onDelete?: (id: string) => void
  className?: string
}

// Migration types
export interface MigrationConfig {
  fromVersion: string
  toVersion: string
  migrationFn: (data: any) => QueryHistoryEntry[]
}

export interface LegacyQueryHistory {
  version?: string
  queries?: string[]
  entries?: any[]
}

// Storage configuration
export interface StorageConfig {
  storageKey: string
  maxEntries: number
  compressionEnabled: boolean
  migrationEnabled: boolean
}

// Keyboard navigation types
export interface HistoryKeyboardNavigation {
  focusIndex: number
  maxIndex: number
  onNavigate: (direction: 'up' | 'down' | 'home' | 'end') => void
  onSelect: (index: number) => void
  onEscape: () => void
}

// Cross-tab synchronization types
export interface StorageEventData {
  action: 'add' | 'remove' | 'clear'
  entry?: QueryHistoryEntry
  id?: string
  timestamp: number
}

// Export/Import types
export interface ExportOptions {
  format: 'json' | 'csv'
  includeMetadata?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  filterBy?: {
    algorithm?: string
    success?: boolean
  }
}

export interface ImportOptions {
  format: 'json' | 'csv'
  merge?: boolean
  validateEntries?: boolean
  skipDuplicates?: boolean
}

export interface ExportResult {
  data: string
  filename: string
  size: number
  entryCount: number
}

export interface ImportResult {
  success: boolean
  importedCount: number
  skippedCount: number
  errors: string[]
}

// Search types
export interface SearchOptions {
  query: string
  fuzzy?: boolean
  fuzzyThreshold?: number
  caseSensitive?: boolean
  filters?: {
    dateRange?: {
      start: Date
      end: Date
    }
    algorithm?: string
    success?: boolean
    minResultCount?: number
    maxResultCount?: number
  }
  sortBy?: 'relevance' | 'date' | 'query' | 'resultCount'
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

export interface SearchResult {
  entries: QueryHistoryEntry[]
  totalCount: number
  searchTime: number
  query: string
  matches: Array<{
    entryId: string
    score: number
    highlights: Array<{
      field: string
      start: number
      end: number
    }>
  }>
}

// Performance monitoring types
export interface PerformanceMetrics {
  saveTime: number
  loadTime: number
  entryCount: number
  storageSize: number
}

// Constants for configuration
export const STORAGE_CONFIG: StorageConfig = {
  storageKey: 'expert_discovery_query_history',
  maxEntries: 50,
  compressionEnabled: false,
  migrationEnabled: true
}

export const CURRENT_VERSION = '2.0.0'

// Type guards
export function isQueryHistoryEntry(obj: any): obj is QueryHistoryEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.query === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.success === 'boolean' &&
    typeof obj.version === 'string' &&
    obj.parameters && 
    typeof obj.parameters === 'object'
  )
}

export function isQueryHistoryError(obj: any): obj is QueryHistoryError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    ['QUOTA_EXCEEDED', 'PARSE_ERROR', 'STORAGE_UNAVAILABLE', 'VALIDATION_ERROR'].includes(obj.code)
  )
}
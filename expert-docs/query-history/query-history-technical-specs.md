# Query History Technical Specifications

**Last Updated: 2025-01-07**

## Overview

This document provides complete technical specifications for the query history enhancement feature, including data models, API contracts, component interfaces, and performance requirements.

## Data Models and Schemas

### Core Data Types

```typescript
// Enums and Constants
export enum SearchAlgorithm {
  VECTOR = 'vector',
  KEYWORD = 'keyword',
  SEMANTIC = 'semantic',
  HYBRID = 'hybrid'
}

export enum StorageType {
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  INDEXED_DB = 'indexedDB',
  MEMORY = 'memory'
}

export const STORAGE_CONSTANTS = {
  MAX_ENTRIES: 50,
  MAX_ENTRY_SIZE: 5000, // characters
  STORAGE_KEY: 'expert-discovery-query-history',
  MIGRATION_KEY: 'query-history-migrated',
  VERSION_KEY: 'query-history-version',
  CURRENT_VERSION: '1.0.0'
} as const
```

### Query History Entry Schema

```typescript
export interface QueryHistoryEntry {
  // Identification
  id: string                    // UUID v4
  version: string              // Schema version
  
  // Query Data
  query: string                // User's search query
  normalizedQuery?: string     // Lowercase, trimmed version
  
  // Parameters
  parameters: QueryParameters
  
  // Metadata
  timestamp: number           // Unix timestamp (milliseconds)
  sessionId?: string         // Optional session identifier
  
  // Results
  resultCount?: number       // Number of experts found
  searchTime?: number        // Query execution time (ms)
  algorithm: SearchAlgorithm // Algorithm used
  success: boolean          // Whether query succeeded
  errorCode?: string        // Error code if failed
  
  // User Metadata
  tags?: string[]           // User-defined tags
  favorite?: boolean        // Marked as favorite
  notes?: string           // User notes
}

export interface QueryParameters {
  algorithm: SearchAlgorithm
  maxResults: number
  technologies?: string[]
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'expert'
  availability?: 'immediate' | 'soon' | 'future'
  location?: string
  remoteOnly?: boolean
  rateRange?: {
    min: number
    max: number
    currency: string
  }
  sortBy?: 'relevance' | 'experience' | 'rate' | 'availability'
  filters?: Record<string, any>
}
```

### Storage Schema

```typescript
export interface StorageSchema {
  version: string
  entries: QueryHistoryEntry[]
  metadata: StorageMetadata
  indexes: StorageIndexes
}

export interface StorageMetadata {
  createdAt: number
  updatedAt: number
  entryCount: number
  totalSize: number
  lastCleanup: number
  compressionEnabled: boolean
}

export interface StorageIndexes {
  byTimestamp: Map<number, string> // timestamp -> id
  byQuery: Map<string, string[]>   // normalized query -> ids
  byAlgorithm: Map<SearchAlgorithm, string[]> // algorithm -> ids
  bySuccess: {
    successful: string[]
    failed: string[]
  }
}
```

### User Preferences Schema

```typescript
export interface QueryHistoryPreferences {
  // Storage Settings
  enabled: boolean
  storageType: StorageType
  maxEntries: number
  retentionDays: number
  
  // Privacy Settings
  autoSave: boolean
  saveFailedQueries: boolean
  shareAnalytics: boolean
  
  // UI Settings
  defaultView: 'compact' | 'detailed' | 'timeline'
  itemsPerPage: number
  showTimestamps: boolean
  showResultCounts: boolean
  
  // Sync Settings (Future)
  enableCloudSync?: boolean
  syncFrequency?: 'realtime' | 'periodic' | 'manual'
  conflictResolution?: 'local' | 'remote' | 'newest'
}
```

## API Contracts

### Storage Service Interface

```typescript
export interface IQueryHistoryStorage {
  // Core Operations
  save(entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>): Promise<QueryHistoryEntry>
  load(options?: LoadOptions): Promise<QueryHistoryEntry[]>
  remove(id: string): Promise<boolean>
  clear(): Promise<void>
  
  // Batch Operations
  saveMany(entries: QueryHistoryEntry[]): Promise<QueryHistoryEntry[]>
  removeMany(ids: string[]): Promise<number>
  
  // Query Operations
  search(query: string, options?: SearchOptions): Promise<QueryHistoryEntry[]>
  filter(predicate: (entry: QueryHistoryEntry) => boolean): Promise<QueryHistoryEntry[]>
  findById(id: string): Promise<QueryHistoryEntry | null>
  
  // Analytics
  getStats(): Promise<StorageStats>
  getUsage(): Promise<StorageUsage>
  
  // Maintenance
  cleanup(options?: CleanupOptions): Promise<CleanupResult>
  optimize(): Promise<void>
  validate(): Promise<ValidationResult>
  
  // Import/Export
  export(format: 'json' | 'csv'): Promise<string>
  import(data: string, format: 'json' | 'csv'): Promise<ImportResult>
}

// Supporting Types
export interface LoadOptions {
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'query' | 'resultCount'
  sortOrder?: 'asc' | 'desc'
  includeMetadata?: boolean
}

export interface SearchOptions {
  fields?: ('query' | 'parameters' | 'tags' | 'notes')[]
  fuzzy?: boolean
  threshold?: number
  limit?: number
}

export interface StorageStats {
  totalEntries: number
  totalSize: number
  oldestEntry: Date | null
  newestEntry: Date | null
  averageQueryLength: number
  averageResultCount: number
  successRate: number
  popularQueries: Array<{ query: string; count: number }>
  algorithmDistribution: Record<SearchAlgorithm, number>
}

export interface CleanupOptions {
  olderThan?: Date
  keepFavorites?: boolean
  maxEntries?: number
  targetSize?: number
}
```

### React Hook Interface

```typescript
export interface UseQueryHistoryOptions {
  enabled?: boolean
  autoLoad?: boolean
  autoSave?: boolean
  storage?: IQueryHistoryStorage
  onError?: (error: Error) => void
}

export interface UseQueryHistoryReturn {
  // Data
  entries: QueryHistoryEntry[]
  totalCount: number
  hasMore: boolean
  
  // Loading States
  isLoading: boolean
  isSaving: boolean
  isDeleting: boolean
  
  // Error States
  error: Error | null
  saveError: Error | null
  deleteError: Error | null
  
  // Actions
  addEntry: (query: string, parameters: QueryParameters, result?: any) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  updateEntry: (id: string, updates: Partial<QueryHistoryEntry>) => Promise<void>
  
  // Query Operations
  searchHistory: (term: string) => Promise<QueryHistoryEntry[]>
  filterHistory: (filters: HistoryFilters) => QueryHistoryEntry[]
  
  // Utilities
  getRecentQueries: (limit?: number) => string[]
  getFavorites: () => QueryHistoryEntry[]
  exportHistory: (format: 'json' | 'csv') => Promise<string>
  importHistory: (data: string, format: 'json' | 'csv') => Promise<void>
  
  // Pagination
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}
```

### Component Interfaces

```typescript
// QueryInput Component Props
export interface QueryInputProps {
  // Existing props
  onQueryChange?: (query: string) => void
  onSearch?: (query: string) => Promise<any>
  isLoading?: boolean
  error?: string | null
  placeholder?: string
  maxLength?: number
  
  // New history-related props
  enableHistory?: boolean
  currentParameters?: QueryParameters
  onSearchComplete?: (result: any) => void
  onParametersRestore?: (parameters: QueryParameters) => void
  historyOptions?: {
    maxVisible?: number
    showTimestamps?: boolean
    showResultCounts?: boolean
    allowExport?: boolean
  }
}

// Query History Display Component
export interface QueryHistoryDisplayProps {
  entries: QueryHistoryEntry[]
  onSelect: (entry: QueryHistoryEntry) => void
  onRemove: (id: string) => void
  onClear: () => void
  onExport?: () => void
  
  // Display Options
  view?: 'compact' | 'detailed' | 'timeline'
  maxVisible?: number
  enablePagination?: boolean
  enableSearch?: boolean
  
  // Customization
  renderEntry?: (entry: QueryHistoryEntry) => React.ReactNode
  emptyMessage?: string
  className?: string
}

// Expandable History Component
export interface ExpandableHistoryProps {
  entries: QueryHistoryEntry[]
  onSelect: (entry: QueryHistoryEntry) => void
  onRemove: (id: string) => void
  onToggleFavorite?: (id: string) => void
  
  // Expansion Settings
  initialExpanded?: boolean
  collapsedCount?: number
  expandedCount?: number
  animationDuration?: number
  
  // Features
  enableKeyboardNav?: boolean
  enableDragReorder?: boolean
  enableBulkActions?: boolean
}
```

## Performance Requirements

### Response Time Requirements

| Operation | Target | Maximum | Notes |
|-----------|--------|---------|-------|
| Load History | <50ms | 100ms | First 10 entries |
| Save Entry | <20ms | 50ms | Single entry |
| Search | <100ms | 200ms | Full text search |
| Remove Entry | <10ms | 30ms | Single entry |
| Clear All | <50ms | 100ms | All entries |
| Export | <500ms | 1000ms | 1000 entries |

### Memory Requirements

```typescript
export const MEMORY_LIMITS = {
  // Per-entry limits
  MAX_QUERY_LENGTH: 500,        // characters
  MAX_PARAMETERS_SIZE: 2000,    // bytes
  MAX_ENTRY_SIZE: 5000,         // bytes
  
  // Total limits
  MAX_MEMORY_USAGE: 10_000_000, // 10MB
  MAX_ENTRIES_IN_MEMORY: 100,   // entries
  
  // Cache limits
  CACHE_SIZE: 1_000_000,        // 1MB
  CACHE_TTL: 300_000,           // 5 minutes
}
```

### Storage Requirements

```typescript
export const STORAGE_LIMITS = {
  // localStorage
  LOCAL_STORAGE_QUOTA: 5_242_880,     // 5MB typical
  LOCAL_STORAGE_RESERVE: 1_048_576,   // 1MB reserve
  
  // IndexedDB
  INDEXED_DB_INITIAL: 52_428_800,     // 50MB initial
  INDEXED_DB_MAX: 1_073_741_824,      // 1GB maximum
  
  // Per-user limits
  MAX_ENTRIES_PER_USER: 10_000,
  MAX_STORAGE_PER_USER: 104_857_600,  // 100MB
}
```

## Browser Compatibility

### Required Browser Features

```typescript
export const REQUIRED_FEATURES = {
  // Storage APIs
  localStorage: true,
  sessionStorage: true,
  indexedDB: true,
  
  // JavaScript APIs
  Promise: true,
  'Array.prototype.find': true,
  'Object.entries': true,
  'String.prototype.includes': true,
  
  // Web APIs
  crypto: true,
  'crypto.randomUUID': true,
  URL: true,
  URLSearchParams: true,
}

export const OPTIONAL_FEATURES = {
  // Performance APIs
  'performance.now': true,
  'performance.memory': true,
  
  // Storage APIs
  'navigator.storage.estimate': true,
  'navigator.storage.persist': true,
  
  // Compression
  CompressionStream: true,
  DecompressionStream: true,
}
```

### Browser Support Matrix

| Browser | Minimum Version | Full Support | Notes |
|---------|----------------|--------------|-------|
| Chrome | 88 | 90+ | Full feature set |
| Firefox | 85 | 90+ | Full feature set |
| Safari | 14 | 15+ | Limited IndexedDB |
| Edge | 88 | 90+ | Full feature set |
| Mobile Chrome | 88 | 90+ | Storage limits |
| Mobile Safari | 14 | 15+ | Storage restrictions |

## Security Considerations

### Data Validation

```typescript
export class QueryValidator {
  static validateEntry(entry: unknown): entry is QueryHistoryEntry {
    if (!entry || typeof entry !== 'object') return false
    
    const e = entry as any
    return (
      typeof e.id === 'string' &&
      typeof e.query === 'string' &&
      e.query.length > 0 &&
      e.query.length <= MEMORY_LIMITS.MAX_QUERY_LENGTH &&
      typeof e.timestamp === 'number' &&
      e.timestamp > 0 &&
      this.validateParameters(e.parameters) &&
      this.validateAlgorithm(e.algorithm) &&
      typeof e.success === 'boolean'
    )
  }
  
  static sanitizeQuery(query: string): string {
    return query
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .slice(0, MEMORY_LIMITS.MAX_QUERY_LENGTH)
  }
  
  static validateParameters(params: unknown): params is QueryParameters {
    // Implementation details...
    return true
  }
}
```

### Privacy Protection

```typescript
export class PrivacyManager {
  // Anonymize sensitive data
  static anonymizeEntry(entry: QueryHistoryEntry): QueryHistoryEntry {
    return {
      ...entry,
      query: this.anonymizeQuery(entry.query),
      parameters: this.anonymizeParameters(entry.parameters),
      sessionId: undefined,
      notes: undefined
    }
  }
  
  // Remove PII from queries
  static anonymizeQuery(query: string): string {
    // Remove email addresses
    query = query.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]')
    
    // Remove phone numbers
    query = query.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    
    // Remove potential names (simplified)
    query = query.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
    
    return query
  }
  
  // Hash sensitive parameters
  static anonymizeParameters(params: QueryParameters): QueryParameters {
    const safe = { ...params }
    
    if (safe.location) {
      // Keep only country/state level
      safe.location = safe.location.split(',')[0]
    }
    
    if (safe.rateRange) {
      // Round to nearest 10
      safe.rateRange.min = Math.round(safe.rateRange.min / 10) * 10
      safe.rateRange.max = Math.round(safe.rateRange.max / 10) * 10
    }
    
    return safe
  }
}
```

## Testing Requirements

### Unit Test Coverage

```typescript
// Storage Service Tests
describe('QueryHistoryStorage', () => {
  describe('save', () => {
    it('should save a new entry with generated ID')
    it('should prevent duplicate queries')
    it('should enforce max entries limit')
    it('should handle storage quota errors')
    it('should validate entry data')
  })
  
  describe('search', () => {
    it('should find entries by query text')
    it('should support fuzzy search')
    it('should search in parameters')
    it('should handle special characters')
    it('should respect result limits')
  })
  
  describe('cleanup', () => {
    it('should remove old entries')
    it('should keep favorites')
    it('should respect size limits')
    it('should update indexes')
  })
})

// Hook Tests
describe('useQueryHistory', () => {
  it('should load entries on mount')
  it('should save entries on search')
  it('should handle concurrent operations')
  it('should recover from errors')
  it('should sync across tabs')
})
```

### Integration Test Scenarios

```typescript
// E2E Test Scenarios
describe('Query History Feature', () => {
  it('should persist queries across page reloads')
  it('should share history between tabs')
  it('should handle storage migration')
  it('should export and import history')
  it('should work offline')
  it('should handle large datasets')
  it('should maintain performance with 1000+ entries')
})
```

### Performance Benchmarks

```typescript
// Performance Tests
describe('Performance', () => {
  it('should load 100 entries in <100ms')
  it('should search 1000 entries in <200ms')
  it('should save without blocking UI')
  it('should handle 10 concurrent saves')
  it('should maintain 60fps during animations')
})
```

## Migration Requirements

### Version Migration

```typescript
export class MigrationManager {
  static migrations: Record<string, Migration> = {
    '0.0.0-1.0.0': {
      up: async (data: any) => {
        // Convert string array to full entries
        const queries = Array.isArray(data) ? data : []
        return {
          version: '1.0.0',
          entries: queries.map(q => ({
            id: crypto.randomUUID(),
            query: q,
            timestamp: Date.now(),
            parameters: this.inferParameters(q),
            algorithm: 'vector',
            success: true
          }))
        }
      },
      down: async (data: StorageSchema) => {
        // Convert back to string array
        return data.entries.map(e => e.query)
      }
    }
  }
  
  static async migrate(
    data: any,
    fromVersion: string,
    toVersion: string
  ): Promise<any> {
    const key = `${fromVersion}-${toVersion}`
    const migration = this.migrations[key]
    
    if (!migration) {
      throw new Error(`No migration path from ${fromVersion} to ${toVersion}`)
    }
    
    return migration.up(data)
  }
}
```

## Error Handling

### Error Types

```typescript
export enum QueryHistoryErrorCode {
  // Storage Errors
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_NOT_AVAILABLE = 'STORAGE_NOT_AVAILABLE',
  STORAGE_PERMISSION_DENIED = 'STORAGE_PERMISSION_DENIED',
  
  // Data Errors
  INVALID_ENTRY_FORMAT = 'INVALID_ENTRY_FORMAT',
  ENTRY_TOO_LARGE = 'ENTRY_TOO_LARGE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Operation Errors
  SAVE_FAILED = 'SAVE_FAILED',
  LOAD_FAILED = 'LOAD_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  
  // Migration Errors
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  INCOMPATIBLE_VERSION = 'INCOMPATIBLE_VERSION',
  
  // Sync Errors (Future)
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  SYNC_NETWORK_ERROR = 'SYNC_NETWORK_ERROR',
  SYNC_AUTH_ERROR = 'SYNC_AUTH_ERROR'
}

export class QueryHistoryError extends Error {
  constructor(
    public code: QueryHistoryErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'QueryHistoryError'
  }
}
```

### Error Recovery

```typescript
export class ErrorRecovery {
  static async handleStorageError(
    error: Error,
    operation: 'save' | 'load' | 'delete'
  ): Promise<void> {
    if (error.name === 'QuotaExceededError') {
      // Try cleanup
      await this.performEmergencyCleanup()
      
      // Retry operation
      return this.retryOperation(operation)
    }
    
    if (error.name === 'SecurityError') {
      // Fall back to session storage
      this.switchToFallbackStorage()
    }
    
    // Log for debugging
    console.error(`Query history ${operation} failed:`, error)
  }
  
  private static async performEmergencyCleanup(): Promise<void> {
    const storage = new QueryHistoryStorage()
    await storage.cleanup({
      keepFavorites: true,
      maxEntries: 20
    })
  }
}
```

## Monitoring and Analytics

### Metrics Collection

```typescript
export interface QueryHistoryMetrics {
  // Usage Metrics
  totalQueries: number
  uniqueQueries: number
  queriesPerSession: number
  reuseRate: number
  
  // Performance Metrics
  averageLoadTime: number
  averageSaveTime: number
  averageSearchTime: number
  
  // Storage Metrics
  storageUsed: number
  entriesCount: number
  compressionRatio: number
  
  // Error Metrics
  errorRate: number
  errorsByType: Record<QueryHistoryErrorCode, number>
  
  // Feature Usage
  exportCount: number
  importCount: number
  favoriteCount: number
  searchUsageCount: number
}

export class MetricsCollector {
  static collect(): Promise<QueryHistoryMetrics> {
    // Implementation
  }
  
  static track(event: string, properties?: any): void {
    // Send to analytics service
  }
}
```

## Conclusion

These technical specifications provide a comprehensive blueprint for implementing the query history enhancement feature. The modular design allows for phased implementation while maintaining high performance and reliability standards. The specifications support both immediate browser-based storage and future migration to user-authenticated cloud storage.
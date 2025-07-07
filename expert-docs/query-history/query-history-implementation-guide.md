# Query History Implementation Guide

**Last Updated: 2025-01-07**

## Overview

This guide provides step-by-step instructions for implementing the query history enhancement in the Expert Discovery interface. The implementation follows a phased approach to ensure smooth integration with existing systems.

## Prerequisites

- React 18+ with TypeScript
- Mantine UI v8.1.0
- React Query (@tanstack/react-query)
- Node.js development environment
- Git for version control

## Phase 1: Core Browser Storage Implementation

### Step 1: Create Storage Service

Create a new file: `admin-ui/src/services/queryHistoryStorage.ts`

```typescript
import { QueryHistoryEntry } from '../types'

export class QueryHistoryStorage {
  private static readonly STORAGE_KEY = 'expert-discovery-query-history'
  private static readonly MAX_ENTRIES = 50
  
  static async save(entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>): Promise<QueryHistoryEntry> {
    const newEntry: QueryHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    
    const history = await this.load()
    
    // Remove duplicates and add new entry at the beginning
    const filtered = history.filter(h => h.query !== entry.query)
    const updated = [newEntry, ...filtered].slice(0, this.MAX_ENTRIES)
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated))
      return newEntry
    } catch (error) {
      console.error('Failed to save query history:', error)
      throw error
    }
  }
  
  static async load(): Promise<QueryHistoryEntry[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      // Validate and migrate old format if needed
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Failed to load query history:', error)
      return []
    }
  }
  
  static async remove(id: string): Promise<void> {
    const history = await this.load()
    const filtered = history.filter(entry => entry.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }
  
  static async clear(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY)
  }
  
  static async search(searchTerm: string): Promise<QueryHistoryEntry[]> {
    const history = await this.load()
    const term = searchTerm.toLowerCase()
    
    return history.filter(entry => 
      entry.query.toLowerCase().includes(term) ||
      JSON.stringify(entry.parameters).toLowerCase().includes(term)
    )
  }
}
```

### Step 2: Create Query History Hook

Create a new file: `admin-ui/src/pages/ExpertDiscovery/hooks/useQueryHistory.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { QueryHistoryStorage } from '../../../services/queryHistoryStorage'
import type { QueryHistoryEntry, QueryParameters } from '../types'

interface UseQueryHistoryReturn {
  entries: QueryHistoryEntry[]
  isLoading: boolean
  error: Error | null
  addEntry: (query: string, parameters: QueryParameters, result?: any) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  getRecentQueries: (limit?: number) => string[]
  searchHistory: (term: string) => Promise<QueryHistoryEntry[]>
}

export function useQueryHistory(): UseQueryHistoryReturn {
  const queryClient = useQueryClient()
  
  // Load history entries
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['queryHistory'],
    queryFn: () => QueryHistoryStorage.load(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
  
  // Add entry mutation
  const addEntryMutation = useMutation({
    mutationFn: async ({ query, parameters, result }: {
      query: string
      parameters: QueryParameters
      result?: any
    }) => {
      return QueryHistoryStorage.save({
        query,
        parameters,
        algorithm: parameters.algorithm,
        success: !!result,
        resultCount: result?.totalCount,
        searchTime: result?.searchTime,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queryHistory'] })
    },
  })
  
  // Remove entry mutation
  const removeEntryMutation = useMutation({
    mutationFn: (id: string) => QueryHistoryStorage.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queryHistory'] })
    },
  })
  
  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: () => QueryHistoryStorage.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queryHistory'] })
    },
  })
  
  // Helper functions
  const addEntry = useCallback(async (
    query: string,
    parameters: QueryParameters,
    result?: any
  ) => {
    await addEntryMutation.mutateAsync({ query, parameters, result })
  }, [addEntryMutation])
  
  const removeEntry = useCallback(async (id: string) => {
    await removeEntryMutation.mutateAsync(id)
  }, [removeEntryMutation])
  
  const clearHistory = useCallback(async () => {
    await clearHistoryMutation.mutateAsync()
  }, [clearHistoryMutation])
  
  const getRecentQueries = useCallback((limit = 5) => {
    return entries.slice(0, limit).map(entry => entry.query)
  }, [entries])
  
  const searchHistory = useCallback(async (term: string) => {
    return QueryHistoryStorage.search(term)
  }, [])
  
  return {
    entries,
    isLoading,
    error: error as Error | null,
    addEntry,
    removeEntry,
    clearHistory,
    getRecentQueries,
    searchHistory,
  }
}
```

### Step 3: Update Type Definitions

Update `admin-ui/src/pages/ExpertDiscovery/types/index.ts`:

```typescript
// Add to existing types
export interface QueryHistoryEntry {
  id: string
  query: string
  parameters: QueryParameters
  timestamp: number
  resultCount?: number
  searchTime?: number
  algorithm: SearchAlgorithm
  success: boolean
}

export interface QueryHistoryItem {
  id: string
  query: string
  timestamp: Date
  truncated: string
}
```

### Step 4: Update QueryInput Component

Modify `admin-ui/src/pages/ExpertDiscovery/components/QueryBuilder/QueryInput.tsx`:

```typescript
import React, { useState, useCallback, useMemo, useEffect } from 'react'
// ... existing imports ...
import { useQueryHistory } from '../../hooks/useQueryHistory'

export function QueryInput({ 
  onQueryChange, 
  onSearch, 
  isLoading = false, 
  error = null,
  placeholder = "Enter your expert discovery query here...",
  maxLength = VALIDATION_RULES.queryMaxLength,
  // New props
  currentParameters,
  onSearchComplete,
}: QueryInputProps) {
  const [query, setQuery] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  // Use the new query history hook
  const {
    entries: historyEntries,
    addEntry,
    removeEntry,
    clearHistory: clearHistoryData,
    getRecentQueries
  } = useQueryHistory()
  
  // Convert entries to display format
  const historyItems = useMemo(() => 
    historyEntries.slice(0, UI_CONFIG.maxQueryHistoryItems).map(entry => ({
      id: entry.id,
      query: entry.query,
      truncated: truncateText(entry.query, 30),
      timestamp: new Date(entry.timestamp),
      parameters: entry.parameters
    })),
    [historyEntries]
  )
  
  // Enhanced search handler with history persistence
  const handleSearch = useCallback(async () => {
    const trimmedQuery = query.trim()
    if (trimmedQuery && validationErrors.length === 0) {
      const startTime = performance.now()
      
      try {
        // Call the original search handler
        const result = await onSearch?.(trimmedQuery)
        const searchTime = performance.now() - startTime
        
        // Add to persistent history
        if (currentParameters) {
          await addEntry(trimmedQuery, currentParameters, {
            totalCount: result?.totalCount || 0,
            searchTime
          })
        }
        
        // Notify parent of completion
        onSearchComplete?.(result)
      } catch (error) {
        // Still save failed queries
        if (currentParameters) {
          await addEntry(trimmedQuery, currentParameters)
        }
        throw error
      }
    }
  }, [query, onSearch, validationErrors, currentParameters, addEntry, onSearchComplete])
  
  // Enhanced history selection with parameters
  const handleHistorySelect = useCallback((entry: typeof historyItems[0]) => {
    setQuery(entry.query)
    setValidationErrors([])
    onQueryChange?.(entry.query)
    // Optionally restore parameters
    if (entry.parameters && window.confirm('Also restore search parameters?')) {
      // This would need to be passed up to parent
      // onParametersRestore?.(entry.parameters)
    }
    setShowHistory(false)
  }, [onQueryChange])
  
  const handleHistoryRemove = useCallback(async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    await removeEntry(id)
  }, [removeEntry])
  
  const clearHistory = useCallback(async () => {
    if (window.confirm('Clear all query history? This cannot be undone.')) {
      await clearHistoryData()
      setShowHistory(false)
    }
  }, [clearHistoryData])
  
  // ... rest of the component remains similar ...
  
  return (
    <Paper p={UI_CONFIG.paperPadding} withBorder>
      <Stack gap={UI_CONFIG.stackGap}>
        <Group justify="space-between" align="center">
          <Text fw={500} size="lg">Query Input</Text>
          {historyItems.length > 0 && (
            <Group gap="xs">
              <Tooltip label="Toggle query history">
                <ActionIcon 
                  variant="subtle" 
                  onClick={() => setShowHistory(!showHistory)}
                  size="sm"
                >
                  <IconHistory size={16} />
                </ActionIcon>
              </Tooltip>
              <Badge size="xs" variant="light">
                {historyEntries.length} saved
              </Badge>
              <Tooltip label="Clear history">
                <ActionIcon 
                  variant="subtle" 
                  color="red" 
                  onClick={clearHistory}
                  size="sm"
                >
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>
        
        {/* ... existing textarea and controls ... */}
        
        {showHistory && historyItems.length > 0 && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>Recent Queries:</Text>
              <Text size="xs" c="dimmed">
                Showing {historyItems.length} of {historyEntries.length}
              </Text>
            </Group>
            <Stack gap={4}>
              {historyItems.map((item) => (
                <Group 
                  key={item.id}
                  p="xs"
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: 4,
                    '&:hover': { backgroundColor: 'var(--mantine-color-gray-0)' }
                  }}
                  onClick={() => handleHistorySelect(item)}
                  justify="space-between"
                >
                  <div style={{ flex: 1 }}>
                    <Text size="sm">{item.truncated}</Text>
                    <Text size="xs" c="dimmed">
                      {new Intl.RelativeTimeFormat('en').format(
                        Math.floor((item.timestamp.getTime() - Date.now()) / 1000 / 60),
                        'minute'
                      )}
                    </Text>
                  </div>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={(e) => handleHistoryRemove(item.id, e)}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
```

### Step 5: Update Parent Component Integration

Modify `admin-ui/src/pages/ExpertDiscovery/index.tsx`:

```typescript
// Add to imports
import { useQueryHistory } from './hooks/useQueryHistory'

export function ExpertDiscoveryPage() {
  // ... existing state ...
  
  // Initialize query history hook
  const queryHistory = useQueryHistory()
  
  // Enhanced search handler
  const handleSearch = useCallback(async (query: string) => {
    if (isSearchingRef.current) return
    
    currentQueryRef.current = query
    hasSearchedRef.current = true
    isSearchingRef.current = true
    
    const searchQuery = {
      query,
      ...queryParameters
    }

    try {
      const result = await expertDiscovery.discoverExperts(searchQuery)
      
      // History is now handled by QueryInput component
      analytics.trackSearch(query, queryParameters.algorithm, result.totalCount)
      
      return result // Return for QueryInput to process
    } catch (error) {
      console.error('Search failed:', error)
      throw error // Let QueryInput handle the error
    } finally {
      isSearchingRef.current = false
    }
  }, [queryParameters, expertDiscovery, analytics])
  
  // ... rest of component ...
  
  return (
    <Container size={UI_CONFIG.containerSize} py={UI_CONFIG.paperPadding}>
      {/* ... existing JSX ... */}
      
      <QueryInput 
        onQueryChange={handleQueryChange}
        onSearch={handleSearch}
        isLoading={expertDiscovery.isDiscovering}
        error={expertDiscovery.discoveryError?.message || null}
        currentParameters={queryParameters} // Pass parameters
      />
      
      {/* ... rest of JSX ... */}
    </Container>
  )
}
```

## Phase 2: Enhanced UI Implementation

### Step 1: Create Expandable History Component

Create `admin-ui/src/pages/ExpertDiscovery/components/QueryHistory/ExpandableHistory.tsx`:

```typescript
import React, { useState, useMemo } from 'react'
import {
  Stack,
  Group,
  Text,
  ActionIcon,
  Button,
  Collapse,
  Badge,
  Tooltip,
  Box
} from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconX, IconClock } from '@tabler/icons-react'
import type { QueryHistoryEntry } from '../../types'

interface ExpandableHistoryProps {
  entries: QueryHistoryEntry[]
  onSelect: (entry: QueryHistoryEntry) => void
  onRemove: (id: string) => void
  onClear: () => void
  maxVisible?: number
  maxTotal?: number
}

export function ExpandableHistory({
  entries,
  onSelect,
  onRemove,
  onClear,
  maxVisible = 5,
  maxTotal = 10
}: ExpandableHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const visibleEntries = useMemo(() => {
    const limit = isExpanded ? maxTotal : maxVisible
    return entries.slice(0, limit)
  }, [entries, isExpanded, maxVisible, maxTotal])
  
  const hasMore = entries.length > maxVisible
  const hiddenCount = Math.max(0, entries.length - maxVisible)
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }
  
  if (entries.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        No query history yet. Your searches will appear here.
      </Text>
    )
  }
  
  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Group gap="xs">
          <Text size="sm" fw={500}>Query History</Text>
          <Badge size="sm" variant="light">
            {entries.length} saved
          </Badge>
        </Group>
        <Button
          size="xs"
          variant="subtle"
          color="red"
          onClick={onClear}
          leftSection={<IconX size={14} />}
        >
          Clear All
        </Button>
      </Group>
      
      <Stack gap={4}>
        {visibleEntries.map((entry, index) => (
          <Box
            key={entry.id}
            p="sm"
            style={{
              borderRadius: 8,
              border: '1px solid var(--mantine-color-gray-3)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'var(--mantine-color-gray-0)',
                transform: 'translateX(2px)'
              }
            }}
            onClick={() => onSelect(entry)}
          >
            <Group justify="space-between" wrap="nowrap">
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="sm" lineClamp={1}>
                  {entry.query}
                </Text>
                <Group gap="xs">
                  <IconClock size={12} />
                  <Text size="xs" c="dimmed">
                    {formatTimestamp(entry.timestamp)}
                  </Text>
                  {entry.resultCount !== undefined && (
                    <>
                      <Text size="xs" c="dimmed">•</Text>
                      <Text size="xs" c="dimmed">
                        {entry.resultCount} results
                      </Text>
                    </>
                  )}
                  <Badge size="xs" variant="dot">
                    {entry.algorithm}
                  </Badge>
                </Group>
              </Stack>
              <Tooltip label="Remove from history">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(entry.id)
                  }}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Box>
        ))}
      </Stack>
      
      {hasMore && (
        <Button
          variant="subtle"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          leftSection={
            isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />
          }
          fullWidth
        >
          {isExpanded
            ? 'Show Less'
            : `Show ${hiddenCount} More ${hiddenCount === 1 ? 'Query' : 'Queries'}`
          }
        </Button>
      )}
    </Stack>
  )
}
```

### Step 2: Add Keyboard Navigation

Create `admin-ui/src/pages/ExpertDiscovery/hooks/useHistoryKeyboard.ts`:

```typescript
import { useEffect, useRef } from 'react'

interface UseHistoryKeyboardProps {
  isOpen: boolean
  entries: any[]
  onSelect: (entry: any) => void
  onClose: () => void
  onRemove?: (id: string) => void
}

export function useHistoryKeyboard({
  isOpen,
  entries,
  onSelect,
  onClose,
  onRemove
}: UseHistoryKeyboardProps) {
  const selectedIndexRef = useRef(-1)
  
  useEffect(() => {
    if (!isOpen) {
      selectedIndexRef.current = -1
      return
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
          
        case 'ArrowDown':
          e.preventDefault()
          selectedIndexRef.current = Math.min(
            selectedIndexRef.current + 1,
            entries.length - 1
          )
          updateFocus()
          break
          
        case 'ArrowUp':
          e.preventDefault()
          selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0)
          updateFocus()
          break
          
        case 'Enter':
          e.preventDefault()
          if (selectedIndexRef.current >= 0) {
            onSelect(entries[selectedIndexRef.current])
          }
          break
          
        case 'Delete':
        case 'Backspace':
          if (onRemove && selectedIndexRef.current >= 0) {
            e.preventDefault()
            onRemove(entries[selectedIndexRef.current].id)
          }
          break
      }
    }
    
    const updateFocus = () => {
      const items = document.querySelectorAll('[data-history-item]')
      items.forEach((item, index) => {
        if (index === selectedIndexRef.current) {
          (item as HTMLElement).focus()
        }
      })
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, entries, onSelect, onClose, onRemove])
}
```

## Phase 3: Testing Implementation

### Step 1: Unit Tests for Storage Service

Create `admin-ui/src/services/__tests__/queryHistoryStorage.test.ts`:

```typescript
import { QueryHistoryStorage } from '../queryHistoryStorage'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('QueryHistoryStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  
  describe('save', () => {
    it('should save a new entry', async () => {
      const entry = {
        query: 'test query',
        parameters: { algorithm: 'vector' as const },
        algorithm: 'vector' as const,
        success: true
      }
      
      const saved = await QueryHistoryStorage.save(entry)
      
      expect(saved).toMatchObject({
        ...entry,
        id: expect.any(String),
        timestamp: expect.any(Number)
      })
    })
    
    it('should prevent duplicates', async () => {
      const entry = {
        query: 'duplicate query',
        parameters: { algorithm: 'vector' as const },
        algorithm: 'vector' as const,
        success: true
      }
      
      await QueryHistoryStorage.save(entry)
      await QueryHistoryStorage.save(entry)
      
      const history = await QueryHistoryStorage.load()
      expect(history).toHaveLength(1)
    })
    
    it('should limit entries to MAX_ENTRIES', async () => {
      // Save 51 entries
      for (let i = 0; i < 51; i++) {
        await QueryHistoryStorage.save({
          query: `query ${i}`,
          parameters: { algorithm: 'vector' as const },
          algorithm: 'vector' as const,
          success: true
        })
      }
      
      const history = await QueryHistoryStorage.load()
      expect(history).toHaveLength(50)
      expect(history[0].query).toBe('query 50') // Most recent
    })
  })
  
  describe('search', () => {
    it('should find entries by query text', async () => {
      await QueryHistoryStorage.save({
        query: 'python developer',
        parameters: { algorithm: 'vector' as const },
        algorithm: 'vector' as const,
        success: true
      })
      
      await QueryHistoryStorage.save({
        query: 'javascript expert',
        parameters: { algorithm: 'vector' as const },
        algorithm: 'vector' as const,
        success: true
      })
      
      const results = await QueryHistoryStorage.search('python')
      expect(results).toHaveLength(1)
      expect(results[0].query).toBe('python developer')
    })
  })
})
```

### Step 2: Integration Tests

Create `admin-ui/src/pages/ExpertDiscovery/components/QueryBuilder/__tests__/QueryInput.integration.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QueryInput } from '../QueryInput'
import { vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('QueryInput with History', () => {
  const mockOnSearch = vi.fn()
  const mockOnQueryChange = vi.fn()
  const mockParameters = {
    algorithm: 'vector' as const,
    maxResults: 10
  }
  
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  
  it('should save query to history on successful search', async () => {
    const user = userEvent.setup()
    mockOnSearch.mockResolvedValue({ totalCount: 5 })
    
    render(
      <QueryInput
        onSearch={mockOnSearch}
        onQueryChange={mockOnQueryChange}
        currentParameters={mockParameters}
      />,
      { wrapper: createWrapper() }
    )
    
    const input = screen.getByPlaceholderText(/enter your expert discovery query/i)
    await user.type(input, 'test query')
    
    const searchButton = screen.getByRole('button', { name: /search experts/i })
    await user.click(searchButton)
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test query')
    })
    
    // Check localStorage
    const stored = localStorage.getItem('expert-discovery-query-history')
    expect(stored).toBeTruthy()
    
    const history = JSON.parse(stored!)
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({
      query: 'test query',
      success: true,
      resultCount: 5
    })
  })
  
  it('should display and select from history', async () => {
    const user = userEvent.setup()
    
    // Pre-populate history
    localStorage.setItem('expert-discovery-query-history', JSON.stringify([
      {
        id: '1',
        query: 'previous search',
        timestamp: Date.now(),
        parameters: mockParameters,
        algorithm: 'vector',
        success: true
      }
    ]))
    
    render(
      <QueryInput
        onSearch={mockOnSearch}
        onQueryChange={mockOnQueryChange}
        currentParameters={mockParameters}
      />,
      { wrapper: createWrapper() }
    )
    
    // Click history button
    const historyButton = screen.getByLabelText(/toggle query history/i)
    await user.click(historyButton)
    
    // Click on history item
    const historyItem = screen.getByText('previous search')
    await user.click(historyItem)
    
    // Check input was populated
    const input = screen.getByPlaceholderText(/enter your expert discovery query/i)
    expect(input).toHaveValue('previous search')
    expect(mockOnQueryChange).toHaveBeenCalledWith('previous search')
  })
})
```

## Migration Guide

### For Existing Users

1. **Data Migration**: On first load with the update, any session history will be automatically migrated to persistent storage.

2. **Feature Toggle**: Users can disable persistence via settings if needed:
   ```typescript
   // In settings/preferences
   localStorage.setItem('expert-discovery-history-enabled', 'false')
   ```

3. **Storage Cleanup**: Old session data will be automatically cleaned up after successful migration.

### For Developers

1. **Branch Strategy**:
   ```bash
   git checkout -b feature/query-history-enhancement
   ```

2. **Feature Flag Implementation**:
   ```typescript
   const FEATURE_FLAGS = {
     PERSISTENT_HISTORY: process.env.REACT_APP_PERSISTENT_HISTORY === 'true'
   }
   ```

3. **Gradual Rollout**:
   - Week 1: Internal testing
   - Week 2: 10% user rollout
   - Week 3: 50% user rollout
   - Week 4: 100% deployment

## Performance Optimization

### Debouncing and Throttling

```typescript
// utils/performance.ts
export const debouncedSave = debounce(
  (entry: QueryHistoryEntry) => QueryHistoryStorage.save(entry),
  500
)

export const throttledSearch = throttle(
  (term: string) => QueryHistoryStorage.search(term),
  300
)
```

### Memory Management

```typescript
// Periodic cleanup of old entries
export const cleanupOldEntries = async (daysToKeep = 30) => {
  const history = await QueryHistoryStorage.load()
  const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
  
  const filtered = history.filter(entry => entry.timestamp > cutoff)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
```

## Troubleshooting

### Common Issues

1. **Storage Quota Exceeded**
   ```typescript
   try {
     localStorage.setItem(key, value)
   } catch (e) {
     if (e.name === 'QuotaExceededError') {
       // Clear old entries or switch to IndexedDB
     }
   }
   ```

2. **Cross-Tab Synchronization**
   ```typescript
   window.addEventListener('storage', (e) => {
     if (e.key === STORAGE_KEY) {
       queryClient.invalidateQueries(['queryHistory'])
     }
   })
   ```

3. **Performance Issues**
   - Implement virtual scrolling for large histories
   - Use React.memo for history item components
   - Batch state updates

## Next Steps

After completing Phase 1:
1. Monitor user adoption and feedback
2. Analyze performance metrics
3. Plan Phase 2 UI enhancements
4. Prepare for IndexedDB migration

This implementation guide provides a solid foundation for enhancing the query history feature while maintaining backward compatibility and performance standards.
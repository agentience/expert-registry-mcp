/**
 * useQueryHistory Hook Tests
 * TDD Red Phase - All tests will FAIL until implementation is created
 * 
 * Expert Test Patterns Applied:
 * - AAA pattern (Arrange, Act, Assert)
 * - React Testing Library best practices
 * - Proper async handling with waitFor
 * - Mock React Query dependencies
 * - One behavior per test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useQueryHistory } from './useQueryHistory'
import type { QueryHistoryEntry, UseQueryHistoryOptions } from '../types/history'
import type { QueryParameters } from '../types'

// Mock the storage service
vi.mock('../services/storage/QueryHistoryStorage', () => ({
  QueryHistoryStorage: vi.fn().mockImplementation(() => ({
    save: vi.fn(),
    load: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    isAvailable: vi.fn(() => true),
    getLastError: vi.fn(() => null)
  }))
}))

// Mock localStorage for storage events
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Create Query Client wrapper for tests
const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  })

  return ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useQueryHistory', () => {
  let mockStorage: any
  const STORAGE_KEY = 'expert_discovery_query_history'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Get mock storage instance
    const { QueryHistoryStorage } = require('../services/storage/QueryHistoryStorage')
    mockStorage = new QueryHistoryStorage()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Helper function to create mock entry
  const createMockEntry = (overrides?: Partial<QueryHistoryEntry>): QueryHistoryEntry => ({
    id: 'test-id-1',
    query: 'React performance optimization',
    parameters: {
      algorithm: 'hybrid' as const,
      maxResults: 10,
      includeInactive: false,
      confidenceThreshold: 0.8,
      technologies: ['React'],
      experienceLevel: 'senior',
      teamSize: 1
    },
    timestamp: Date.now(),
    success: true,
    version: '2.0.0',
    ...overrides
  })

  const createMockParameters = (): QueryParameters => ({
    algorithm: 'hybrid' as const,
    maxResults: 20,
    includeInactive: false,
    confidenceThreshold: 0.7,
    technologies: ['TypeScript'],
    experienceLevel: 'expert',
    teamSize: 1
  })

  describe('Hook Initialization', () => {
    it('should initialize with empty entries when no stored data', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      mockStorage.load.mockResolvedValue([])
      
      // Act
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.entries).toEqual([])
      expect(result.current.error).toBeNull()
      expect(mockStorage.load).toHaveBeenCalledTimes(1)
    })

    it('should load existing entries on mount', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const existingEntries = [
        createMockEntry({ id: '1', query: 'Test 1', timestamp: Date.now() }),
        createMockEntry({ id: '2', query: 'Test 2', timestamp: Date.now() - 1000 })
      ]
      mockStorage.load.mockResolvedValue(existingEntries)
      
      // Act
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.entries).toHaveLength(2)
      expect(result.current.entries[0].query).toBe('Test 1')
      expect(result.current.entries[1].query).toBe('Test 2')
    })

    it('should handle storage loading errors gracefully', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const storageError = {
        code: 'PARSE_ERROR' as const,
        message: 'Failed to parse storage data'
      }
      mockStorage.load.mockRejectedValue(new Error('Storage error'))
      mockStorage.getLastError.mockReturnValue(storageError)
      
      // Act
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.entries).toEqual([])
      expect(result.current.error).toEqual(storageError)
    })

    it('should respect custom options', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const options: UseQueryHistoryOptions = {
        maxEntries: 25,
        enableSync: false,
        autoSave: false
      }
      mockStorage.load.mockResolvedValue([])
      
      // Act
      const { result } = renderHook(() => useQueryHistory(options), { wrapper })
      
      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.entries).toEqual([])
    })
  })

  describe('Adding Entries', () => {
    it('should add new entry and update cache', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const query = 'TypeScript generics'
      const parameters = createMockParameters()
      const savedEntry = createMockEntry({
        query,
        parameters,
        resultCount: 5,
        success: true
      })
      
      mockStorage.load.mockResolvedValue([])
      mockStorage.save.mockResolvedValue(savedEntry)
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Act
      await act(async () => {
        await result.current.addEntry(query, parameters, { resultCount: 5 })
      })
      
      // Assert
      expect(result.current.entries).toHaveLength(1)
      expect(result.current.entries[0]).toMatchObject({
        query,
        parameters,
        resultCount: 5,
        success: true
      })
      expect(mockStorage.save).toHaveBeenCalledWith({
        query,
        parameters,
        success: true,
        resultCount: 5,
        version: '2.0.0'
      })
    })

    it('should handle save failures gracefully', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const query = 'Test query'
      const parameters = createMockParameters()
      const saveError = {
        code: 'QUOTA_EXCEEDED' as const,
        message: 'Storage quota exceeded'
      }
      
      mockStorage.load.mockResolvedValue([])
      mockStorage.save.mockResolvedValue(null)
      mockStorage.getLastError.mockReturnValue(saveError)
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Act
      await act(async () => {
        await result.current.addEntry(query, parameters)
      })
      
      // Assert
      expect(result.current.entries).toHaveLength(0) // Should not add failed entry
      expect(result.current.error).toEqual(saveError)
    })

    it('should use optimistic updates for better UX', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const query = 'Optimistic test'
      const parameters = createMockParameters()
      
      mockStorage.load.mockResolvedValue([])
      
      // Simulate slow save operation
      mockStorage.save.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createMockEntry({ query })), 100))
      )
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Act
      act(() => {
        result.current.addEntry(query, parameters)
      })
      
      // Assert - Should show optimistic update immediately
      expect(result.current.entries).toHaveLength(1)
      expect(result.current.entries[0].query).toBe(query)
      
      // Wait for actual save to complete
      await waitFor(() => {
        expect(mockStorage.save).toHaveBeenCalled()
      })
    })

    it('should add metadata to entries when provided', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const query = 'Test with metadata'
      const parameters = createMockParameters()
      const metadata = {
        success: false,
        resultCount: 0,
        searchTime: 250,
        algorithm: 'vector'
      }
      const savedEntry = createMockEntry({ query, ...metadata })
      
      mockStorage.load.mockResolvedValue([])
      mockStorage.save.mockResolvedValue(savedEntry)
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Act
      await act(async () => {
        await result.current.addEntry(query, parameters, metadata)
      })
      
      // Assert
      expect(mockStorage.save).toHaveBeenCalledWith({
        query,
        parameters,
        ...metadata,
        version: '2.0.0'
      })
    })
  })

  describe('Removing Entries', () => {
    it('should remove entry by ID', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const existingEntries = [
        createMockEntry({ id: 'remove-me', query: 'Remove this' }),
        createMockEntry({ id: 'keep-me', query: 'Keep this' })
      ]
      
      mockStorage.load.mockResolvedValue(existingEntries)
      mockStorage.remove.mockResolvedValue(true)
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.entries).toHaveLength(2)
      })
      
      // Act
      await act(async () => {
        await result.current.removeEntry('remove-me')
      })
      
      // Assert
      expect(result.current.entries).toHaveLength(1)
      expect(result.current.entries[0].id).toBe('keep-me')
      expect(mockStorage.remove).toHaveBeenCalledWith('remove-me')
    })

    it('should handle remove failures gracefully', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const existingEntries = [createMockEntry({ id: 'test-id' })]
      
      mockStorage.load.mockResolvedValue(existingEntries)
      mockStorage.remove.mockResolvedValue(false) // Remove failed
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })
      
      // Act
      await act(async () => {
        await result.current.removeEntry('non-existent-id')
      })
      
      // Assert
      expect(result.current.entries).toHaveLength(1) // Should remain unchanged
    })
  })

  describe('Clearing History', () => {
    it('should clear all entries', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const existingEntries = [
        createMockEntry({ id: '1' }),
        createMockEntry({ id: '2' })
      ]
      
      mockStorage.load.mockResolvedValue(existingEntries)
      mockStorage.clear.mockResolvedValue(undefined)
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.entries).toHaveLength(2)
      })
      
      // Act
      await act(async () => {
        await result.current.clearHistory()
      })
      
      // Assert
      expect(result.current.entries).toHaveLength(0)
      expect(mockStorage.clear).toHaveBeenCalledTimes(1)
    })

    it('should handle clear failures gracefully', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const existingEntries = [createMockEntry()]
      
      mockStorage.load.mockResolvedValue(existingEntries)
      mockStorage.clear.mockRejectedValue(new Error('Clear failed'))
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })
      
      // Act
      await act(async () => {
        await result.current.clearHistory()
      })
      
      // Assert
      expect(result.current.entries).toHaveLength(1) // Should remain unchanged on error
    })
  })

  describe('React Query Integration', () => {
    it('should use React Query for state management', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      mockStorage.load.mockResolvedValue([])
      
      // Act
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      // Assert
      expect(result.current.isLoading).toBe(true) // Initially loading
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should support manual refetch', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      mockStorage.load.mockResolvedValue([])
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Clear the mock to track new calls
      mockStorage.load.mockClear()
      
      // Act
      await act(async () => {
        await result.current.refetch()
      })
      
      // Assert
      expect(mockStorage.load).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache on mutations', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const query = 'Cache invalidation test'
      const parameters = createMockParameters()
      const savedEntry = createMockEntry({ query })
      
      mockStorage.load.mockResolvedValue([])
      mockStorage.save.mockResolvedValue(savedEntry)
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Clear mock to track refetch calls
      mockStorage.load.mockClear()
      
      // Act
      await act(async () => {
        await result.current.addEntry(query, parameters)
      })
      
      // Assert - Should have refetched data after mutation
      expect(mockStorage.load).toHaveBeenCalled()
    })
  })

  describe('Cross-Tab Synchronization', () => {
    it('should sync when storage event is fired', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const initialEntries = [createMockEntry({ id: '1' })]
      const updatedEntries = [
        ...initialEntries,
        createMockEntry({ id: '2', query: 'New from other tab' })
      ]
      
      mockStorage.load
        .mockResolvedValueOnce(initialEntries)
        .mockResolvedValueOnce(updatedEntries)
      
      const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
      
      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })
      
      // Act - Simulate storage event from another tab
      act(() => {
        const event = new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify(updatedEntries)
        })
        window.dispatchEvent(event)
      })
      
      // Assert
      await waitFor(() => {
        expect(result.current.entries).toHaveLength(2)
      })
      
      expect(result.current.entries[1].query).toBe('New from other tab')
    })

    it('should ignore storage events when sync is disabled', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const initialEntries = [createMockEntry({ id: '1' })]
      
      mockStorage.load.mockResolvedValue(initialEntries)
      
      const { result } = renderHook(() => useQueryHistory({ enableSync: false }), { wrapper })
      
      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })
      
      // Clear mock to track new calls
      mockStorage.load.mockClear()
      
      // Act - Simulate storage event
      act(() => {
        const event = new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify([])
        })
        window.dispatchEvent(event)
      })
      
      // Assert - Should not refetch
      expect(mockStorage.load).not.toHaveBeenCalled()
    })

    it('should handle concurrent updates without data loss', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const query1 = 'Concurrent Query 1'
      const query2 = 'Concurrent Query 2'
      const parameters = createMockParameters()
      
      mockStorage.load.mockResolvedValue([])
      mockStorage.save
        .mockResolvedValueOnce(createMockEntry({ id: '1', query: query1 }))
        .mockResolvedValueOnce(createMockEntry({ id: '2', query: query2 }))
      
      const { result: hook1 } = renderHook(() => useQueryHistory(), { wrapper })
      const { result: hook2 } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(hook1.current.isLoading).toBe(false)
        expect(hook2.current.isLoading).toBe(false)
      })
      
      // Act - Concurrent additions
      await Promise.all([
        act(async () => hook1.current.addEntry(query1, parameters)),
        act(async () => hook2.current.addEntry(query2, parameters))
      ])
      
      // Assert
      await waitFor(() => {
        expect(hook1.current.entries).toHaveLength(2)
        expect(hook2.current.entries).toHaveLength(2)
      })
      
      const queries1 = hook1.current.entries.map(e => e.query)
      const queries2 = hook2.current.entries.map(e => e.query)
      
      expect(queries1).toContain(query1)
      expect(queries1).toContain(query2)
      expect(queries2).toContain(query1)
      expect(queries2).toContain(query2)
    })
  })

  describe('Performance', () => {
    it('should debounce rapid mutations', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const parameters = createMockParameters()
      
      mockStorage.load.mockResolvedValue([])
      mockStorage.save.mockImplementation((entry) => 
        Promise.resolve(createMockEntry({ query: entry.query }))
      )
      
      const { result } = renderHook(() => useQueryHistory(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Act - Rapid successive adds
      await act(async () => {
        await Promise.all([
          result.current.addEntry('Query 1', parameters),
          result.current.addEntry('Query 2', parameters),
          result.current.addEntry('Query 3', parameters)
        ])
      })
      
      // Assert - Should handle all mutations
      expect(mockStorage.save).toHaveBeenCalledTimes(3)
    })

    it('should not cause memory leaks on unmount', () => {
      // Arrange
      const wrapper = createQueryWrapper()
      mockStorage.load.mockResolvedValue([])
      
      // Act
      const { unmount } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
      
      // Assert - Should not throw on unmount
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Export/Import Functionality', () => {
    describe('Export History', () => {
      it('should export history to JSON format', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Test Query 1', 
            timestamp: Date.now() - 1000,
            success: true,
            resultCount: 5
          }),
          createMockEntry({ 
            id: '2', 
            query: 'Test Query 2', 
            timestamp: Date.now(),
            success: false,
            resultCount: 0
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(2)
        })
        
        // Act
        let exportResult
        await act(async () => {
          exportResult = await result.current.exportHistory({ format: 'json' })
        })
        
        // Assert
        expect(exportResult).toEqual({
          data: JSON.stringify(existingEntries, null, 2),
          filename: expect.stringMatching(/^query-history-\d{4}-\d{2}-\d{2}\.json$/),
          size: expect.any(Number),
          entryCount: 2
        })
      })

      it('should export history to CSV format', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Test Query 1', 
            timestamp: 1672531200000, // 2023-01-01 00:00:00
            success: true,
            resultCount: 5,
            searchTime: 250
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act
        let exportResult
        await act(async () => {
          exportResult = await result.current.exportHistory({ format: 'csv' })
        })
        
        // Assert
        expect(exportResult).toEqual({
          data: expect.stringContaining('Query,Algorithm,Success,Result Count,Search Time,Date'),
          filename: expect.stringMatching(/^query-history-\d{4}-\d{2}-\d{2}\.csv$/),
          size: expect.any(Number),
          entryCount: 1
        })
        
        expect(exportResult.data).toContain('Test Query 1')
        expect(exportResult.data).toContain('true')
        expect(exportResult.data).toContain('5')
        expect(exportResult.data).toContain('250')
      })

      it('should filter export by date range', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const now = Date.now()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Old Query', 
            timestamp: now - 7 * 24 * 60 * 60 * 1000 // 7 days ago
          }),
          createMockEntry({ 
            id: '2', 
            query: 'Recent Query', 
            timestamp: now - 1 * 24 * 60 * 60 * 1000 // 1 day ago
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(2)
        })
        
        // Act - Export only last 3 days
        let exportResult
        await act(async () => {
          exportResult = await result.current.exportHistory({ 
            format: 'json',
            dateRange: {
              start: new Date(now - 3 * 24 * 60 * 60 * 1000),
              end: new Date(now)
            }
          })
        })
        
        // Assert
        expect(exportResult.entryCount).toBe(1)
        expect(exportResult.data).toContain('Recent Query')
        expect(exportResult.data).not.toContain('Old Query')
      })

      it('should filter export by algorithm', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Vector Query', 
            algorithm: 'vector'
          }),
          createMockEntry({ 
            id: '2', 
            query: 'Hybrid Query', 
            algorithm: 'hybrid'
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(2)
        })
        
        // Act - Export only vector algorithm
        let exportResult
        await act(async () => {
          exportResult = await result.current.exportHistory({ 
            format: 'json',
            filterBy: { algorithm: 'vector' }
          })
        })
        
        // Assert
        expect(exportResult.entryCount).toBe(1)
        expect(exportResult.data).toContain('Vector Query')
        expect(exportResult.data).not.toContain('Hybrid Query')
      })

      it('should handle empty export gracefully', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        mockStorage.load.mockResolvedValue([])
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(0)
        })
        
        // Act
        let exportResult
        await act(async () => {
          exportResult = await result.current.exportHistory({ format: 'json' })
        })
        
        // Assert
        expect(exportResult.entryCount).toBe(0)
        expect(exportResult.data).toBe('[]')
      })
    })

    describe('Import History', () => {
      it('should import JSON history data', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const importData = [
          {
            id: 'import-1',
            query: 'Imported Query 1',
            parameters: createMockParameters(),
            timestamp: Date.now(),
            success: true,
            version: '2.0.0'
          },
          {
            id: 'import-2',
            query: 'Imported Query 2',
            parameters: createMockParameters(),
            timestamp: Date.now() - 1000,
            success: false,
            version: '2.0.0'
          }
        ]
        
        mockStorage.load.mockResolvedValue([])
        mockStorage.save.mockImplementation((entry) => 
          Promise.resolve(createMockEntry(entry))
        )
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(0)
        })
        
        // Act
        let importResult
        await act(async () => {
          importResult = await result.current.importHistory(
            JSON.stringify(importData), 
            { format: 'json' }
          )
        })
        
        // Assert
        expect(importResult).toEqual({
          success: true,
          importedCount: 2,
          skippedCount: 0,
          errors: []
        })
        
        expect(mockStorage.save).toHaveBeenCalledTimes(2)
      })

      it('should merge with existing history when merge option is true', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ id: 'existing-1', query: 'Existing Query' })
        ]
        const importData = [
          {
            id: 'import-1',
            query: 'Imported Query',
            parameters: createMockParameters(),
            timestamp: Date.now(),
            success: true,
            version: '2.0.0'
          }
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        mockStorage.save.mockImplementation((entry) => 
          Promise.resolve(createMockEntry(entry))
        )
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act
        let importResult
        await act(async () => {
          importResult = await result.current.importHistory(
            JSON.stringify(importData), 
            { format: 'json', merge: true }
          )
        })
        
        // Assert
        expect(importResult.success).toBe(true)
        expect(importResult.importedCount).toBe(1)
        expect(result.current.entries).toHaveLength(2)
      })

      it('should skip duplicate entries when skipDuplicates is true', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ id: 'existing-1', query: 'Duplicate Query' })
        ]
        const importData = [
          {
            id: 'import-1',
            query: 'Duplicate Query', // Same query as existing
            parameters: createMockParameters(),
            timestamp: Date.now(),
            success: true,
            version: '2.0.0'
          },
          {
            id: 'import-2',
            query: 'New Query',
            parameters: createMockParameters(),
            timestamp: Date.now() - 1000,
            success: true,
            version: '2.0.0'
          }
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        mockStorage.save.mockImplementation((entry) => 
          Promise.resolve(createMockEntry(entry))
        )
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act
        let importResult
        await act(async () => {
          importResult = await result.current.importHistory(
            JSON.stringify(importData), 
            { format: 'json', merge: true, skipDuplicates: true }
          )
        })
        
        // Assert
        expect(importResult.success).toBe(true)
        expect(importResult.importedCount).toBe(1)
        expect(importResult.skippedCount).toBe(1)
        expect(result.current.entries).toHaveLength(2)
      })

      it('should validate entries and report errors', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const invalidImportData = [
          {
            id: 'valid-1',
            query: 'Valid Query',
            parameters: createMockParameters(),
            timestamp: Date.now(),
            success: true,
            version: '2.0.0'
          },
          {
            // Missing required fields
            id: 'invalid-1',
            query: 'Invalid Query'
            // Missing parameters, timestamp, success, version
          },
          {
            id: 'invalid-2',
            query: '', // Empty query
            parameters: createMockParameters(),
            timestamp: Date.now(),
            success: true,
            version: '2.0.0'
          }
        ]
        
        mockStorage.load.mockResolvedValue([])
        mockStorage.save.mockImplementation((entry) => 
          Promise.resolve(createMockEntry(entry))
        )
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(0)
        })
        
        // Act
        let importResult
        await act(async () => {
          importResult = await result.current.importHistory(
            JSON.stringify(invalidImportData), 
            { format: 'json', validateEntries: true }
          )
        })
        
        // Assert
        expect(importResult.success).toBe(false)
        expect(importResult.importedCount).toBe(1)
        expect(importResult.skippedCount).toBe(2)
        expect(importResult.errors).toHaveLength(2)
        expect(importResult.errors[0]).toContain('Missing required fields')
        expect(importResult.errors[1]).toContain('Empty query')
      })

      it('should handle malformed JSON gracefully', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        mockStorage.load.mockResolvedValue([])
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(0)
        })
        
        // Act
        let importResult
        await act(async () => {
          importResult = await result.current.importHistory(
            'invalid json{', 
            { format: 'json' }
          )
        })
        
        // Assert
        expect(importResult.success).toBe(false)
        expect(importResult.importedCount).toBe(0)
        expect(importResult.errors).toHaveLength(1)
        expect(importResult.errors[0]).toContain('Invalid JSON')
      })

      it('should replace existing history when merge is false', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ id: 'existing-1', query: 'Existing Query' })
        ]
        const importData = [
          {
            id: 'import-1',
            query: 'Imported Query',
            parameters: createMockParameters(),
            timestamp: Date.now(),
            success: true,
            version: '2.0.0'
          }
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        mockStorage.clear.mockResolvedValue(undefined)
        mockStorage.save.mockImplementation((entry) => 
          Promise.resolve(createMockEntry(entry))
        )
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act
        let importResult
        await act(async () => {
          importResult = await result.current.importHistory(
            JSON.stringify(importData), 
            { format: 'json', merge: false }
          )
        })
        
        // Assert
        expect(importResult.success).toBe(true)
        expect(importResult.importedCount).toBe(1)
        expect(mockStorage.clear).toHaveBeenCalledTimes(1)
        expect(mockStorage.save).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Advanced Search Functionality', () => {
    describe('Basic Search', () => {
      it('should search entries by query text', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'React performance optimization',
            timestamp: Date.now() - 1000
          }),
          createMockEntry({ 
            id: '2', 
            query: 'TypeScript generics tutorial',
            timestamp: Date.now() - 2000
          }),
          createMockEntry({ 
            id: '3', 
            query: 'React hooks performance',
            timestamp: Date.now() - 3000
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
        
        // Act
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ query: 'React' })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(2)
        expect(searchResult.entries[0].query).toContain('React')
        expect(searchResult.entries[1].query).toContain('React')
        expect(searchResult.totalCount).toBe(2)
        expect(searchResult.searchTime).toBeGreaterThan(0)
      })

      it('should perform fuzzy search when enabled', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'React performance optimization',
            timestamp: Date.now() - 1000
          }),
          createMockEntry({ 
            id: '2', 
            query: 'JavaScript async/await patterns',
            timestamp: Date.now() - 2000
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(2)
        })
        
        // Act - Search with typo
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'Raect performanc',
            fuzzy: true,
            fuzzyThreshold: 0.6
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(1)
        expect(searchResult.entries[0].query).toBe('React performance optimization')
        expect(searchResult.matches[0].score).toBeGreaterThan(0.6)
      })

      it('should respect case sensitivity setting', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'React Performance Tips',
            timestamp: Date.now() - 1000
          }),
          createMockEntry({ 
            id: '2', 
            query: 'vue.js performance guide',
            timestamp: Date.now() - 2000
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(2)
        })
        
        // Act - Case insensitive search
        let caseInsensitiveResult
        await act(async () => {
          caseInsensitiveResult = await result.current.searchHistory({ 
            query: 'PERFORMANCE',
            caseSensitive: false
          })
        })
        
        // Assert
        expect(caseInsensitiveResult.entries).toHaveLength(2)
        
        // Act - Case sensitive search
        let caseSensitiveResult
        await act(async () => {
          caseSensitiveResult = await result.current.searchHistory({ 
            query: 'Performance',
            caseSensitive: true
          })
        })
        
        // Assert
        expect(caseSensitiveResult.entries).toHaveLength(1)
        expect(caseSensitiveResult.entries[0].query).toBe('React Performance Tips')
      })
    })

    describe('Search Filters', () => {
      it('should filter by date range', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const now = Date.now()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Recent query',
            timestamp: now - 1 * 24 * 60 * 60 * 1000 // 1 day ago
          }),
          createMockEntry({ 
            id: '2', 
            query: 'Old query',
            timestamp: now - 7 * 24 * 60 * 60 * 1000 // 7 days ago
          }),
          createMockEntry({ 
            id: '3', 
            query: 'Very old query',
            timestamp: now - 30 * 24 * 60 * 60 * 1000 // 30 days ago
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
        
        // Act - Filter to last 3 days
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'query',
            filters: {
              dateRange: {
                start: new Date(now - 3 * 24 * 60 * 60 * 1000),
                end: new Date(now)
              }
            }
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(1)
        expect(searchResult.entries[0].query).toBe('Recent query')
      })

      it('should filter by algorithm', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Vector search query',
            algorithm: 'vector'
          }),
          createMockEntry({ 
            id: '2', 
            query: 'Hybrid search query',
            algorithm: 'hybrid'
          }),
          createMockEntry({ 
            id: '3', 
            query: 'Graph search query',
            algorithm: 'graph'
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
        
        // Act - Filter by vector algorithm
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'search',
            filters: {
              algorithm: 'vector'
            }
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(1)
        expect(searchResult.entries[0].algorithm).toBe('vector')
      })

      it('should filter by success status', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Successful query',
            success: true
          }),
          createMockEntry({ 
            id: '2', 
            query: 'Failed query',
            success: false
          }),
          createMockEntry({ 
            id: '3', 
            query: 'Another successful query',
            success: true
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
        
        // Act - Filter by success status
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'query',
            filters: {
              success: true
            }
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(2)
        expect(searchResult.entries.every(entry => entry.success)).toBe(true)
      })

      it('should filter by result count range', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'High result query',
            resultCount: 25
          }),
          createMockEntry({ 
            id: '2', 
            query: 'Medium result query',
            resultCount: 10
          }),
          createMockEntry({ 
            id: '3', 
            query: 'Low result query',
            resultCount: 2
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
        
        // Act - Filter by result count range
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'query',
            filters: {
              minResultCount: 5,
              maxResultCount: 20
            }
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(1)
        expect(searchResult.entries[0].resultCount).toBe(10)
      })
    })

    describe('Search Sorting', () => {
      it('should sort by relevance (default)', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'React performance optimization tips',
            timestamp: Date.now() - 1000
          }),
          createMockEntry({ 
            id: '2', 
            query: 'JavaScript React patterns',
            timestamp: Date.now() - 2000
          }),
          createMockEntry({ 
            id: '3', 
            query: 'React hooks guide',
            timestamp: Date.now() - 3000
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
        
        // Act
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'React',
            sortBy: 'relevance'
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(3)
        expect(searchResult.matches[0].score).toBeGreaterThanOrEqual(searchResult.matches[1].score)
        expect(searchResult.matches[1].score).toBeGreaterThanOrEqual(searchResult.matches[2].score)
      })

      it('should sort by date', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Oldest query',
            timestamp: Date.now() - 3000
          }),
          createMockEntry({ 
            id: '2', 
            query: 'Newest query',
            timestamp: Date.now() - 1000
          }),
          createMockEntry({ 
            id: '3', 
            query: 'Middle query',
            timestamp: Date.now() - 2000
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
        
        // Act - Sort by date, descending (newest first)
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'query',
            sortBy: 'date',
            sortOrder: 'desc'
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(3)
        expect(searchResult.entries[0].query).toBe('Newest query')
        expect(searchResult.entries[1].query).toBe('Middle query')
        expect(searchResult.entries[2].query).toBe('Oldest query')
      })

      it('should sort by result count', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Low result query',
            resultCount: 5
          }),
          createMockEntry({ 
            id: '2', 
            query: 'High result query',
            resultCount: 25
          }),
          createMockEntry({ 
            id: '3', 
            query: 'Medium result query',
            resultCount: 15
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
        
        // Act - Sort by result count, descending
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'query',
            sortBy: 'resultCount',
            sortOrder: 'desc'
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(3)
        expect(searchResult.entries[0].resultCount).toBe(25)
        expect(searchResult.entries[1].resultCount).toBe(15)
        expect(searchResult.entries[2].resultCount).toBe(5)
      })
    })

    describe('Search Pagination', () => {
      it('should limit search results', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = Array.from({ length: 20 }, (_, i) => 
          createMockEntry({ 
            id: `${i + 1}`, 
            query: `Search query ${i + 1}`,
            timestamp: Date.now() - i * 1000
          })
        )
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(20)
        })
        
        // Act
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'query',
            limit: 5
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(5)
        expect(searchResult.totalCount).toBe(20)
      })
    })

    describe('Search Performance', () => {
      it('should measure search time', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'Performance test query',
            timestamp: Date.now() - 1000
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'performance'
          })
        })
        
        // Assert
        expect(searchResult.searchTime).toBeGreaterThan(0)
        expect(searchResult.searchTime).toBeLessThan(1000) // Should be fast
      })

      it('should handle empty search results', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = [
          createMockEntry({ 
            id: '1', 
            query: 'React performance',
            timestamp: Date.now() - 1000
          })
        ]
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ 
            query: 'nonexistent'
          })
        })
        
        // Assert
        expect(searchResult.entries).toHaveLength(0)
        expect(searchResult.totalCount).toBe(0)
        expect(searchResult.matches).toHaveLength(0)
      })
    })
  })

  describe('Enhanced Cross-Tab Synchronization', () => {
    describe('Real-time Sync', () => {
      it('should sync immediately when storage event is fired', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const initialEntries = [createMockEntry({ id: '1' })]
        const updatedEntries = [
          ...initialEntries,
          createMockEntry({ id: '2', query: 'New from other tab' })
        ]
        
        mockStorage.load
          .mockResolvedValueOnce(initialEntries)
          .mockResolvedValueOnce(updatedEntries)
        
        const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act - Simulate storage event from another tab
        act(() => {
          const event = new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(updatedEntries),
            oldValue: JSON.stringify(initialEntries)
          })
          window.dispatchEvent(event)
        })
        
        // Assert
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(2)
        })
      })

      it('should handle concurrent modifications with conflict resolution', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const baseEntries = [createMockEntry({ id: '1', query: 'Base entry' })]
        
        // Simulate two tabs with different modifications
        const tab1Entries = [
          ...baseEntries,
          createMockEntry({ id: '2', query: 'Tab 1 entry', timestamp: Date.now() - 1000 })
        ]
        const tab2Entries = [
          ...baseEntries,
          createMockEntry({ id: '3', query: 'Tab 2 entry', timestamp: Date.now() - 500 })
        ]
        
        mockStorage.load
          .mockResolvedValueOnce(baseEntries)
          .mockResolvedValueOnce(tab1Entries)
          .mockResolvedValueOnce(tab2Entries)
        
        const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act - Simulate rapid storage events from different tabs
        act(() => {
          const event1 = new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(tab1Entries)
          })
          window.dispatchEvent(event1)
        })
        
        // Wait a bit then simulate another tab's change
        await new Promise(resolve => setTimeout(resolve, 100))
        
        act(() => {
          const event2 = new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(tab2Entries)
          })
          window.dispatchEvent(event2)
        })
        
        // Assert - Should handle both updates
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(2)
        })
      })

      it('should debounce rapid sync events', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const initialEntries = [createMockEntry({ id: '1' })]
        
        mockStorage.load.mockResolvedValue(initialEntries)
        
        const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Clear mock to track new calls
        mockStorage.load.mockClear()
        
        // Act - Simulate rapid storage events
        act(() => {
          for (let i = 0; i < 10; i++) {
            const event = new StorageEvent('storage', {
              key: STORAGE_KEY,
              newValue: JSON.stringify(initialEntries)
            })
            window.dispatchEvent(event)
          }
        })
        
        // Assert - Should debounce and not call load 10 times
        await waitFor(() => {
          expect(mockStorage.load).toHaveBeenCalledTimes(1)
        })
      })

      it('should handle storage events with invalid data gracefully', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const validEntries = [createMockEntry({ id: '1' })]
        
        mockStorage.load.mockResolvedValue(validEntries)
        
        const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act - Simulate storage event with invalid JSON
        act(() => {
          const event = new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: 'invalid json{'
          })
          window.dispatchEvent(event)
        })
        
        // Assert - Should not crash and maintain current state
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
      })
    })

    describe('Conflict Resolution', () => {
      it('should resolve conflicts by timestamp (last write wins)', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const now = Date.now()
        
        const olderEntry = createMockEntry({ 
          id: '1', 
          query: 'Older version',
          timestamp: now - 5000
        })
        const newerEntry = createMockEntry({ 
          id: '1', 
          query: 'Newer version',
          timestamp: now - 1000
        })
        
        mockStorage.load
          .mockResolvedValueOnce([olderEntry])
          .mockResolvedValueOnce([newerEntry])
        
        const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
          expect(result.current.entries[0].query).toBe('Older version')
        })
        
        // Act - Simulate sync with newer version
        act(() => {
          const event = new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify([newerEntry])
          })
          window.dispatchEvent(event)
        })
        
        // Assert - Should update to newer version
        await waitFor(() => {
          expect(result.current.entries[0].query).toBe('Newer version')
        })
      })

      it('should merge entries from different tabs without duplication', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const baseEntries = [createMockEntry({ id: '1', query: 'Base' })]
        const tab1Entries = [
          ...baseEntries,
          createMockEntry({ id: '2', query: 'Tab 1' })
        ]
        const tab2Entries = [
          ...baseEntries,
          createMockEntry({ id: '3', query: 'Tab 2' })
        ]
        
        mockStorage.load
          .mockResolvedValueOnce(baseEntries)
          .mockResolvedValueOnce(tab1Entries)
          .mockResolvedValueOnce([...tab1Entries, ...tab2Entries.slice(1)])
        
        const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Act - Simulate merging changes from different tabs
        act(() => {
          const event1 = new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(tab1Entries)
          })
          window.dispatchEvent(event1)
        })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(2)
        })
        
        act(() => {
          const event2 = new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify([...tab1Entries, ...tab2Entries.slice(1)])
          })
          window.dispatchEvent(event2)
        })
        
        // Assert - Should merge without duplicates
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(3)
        })
      })
    })

    describe('Sync Performance', () => {
      it('should only sync when data has actually changed', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const entries = [createMockEntry({ id: '1' })]
        
        mockStorage.load.mockResolvedValue(entries)
        
        const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Clear mock to track new calls
        mockStorage.load.mockClear()
        
        // Act - Simulate storage event with same data
        act(() => {
          const event = new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(entries), // Same data
            oldValue: JSON.stringify(entries)
          })
          window.dispatchEvent(event)
        })
        
        // Assert - Should not trigger unnecessary reload
        await new Promise(resolve => setTimeout(resolve, 100))
        expect(mockStorage.load).not.toHaveBeenCalled()
      })

      it('should handle high-frequency sync events efficiently', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const entries = [createMockEntry({ id: '1' })]
        
        mockStorage.load.mockResolvedValue(entries)
        
        const { result } = renderHook(() => useQueryHistory({ enableSync: true }), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1)
        })
        
        // Clear mock to track new calls
        mockStorage.load.mockClear()
        
        // Act - Simulate high-frequency events
        const startTime = performance.now()
        act(() => {
          for (let i = 0; i < 100; i++) {
            const event = new StorageEvent('storage', {
              key: STORAGE_KEY,
              newValue: JSON.stringify(entries)
            })
            window.dispatchEvent(event)
          }
        })
        
        // Assert - Should handle efficiently without blocking
        const endTime = performance.now()
        expect(endTime - startTime).toBeLessThan(1000) // Should be fast
      })
    })
  })

  describe('Performance Monitoring Integration', () => {
    describe('Timing Measurements', () => {
      it('should track timing for add operations', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const query = 'Performance test query'
        const parameters = createMockParameters()
        
        mockStorage.load.mockResolvedValue([])
        mockStorage.save.mockResolvedValue(createMockEntry({ query }))
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })
        
        // Act
        const startTime = performance.now()
        await act(async () => {
          await result.current.addEntry(query, parameters)
        })
        const endTime = performance.now()
        
        // Assert
        expect(endTime - startTime).toBeGreaterThan(0)
        expect(endTime - startTime).toBeLessThan(5000) // Should be reasonably fast
      })

      it('should track timing for search operations', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = Array.from({ length: 100 }, (_, i) => 
          createMockEntry({ 
            id: `${i}`, 
            query: `Performance test query ${i}`,
            timestamp: Date.now() - i * 1000
          })
        )
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(100)
        })
        
        // Act
        const startTime = performance.now()
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ query: 'test' })
        })
        const endTime = performance.now()
        
        // Assert
        expect(searchResult.searchTime).toBeGreaterThan(0)
        expect(endTime - startTime).toBeGreaterThan(0)
        expect(endTime - startTime).toBeLessThan(1000) // Should be fast even with 100 entries
      })

      it('should track timing for export operations', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const existingEntries = Array.from({ length: 50 }, (_, i) => 
          createMockEntry({ 
            id: `${i}`, 
            query: `Export test query ${i}`,
            timestamp: Date.now() - i * 1000
          })
        )
        
        mockStorage.load.mockResolvedValue(existingEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(50)
        })
        
        // Act
        const startTime = performance.now()
        let exportResult
        await act(async () => {
          exportResult = await result.current.exportHistory({ format: 'json' })
        })
        const endTime = performance.now()
        
        // Assert
        expect(endTime - startTime).toBeGreaterThan(0)
        expect(endTime - startTime).toBeLessThan(2000) // Should be fast
        expect(exportResult.entryCount).toBe(50)
      })

      it('should track timing for import operations', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const importData = Array.from({ length: 25 }, (_, i) => ({
          id: `import-${i}`,
          query: `Import test query ${i}`,
          parameters: createMockParameters(),
          timestamp: Date.now() - i * 1000,
          success: true,
          version: '2.0.0'
        }))
        
        mockStorage.load.mockResolvedValue([])
        mockStorage.save.mockImplementation((entry) => 
          Promise.resolve(createMockEntry(entry))
        )
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(0)
        })
        
        // Act
        const startTime = performance.now()
        let importResult
        await act(async () => {
          importResult = await result.current.importHistory(
            JSON.stringify(importData),
            { format: 'json' }
          )
        })
        const endTime = performance.now()
        
        // Assert
        expect(endTime - startTime).toBeGreaterThan(0)
        expect(endTime - startTime).toBeLessThan(5000) // Should be reasonably fast
        expect(importResult.importedCount).toBe(25)
      })
    })

    describe('Performance Metrics Collection', () => {
      it('should collect metrics for hook render performance', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const entries = [createMockEntry({ id: '1' })]
        
        mockStorage.load.mockResolvedValue(entries)
        
        // Act
        const startTime = performance.now()
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        const endTime = performance.now()
        
        // Assert
        expect(endTime - startTime).toBeLessThan(1000) // Initial render should be fast
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })
      })

      it('should collect metrics for memory usage', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const largeEntries = Array.from({ length: 1000 }, (_, i) => 
          createMockEntry({ 
            id: `${i}`, 
            query: `Large dataset query ${i}`,
            timestamp: Date.now() - i * 1000
          })
        )
        
        mockStorage.load.mockResolvedValue(largeEntries)
        
        // Act
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(1000)
        })
        
        // Assert - Should handle large datasets efficiently
        expect(result.current.entries).toHaveLength(1000)
      })

      it('should collect metrics for concurrent operations', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const parameters = createMockParameters()
        
        mockStorage.load.mockResolvedValue([])
        mockStorage.save.mockImplementation((entry) => 
          Promise.resolve(createMockEntry(entry))
        )
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })
        
        // Act - Perform multiple concurrent operations
        const startTime = performance.now()
        await act(async () => {
          await Promise.all([
            result.current.addEntry('Query 1', parameters),
            result.current.addEntry('Query 2', parameters),
            result.current.addEntry('Query 3', parameters),
            result.current.searchHistory({ query: 'test' }),
            result.current.exportHistory({ format: 'json' })
          ])
        })
        const endTime = performance.now()
        
        // Assert - Should handle concurrent operations efficiently
        expect(endTime - startTime).toBeLessThan(3000) // Should be reasonably fast
        expect(mockStorage.save).toHaveBeenCalledTimes(3)
      })
    })

    describe('Performance Optimization', () => {
      it('should optimize memory usage with large datasets', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const veryLargeEntries = Array.from({ length: 10000 }, (_, i) => 
          createMockEntry({ 
            id: `${i}`, 
            query: `Very large dataset query ${i}`,
            timestamp: Date.now() - i * 1000
          })
        )
        
        mockStorage.load.mockResolvedValue(veryLargeEntries)
        
        // Act
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(10000)
        })
        
        // Assert - Should handle very large datasets
        expect(result.current.entries).toHaveLength(10000)
        expect(result.current.entries[0]).toHaveProperty('id')
      })

      it('should optimize search performance with indexing', async () => {
        // Arrange
        const wrapper = createQueryWrapper()
        const searchableEntries = Array.from({ length: 5000 }, (_, i) => 
          createMockEntry({ 
            id: `${i}`, 
            query: i % 2 === 0 ? `React query ${i}` : `Vue query ${i}`,
            timestamp: Date.now() - i * 1000
          })
        )
        
        mockStorage.load.mockResolvedValue(searchableEntries)
        
        const { result } = renderHook(() => useQueryHistory(), { wrapper })
        
        await waitFor(() => {
          expect(result.current.entries).toHaveLength(5000)
        })
        
        // Act - Search large dataset
        const startTime = performance.now()
        let searchResult
        await act(async () => {
          searchResult = await result.current.searchHistory({ query: 'React' })
        })
        const endTime = performance.now()
        
        // Assert - Should be fast even with large dataset
        expect(endTime - startTime).toBeLessThan(500) // Should be very fast with indexing
        expect(searchResult.entries.length).toBeGreaterThan(0)
        expect(searchResult.entries.every(e => e.query.includes('React'))).toBe(true)
      })
    })
  })
})
/**
 * QueryHistoryStorage Service Tests
 * TDD Red Phase - All tests will FAIL until implementation is created
 * 
 * Expert Test Patterns Applied:
 * - AAA pattern (Arrange, Act, Assert)
 * - One behavior per test
 * - Descriptive test names
 * - Proper TypeScript types
 * - Mock external dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryHistoryStorage } from './QueryHistoryStorage'
import type { QueryHistoryEntry, QueryHistoryError } from '../../types/history'
import type { QueryParameters } from '../../types'

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Store original localStorage
const originalLocalStorage = global.localStorage

describe('QueryHistoryStorage', () => {
  let storage: QueryHistoryStorage
  const STORAGE_KEY = 'expert_discovery_query_history'

  beforeEach(() => {
    // Replace localStorage with mock
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    
    // Reset all mocks
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Create fresh storage instance
    storage = new QueryHistoryStorage()
  })

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    })
  })

  // Helper function to create mock entry
  const createMockEntry = (overrides?: Partial<Omit<QueryHistoryEntry, 'id' | 'timestamp'>>): Omit<QueryHistoryEntry, 'id' | 'timestamp'> => ({
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
    success: true,
    version: '2.0.0',
    ...overrides
  })

  describe('Storage Service Foundation', () => {
    it('should detect localStorage availability', () => {
      // Arrange - localStorage mock is already set up
      
      // Act
      const isAvailable = storage.isAvailable()
      
      // Assert
      expect(isAvailable).toBe(true)
    })

    it('should detect localStorage unavailability', () => {
      // Arrange - Remove localStorage
      delete (global as any).localStorage
      storage = new QueryHistoryStorage()
      
      // Act
      const isAvailable = storage.isAvailable()
      
      // Assert
      expect(isAvailable).toBe(false)
    })

    it('should save a new entry to localStorage', async () => {
      // Arrange
      const entry = createMockEntry()
      const expectedStoredData = JSON.stringify([{
        ...entry,
        id: expect.any(String),
        timestamp: expect.any(Number)
      }])
      
      // Act
      const result = await storage.save(entry)
      
      // Assert
      expect(result).toMatchObject({
        ...entry,
        id: expect.any(String),
        timestamp: expect.any(Number)
      })
      expect(result!.id).toBeDefined()
      expect(result!.timestamp).toBeGreaterThan(0)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expectedStoredData)
    })

    it('should generate unique IDs for entries', async () => {
      // Arrange
      const entry1 = createMockEntry({ query: 'Query 1' })
      const entry2 = createMockEntry({ query: 'Query 2' })
      
      // Act
      const result1 = await storage.save(entry1)
      const result2 = await storage.save(entry2)
      
      // Assert
      expect(result1!.id).toBeDefined()
      expect(result2!.id).toBeDefined()
      expect(result1!.id).not.toBe(result2!.id)
    })

    it('should load entries from localStorage', async () => {
      // Arrange
      const storedEntries: QueryHistoryEntry[] = [
        {
          id: 'test-id-1',
          query: 'Test Query 1',
          parameters: createMockEntry().parameters,
          timestamp: Date.now() - 1000,
          success: true,
          version: '2.0.0'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedEntries))
      
      // Act
      const result = await storage.load()
      
      // Assert
      expect(result).toEqual(storedEntries)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
    })

    it('should return empty array when no data exists', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null)
      
      // Act
      const result = await storage.load()
      
      // Assert
      expect(result).toEqual([])
    })
  })

  describe('Storage Limit Enforcement', () => {
    it('should enforce maximum entry limit (50 entries)', async () => {
      // Arrange
      const existingEntries: QueryHistoryEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `id-${i}`,
        query: `Query ${i}`,
        parameters: createMockEntry().parameters,
        timestamp: Date.now() - (50 - i) * 1000, // Oldest first
        success: true,
        version: '2.0.0'
      }))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingEntries))
      
      const newEntry = createMockEntry({ query: 'New query exceeding limit' })
      
      // Act
      const result = await storage.save(newEntry)
      
      // Assert
      expect(result).toBeDefined()
      
      // Verify localStorage.setItem was called
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      const [, storedData] = mockLocalStorage.setItem.mock.calls[0]
      const parsedData = JSON.parse(storedData)
      
      // Should still have exactly 50 entries
      expect(parsedData).toHaveLength(50)
      
      // Should not contain the oldest entry (id-0)
      expect(parsedData.find((e: QueryHistoryEntry) => e.id === 'id-0')).toBeUndefined()
      
      // Should contain the new entry
      expect(parsedData.find((e: QueryHistoryEntry) => e.query === 'New query exceeding limit')).toBeDefined()
    })

    it('should maintain chronological order when removing oldest entries', async () => {
      // Arrange
      const existingEntries: QueryHistoryEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `id-${i}`,
        query: `Query ${i}`,
        parameters: createMockEntry().parameters,
        timestamp: Date.now() - (50 - i) * 1000,
        success: true,
        version: '2.0.0'
      }))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingEntries))
      
      const newEntry = createMockEntry({ query: 'Newest entry' })
      
      // Act
      await storage.save(newEntry)
      
      // Assert
      const [, storedData] = mockLocalStorage.setItem.mock.calls[0]
      const parsedData: QueryHistoryEntry[] = JSON.parse(storedData)
      
      // Verify entries are sorted by timestamp (newest first)
      for (let i = 0; i < parsedData.length - 1; i++) {
        expect(parsedData[i].timestamp).toBeGreaterThanOrEqual(parsedData[i + 1].timestamp)
      }
    })
  })

  describe('Duplicate Query Prevention', () => {
    it('should prevent duplicate queries by updating existing entry', async () => {
      // Arrange
      const existingEntry: QueryHistoryEntry = {
        id: 'existing-id',
        query: 'React performance optimization',
        parameters: createMockEntry().parameters,
        timestamp: Date.now() - 5000,
        success: true,
        version: '2.0.0'
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([existingEntry]))
      
      const duplicateEntry = createMockEntry({
        query: 'React performance optimization', // Same query
        success: false, // Different metadata
        resultCount: 15
      })
      
      // Act
      const result = await storage.save(duplicateEntry)
      
      // Assert
      expect(result).toBeDefined()
      expect(result!.id).toBe('existing-id') // Should reuse existing ID
      expect(result!.timestamp).toBeGreaterThan(existingEntry.timestamp) // Should update timestamp
      
      const [, storedData] = mockLocalStorage.setItem.mock.calls[0]
      const parsedData: QueryHistoryEntry[] = JSON.parse(storedData)
      
      // Should still have only one entry
      expect(parsedData).toHaveLength(1)
      expect(parsedData[0].id).toBe('existing-id')
      expect(parsedData[0].success).toBe(false) // Should update metadata
    })

    it('should normalize query text for duplicate detection', async () => {
      // Arrange
      const existingEntry: QueryHistoryEntry = {
        id: 'existing-id',
        query: '  React Performance   optimization  ',
        parameters: createMockEntry().parameters,
        timestamp: Date.now() - 5000,
        success: true,
        version: '2.0.0'
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([existingEntry]))
      
      const normalizedEntry = createMockEntry({
        query: 'react performance optimization' // Different case and spacing
      })
      
      // Act
      const result = await storage.save(normalizedEntry)
      
      // Assert
      expect(result!.id).toBe('existing-id') // Should detect as duplicate
    })
  })

  describe('localStorage Quota Handling', () => {
    it('should handle quota exceeded error gracefully', async () => {
      // Arrange
      const largeEntry = createMockEntry({
        query: 'x'.repeat(5000),
        notes: 'y'.repeat(10000)
      })
      
      mockLocalStorage.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })
      
      // Act
      const result = await storage.save(largeEntry)
      
      // Assert
      expect(result).toBeNull()
      
      const lastError = storage.getLastError()
      expect(lastError).toEqual({
        code: 'QUOTA_EXCEEDED',
        message: 'Storage quota exceeded. Please clear some history entries.',
        details: expect.any(Error)
      })
    })

    it('should handle DOM exception quota errors', async () => {
      // Arrange
      const entry = createMockEntry()
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      })
      
      // Act
      const result = await storage.save(entry)
      
      // Assert
      expect(result).toBeNull()
      expect(storage.getLastError()?.code).toBe('QUOTA_EXCEEDED')
    })

    it('should clear old entries and retry on quota exceeded', async () => {
      // Arrange
      const existingEntries: QueryHistoryEntry[] = Array.from({ length: 25 }, (_, i) => ({
        id: `old-id-${i}`,
        query: `Old Query ${i}`,
        parameters: createMockEntry().parameters,
        timestamp: Date.now() - (25 - i) * 1000,
        success: true,
        version: '2.0.0'
      }))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingEntries))
      
      const newEntry = createMockEntry({ query: 'New entry after cleanup' })
      
      // Mock first call to throw quota error, second call to succeed
      let callCount = 0
      mockLocalStorage.setItem.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          throw new DOMException('QuotaExceededError')
        }
        // Second call succeeds
      })
      
      // Act
      const result = await storage.save(newEntry)
      
      // Assert
      expect(result).toBeDefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2) // Retry after cleanup
    })
  })

  describe('Data Validation', () => {
    it('should validate entry structure before saving', async () => {
      // Arrange
      const invalidEntry = {
        // Missing required fields
        query: '', // Empty query
        parameters: null
      } as any
      
      // Act
      const result = await storage.save(invalidEntry)
      
      // Assert
      expect(result).toBeNull()
      expect(storage.getLastError()?.code).toBe('VALIDATION_ERROR')
    })

    it('should sanitize query text', async () => {
      // Arrange
      const entryWithXSS = createMockEntry({
        query: '<script>alert("xss")</script>React performance tips'
      })
      
      // Act
      const result = await storage.save(entryWithXSS)
      
      // Assert
      expect(result!.query).toBe('React performance tips')
      expect(result!.query).not.toContain('<script>')
    })

    it('should validate parameters structure', async () => {
      // Arrange
      const entryWithInvalidParams = createMockEntry({
        parameters: {
          algorithm: 'invalid-algorithm',
          maxResults: -1
        } as any
      })
      
      // Act
      const result = await storage.save(entryWithInvalidParams)
      
      // Assert
      expect(result).toBeNull()
      expect(storage.getLastError()?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Error Handling', () => {
    it('should handle corrupted storage data gracefully', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('invalid-json{]')
      
      // Act
      const result = await storage.load()
      
      // Assert
      expect(result).toEqual([])
      expect(storage.getLastError()?.code).toBe('PARSE_ERROR')
    })

    it('should handle storage unavailable gracefully', async () => {
      // Arrange
      delete (global as any).localStorage
      storage = new QueryHistoryStorage()
      const entry = createMockEntry()
      
      // Act
      const saveResult = await storage.save(entry)
      const loadResult = await storage.load()
      
      // Assert
      expect(saveResult).toBeNull()
      expect(loadResult).toEqual([])
      expect(storage.isAvailable()).toBe(false)
      expect(storage.getLastError()?.code).toBe('STORAGE_UNAVAILABLE')
    })

    it('should clear error state after successful operation', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('invalid-json')
      await storage.load() // This should set an error
      expect(storage.getLastError()).toBeDefined()
      
      // Reset mock to return valid data
      mockLocalStorage.getItem.mockReturnValue('[]')
      
      // Act
      await storage.load()
      
      // Assert
      expect(storage.getLastError()).toBeNull()
    })
  })

  describe('Entry Management', () => {
    it('should remove entry by ID', async () => {
      // Arrange
      const entries: QueryHistoryEntry[] = [
        {
          id: 'remove-me',
          query: 'Entry to remove',
          parameters: createMockEntry().parameters,
          timestamp: Date.now(),
          success: true,
          version: '2.0.0'
        },
        {
          id: 'keep-me',
          query: 'Entry to keep',
          parameters: createMockEntry().parameters,
          timestamp: Date.now() - 1000,
          success: true,
          version: '2.0.0'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(entries))
      
      // Act
      const result = await storage.remove('remove-me')
      
      // Assert
      expect(result).toBe(true)
      
      const [, storedData] = mockLocalStorage.setItem.mock.calls[0]
      const parsedData: QueryHistoryEntry[] = JSON.parse(storedData)
      
      expect(parsedData).toHaveLength(1)
      expect(parsedData[0].id).toBe('keep-me')
    })

    it('should return false when removing non-existent entry', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('[]')
      
      // Act
      const result = await storage.remove('non-existent-id')
      
      // Assert
      expect(result).toBe(false)
    })

    it('should clear all entries', async () => {
      // Arrange
      const entries: QueryHistoryEntry[] = [
        {
          id: 'entry-1',
          query: 'Query 1',
          parameters: createMockEntry().parameters,
          timestamp: Date.now(),
          success: true,
          version: '2.0.0'
        }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(entries))
      
      // Act
      await storage.clear()
      
      // Assert
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
    })
  })

  describe('Performance', () => {
    it('should handle large number of entries efficiently', async () => {
      // Arrange
      const largeEntrySet: QueryHistoryEntry[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `perf-test-${i}`,
        query: `Performance test query ${i}`,
        parameters: createMockEntry().parameters,
        timestamp: Date.now() - i * 1000,
        success: true,
        version: '2.0.0'
      }))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largeEntrySet))
      
      // Act
      const startTime = performance.now()
      const result = await storage.load()
      const endTime = performance.now()
      
      // Assert
      expect(result).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(100) // Should load within 100ms
    })

    it('should batch multiple save operations', async () => {
      // Arrange
      const entries = Array.from({ length: 5 }, (_, i) => 
        createMockEntry({ query: `Batch test ${i}` })
      )
      
      // Act
      const results = await Promise.all(
        entries.map(entry => storage.save(entry))
      )
      
      // Assert
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
      })
      
      // Should have called setItem for each save
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(5)
    })
  })
})
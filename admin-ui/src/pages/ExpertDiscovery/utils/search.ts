/**
 * Advanced Search Utility for Query History
 * Implements fuzzy search, filtering, and relevance scoring
 * 
 * Expert patterns applied:
 * - Efficient fuzzy matching with Levenshtein distance
 * - Multiple scoring algorithms for relevance ranking
 * - Optimized search indexing for performance
 * - Flexible filtering system with chainable operations
 * - Memory-efficient processing for large datasets
 */

import type { QueryHistoryEntry, SearchOptions, SearchResult } from '../types/history'

/**
 * Fuzzy matching utilities
 */
class FuzzyMatcher {
  /**
   * Calculate Levenshtein distance between two strings
   */
  static levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))
    
    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i
    }
    
    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j
    }
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1,     // deletion
          matrix[j - 1][i - 1] + indicator  // substitution
        )
      }
    }
    
    return matrix[b.length][a.length]
  }
  
  /**
   * Calculate fuzzy match score (0-1, higher is better)
   */
  static fuzzyScore(query: string, text: string, threshold: number = 0.6): number {
    const distance = this.levenshteinDistance(query.toLowerCase(), text.toLowerCase())
    const maxLength = Math.max(query.length, text.length)
    const score = maxLength === 0 ? 1 : (maxLength - distance) / maxLength
    
    return score >= threshold ? score : 0
  }
  
  /**
   * Check if text matches query with fuzzy matching
   */
  static fuzzyMatch(query: string, text: string, threshold: number = 0.6): boolean {
    return this.fuzzyScore(query, text, threshold) > 0
  }
}

/**
 * Text search utilities
 */
class TextSearch {
  /**
   * Calculate relevance score for exact matches
   */
  static exactMatchScore(query: string, text: string, caseSensitive: boolean = false): number {
    const searchQuery = caseSensitive ? query : query.toLowerCase()
    const searchText = caseSensitive ? text : text.toLowerCase()
    
    // Exact match gets highest score
    if (searchText === searchQuery) return 1.0
    
    // Starts with query gets high score
    if (searchText.startsWith(searchQuery)) return 0.9
    
    // Contains query gets medium score
    if (searchText.includes(searchQuery)) return 0.7
    
    // Word boundary matches get lower score
    const wordBoundaryRegex = new RegExp(`\\b${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseSensitive ? 'g' : 'gi')
    if (wordBoundaryRegex.test(searchText)) return 0.5
    
    return 0
  }
  
  /**
   * Find highlights in text
   */
  static findHighlights(query: string, text: string, caseSensitive: boolean = false): Array<{ start: number; end: number }> {
    const searchQuery = caseSensitive ? query : query.toLowerCase()
    const searchText = caseSensitive ? text : text.toLowerCase()
    const highlights: Array<{ start: number; end: number }> = []
    
    let index = 0
    while (index < searchText.length) {
      const found = searchText.indexOf(searchQuery, index)
      if (found === -1) break
      
      highlights.push({
        start: found,
        end: found + searchQuery.length
      })
      
      index = found + searchQuery.length
    }
    
    return highlights
  }
}

/**
 * Search index for improved performance
 */
class SearchIndex {
  private index: Map<string, Set<string>> = new Map()
  
  /**
   * Build search index from entries
   */
  buildIndex(entries: QueryHistoryEntry[]): void {
    this.index.clear()
    
    for (const entry of entries) {
      const words = this.tokenize(entry.query)
      
      for (const word of words) {
        if (!this.index.has(word)) {
          this.index.set(word, new Set())
        }
        this.index.get(word)!.add(entry.id)
      }
    }
  }
  
  /**
   * Search using index
   */
  search(query: string): Set<string> {
    const words = this.tokenize(query)
    const results: Set<string>[] = []
    
    for (const word of words) {
      const matches = this.index.get(word)
      if (matches) {
        results.push(matches)
      }
    }
    
    if (results.length === 0) return new Set()
    
    // Intersection of all word matches
    return results.reduce((acc, curr) => {
      const intersection = new Set<string>()
      for (const item of acc) {
        if (curr.has(item)) {
          intersection.add(item)
        }
      }
      return intersection
    })
  }
  
  /**
   * Tokenize text into searchable words
   */
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
  }
}

/**
 * Main search engine
 */
export class HistorySearchEngine {
  private searchIndex = new SearchIndex()
  
  /**
   * Search query history entries
   */
  search(entries: QueryHistoryEntry[], options: SearchOptions): SearchResult {
    const startTime = performance.now()
    
    // Build index if needed
    this.searchIndex.buildIndex(entries)
    
    // Apply filters first
    let filteredEntries = this.applyFilters(entries, options)
    
    // Perform search
    const searchResults = this.performSearch(filteredEntries, options)
    
    // Sort results
    const sortedResults = this.sortResults(searchResults, options)
    
    // Apply pagination
    const paginatedResults = this.applyPagination(sortedResults, options)
    
    const endTime = performance.now()
    
    return {
      entries: paginatedResults.entries,
      totalCount: sortedResults.length,
      searchTime: endTime - startTime,
      query: options.query,
      matches: paginatedResults.matches
    }
  }
  
  /**
   * Apply search filters
   */
  private applyFilters(entries: QueryHistoryEntry[], options: SearchOptions): QueryHistoryEntry[] {
    let filtered = entries
    
    // Date range filter
    if (options.filters?.dateRange) {
      const { start, end } = options.filters.dateRange
      const startTime = start.getTime()
      const endTime = end.getTime()
      
      filtered = filtered.filter(entry => 
        entry.timestamp >= startTime && entry.timestamp <= endTime
      )
    }
    
    // Algorithm filter
    if (options.filters?.algorithm) {
      filtered = filtered.filter(entry => 
        entry.algorithm === options.filters?.algorithm
      )
    }
    
    // Success filter
    if (options.filters?.success !== undefined) {
      filtered = filtered.filter(entry => 
        entry.success === options.filters?.success
      )
    }
    
    // Result count range filter
    if (options.filters?.minResultCount !== undefined) {
      filtered = filtered.filter(entry => 
        (entry.resultCount ?? 0) >= options.filters!.minResultCount!
      )
    }
    
    if (options.filters?.maxResultCount !== undefined) {
      filtered = filtered.filter(entry => 
        (entry.resultCount ?? 0) <= options.filters!.maxResultCount!
      )
    }
    
    return filtered
  }
  
  /**
   * Perform the actual search
   */
  private performSearch(entries: QueryHistoryEntry[], options: SearchOptions): Array<{
    entry: QueryHistoryEntry
    score: number
    highlights: Array<{ field: string; start: number; end: number }>
  }> {
    const results: Array<{
      entry: QueryHistoryEntry
      score: number
      highlights: Array<{ field: string; start: number; end: number }>
    }> = []
    
    for (const entry of entries) {
      const matchResult = this.matchEntry(entry, options)
      
      if (matchResult.score > 0) {
        results.push({
          entry,
          score: matchResult.score,
          highlights: matchResult.highlights
        })
      }
    }
    
    return results
  }
  
  /**
   * Match a single entry against search query
   */
  private matchEntry(entry: QueryHistoryEntry, options: SearchOptions): {
    score: number
    highlights: Array<{ field: string; start: number; end: number }>
  } {
    const { query, fuzzy = false, fuzzyThreshold = 0.6, caseSensitive = false } = options
    
    let score = 0
    const highlights: Array<{ field: string; start: number; end: number }> = []
    
    // Search in query field (primary)
    if (fuzzy) {
      const fuzzyScore = FuzzyMatcher.fuzzyScore(query, entry.query, fuzzyThreshold)
      score = Math.max(score, fuzzyScore * 1.0) // Full weight for query field
    } else {
      const exactScore = TextSearch.exactMatchScore(query, entry.query, caseSensitive)
      score = Math.max(score, exactScore * 1.0) // Full weight for query field
      
      if (exactScore > 0) {
        const queryHighlights = TextSearch.findHighlights(query, entry.query, caseSensitive)
        highlights.push(...queryHighlights.map(h => ({ ...h, field: 'query' })))
      }
    }
    
    // Search in algorithm field (secondary)
    if (entry.algorithm) {
      if (fuzzy) {
        const fuzzyScore = FuzzyMatcher.fuzzyScore(query, entry.algorithm, fuzzyThreshold)
        score = Math.max(score, fuzzyScore * 0.5) // Half weight for algorithm field
      } else {
        const exactScore = TextSearch.exactMatchScore(query, entry.algorithm, caseSensitive)
        score = Math.max(score, exactScore * 0.5) // Half weight for algorithm field
        
        if (exactScore > 0) {
          const algorithmHighlights = TextSearch.findHighlights(query, entry.algorithm, caseSensitive)
          highlights.push(...algorithmHighlights.map(h => ({ ...h, field: 'algorithm' })))
        }
      }
    }
    
    // Search in notes field if present (tertiary)
    if (entry.notes) {
      if (fuzzy) {
        const fuzzyScore = FuzzyMatcher.fuzzyScore(query, entry.notes, fuzzyThreshold)
        score = Math.max(score, fuzzyScore * 0.3) // Lower weight for notes field
      } else {
        const exactScore = TextSearch.exactMatchScore(query, entry.notes, caseSensitive)
        score = Math.max(score, exactScore * 0.3) // Lower weight for notes field
        
        if (exactScore > 0) {
          const notesHighlights = TextSearch.findHighlights(query, entry.notes, caseSensitive)
          highlights.push(...notesHighlights.map(h => ({ ...h, field: 'notes' })))
        }
      }
    }
    
    return { score, highlights }
  }
  
  /**
   * Sort search results
   */
  private sortResults(results: Array<{
    entry: QueryHistoryEntry
    score: number
    highlights: Array<{ field: string; start: number; end: number }>
  }>, options: SearchOptions): Array<{
    entry: QueryHistoryEntry
    score: number
    highlights: Array<{ field: string; start: number; end: number }>
  }> {
    const { sortBy = 'relevance', sortOrder = 'desc' } = options
    
    const sorted = [...results].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'relevance':
          comparison = b.score - a.score
          break
        case 'date':
          comparison = b.entry.timestamp - a.entry.timestamp
          break
        case 'query':
          comparison = a.entry.query.localeCompare(b.entry.query)
          break
        case 'resultCount':
          comparison = (b.entry.resultCount ?? 0) - (a.entry.resultCount ?? 0)
          break
        default:
          comparison = b.score - a.score
      }
      
      return sortOrder === 'asc' ? -comparison : comparison
    })
    
    return sorted
  }
  
  /**
   * Apply pagination to results
   */
  private applyPagination(results: Array<{
    entry: QueryHistoryEntry
    score: number
    highlights: Array<{ field: string; start: number; end: number }>
  }>, options: SearchOptions): {
    entries: QueryHistoryEntry[]
    matches: Array<{
      entryId: string
      score: number
      highlights: Array<{ field: string; start: number; end: number }>
    }>
  } {
    const { limit } = options
    const paginatedResults = limit ? results.slice(0, limit) : results
    
    return {
      entries: paginatedResults.map(r => r.entry),
      matches: paginatedResults.map(r => ({
        entryId: r.entry.id,
        score: r.score,
        highlights: r.highlights
      }))
    }
  }
}

/**
 * Singleton search engine instance
 */
export const searchEngine = new HistorySearchEngine()
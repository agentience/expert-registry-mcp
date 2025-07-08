/**
 * Expert Discovery Utilities (Legacy)
 * 
 * @deprecated Use specific utility modules from ./utils/ directory instead
 * @fileoverview Legacy utilities maintained for backward compatibility
 * 
 * New utilities:
 * - ./utils/performance.ts - Performance monitoring utilities
 * - ./utils/errors.ts - Error handling utilities
 * - ./utils/validation.ts - Input validation utilities
 * - ./utils/text.ts - Text processing utilities
 */

import { CONFIG } from './config'
import { createOptimizedDebounce } from './utils/performance'

/**
 * @deprecated Use validation utilities from ./utils/validation.ts
 */
export function validateQuery(query: string): string[] {
  const errors: string[] = []
  
  if (!query || query.trim().length === 0) {
    errors.push('Query cannot be empty')
  }
  
  if (query.length < CONFIG.validation.queryMinLength) {
    errors.push(`Query must be at least ${CONFIG.validation.queryMinLength} characters long`)
  }
  
  if (query.length > CONFIG.validation.queryMaxLength) {
    errors.push(`Query cannot exceed ${CONFIG.validation.queryMaxLength} characters`)
  }

  // XSS protection
  if (CONFIG.validation.xssProtectionEnabled) {
    for (const rule of CONFIG.validation.sanitizationRules) {
      if (new RegExp(rule, 'gi').test(query)) {
        errors.push('Query contains potentially harmful content')
        break
      }
    }
  }

  // Character validation
  if (!CONFIG.validation.allowedCharacterPattern.test(query)) {
    errors.push('Query contains invalid characters')
  }
  
  return errors
}

/**
 * @deprecated Use text utilities from ./utils/text.ts
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * @deprecated Use createOptimizedDebounce from ./utils/performance.ts
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  return createOptimizedDebounce(func, wait)
}

// Missing utility functions for backward compatibility
export function validateQueryParameters(params: any): string[] {
  const errors: string[] = []
  
  if (params.maxResults && (params.maxResults < 1 || params.maxResults > 100)) {
    errors.push('Max results must be between 1 and 100')
  }
  
  if (params.confidenceThreshold && (params.confidenceThreshold < 0 || params.confidenceThreshold > 1)) {
    errors.push('Confidence threshold must be between 0 and 1')
  }
  
  return errors
}

export function formatConfidencePercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function mergeQueryParameters(current: any, updates: any): any {
  return { ...current, ...updates }
}

export function generateQueryCacheKey(query: string, params: any): string {
  return `query_${btoa(query)}_${btoa(JSON.stringify(params))}`
}

export function areQueriesEqual(query1: any, query2: any): boolean {
  return JSON.stringify(query1) === JSON.stringify(query2)
}

export function createSearchParams(params: any): URLSearchParams {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  })
  
  return searchParams
}

export function extractQueryParametersFromUrl(urlOrSearchParams: string | URLSearchParams): any {
  const params: any = {}
  
  let searchParams: URLSearchParams
  
  try {
    // If it's already a URLSearchParams object, use it directly
    if (urlOrSearchParams instanceof URLSearchParams) {
      searchParams = urlOrSearchParams
    } else if (typeof urlOrSearchParams === 'string') {
      // If it's a full URL, extract search params
      if (urlOrSearchParams.includes('://')) {
        const urlObj = new URL(urlOrSearchParams)
        searchParams = urlObj.searchParams
      } else {
        // If it's just search params string, use directly
        searchParams = new URLSearchParams(urlOrSearchParams)
      }
    } else {
      console.warn('Invalid URL or search params type:', typeof urlOrSearchParams)
      return {}
    }
  } catch (error) {
    console.warn('Invalid URL or search params:', urlOrSearchParams)
    return {}
  }
  
  searchParams.forEach((value, key) => {
    try {
      // Try to parse as JSON first
      params[key] = JSON.parse(value)
    } catch {
      // Fall back to string value
      params[key] = value
    }
  })
  
  return params
}
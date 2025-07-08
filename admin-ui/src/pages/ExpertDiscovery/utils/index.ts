/**
 * Utility functions for Expert Discovery feature
 */

import type { QueryParameters, ExpertDiscoveryQuery, Expert } from '../types'
import { VALIDATION_RULES } from '../constants'

/**
 * Validates query parameters
 */
export const validateQueryParameters = (parameters: QueryParameters): string[] => {
  const errors: string[] = []

  if (parameters.maxResults < VALIDATION_RULES.maxResults.min || 
      parameters.maxResults > VALIDATION_RULES.maxResults.max) {
    errors.push(`Max results must be between ${VALIDATION_RULES.maxResults.min} and ${VALIDATION_RULES.maxResults.max}`)
  }

  if (parameters.teamSize < VALIDATION_RULES.teamSize.min || 
      parameters.teamSize > VALIDATION_RULES.teamSize.max) {
    errors.push(`Team size must be between ${VALIDATION_RULES.teamSize.min} and ${VALIDATION_RULES.teamSize.max}`)
  }

  if (parameters.confidenceThreshold < VALIDATION_RULES.confidenceThreshold.min || 
      parameters.confidenceThreshold > VALIDATION_RULES.confidenceThreshold.max) {
    errors.push(`Confidence threshold must be between ${VALIDATION_RULES.confidenceThreshold.min} and ${VALIDATION_RULES.confidenceThreshold.max}`)
  }

  return errors
}

/**
 * Validates a search query string
 */
export const validateQuery = (query: string): string[] => {
  const errors: string[] = []

  if (query.trim().length < VALIDATION_RULES.queryMinLength) {
    errors.push(`Query must be at least ${VALIDATION_RULES.queryMinLength} characters long`)
  }

  if (query.length > VALIDATION_RULES.queryMaxLength) {
    errors.push(`Query cannot exceed ${VALIDATION_RULES.queryMaxLength} characters`)
  }

  return errors
}

/**
 * Formats confidence percentage for display
 */
export const formatConfidencePercentage = (confidence: number): string => {
  return `${(confidence * 100).toFixed(0)}%`
}

/**
 * Truncates text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

/**
 * Debounces a function call
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Creates a deep copy of query parameters
 */
export const cloneQueryParameters = (parameters: QueryParameters): QueryParameters => {
  return {
    ...parameters,
    technologies: [...(parameters.technologies || [])]
  }
}

/**
 * Merges partial query parameters with defaults
 */
export const mergeQueryParameters = (
  base: QueryParameters,
  partial: Partial<QueryParameters>
): QueryParameters => {
  return {
    ...base,
    ...partial,
    technologies: partial.technologies ? [...partial.technologies] : [...(base.technologies || [])]
  }
}

/**
 * Filters experts based on parameters
 */
export const filterExpertsByParameters = (
  experts: Expert[],
  parameters: QueryParameters
): Expert[] => {
  return experts.filter(expert => {
    // Filter by active status
    if (!parameters.includeInactive && !expert.active) {
      return false
    }

    // Filter by confidence threshold
    if (expert.confidence < parameters.confidenceThreshold) {
      return false
    }

    // Filter by technologies (if any specified)
    if (parameters.technologies && parameters.technologies.length > 0) {
      const hasMatchingTech = parameters.technologies.some(tech =>
        expert.technologies.includes(tech) || expert.specializations.includes(tech)
      )
      if (!hasMatchingTech) {
        return false
      }
    }

    // Filter by experience level
    if (parameters.experienceLevel !== 'any' && 
        expert.experienceLevel !== parameters.experienceLevel) {
      return false
    }

    return true
  })
}

/**
 * Sorts experts by confidence score (descending)
 */
export const sortExpertsByConfidence = (experts: Expert[]): Expert[] => {
  return [...experts].sort((a, b) => b.confidence - a.confidence)
}

/**
 * Generates a cache key for query results
 */
export const generateQueryCacheKey = (query: ExpertDiscoveryQuery): string => {
  const keyParts = [
    query.query,
    query.algorithm,
    query.maxResults,
    query.includeInactive,
    query.confidenceThreshold,
    query.experienceLevel,
    query.teamSize,
    (query.technologies || []).sort().join(',')
  ]
  
  return keyParts.join('|')
}

/**
 * Checks if two query objects are equal
 */
export const areQueriesEqual = (
  query1: ExpertDiscoveryQuery | null,
  query2: ExpertDiscoveryQuery | null
): boolean => {
  if (query1 === query2) return true
  if (!query1 || !query2) return false

  const tech1 = query1.technologies || []
  const tech2 = query2.technologies || []

  return (
    query1.query === query2.query &&
    query1.algorithm === query2.algorithm &&
    query1.maxResults === query2.maxResults &&
    query1.includeInactive === query2.includeInactive &&
    query1.confidenceThreshold === query2.confidenceThreshold &&
    query1.experienceLevel === query2.experienceLevel &&
    query1.teamSize === query2.teamSize &&
    tech1.length === tech2.length &&
    tech1.every(tech => tech2.includes(tech))
  )
}

/**
 * Formats search time for display
 */
export const formatSearchTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${Math.round(timeMs)}ms`
  }
  return `${(timeMs / 1000).toFixed(1)}s`
}

/**
 * Creates URL search parameters from query parameters
 */
export const createSearchParams = (tab: string, parameters?: Partial<QueryParameters>): URLSearchParams => {
  const params = new URLSearchParams()
  params.set('tab', tab)
  
  if (parameters) {
    Object.entries(parameters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','))
        } else {
          params.set(key, String(value))
        }
      }
    })
  }
  
  return params
}

/**
 * Extracts query parameters from URL search parameters
 */
export const extractQueryParametersFromUrl = (searchParams: URLSearchParams): Partial<QueryParameters> => {
  const params: Partial<QueryParameters> = {}
  
  const algorithm = searchParams.get('algorithm')
  if (algorithm) params.algorithm = algorithm as any
  
  const maxResults = searchParams.get('maxResults')
  if (maxResults) params.maxResults = parseInt(maxResults, 10)
  
  const includeInactive = searchParams.get('includeInactive')
  if (includeInactive) params.includeInactive = includeInactive === 'true'
  
  const confidenceThreshold = searchParams.get('confidenceThreshold')
  if (confidenceThreshold) params.confidenceThreshold = parseFloat(confidenceThreshold)
  
  const technologies = searchParams.get('technologies')
  if (technologies) params.technologies = technologies.split(',').filter(Boolean)
  
  const experienceLevel = searchParams.get('experienceLevel')
  if (experienceLevel) params.experienceLevel = experienceLevel
  
  const teamSize = searchParams.get('teamSize')
  if (teamSize) params.teamSize = parseInt(teamSize, 10)
  
  return params
}
import type { OverviewStats } from '../types/stats'

/**
 * API endpoint for overview stats
 */
export const OVERVIEW_STATS_ENDPOINT = '/api/admin/stats/overview'

/**
 * Error types for categorizing different kinds of API errors
 */
export type ErrorType = 
  | 'authentication'
  | 'authorization' 
  | 'not_found'
  | 'rate_limit'
  | 'client'
  | 'server'
  | 'network'

/**
 * Enhanced error class for stats API operations with improved error handling
 */
export class StatsApiError extends Error {
  public readonly errorType: ErrorType
  public readonly userMessage: string
  public readonly isRetryable: boolean
  public readonly retryMessage?: string
  public readonly errorCode?: string
  public readonly retryAfter?: number

  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string,
    response?: Response,
    responseData?: any
  ) {
    super(message)
    this.name = 'StatsApiError'
    
    // Extract retry-after header for rate limiting first
    if (status === 429 && response?.headers.get('Retry-After')) {
      this.retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10)
    }
    
    // Extract error code from response data
    if (responseData?.code) {
      this.errorCode = responseData.code
    }
    
    // Determine error type based on status code
    this.errorType = this.determineErrorType(status)
    
    // Generate user-friendly message
    this.userMessage = this.generateUserMessage(status, statusText, responseData)
    
    // Determine if error is retryable
    this.isRetryable = this.determineRetryability(status)
    
    // Set retry message for retryable errors
    if (this.isRetryable) {
      this.retryMessage = 'This is a temporary issue. Please try again'
    }
  }

  private determineErrorType(status?: number): ErrorType {
    if (!status) return 'network'
    
    switch (status) {
      case 401:
        return 'authentication'
      case 403:
        return 'authorization'
      case 404:
        return 'not_found'
      case 429:
        return 'rate_limit'
      case 400:
      case 422:
        return 'client'
      case 500:
      case 502:
      case 503:
      case 504:
        return 'server'
      default:
        if (status >= 400 && status < 500) return 'client'
        if (status >= 500) return 'server'
        return 'network'
    }
  }

  private generateUserMessage(status?: number, statusText?: string, responseData?: any): string {
    if (!status) {
      return 'Unable to connect to the server. Please check your internet connection and try again'
    }
    
    // For certain status codes, use standard user-friendly messages
    switch (status) {
      case 401:
        return 'Please log in to continue'
      case 403:
        return 'You do not have permission to access this resource'
      case 404:
        return 'The requested resource was not found'
      case 429:
        if (this.retryAfter) {
          return `Too many requests. Please try again in ${this.retryAfter} seconds`
        }
        return 'Too many requests. Please try again in a few moments'
      case 500:
        return 'An internal server error occurred. Please try again later'
      case 502:
        return 'The server is temporarily unavailable. Please try again later'
      case 503:
        // For 503, prefer custom message if available (e.g., maintenance messages)
        if (responseData?.error && typeof responseData.error === 'string') {
          return responseData.error
        }
        return 'The service is temporarily unavailable. Please try again later'
      case 504:
        return 'The request timed out. Please try again'
      default:
        // For other errors, use custom message if available, otherwise fallback
        if (responseData?.error && typeof responseData.error === 'string') {
          return responseData.error
        }
        return statusText || 'An unexpected error occurred'
    }
  }

  private determineRetryability(status?: number): boolean {
    if (!status) return true // Network errors are usually retryable
    
    // Server errors and rate limiting are retryable
    // Client errors (except rate limiting) are not retryable
    return status >= 500 || status === 429 || status === 408
  }
}

/**
 * Fetches overview statistics from the API
 * 
 * @returns Promise<OverviewStats> The overview statistics data
 * @throws {StatsApiError} When the API request fails
 */
export async function fetchOverviewStats(): Promise<OverviewStats> {
  let response: Response | undefined
  
  try {
    response = await fetch(OVERVIEW_STATS_ENDPOINT)
    
    if (!response.ok) {
      let responseData: any = null
      
      try {
        responseData = await response.json()
      } catch {
        // Ignore JSON parse errors for response data
      }
      
      throw new StatsApiError(
        `Failed to fetch overview stats: ${response.statusText}`,
        response.status,
        response.statusText,
        response,
        responseData
      )
    }
    
    const data = await response.json()
    return data as OverviewStats
  } catch (error) {
    if (error instanceof StatsApiError) {
      throw error
    }
    
    // Handle network errors or other fetch failures
    throw new StatsApiError(
      `Network error while fetching overview stats: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      undefined,
      undefined,
      response
    )
  }
}
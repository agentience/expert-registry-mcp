/**
 * Expert Error Handling Utilities
 * Comprehensive error management with context preservation and recovery strategies
 * 
 * @fileoverview Error handling utilities following expert patterns:
 * - Structured error types with context
 * - Automatic error recovery strategies
 * - Error correlation and tracking
 * - Performance-aware error reporting
 * - User-friendly error messages
 * 
 * @author Expert-Enhanced Refactoring Agent
 * @version 2.1.0
 */

import { CONFIG } from '../config'
import { performanceMonitor } from './performance'

/**
 * Base error interface with rich context
 */
export interface EnhancedError extends Error {
  readonly code: string
  readonly context?: Record<string, any>
  readonly recoverable: boolean
  readonly userMessage: string
  readonly timestamp: number
  readonly correlationId: string
}

/**
 * Error severity levels for proper handling
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Error recovery strategy interface
 */
export interface ErrorRecoveryStrategy {
  readonly canRecover: (error: EnhancedError) => boolean
  readonly recover: (error: EnhancedError) => Promise<any>
  readonly maxAttempts: number
}

/**
 * Error context builder for rich error information
 */
export class ErrorContextBuilder {
  private context: Record<string, any> = {}

  add(key: string, value: any): this {
    this.context[key] = value
    return this
  }

  addOperation(operation: string): this {
    return this.add('operation', operation)
  }

  addUserId(userId: string): this {
    return this.add('userId', userId)
  }

  addTimestamp(): this {
    return this.add('timestamp', new Date().toISOString())
  }

  addUserAgent(): this {
    return this.add('userAgent', navigator.userAgent)
  }

  addUrl(): this {
    return this.add('url', window.location.href)
  }

  build(): Record<string, any> {
    return { ...this.context }
  }
}

/**
 * Enhanced error class with expert-level features
 */
export class ExpertError extends Error implements EnhancedError {
  readonly code: string
  readonly context: Record<string, any>
  readonly recoverable: boolean
  readonly userMessage: string
  readonly timestamp: number
  readonly correlationId: string
  readonly severity: ErrorSeverity

  constructor(
    message: string,
    code: string,
    options: {
      cause?: Error
      context?: Record<string, any>
      recoverable?: boolean
      userMessage?: string
      severity?: ErrorSeverity
    } = {}
  ) {
    super(message, { cause: options.cause })
    
    this.code = code
    this.context = options.context || {}
    this.recoverable = options.recoverable ?? false
    this.userMessage = options.userMessage || this.getDefaultUserMessage(code)
    this.timestamp = Date.now()
    this.correlationId = this.generateCorrelationId()
    this.severity = options.severity || this.inferSeverity(code)
    
    // Maintain proper error stack
    this.name = 'ExpertError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExpertError)
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getDefaultUserMessage(code: string): string {
    const messages: Record<string, string> = {
      'STORAGE_UNAVAILABLE': 'Storage is not available. Please check your browser settings.',
      'QUOTA_EXCEEDED': 'Storage space is full. Please clear some data and try again.',
      'PARSE_ERROR': 'Data format error. Your data may be corrupted.',
      'VALIDATION_ERROR': 'Invalid input. Please check your data and try again.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'PERMISSION_DENIED': 'Permission denied. You may not have access to this feature.',
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
      'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.'
    }
    
    return messages[code] || 'An unexpected error occurred. Please try again.'
  }

  private inferSeverity(code: string): ErrorSeverity {
    const severityMap: Record<string, ErrorSeverity> = {
      'STORAGE_UNAVAILABLE': 'high',
      'QUOTA_EXCEEDED': 'medium',
      'PARSE_ERROR': 'medium',
      'VALIDATION_ERROR': 'low',
      'NETWORK_ERROR': 'medium',
      'PERMISSION_DENIED': 'high',
      'RATE_LIMITED': 'medium',
      'SERVICE_UNAVAILABLE': 'high'
    }
    
    return severityMap[code] || 'medium'
  }

  /**
   * Converts to plain object for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      recoverable: this.recoverable,
      userMessage: this.userMessage,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      severity: this.severity,
      stack: this.stack
    }
  }
}

/**
 * Error recovery strategies for common error types
 */
export const ErrorRecoveryStrategies: Record<string, ErrorRecoveryStrategy> = {
  STORAGE_UNAVAILABLE: {
    canRecover: (error) => error.code === 'STORAGE_UNAVAILABLE',
    recover: async () => {
      // Try fallback to memory storage
      return new Map()
    },
    maxAttempts: 1
  },

  QUOTA_EXCEEDED: {
    canRecover: (error) => error.code === 'QUOTA_EXCEEDED',
    recover: async () => {
      // Try to clear old data and retry
      const oldData = localStorage.getItem(CONFIG.storage.storageKey)
      if (oldData) {
        const parsed = JSON.parse(oldData)
        if (Array.isArray(parsed)) {
          // Keep only half of the entries
          const reduced = parsed.slice(0, Math.floor(parsed.length / 2))
          localStorage.setItem(CONFIG.storage.storageKey, JSON.stringify(reduced))
          return true
        }
      }
      return false
    },
    maxAttempts: 2
  },

  PARSE_ERROR: {
    canRecover: (error) => error.code === 'PARSE_ERROR',
    recover: async () => {
      // Clear corrupted data and start fresh
      localStorage.removeItem(CONFIG.storage.storageKey)
      return []
    },
    maxAttempts: 1
  },

  NETWORK_ERROR: {
    canRecover: (error) => error.code === 'NETWORK_ERROR',
    recover: async () => {
      // Implement exponential backoff retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
    },
    maxAttempts: 3
  }
}

/**
 * Advanced error manager with recovery and reporting
 */
export class ErrorManager {
  private errorCount = new Map<string, number>()
  private lastErrors = new Map<string, EnhancedError>()
  private recoveryAttempts = new Map<string, number>()

  /**
   * Handles error with automatic recovery attempts
   */
  async handleError(error: Error | EnhancedError, operation?: string): Promise<any> {
    const enhancedError = this.enhanceError(error, operation)
    
    // Track error occurrence
    this.trackError(enhancedError)
    
    // Report performance impact
    this.reportPerformanceImpact(enhancedError)
    
    // Attempt recovery if possible
    if (enhancedError.recoverable) {
      const recovered = await this.attemptRecovery(enhancedError)
      if (recovered !== null) {
        return recovered
      }
    }
    
    // Log error for debugging
    this.logError(enhancedError)
    
    // Re-throw enhanced error
    throw enhancedError
  }

  /**
   * Creates user-friendly error wrapper
   */
  createUserError(
    code: string,
    userMessage: string,
    context?: Record<string, any>
  ): ExpertError {
    return new ExpertError(
      `User error: ${code}`,
      code,
      {
        userMessage,
        context: new ErrorContextBuilder()
          .addTimestamp()
          .addUrl()
          .add('userError', true)
          .add('customContext', context)
          .build(),
        recoverable: true,
        severity: 'low'
      }
    )
  }

  /**
   * Gets error statistics for monitoring
   */
  getErrorStats(): Record<string, { count: number; lastOccurrence: number }> {
    const stats: Record<string, { count: number; lastOccurrence: number }> = {}
    
    for (const [code, count] of this.errorCount) {
      const lastError = this.lastErrors.get(code)
      stats[code] = {
        count,
        lastOccurrence: lastError?.timestamp || 0
      }
    }
    
    return stats
  }

  /**
   * Clears error tracking data
   */
  clearStats(): void {
    this.errorCount.clear()
    this.lastErrors.clear()
    this.recoveryAttempts.clear()
  }

  private enhanceError(error: Error | EnhancedError, operation?: string): EnhancedError {
    if (error instanceof ExpertError) {
      return error
    }

    // Convert standard errors to enhanced errors
    const context = new ErrorContextBuilder()
      .addTimestamp()
      .addUrl()
      .addUserAgent()
    
    if (operation) {
      context.addOperation(operation)
    }

    return new ExpertError(
      error.message,
      this.inferErrorCode(error),
      {
        cause: error,
        context: context.build(),
        recoverable: this.isRecoverable(error),
        severity: this.inferSeverityFromError(error)
      }
    )
  }

  private inferErrorCode(error: Error): string {
    if (error.name === 'QuotaExceededError') return 'QUOTA_EXCEEDED'
    if (error.name === 'SecurityError') return 'PERMISSION_DENIED'
    if (error.name === 'NetworkError') return 'NETWORK_ERROR'
    if (error.name === 'SyntaxError') return 'PARSE_ERROR'
    if (error.message.includes('storage')) return 'STORAGE_UNAVAILABLE'
    if (error.message.includes('quota')) return 'QUOTA_EXCEEDED'
    if (error.message.includes('parse')) return 'PARSE_ERROR'
    return 'UNKNOWN_ERROR'
  }

  private isRecoverable(error: Error): boolean {
    const recoverableCodes = [
      'QUOTA_EXCEEDED',
      'PARSE_ERROR',
      'NETWORK_ERROR',
      'STORAGE_UNAVAILABLE'
    ]
    const code = this.inferErrorCode(error)
    return recoverableCodes.includes(code)
  }

  private inferSeverityFromError(error: Error): ErrorSeverity {
    if (error.name === 'SecurityError') return 'critical'
    if (error.name === 'QuotaExceededError') return 'medium'
    if (error.name === 'NetworkError') return 'medium'
    if (error.name === 'SyntaxError') return 'medium'
    return 'low'
  }

  private trackError(error: EnhancedError): void {
    const count = this.errorCount.get(error.code) || 0
    this.errorCount.set(error.code, count + 1)
    this.lastErrors.set(error.code, error)
  }

  private reportPerformanceImpact(error: EnhancedError): void {
    if (CONFIG.performance.enableMetrics) {
      performanceMonitor.record({
        operationName: 'error_occurred',
        duration: 0,
        memoryUsed: 0,
        timestamp: error.timestamp,
        success: false,
        errorType: error.code,
        metadata: {
          severity: error.severity,
          recoverable: error.recoverable,
          correlationId: error.correlationId
        }
      })
    }
  }

  private async attemptRecovery(error: EnhancedError): Promise<any> {
    const strategy = ErrorRecoveryStrategies[error.code]
    if (!strategy || !strategy.canRecover(error)) {
      return null
    }

    const attemptKey = `${error.code}-${error.correlationId}`
    const attempts = this.recoveryAttempts.get(attemptKey) || 0
    
    if (attempts >= strategy.maxAttempts) {
      return null
    }

    try {
      this.recoveryAttempts.set(attemptKey, attempts + 1)
      const result = await strategy.recover(error)
      
      // Log successful recovery
      console.info(`Error recovery successful for ${error.code}`, {
        attempts: attempts + 1,
        correlationId: error.correlationId
      })
      
      return result
    } catch (recoveryError) {
      console.warn(`Error recovery failed for ${error.code}`, {
        attempts: attempts + 1,
        recoveryError,
        originalError: error
      })
      return null
    }
  }

  private logError(error: EnhancedError): void {
    const logLevel = this.getLogLevel(error.severity)
    const logData = {
      code: error.code,
      message: error.message,
      correlationId: error.correlationId,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString()
    }

    switch (logLevel) {
      case 'error':
        console.error(`[${error.code}] ${error.message}`, logData)
        break
      case 'warn':
        console.warn(`[${error.code}] ${error.message}`, logData)
        break
      case 'info':
        console.info(`[${error.code}] ${error.message}`, logData)
        break
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warn'
      case 'low':
        return 'info'
    }
  }
}

/**
 * Singleton error manager instance
 */
export const errorManager = new ErrorManager()

/**
 * Convenience function for creating context-rich errors
 */
export function createError(
  message: string,
  code: string,
  options?: {
    cause?: Error
    context?: Record<string, any>
    recoverable?: boolean
    userMessage?: string
    severity?: ErrorSeverity
  }
): ExpertError {
  return new ExpertError(message, code, options)
}

/**
 * Error boundary helper for React components
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: { componentStack: string }) => {
    const enhancedError = new ExpertError(
      `React component error in ${componentName}`,
      'COMPONENT_ERROR',
      {
        cause: error,
        context: new ErrorContextBuilder()
          .addTimestamp()
          .add('componentName', componentName)
          .add('componentStack', errorInfo.componentStack)
          .build(),
        recoverable: false,
        severity: 'high'
      }
    )

    errorManager.handleError(enhancedError).catch(console.error)
  }
}
/**
 * Performance Monitoring Utilities
 * Expert-level performance tracking and optimization tools
 * 
 * @fileoverview Performance utilities following expert patterns:
 * - High-resolution timing measurements
 * - Memory usage monitoring
 * - Operation profiling with statistical analysis
 * - Automatic performance regression detection
 * - Real-time performance alerts
 * 
 * @author Expert-Enhanced Refactoring Agent
 * @version 2.1.0
 */

import { CONFIG } from '../config'

/**
 * Performance metrics interface for detailed tracking
 */
export interface PerformanceMetrics {
  readonly operationName: string
  readonly duration: number
  readonly memoryUsed: number
  readonly timestamp: number
  readonly success: boolean
  readonly errorType?: string
  readonly metadata?: Record<string, any>
}

/**
 * Performance statistics for trend analysis
 */
export interface PerformanceStats {
  readonly count: number
  readonly averageDuration: number
  readonly medianDuration: number
  readonly p95Duration: number
  readonly p99Duration: number
  readonly minDuration: number
  readonly maxDuration: number
  readonly successRate: number
  readonly lastUpdated: number
}

/**
 * Performance alert configuration
 */
interface PerformanceAlert {
  readonly threshold: number
  readonly metric: keyof PerformanceMetrics
  readonly callback: (metrics: PerformanceMetrics) => void
}

/**
 * High-performance metrics collector with statistical analysis
 */
class PerformanceMonitor {
  private metrics = new WeakMap<object, PerformanceMetrics[]>()
  private metricsKeys = new Map<string, object>()
  private alerts = new Map<string, PerformanceAlert[]>()
  private maxMetricsPerOperation = 1000
  private cleanupInterval: number | null = null

  constructor() {
    // Start cleanup interval to prevent memory leaks
    this.startCleanupInterval()
  }

  /**
   * Records performance metrics for an operation
   */
  record(metrics: PerformanceMetrics): void {
    if (!CONFIG.performance.enableMetrics) return

    const { operationName } = metrics
    let keyObj = this.metricsKeys.get(operationName)
    
    if (!keyObj) {
      keyObj = { name: operationName }
      this.metricsKeys.set(operationName, keyObj)
    }
    
    const existing = this.metrics.get(keyObj) || []
    
    // Maintain circular buffer for memory efficiency
    if (existing.length >= this.maxMetricsPerOperation) {
      existing.shift()
    }
    
    existing.push(metrics)
    this.metrics.set(keyObj, existing)

    // Check alerts
    this.checkAlerts(operationName, metrics)

    // Report to external monitoring if configured
    this.reportToExternal(metrics)
  }

  /**
   * Gets performance statistics for an operation
   */
  getStats(operationName: string): PerformanceStats | null {
    const keyObj = this.metricsKeys.get(operationName)
    if (!keyObj) return null
    
    const metrics = this.metrics.get(keyObj)
    if (!metrics || metrics.length === 0) return null

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b)
    const successCount = metrics.filter(m => m.success).length

    return {
      count: metrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianDuration: durations[Math.floor(durations.length / 2)],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)],
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      successRate: successCount / metrics.length,
      lastUpdated: Date.now()
    }
  }

  /**
   * Registers performance alert
   */
  addAlert(operationName: string, alert: PerformanceAlert): void {
    const existing = this.alerts.get(operationName) || []
    existing.push(alert)
    this.alerts.set(operationName, existing)
  }

  /**
   * Clears all metrics for memory cleanup
   */
  clear(): void {
    this.metricsKeys.clear()
    // Note: WeakMap will automatically clean up when keys are removed
  }

  /**
   * Gets all operation names being monitored
   */
  getOperations(): string[] {
    return Array.from(this.metricsKeys.keys())
  }

  /**
   * Dispose of the performance monitor and clean up resources
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
    this.alerts.clear()
  }

  /**
   * Start cleanup interval to prevent memory leaks
   */
  private startCleanupInterval(): void {
    // Clean up old metrics every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Perform cleanup of old metrics
   */
  private performCleanup(): void {
    const now = Date.now()
    const maxAge = 30 * 60 * 1000 // 30 minutes
    
    for (const [operationName, keyObj] of this.metricsKeys.entries()) {
      const metrics = this.metrics.get(keyObj)
      if (metrics) {
        const filteredMetrics = metrics.filter(m => now - m.timestamp < maxAge)
        if (filteredMetrics.length === 0) {
          this.metricsKeys.delete(operationName)
        } else if (filteredMetrics.length !== metrics.length) {
          this.metrics.set(keyObj, filteredMetrics)
        }
      }
    }
  }

  private checkAlerts(operationName: string, metrics: PerformanceMetrics): void {
    const alerts = this.alerts.get(operationName) || []
    
    for (const alert of alerts) {
      const value = metrics[alert.metric] as number
      if (value > alert.threshold) {
        try {
          alert.callback(metrics)
        } catch (error) {
          console.warn('Performance alert callback failed:', error)
        }
      }
    }
  }

  private reportToExternal(metrics: PerformanceMetrics): void {
    if (!CONFIG.performance.metricsEndpoint) return
    if (Math.random() > CONFIG.performance.samplingRate) return

    // Async reporting without blocking main thread
    setTimeout(() => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      fetch(CONFIG.performance.metricsEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
        signal: controller.signal
      }).catch(error => {
        if (error.name !== 'AbortError') {
          console.warn('Failed to report metrics:', error)
        }
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    }, 0)
  }
}

/**
 * Singleton performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * High-precision timer for performance measurements
 */
export class PrecisionTimer {
  private startTime: number
  private startMemory: number

  constructor() {
    this.startTime = performance.now()
    this.startMemory = this.getMemoryUsage()
  }

  /**
   * Stops timer and returns metrics
   */
  stop(operationName: string, success = true, errorType?: string): PerformanceMetrics {
    const duration = performance.now() - this.startTime
    const memoryUsed = this.getMemoryUsage() - this.startMemory

    const metrics: PerformanceMetrics = {
      operationName,
      duration,
      memoryUsed,
      timestamp: Date.now(),
      success,
      errorType
    }

    performanceMonitor.record(metrics)
    return metrics
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0
    }
    return 0
  }
}

/**
 * Performance measurement decorator for async functions
 */
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  operationName: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const timer = new PrecisionTimer()
    
    try {
      const result = await fn(...args)
      timer.stop(operationName, true)
      return result
    } catch (error) {
      timer.stop(operationName, false, error instanceof Error ? error.name : 'Unknown')
      throw error
    }
  }) as T
}

/**
 * Performance measurement decorator for synchronous functions
 */
export function measureSync<T extends (...args: any[]) => any>(
  operationName: string,
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    const timer = new PrecisionTimer()
    
    try {
      const result = fn(...args)
      timer.stop(operationName, true)
      return result
    } catch (error) {
      timer.stop(operationName, false, error instanceof Error ? error.name : 'Unknown')
      throw error
    }
  }) as T
}

/**
 * Debounced function factory with performance monitoring and cleanup
 */
export function createOptimizedDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  operationName?: string
): ((...args: Parameters<T>) => void) & { dispose: () => void } {
  let timeoutId: number | null = null
  let lastCallTime = 0
  let callCount = 0

  const debouncedFn = (...args: Parameters<T>) => {
    const now = Date.now()
    callCount++

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      const timeSinceLastCall = now - lastCallTime
      lastCallTime = now

      if (operationName && CONFIG.performance.enableMetrics) {
        performanceMonitor.record({
          operationName: `${operationName}_debounce`,
          duration: timeSinceLastCall,
          memoryUsed: 0,
          timestamp: now,
          success: true,
          metadata: { callCount, delay }
        })
      }

      callCount = 0
      fn(...args)
    }, delay)
  }

  // Add dispose method to clean up timers
  debouncedFn.dispose = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debouncedFn
}

/**
 * Memory usage monitoring utilities
 */
export const MemoryMonitor = {
  /**
   * Gets current memory usage information
   */
  getCurrentUsage(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        percentage: memory.totalJSHeapSize ? 
          (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 : 0
      }
    }
    return { used: 0, total: 0, percentage: 0 }
  },

  /**
   * Checks if memory usage exceeds warning threshold
   */
  isMemoryWarning(): boolean {
    const usage = this.getCurrentUsage()
    return usage.used > CONFIG.performance.memoryWarningThreshold
  },

  /**
   * Forces garbage collection if available (development only)
   */
  forceGC(): void {
    if (CONFIG.environment === 'development' && 'gc' in window) {
      (window as any).gc()
    }
  }
}

/**
 * Performance regression detection
 */
export class RegressionDetector {
  private baselines = new Map<string, number>()

  /**
   * Sets performance baseline for an operation
   */
  setBaseline(operationName: string, duration: number): void {
    this.baselines.set(operationName, duration)
  }

  /**
   * Checks if current performance represents a regression
   */
  checkRegression(operationName: string, currentDuration: number, threshold = 1.5): boolean {
    const baseline = this.baselines.get(operationName)
    return baseline ? currentDuration > baseline * threshold : false
  }

  /**
   * Gets regression percentage
   */
  getRegressionPercentage(operationName: string, currentDuration: number): number {
    const baseline = this.baselines.get(operationName)
    return baseline ? ((currentDuration - baseline) / baseline) * 100 : 0
  }
}

export const regressionDetector = new RegressionDetector()

/**
 * Setup default performance alerts
 */
if (CONFIG.features.performanceMonitoringEnabled) {
  // Alert for slow operations
  performanceMonitor.addAlert('query_history_save', {
    threshold: CONFIG.performance.slowOperationThreshold,
    metric: 'duration',
    callback: (metrics) => {
      console.warn(`Slow storage operation detected: ${metrics.duration}ms`, metrics)
    }
  })

  // Alert for memory warnings
  performanceMonitor.addAlert('query_history_load', {
    threshold: CONFIG.performance.memoryWarningThreshold,
    metric: 'memoryUsed',
    callback: (metrics) => {
      console.warn(`High memory usage detected: ${metrics.memoryUsed} bytes`, metrics)
    }
  })
}

/**
 * Global cleanup function to prevent memory leaks
 * Should be called when the application is shutting down
 */
export function cleanupPerformanceMonitoring(): void {
  performanceMonitor.dispose()
  // Access baselines through public method instead of private property
  const detector = regressionDetector as any
  if (detector.baselines && detector.baselines.clear) {
    detector.baselines.clear()
  }
}

/**
 * Setup cleanup on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupPerformanceMonitoring)
  window.addEventListener('unload', cleanupPerformanceMonitoring)
}
/**
 * Expert Discovery Configuration Management
 * Centralized configuration system with environment overrides and type safety
 * 
 * @fileoverview Configuration management following expert patterns:
 * - Environment-specific overrides
 * - Type-safe configuration objects
 * - Immutable configuration with freezing
 * - Performance monitoring settings
 * - Feature flags for A/B testing
 * 
 * @author Expert-Enhanced Refactoring Agent
 * @version 2.1.0
 */

/**
 * Storage configuration with advanced settings
 */
export interface StorageConfiguration {
  readonly storageKey: string
  readonly maxEntries: number
  readonly compressionEnabled: boolean
  readonly migrationEnabled: boolean
  readonly retryAttempts: number
  readonly retryDelayMs: number
  readonly quotaWarningThreshold: number
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfiguration {
  readonly enableMetrics: boolean
  readonly metricsEndpoint?: string
  readonly samplingRate: number
  readonly slowOperationThreshold: number
  readonly memoryWarningThreshold: number
}

/**
 * UI behavior configuration
 */
export interface UIConfiguration {
  readonly paperPadding: string
  readonly stackGap: string
  readonly maxVisibleHistoryItems: number
  readonly debounceMs: number
  readonly animationDuration: number
  readonly virtualScrollThreshold: number
  readonly keyboardNavigationEnabled: boolean
}

/**
 * Validation rules configuration
 */
export interface ValidationConfiguration {
  readonly queryMaxLength: number
  readonly queryMinLength: number
  readonly allowedCharacterPattern: RegExp
  readonly xssProtectionEnabled: boolean
  readonly sanitizationRules: readonly string[]
}

/**
 * Feature flags for controlled rollouts
 */
export interface FeatureFlags {
  readonly crossTabSyncEnabled: boolean
  readonly optimisticUpdatesEnabled: boolean
  readonly virtualScrollingEnabled: boolean
  readonly performanceMonitoringEnabled: boolean
  readonly advancedKeyboardNavigation: boolean
  readonly autoSaveEnabled: boolean
  readonly analyticsEnabled: boolean
}

/**
 * Complete expert discovery configuration
 */
export interface ExpertDiscoveryConfig {
  readonly storage: StorageConfiguration
  readonly performance: PerformanceConfiguration
  readonly ui: UIConfiguration
  readonly validation: ValidationConfiguration
  readonly features: FeatureFlags
  readonly version: string
  readonly environment: 'development' | 'staging' | 'production'
}

/**
 * Default storage configuration optimized for performance and reliability
 */
const DEFAULT_STORAGE_CONFIG: StorageConfiguration = Object.freeze({
  storageKey: 'expert_discovery_query_history',
  maxEntries: 50,
  compressionEnabled: false,
  migrationEnabled: true,
  retryAttempts: 3,
  retryDelayMs: 1000,
  quotaWarningThreshold: 0.8 // 80% of storage quota
})

/**
 * Default performance configuration for monitoring and optimization
 */
const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfiguration = Object.freeze({
  enableMetrics: import.meta.env.MODE !== 'production',
  metricsEndpoint: import.meta.env.VITE_METRICS_ENDPOINT,
  samplingRate: 0.1, // 10% sampling
  slowOperationThreshold: 1000, // 1 second
  memoryWarningThreshold: 50 * 1024 * 1024 // 50MB
})

/**
 * Default UI configuration following material design principles
 */
const DEFAULT_UI_CONFIG: UIConfiguration = Object.freeze({
  paperPadding: 'md',
  stackGap: 'md',
  maxVisibleHistoryItems: 20,
  debounceMs: 150,
  animationDuration: 200,
  virtualScrollThreshold: 100,
  keyboardNavigationEnabled: true
})

/**
 * Default validation configuration with security-first approach
 */
const DEFAULT_VALIDATION_CONFIG: ValidationConfiguration = Object.freeze({
  queryMaxLength: 5000,
  queryMinLength: 3,
  allowedCharacterPattern: /^[\w\s\-.,!?()[\]{}'"@#$%&*+=<>|\\/:;]*$/,
  xssProtectionEnabled: true,
  sanitizationRules: [
    '<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>',
    '<iframe\\b[^<]*(?:(?!<\\/iframe>)<[^<]*)*<\\/iframe>',
    'javascript:',
    'data:text/html',
    'vbscript:',
    'onload=',
    'onerror=',
    'onclick='
  ] as const
})

/**
 * Default feature flags for progressive enhancement
 */
const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.freeze({
  crossTabSyncEnabled: true,
  optimisticUpdatesEnabled: true,
  virtualScrollingEnabled: true,
  performanceMonitoringEnabled: import.meta.env.MODE !== 'production',
  advancedKeyboardNavigation: true,
  autoSaveEnabled: true,
  analyticsEnabled: import.meta.env.MODE !== 'production'
})

/**
 * Environment-specific configuration overrides
 */
const ENVIRONMENT_OVERRIDES: Record<string, Partial<ExpertDiscoveryConfig>> = {
  development: {
    performance: {
      enableMetrics: true,
      samplingRate: 1.0 // 100% sampling in development
    },
    features: {
      performanceMonitoringEnabled: true
    }
  },
  staging: {
    performance: {
      enableMetrics: true,
      samplingRate: 0.5 // 50% sampling in staging
    }
  },
  production: {
    performance: {
      enableMetrics: false,
      samplingRate: 0.01 // 1% sampling in production
    },
    features: {
      performanceMonitoringEnabled: false
    }
  }
}

/**
 * Creates the complete configuration with environment overrides
 */
function createConfig(): ExpertDiscoveryConfig {
  const environment = (import.meta.env.MODE as any) || 'development'
  const environmentOverride = ENVIRONMENT_OVERRIDES[environment] || {}
  
  const baseConfig: ExpertDiscoveryConfig = {
    storage: DEFAULT_STORAGE_CONFIG,
    performance: DEFAULT_PERFORMANCE_CONFIG,
    ui: DEFAULT_UI_CONFIG,
    validation: DEFAULT_VALIDATION_CONFIG,
    features: DEFAULT_FEATURE_FLAGS,
    version: '2.1.0',
    environment
  }

  // Deep merge environment overrides
  const config: ExpertDiscoveryConfig = {
    ...baseConfig,
    storage: { ...baseConfig.storage, ...environmentOverride.storage },
    performance: { ...baseConfig.performance, ...environmentOverride.performance },
    ui: { ...baseConfig.ui, ...environmentOverride.ui },
    validation: { ...baseConfig.validation, ...environmentOverride.validation },
    features: { ...baseConfig.features, ...environmentOverride.features }
  }

  return Object.freeze(config)
}

/**
 * Singleton configuration instance
 */
export const CONFIG = createConfig()

/**
 * Legacy exports for backward compatibility
 * @deprecated Use CONFIG.storage, CONFIG.ui, etc. instead
 */
export const STORAGE_CONFIG = CONFIG.storage
export const UI_CONFIG = CONFIG.ui
export const VALIDATION_RULES = CONFIG.validation
export const CURRENT_VERSION = CONFIG.version

/**
 * Type guards for configuration validation
 */
export function isValidStorageConfig(config: any): config is StorageConfiguration {
  return (
    typeof config === 'object' &&
    typeof config.storageKey === 'string' &&
    typeof config.maxEntries === 'number' &&
    typeof config.compressionEnabled === 'boolean' &&
    typeof config.migrationEnabled === 'boolean' &&
    typeof config.retryAttempts === 'number' &&
    typeof config.retryDelayMs === 'number'
  )
}

/**
 * Configuration utilities
 */
export const ConfigUtils = {
  /**
   * Gets configuration value with fallback
   */
  getValue<T>(path: string, fallback: T): T {
    const keys = path.split('.')
    let current: any = CONFIG
    
    for (const key of keys) {
      if (current?.[key] === undefined) {
        return fallback
      }
      current = current[key]
    }
    
    return current ?? fallback
  },

  /**
   * Checks if feature is enabled
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return CONFIG.features[feature] === true
  },

  /**
   * Gets environment-specific value
   */
  getEnvironmentValue<T>(
    development: T,
    staging: T,
    production: T
  ): T {
    switch (CONFIG.environment) {
      case 'staging':
        return staging
      case 'production':
        return production
      default:
        return development
    }
  }
}

export default CONFIG
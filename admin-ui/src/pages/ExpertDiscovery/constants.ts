/**
 * Expert Discovery Constants (Legacy)
 * 
 * @deprecated Use CONFIG from './config' instead for centralized configuration
 * @fileoverview Legacy constants maintained for backward compatibility
 */

import { CONFIG } from './config'

/**
 * @deprecated Use CONFIG.validation instead
 */
export const VALIDATION_RULES = {
  queryMaxLength: CONFIG.validation.queryMaxLength,
  queryMinLength: CONFIG.validation.queryMinLength,
  maxResults: {
    min: 1,
    max: 50
  },
  teamSize: {
    min: 1,
    max: 10
  },
  confidenceThreshold: {
    min: 0.0,
    max: 1.0,
    step: 0.1
  }
} as const

/**
 * @deprecated Use CONFIG.ui instead
 */
export const UI_CONFIG = {
  paperPadding: CONFIG.ui.paperPadding,
  stackGap: CONFIG.ui.stackGap,
  maxQueryHistoryItems: CONFIG.ui.maxVisibleHistoryItems
} as const

// Export missing constants for backward compatibility
export const DEFAULT_QUERY_PARAMETERS = {
  algorithm: 'hybrid' as const,
  maxResults: 10,
  includeInactive: false,
  confidenceThreshold: 0.8,
  technologies: [],
  experienceLevel: 'senior',
  teamSize: 1
}

export const ALGORITHM_OPTIONS = [
  { value: 'vector', label: 'Vector Search' },
  { value: 'graph', label: 'Graph Search' },
  { value: 'hybrid', label: 'Hybrid Search' }
]

export const TECHNOLOGY_OPTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'Rust'
]

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'expert', label: 'Expert' }
]

export const CONFIDENCE_SLIDER_MARKS = [
  { value: 0, label: '0%' },
  { value: 0.5, label: '50%' },
  { value: 1, label: '100%' }
]

export const ANALYTICS_CONFIG = {
  enableTracking: CONFIG.features.analyticsEnabled,
  samplingRate: 0.1,
  metricsEndpoint: '/api/analytics',
  measurementId: 'G-XXXXXXXXXX', // Placeholder - replace with actual GA4 measurement ID
  pageTitle: 'Expert Discovery',
  events: {
    search: 'expert_search',
    tabSwitch: 'tab_switch',
    parameterChange: 'parameter_change',
    pageView: 'page_view'
  }
}

export const QUERY_CONFIG = {
  defaultMaxResults: 10,
  defaultAlgorithm: 'hybrid' as const,
  defaultConfidenceThreshold: 0.8
}

export const KEYBOARD_SHORTCUTS = {
  search: 'ctrl+enter',
  clear: 'ctrl+shift+x',
  toggleHistory: 'ctrl+h'
}

export const EXPERT_DISCOVERY_TABS = [
  { value: 'search', label: 'Search Experts', shortcut: 'Ctrl+1' },
  { value: 'analytics', label: 'Analytics', shortcut: 'Ctrl+2' },
  { value: 'history', label: 'History', shortcut: 'Ctrl+3' }
]
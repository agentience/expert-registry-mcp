/**
 * Constants and configuration for Expert Discovery feature
 */

import type { QueryParameters, TabConfig, SearchAlgorithm, ExperienceLevel } from '../types'

// Default parameter values
export const DEFAULT_QUERY_PARAMETERS: QueryParameters = {
  algorithm: 'hybrid',
  maxResults: 10,
  includeInactive: false,
  confidenceThreshold: 0.7,
  technologies: [],
  experienceLevel: 'any',
  teamSize: 1
} as const

// Tab configuration
export const EXPERT_DISCOVERY_TABS: TabConfig[] = [
  { value: 'query-builder', label: 'Query Builder', shortcut: 'Ctrl+1' },
  { value: 'technology-detection', label: 'Technology Detection', shortcut: 'Ctrl+2' }
] as const

// Search algorithm options
export const ALGORITHM_OPTIONS = [
  { value: 'hybrid' as SearchAlgorithm, label: 'Hybrid (Vector + Graph)' },
  { value: 'vector' as SearchAlgorithm, label: 'Vector Search Only' },
  { value: 'graph' as SearchAlgorithm, label: 'Graph Search Only' },
  { value: 'keyword' as SearchAlgorithm, label: 'Keyword Matching' }
] as const

// Experience level options
export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'any', label: 'Any Level' },
  { value: 'junior' as ExperienceLevel, label: 'Junior (1-2 years)' },
  { value: 'mid' as ExperienceLevel, label: 'Mid-level (3-5 years)' },
  { value: 'senior' as ExperienceLevel, label: 'Senior (5+ years)' },
  { value: 'expert' as ExperienceLevel, label: 'Expert (10+ years)' }
] as const

// Technology options (in production, this might come from an API)
export const TECHNOLOGY_OPTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go',
  'Docker', 'Kubernetes', 'AWS', 'PostgreSQL', 'MongoDB', 'Redis',
  'Vue.js', 'Angular', 'Next.js', 'GraphQL', 'Express.js', 'FastAPI',
  'Spring Boot', 'Django', 'Flask', 'Nginx', 'Apache', 'Jenkins'
] as const

// Validation constraints
export const VALIDATION_RULES = {
  maxResults: { min: 1, max: 50 },
  teamSize: { min: 1, max: 10 },
  confidenceThreshold: { min: 0.1, max: 1.0, step: 0.1 },
  queryMaxLength: 1000,
  queryMinLength: 3
} as const

// Slider marks for confidence threshold
export const CONFIDENCE_SLIDER_MARKS = [
  { value: 0.1, label: '10%' },
  { value: 0.5, label: '50%' },
  { value: 0.9, label: '90%' }
] as const

// Query client configuration
export const QUERY_CONFIG = {
  staleTime: 30000, // 30 seconds
  gcTime: 300000, // 5 minutes
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000)
} as const

// Mock API configuration
export const MOCK_API_CONFIG = {
  discoverExpertsDelay: 500,
  getExpertDetailsDelay: 200,
  mockExpertsCount: 20
} as const

// Analytics configuration
export const ANALYTICS_CONFIG = {
  pageTitle: 'Expert Discovery Testing',
  measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || `GA-${Date.now()}`,
  events: {
    tabSwitch: 'expert_discovery_tab_switch',
    search: 'expert_discovery_search',
    parameterChange: 'expert_discovery_parameter_change'
  }
} as const

// Keyboard shortcuts mapping
export const KEYBOARD_SHORTCUTS = {
  'Ctrl+1': 'query-builder',
  'Ctrl+2': 'technology-detection'
} as const

// UI constants
export const UI_CONFIG = {
  containerSize: 'xl',
  paperPadding: 'md',
  stackGap: 'md',
  maxQueryHistoryItems: 5
} as const
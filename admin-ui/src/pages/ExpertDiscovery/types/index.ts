/**
 * Shared types and interfaces for Expert Discovery feature
 */

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'expert'

export type SearchAlgorithm = 'hybrid' | 'vector' | 'graph' | 'keyword'

// Match the backend Expert model structure
export interface ExpertSpecialization {
  technology: string
  frameworks: string[]
  expertise_level: string
}

export interface PerformanceMetrics {
  average_adherence_score: number
  successful_applications: number
  total_applications: number
  last_used?: string
}

export interface ExpertScores {
  total_score: number
  technology_match: number
  workflow_compatibility: number
  performance_history: number
  capability_assessment: number
  semantic_similarity: number
  graph_connectivity: number
}

export interface Expert {
  id: string
  name: string
  version: string
  description: string
  domains: string[]
  specializations: ExpertSpecialization[]
  workflow_compatibility: Record<string, number>
  performance_metrics?: PerformanceMetrics
  constraints: string[]
  patterns: string[]
  quality_standards: string[]
  tools_required: string[]
  created_at: string
  updated_at: string
  
  // Additional fields from backend
  confidence: number
  active: boolean
  experience_level?: string
  scores?: ExpertScores
}

export interface QueryParameters {
  algorithm: SearchAlgorithm
  maxResults: number
  includeInactive: boolean
  confidenceThreshold: number
  technologies: string[]
  experienceLevel: string
  teamSize: number
}

export interface ExpertDiscoveryQuery extends QueryParameters {
  query: string
}

export interface ExpertDiscoveryResult {
  experts: Expert[]
  totalCount: number
  searchTime: number
  algorithm: SearchAlgorithm
  query: string
}

export interface TabConfig {
  value: string
  label: string
  shortcut?: string
}

export interface BreadcrumbItem {
  title: string
  href: string
}

// Component prop types
export interface QueryInputProps {
  onQueryChange?: (query: string) => void
  onSearch?: (query: string) => void
  isLoading?: boolean
  error?: string | null
  placeholder?: string
  maxLength?: number
}

export interface QueryParametersProps {
  onParametersChange?: (parameters: QueryParameters) => void
  initialParameters?: Partial<QueryParameters>
  disabled?: boolean
}

// Analytics types
export interface AnalyticsConfig {
  measurementId: string
  pageTitle: string
}

// Error types
export type ExpertDiscoveryError = Error | null

// Hook return types
export interface UseExpertDiscoveryReturn {
  // Data
  data: ExpertDiscoveryResult | undefined | null
  experts: Expert[]
  totalCount: number
  searchTime: number
  
  // Loading states
  isLoading: boolean
  isDiscovering: boolean
  isLoadingDetails: boolean
  
  // Error states
  error: ExpertDiscoveryError
  discoveryError: ExpertDiscoveryError
  detailsError: ExpertDiscoveryError
  
  // Actions
  discoverExperts: (query: ExpertDiscoveryQuery) => Promise<ExpertDiscoveryResult>
  getExpertDetails: (expertId: string) => Promise<Expert>
  clearResults: () => void
  refetch: () => void
  
  // State
  lastQuery: ExpertDiscoveryQuery | null
  hasSearched: boolean
}
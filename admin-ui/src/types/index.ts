export interface Expert {
  id: string
  name: string
  version: string
  description: string
  domains: string[]
  specializations: Specialization[]
  constraints: string[]
  patterns: string[]
  quality_standards: string[]
  workflow_compatibility: WorkflowCompatibility
  performance_metrics?: PerformanceMetrics
}

export interface Specialization {
  technology: string
  frameworks: string[]
  expertise_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface WorkflowCompatibility {
  feature: number
  'bug-fix': number
  refactoring: number
  investigation: number
  article: number
}

export interface PerformanceMetrics {
  average_adherence_score: number
  successful_applications: number
  total_applications: number
  success_rate?: number
}

export interface SystemStats {
  total_experts: number
  active_tasks: number
  success_rate: number
  avg_response_time: number
  total_requests_today: number
  total_requests_week: number
}

export interface ExpertStats {
  expert_id: string
  usage_count: number
  success_rate: number
  average_response_time: number
  last_used: string
  trend_data: TrendPoint[]
}

export interface TrendPoint {
  date: string
  value: number
}

export interface User {
  id: string
  email: string
  name: string
  role: 'viewer' | 'editor' | 'admin'
}

export interface TaskHistory {
  id: string
  expert_id: string
  task_type: string
  success: boolean
  adherence_score?: number
  created_at: string
  duration_ms?: number
}

export interface UsageData {
  date: string
  total: number
  successful: number
  failed: number
}

export interface ExpertFormData {
  id: string
  name: string
  version: string
  description: string
  domains: string[]
  specializations: Specialization[]
  workflow_compatibility: WorkflowCompatibility
  constraints: string[]
  patterns: string[]
  quality_standards: string[]
}
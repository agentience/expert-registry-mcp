// Types for overview statistics API response

export interface TopExpert {
  id: string
  name: string
  specialization: string
  expertiseLevel: string
  usageCount: number
}

export interface ActivityItem {
  id: string
  timestamp: string
  type: 'expert_added' | 'expert_updated' | 'expert_deleted'
  message: string
  expertId: string
}

export interface OverviewStats {
  totalExperts: number
  activeExperts: number
  inactiveExperts: number
  expertsCountBySpecialization: Record<string, number>
  expertsCountByStatus: {
    active: number
    inactive: number
  }
  expertsCountByExpertiseLevel: Record<string, number>
  topExperts: TopExpert[]
  recentActivity: ActivityItem[]
}
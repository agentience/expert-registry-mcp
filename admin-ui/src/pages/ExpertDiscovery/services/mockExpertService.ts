/**
 * Mock expert service for development and testing
 */

import type { Expert, ExpertDiscoveryQuery, ExpertDiscoveryResult } from '../types'
import { MOCK_API_CONFIG } from '../constants'
import { filterExpertsByParameters, sortExpertsByConfidence } from '../utils'

// Expanded mock expert data
const MOCK_EXPERTS: Expert[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'Senior Frontend Developer',
    specializations: ['React', 'TypeScript', 'UI/UX', 'Web Performance'],
    technologies: ['React', 'TypeScript', 'Jest', 'Vite', 'Webpack', 'Sass'],
    experienceLevel: 'senior',
    confidence: 0.92,
    active: true,
    lastActive: '2024-01-15'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    title: 'Full Stack Engineer',
    specializations: ['Node.js', 'GraphQL', 'Database Design', 'API Development'],
    technologies: ['Node.js', 'GraphQL', 'PostgreSQL', 'Docker', 'Express.js', 'Redis'],
    experienceLevel: 'senior',
    confidence: 0.88,
    active: true,
    lastActive: '2024-01-14'
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    title: 'DevOps Engineer',
    specializations: ['Cloud Infrastructure', 'CI/CD', 'Monitoring', 'Security'],
    technologies: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Prometheus'],
    experienceLevel: 'expert',
    confidence: 0.94,
    active: true,
    lastActive: '2024-01-16'
  },
  {
    id: '4',
    name: 'Alex Kim',
    title: 'Backend Developer',
    specializations: ['Python', 'Machine Learning', 'Data Processing', 'APIs'],
    technologies: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'Redis', 'Celery'],
    experienceLevel: 'mid',
    confidence: 0.75,
    active: true,
    lastActive: '2024-01-13'
  },
  {
    id: '5',
    name: 'Jordan Taylor',
    title: 'Mobile Developer',
    specializations: ['React Native', 'iOS', 'Android', 'Cross-platform'],
    technologies: ['React Native', 'TypeScript', 'Swift', 'Kotlin', 'Expo'],
    experienceLevel: 'senior',
    confidence: 0.86,
    active: false,
    lastActive: '2023-12-20'
  },
  {
    id: '6',
    name: 'Maya Patel',
    title: 'Data Engineer',
    specializations: ['Big Data', 'ETL', 'Data Warehousing', 'Analytics'],
    technologies: ['Python', 'Apache Spark', 'PostgreSQL', 'MongoDB', 'Kafka'],
    experienceLevel: 'senior',
    confidence: 0.89,
    active: true,
    lastActive: '2024-01-12'
  },
  {
    id: '7',
    name: 'Chris Anderson',
    title: 'Junior Developer',
    specializations: ['JavaScript', 'Web Development', 'Learning', 'Frontend'],
    technologies: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
    experienceLevel: 'junior',
    confidence: 0.65,
    active: true,
    lastActive: '2024-01-16'
  },
  {
    id: '8',
    name: 'Dr. Lisa Wang',
    title: 'ML Research Engineer',
    specializations: ['Machine Learning', 'Deep Learning', 'Research', 'AI'],
    technologies: ['Python', 'TensorFlow', 'PyTorch', 'Jupyter', 'NumPy'],
    experienceLevel: 'expert',
    confidence: 0.96,
    active: true,
    lastActive: '2024-01-15'
  }
]

/**
 * Simulates API delay
 */
const simulateDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock function to discover experts based on query
 */
export const mockDiscoverExperts = async (query: ExpertDiscoveryQuery): Promise<ExpertDiscoveryResult> => {
  await simulateDelay(MOCK_API_CONFIG.discoverExpertsDelay)
  
  // Debug logging
  console.log('🔍 Expert Discovery Debug:', {
    query: query.query,
    confidenceThreshold: query.confidenceThreshold,
    technologies: query.technologies,
    includeInactive: query.includeInactive,
    experienceLevel: query.experienceLevel
  })
  
  // Simple text search simulation
  const searchTerms = query.query.toLowerCase().split(' ').filter(Boolean)
  console.log('📝 Search terms:', searchTerms)
  
  let filteredExperts = MOCK_EXPERTS.filter(expert => {
    // Text search in name, title, specializations
    const searchableText = [
      expert.name,
      expert.title,
      ...expert.specializations,
      ...expert.technologies
    ].join(' ').toLowerCase()
    
    const hasMatch = searchTerms.some(term => searchableText.includes(term))
    if (hasMatch) {
      console.log(`✅ Text match: ${expert.name} (confidence: ${expert.confidence})`)
    }
    return hasMatch
  })

  console.log(`📊 After text search: ${filteredExperts.length} experts`)

  // Apply parameter filters
  filteredExperts = filterExpertsByParameters(filteredExperts, query)
  console.log(`📊 After parameter filters: ${filteredExperts.length} experts`)
  
  // Sort by confidence
  filteredExperts = sortExpertsByConfidence(filteredExperts)
  
  // Apply result limit
  const limitedExperts = filteredExperts.slice(0, query.maxResults)
  
  // Simulate different algorithms affecting confidence slightly
  const adjustedExperts = limitedExperts.map(expert => {
    let confidenceAdjustment = 0
    
    switch (query.algorithm) {
      case 'vector':
        confidenceAdjustment = Math.random() * 0.05 - 0.025 // ±2.5%
        break
      case 'graph':
        confidenceAdjustment = Math.random() * 0.1 - 0.05 // ±5%
        break
      case 'keyword':
        confidenceAdjustment = Math.random() * 0.15 - 0.075 // ±7.5%
        break
      default: // hybrid
        confidenceAdjustment = Math.random() * 0.02 - 0.01 // ±1%
    }
    
    return {
      ...expert,
      confidence: Math.max(0, Math.min(1, expert.confidence + confidenceAdjustment))
    }
  })

  const searchTime = Math.random() * 100 + 50 // 50-150ms

  return {
    experts: adjustedExperts,
    totalCount: filteredExperts.length,
    searchTime,
    algorithm: query.algorithm,
    query: query.query
  }
}

/**
 * Mock function to get expert details
 */
export const mockGetExpertDetails = async (expertId: string): Promise<Expert> => {
  await simulateDelay(MOCK_API_CONFIG.getExpertDetailsDelay)
  
  const expert = MOCK_EXPERTS.find(e => e.id === expertId)
  
  if (!expert) {
    throw new Error(`Expert with ID ${expertId} not found`)
  }
  
  return expert
}

/**
 * Mock function to get all available technologies
 */
export const mockGetAvailableTechnologies = async (): Promise<string[]> => {
  await simulateDelay(100)
  
  const allTechnologies = new Set<string>()
  
  MOCK_EXPERTS.forEach(expert => {
    expert.technologies.forEach(tech => allTechnologies.add(tech))
    expert.specializations.forEach(spec => allTechnologies.add(spec))
  })
  
  return Array.from(allTechnologies).sort()
}

/**
 * Mock function to get expert statistics
 */
export const mockGetExpertStatistics = async () => {
  await simulateDelay(200)
  
  const activeExperts = MOCK_EXPERTS.filter(e => e.active).length
  const totalExperts = MOCK_EXPERTS.length
  
  const experienceLevels = MOCK_EXPERTS.reduce((acc, expert) => {
    acc[expert.experienceLevel] = (acc[expert.experienceLevel] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    totalExperts,
    activeExperts,
    inactiveExperts: totalExperts - activeExperts,
    experienceLevels,
    averageConfidence: MOCK_EXPERTS.reduce((sum, e) => sum + e.confidence, 0) / totalExperts
  }
}
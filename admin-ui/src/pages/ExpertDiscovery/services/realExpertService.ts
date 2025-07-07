/**
 * Real expert service using MCP endpoints
 */

import type { Expert, ExpertDiscoveryQuery, ExpertDiscoveryResult } from '../types'
import { discoveryApi } from '../../../services/api'


/**
 * Convert UI query parameters to MCP context format
 */
const convertToMcpContext = (query: ExpertDiscoveryQuery) => {
  return {
    description: query.query,
    technologies: query.technologies || [],
    constraints: [
      ...(query.experienceLevel !== 'any' ? [`Experience level: ${query.experienceLevel}`] : [])
    ],
    workflow_type: 'feature', // Default to feature workflow
    include_inactive: query.includeInactive,
    max_results: query.maxResults,
    confidence_threshold: query.confidenceThreshold
  }
}

/**
 * Real function to discover experts using MCP smart discovery
 */
export const realDiscoverExperts = async (query: ExpertDiscoveryQuery): Promise<ExpertDiscoveryResult> => {
  const startTime = Date.now()
  
  try {
    console.log('🚀 Real Expert Discovery:', {
      query: query.query,
      algorithm: query.algorithm,
      confidenceThreshold: query.confidenceThreshold,
      technologies: query.technologies
    })

    let result: ExpertDiscoveryResult
    
    let response: any
    
    // Choose the appropriate endpoint based on algorithm
    switch (query.algorithm) {
      case 'vector':
      case 'hybrid':
        // Use smart discover for vector and hybrid searches
        const context = convertToMcpContext(query)
        response = await discoveryApi.smartDiscover(context)
        break
        
      case 'keyword':
        // Use basic search for keyword matching  
        response = await discoveryApi.search(query.query)
        break
        
      case 'graph':
        // Use semantic search for graph-based discovery
        response = await discoveryApi.semanticSearch(query.query, 'patterns', query.maxResults)
        break
        
      default:
        // Default to smart discover
        const defaultContext = convertToMcpContext(query)
        response = await discoveryApi.smartDiscover(defaultContext)
    }

    // Get result from API response
    result = response.data
    
    // Get experts from result
    let experts = result.experts || []
    
    // Apply additional client-side filtering
    experts = experts.filter(expert => {
      // For now, we don't have confidence scores from the backend
      // The backend already applies its own scoring and filtering
      
      // Check if the expert has recent activity (based on last_used)
      if (!query.includeInactive && expert.performance_metrics?.last_used) {
        const lastUsed = new Date(expert.performance_metrics.last_used)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        
        if (lastUsed < sixMonthsAgo) {
          console.log(`❌ ${expert.name} filtered out: inactive (last used ${lastUsed.toLocaleDateString()})`)
          return false
        }
      }
      
      // Filter by experience level based on expertise_level in specializations
      if (query.experienceLevel !== 'any') {
        const hasMatchingLevel = expert.specializations?.some(spec => {
          // Map our UI experience levels to backend expertise levels
          const levelMap: Record<string, string[]> = {
            'junior': ['beginner', 'intermediate'],
            'mid': ['intermediate', 'advanced'],
            'senior': ['advanced', 'expert'],
            'expert': ['expert']
          }
          
          const acceptableLevels = levelMap[query.experienceLevel] || []
          return acceptableLevels.includes(spec.expertise_level)
        })
        
        if (!hasMatchingLevel) {
          console.log(`❌ ${expert.name} filtered out: no matching expertise level for ${query.experienceLevel}`)
          return false
        }
      }
      
      console.log(`✅ ${expert.name} passed all filters`)
      return true
    })

    // Limit results
    experts = experts.slice(0, query.maxResults)

    console.log(`📊 Final results: ${experts.length} experts`)

    return {
      experts,
      totalCount: experts.length,
      searchTime: result.searchTime || result.search_time || 0,
      algorithm: query.algorithm,
      query: query.query
    }
    
  } catch (error: any) {
    console.error('❌ Expert discovery failed:', error)
    if (error.response?.data) {
      console.error('Error details:', error.response.data)
    }
    
    // Return empty results on error
    return {
      experts: [],
      totalCount: 0,
      searchTime: Date.now() - startTime,
      algorithm: query.algorithm,
      query: query.query
    }
  }
}

/**
 * Real function to get expert details
 */
export const realGetExpertDetails = async (expertId: string): Promise<Expert> => {
  try {
    const response = await discoveryApi.getExpert(expertId, true)
    return response.data
  } catch (error) {
    console.error(`❌ Failed to get expert details for ${expertId}:`, error)
    throw new Error(`Expert with ID ${expertId} not found`)
  }
}

/**
 * Real function to get available technologies
 */
export const realGetAvailableTechnologies = async (): Promise<string[]> => {
  try {
    // Get all experts and extract their technologies
    const response = await discoveryApi.search('')
    const experts = response.data?.experts || []
    
    const allTechnologies = new Set<string>()
    
    experts.forEach((expert: any) => {
      expert.specializations?.forEach((spec: any) => {
        if (spec.technology) allTechnologies.add(spec.technology)
        if (spec.frameworks) {
          spec.frameworks.forEach((framework: string) => allTechnologies.add(framework))
        }
      })
      expert.domains?.forEach((domain: string) => allTechnologies.add(domain))
    })
    
    return Array.from(allTechnologies).sort()
  } catch (error) {
    console.error('❌ Failed to get available technologies:', error)
    // Return fallback technologies from the known experts
    return ['React', 'TypeScript', 'AWS', 'DynamoDB', 'Next.js', 'Node.js', 'AWS Amplify Gen 2', 'AWS Cloudscape']
  }
}

/**
 * Real function to get expert statistics
 */
export const realGetExpertStatistics = async () => {
  try {
    const response = await discoveryApi.search('')
    const experts = response.data?.experts || []
    
    const totalExperts = experts.length
    const activeExperts = experts.filter((e: any) => e.active !== false).length
    
    const experienceLevels = experts.reduce((acc: Record<string, number>, expert: any) => {
      const levels = expert.specializations?.map((spec: any) => spec.expertise_level) || []
      const level = levels.includes('expert') ? 'expert' :
                   levels.includes('advanced') ? 'senior' : 
                   levels.includes('intermediate') ? 'mid' : 'junior'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {})
    
    const averageConfidence = experts.reduce((sum: number, e: any) => {
      const confidence = e.performance_metrics?.successful_applications / 
                        Math.max(e.performance_metrics?.total_applications || 1, 1) || 0.8
      return sum + confidence
    }, 0) / Math.max(totalExperts, 1)
    
    return {
      totalExperts,
      activeExperts,
      inactiveExperts: totalExperts - activeExperts,
      experienceLevels,
      averageConfidence
    }
  } catch (error) {
    console.error('❌ Failed to get expert statistics:', error)
    return {
      totalExperts: 0,
      activeExperts: 0,
      inactiveExperts: 0,
      experienceLevels: {},
      averageConfidence: 0
    }
  }
}
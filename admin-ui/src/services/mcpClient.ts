/**
 * MCP client for connecting to the Expert Registry MCP server
 */

import type { Expert, ExpertDiscoveryQuery, ExpertDiscoveryResult } from '../pages/ExpertDiscovery/types'

// MCP server configuration
const MCP_BASE_URL = 'http://localhost:8080'

/**
 * Call an MCP tool via SSE transport
 */
async function callMcpTool<T = any>(toolName: string, arguments_: Record<string, any>): Promise<T> {
  try {
    // For now, since the MCP server is running SSE transport and we need HTTP access,
    // we'll fallback to the mock data until proper MCP client integration is set up
    console.warn(`⚠️ MCP SSE transport not yet implemented in browser. Tool: ${toolName}`)
    throw new Error('MCP SSE transport not implemented in browser client')
  } catch (error) {
    console.error(`❌ MCP tool call failed for ${toolName}:`, error)
    throw error
  }
}

/**
 * Convert MCP expert format to UI expert format
 */
const convertMcpExpertToUiExpert = (mcpExpert: any): Expert => {
  // Extract technologies from specializations
  const technologies = mcpExpert.specializations?.map((spec: any) => spec.technology) || []
  const frameworks = mcpExpert.specializations?.flatMap((spec: any) => spec.frameworks || []) || []
  
  // Determine experience level from expertise levels
  const expertiseLevels = mcpExpert.specializations?.map((spec: any) => spec.expertise_level) || []
  const experienceLevel = expertiseLevels.includes('expert') ? 'expert' :
                         expertiseLevels.includes('advanced') ? 'senior' : 
                         expertiseLevels.includes('intermediate') ? 'mid' : 'junior'

  // Calculate confidence from performance metrics
  const metrics = mcpExpert.performance_metrics
  const confidence = metrics ? 
    (metrics.successful_applications / Math.max(metrics.total_applications, 1)) : 0.8

  return {
    id: mcpExpert.id,
    name: mcpExpert.name,
    title: mcpExpert.description || mcpExpert.name,
    specializations: [...technologies, ...mcpExpert.domains || []],
    technologies: [...technologies, ...frameworks],
    experienceLevel,
    confidence,
    active: true, // MCP experts are considered active
    lastActive: metrics?.last_used || new Date().toISOString().split('T')[0]
  }
}

/**
 * MCP client for expert discovery
 */
export const mcpClient = {
  /**
   * Smart discovery using hybrid AI engine
   */
  async smartDiscover(context: any): Promise<ExpertDiscoveryResult> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 MCP Smart Discovery:', context)
      
      const result = await callMcpTool('expert_smart_discover', { context })
      
      const experts = result.experts?.map(convertMcpExpertToUiExpert) || []
      const searchTime = Date.now() - startTime
      
      return {
        experts,
        totalCount: experts.length,
        searchTime,
        algorithm: 'hybrid',
        query: context.description || ''
      }
    } catch (error) {
      console.error('❌ Smart discovery failed:', error)
      return {
        experts: [],
        totalCount: 0,
        searchTime: Date.now() - startTime,
        algorithm: 'hybrid',
        query: context.description || ''
      }
    }
  },

  /**
   * Semantic search using natural language
   */
  async semanticSearch(query: string, searchMode = 'hybrid', limit = 5): Promise<ExpertDiscoveryResult> {
    const startTime = Date.now()
    
    try {
      console.log('🔍 MCP Semantic Search:', { query, searchMode, limit })
      
      const result = await callMcpTool('expert_semantic_search', {
        query,
        search_mode: searchMode,
        limit
      })
      
      const experts = result.experts?.map(convertMcpExpertToUiExpert) || []
      const searchTime = Date.now() - startTime
      
      return {
        experts,
        totalCount: experts.length,
        searchTime,
        algorithm: 'vector',
        query
      }
    } catch (error) {
      console.error('❌ Semantic search failed:', error)
      return {
        experts: [],
        totalCount: 0,
        searchTime: Date.now() - startTime,
        algorithm: 'vector',
        query
      }
    }
  },

  /**
   * Basic text search
   */
  async search(query: string, searchFields?: string[]): Promise<ExpertDiscoveryResult> {
    const startTime = Date.now()
    
    try {
      console.log('📝 MCP Basic Search:', { query, searchFields })
      
      const result = await callMcpTool('expert_registry_search', {
        query,
        search_fields: searchFields
      })
      
      const experts = result.experts?.map(convertMcpExpertToUiExpert) || []
      const searchTime = Date.now() - startTime
      
      return {
        experts,
        totalCount: experts.length,
        searchTime,
        algorithm: 'keyword',
        query
      }
    } catch (error) {
      console.error('❌ Basic search failed:', error)
      return {
        experts: [],
        totalCount: 0,
        searchTime: Date.now() - startTime,
        algorithm: 'keyword',
        query
      }
    }
  },

  /**
   * Get expert details
   */
  async getExpert(expertId: string, includeContext = true): Promise<Expert> {
    try {
      console.log('👤 Getting expert details:', expertId)
      
      const result = await callMcpTool('expert_registry_get', {
        expert_id: expertId,
        include_context: includeContext
      })
      
      return convertMcpExpertToUiExpert(result)
    } catch (error) {
      console.error(`❌ Failed to get expert ${expertId}:`, error)
      throw new Error(`Expert with ID ${expertId} not found`)
    }
  },

  /**
   * List all experts
   */
  async listExperts(): Promise<Expert[]> {
    try {
      console.log('📋 Listing all experts')
      
      const result = await callMcpTool('expert_registry_list', {})
      
      return result.experts?.map(convertMcpExpertToUiExpert) || []
    } catch (error) {
      console.error('❌ Failed to list experts:', error)
      return []
    }
  },

  /**
   * Get available technologies
   */
  async getAvailableTechnologies(): Promise<string[]> {
    try {
      const experts = await this.listExperts()
      
      const allTechnologies = new Set<string>()
      
      experts.forEach(expert => {
        expert.technologies.forEach(tech => allTechnologies.add(tech))
        expert.specializations.forEach(spec => allTechnologies.add(spec))
      })
      
      return Array.from(allTechnologies).sort()
    } catch (error) {
      console.error('❌ Failed to get available technologies:', error)
      // Return fallback technologies from the known experts
      return ['React', 'TypeScript', 'AWS', 'DynamoDB', 'Next.js', 'Node.js', 'AWS Amplify Gen 2', 'AWS Cloudscape']
    }
  },

  /**
   * Get expert statistics
   */
  async getExpertStatistics() {
    try {
      const experts = await this.listExperts()
      
      const totalExperts = experts.length
      const activeExperts = experts.filter(e => e.active).length
      
      const experienceLevels = experts.reduce((acc: Record<string, number>, expert) => {
        acc[expert.experienceLevel] = (acc[expert.experienceLevel] || 0) + 1
        return acc
      }, {})
      
      const averageConfidence = experts.reduce((sum, e) => sum + e.confidence, 0) / Math.max(totalExperts, 1)
      
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
}
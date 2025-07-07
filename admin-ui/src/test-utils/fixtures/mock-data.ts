// Simplified mock data for initial testing - will be expanded with faker when available

// Expert data factory
export const createMockExpert = (overrides: any = {}) => ({
  id: 'expert-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Expert',
  description: 'A test expert for unit testing',
  specializations: [
    {
      technology: 'React',
      frameworks: ['Next.js'],
      experienceLevel: 'advanced',
      domainExpertise: ['frontend']
    }
  ],
  score: 0.85,
  reasoning: 'Test reasoning for expert selection',
  contextPath: '/expert-contexts/test-expert.md',
  metadata: {
    created: '2023-01-01T00:00:00Z',
    updated: '2023-12-01T00:00:00Z',
    version: '1.0.0'
  },
  ...overrides
})

// Technology detection factory
export const createMockTechnology = (overrides: any = {}) => ({
  name: 'React',
  confidence: 0.9,
  category: 'frontend',
  evidence: ['import React from "react"'],
  patterns: [
    {
      type: 'import',
      pattern: 'React',
      confidence: 0.95
    }
  ],
  ...overrides
})

// Query fixtures
export const queryFixtures = {
  simple: 'Find React experts',
  complex: 'Expert in React with TypeScript and Node.js backend experience',
  technology: 'React, Redux, GraphQL, AWS',
  task: 'Build a real-time collaboration platform',
  empty: '',
  tooLong: 'A'.repeat(5001),
  withSpecialChars: 'Find experts with C++ and .NET experience'
}

// Parameter fixtures
export const parameterFixtures = {
  default: {
    searchDepth: 3,
    maxResults: 10,
    scoreThreshold: 0.5,
    methods: ['vector', 'graph', 'hybrid']
  },
  performance: {
    searchDepth: 1,
    maxResults: 5,
    scoreThreshold: 0.7,
    methods: ['vector']
  },
  invalid: {
    searchDepth: 10,
    maxResults: 100,
    scoreThreshold: 1.5,
    methods: ['invalid']
  }
}

// Mock graph data
export const createMockGraphData = (nodeCount = 10) => ({
  nodes: Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    label: `Node ${i}`,
    type: 'expert'
  })),
  edges: Array.from({ length: Math.floor(nodeCount / 2) }, (_, i) => ({
    id: `edge-${i}`,
    source: `node-${i}`,
    target: `node-${i + 1}`,
    weight: 0.5
  })),
  stats: {
    totalNodes: nodeCount,
    totalEdges: Math.floor(nodeCount / 2),
    avgDegree: 2
  }
})

// Mock benchmark result
export const createMockBenchmarkResult = () => ({
  id: 'benchmark-' + Date.now(),
  query: 'Test query',
  method: 'vector',
  performance: {
    totalTime: 150,
    breakdown: {
      preprocessing: 20,
      search: 80,
      scoring: 30,
      postprocessing: 20
    }
  },
  results: {
    count: 10,
    averageScore: 0.75,
    topScore: 0.95
  }
})
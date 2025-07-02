import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'

// Define handlers for the API endpoints
export const handlers = [
  // Overview stats endpoint
  http.get('/api/overview/stats', () => {
    return HttpResponse.json({
      totalExperts: 25,
      activeExperts: 20,
      inactiveExperts: 5,
      expertsCountBySpecialization: {
        'Backend Development': 8,
        'Frontend Development': 6,
        'DevOps': 4,
        'Data Science': 3,
        'Security': 2,
        'Mobile Development': 2
      },
      expertsCountByStatus: {
        active: 20,
        inactive: 5
      },
      expertsCountByExpertiseLevel: {
        expert: 10,
        advanced: 8,
        intermediate: 5,
        beginner: 2
      },
      topExperts: [
        {
          id: 'backend-expert',
          name: 'Backend Expert',
          specialization: 'Backend Development',
          expertiseLevel: 'expert',
          usageCount: 150
        },
        {
          id: 'frontend-master',
          name: 'Frontend Master',
          specialization: 'Frontend Development',
          expertiseLevel: 'expert',
          usageCount: 120
        },
        {
          id: 'devops-guru',
          name: 'DevOps Guru',
          specialization: 'DevOps',
          expertiseLevel: 'advanced',
          usageCount: 100
        }
      ],
      recentActivity: [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          type: 'expert_added',
          message: 'New expert "AI Specialist" added',
          expertId: 'ai-specialist'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'expert_updated',
          message: 'Expert "Backend Expert" updated',
          expertId: 'backend-expert'
        }
      ]
    })
  }),
]

// Create the server instance
export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test (important for test isolation)
afterEach(() => server.resetHandlers())

// Clean up after all tests are done
afterAll(() => server.close())
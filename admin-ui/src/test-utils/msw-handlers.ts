import { http, HttpResponse } from 'msw'

// Simple handlers for testing - will be expanded when implementing components
export const handlers = [
  // Expert Discovery API
  http.post('/api/admin/discovery/test', () => {
    return HttpResponse.json({
      results: {
        vector: [],
        graph: [],
        hybrid: []
      },
      performance: {
        totalTime: 150,
        breakdown: {
          preprocessing: 20,
          vectorSearch: 50,
          graphTraversal: 60,
          scoring: 20
        }
      }
    })
  }),

  // Technology Detection API
  http.post('/api/admin/discovery/detect-technologies', () => {
    return HttpResponse.json({
      technologies: [],
      confidence: {
        overall: 0.85,
        breakdown: {
          syntactic: 0.9,
          semantic: 0.8,
          contextual: 0.85
        }
      }
    })
  }),

  // Error scenarios
  http.post('/api/admin/discovery/test-error', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  })
]
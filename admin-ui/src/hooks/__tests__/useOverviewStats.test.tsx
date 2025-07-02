import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useOverviewStats } from '../useOverviewStats'
import { server } from '../../test-utils/server'
import { renderWithProviders } from '../../test-utils/test-utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useOverviewStats', () => {
  it('should fetch and return overview stats data', async () => {
    // Create a wrapper with QueryClient
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper })

    // Initially, the hook should be in loading state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBe(null)

    // Wait for the query to resolve
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Check that data is correctly returned
    expect(result.current.data).toEqual({
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
      recentActivity: expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          type: 'expert_added',
          message: 'New expert "AI Specialist" added',
          expertId: 'ai-specialist'
        }),
        expect.objectContaining({
          id: '2',
          type: 'expert_updated',
          message: 'Expert "Backend Expert" updated',
          expertId: 'backend-expert'
        })
      ])
    })
    expect(result.current.error).toBe(null)
  })

  it('should handle loading state correctly', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper })

    // Should start in loading state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBe(null)
  })

  it('should handle error state when API call fails', async () => {
    // Override the handler to return an error
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Failed to fetch stats' },
          { status: 500 }
        )
      })
    )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper })

    // Wait for the error state
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeTruthy()
  })

  it('should transform data correctly when specializations are empty', async () => {
    // Override handler to return empty specializations
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json({
          totalExperts: 0,
          activeExperts: 0,
          inactiveExperts: 0,
          expertsCountBySpecialization: {},
          expertsCountByStatus: {
            active: 0,
            inactive: 0
          },
          expertsCountByExpertiseLevel: {},
          topExperts: [],
          recentActivity: []
        })
      })
    )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({
      totalExperts: 0,
      activeExperts: 0,
      inactiveExperts: 0,
      expertsCountBySpecialization: {},
      expertsCountByStatus: {
        active: 0,
        inactive: 0
      },
      expertsCountByExpertiseLevel: {},
      topExperts: [],
      recentActivity: []
    })
  })

  it('should handle network errors gracefully', async () => {
    // Override handler to simulate network error
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.error()
      })
    )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })

  it('should refetch data when refetch is called', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper })

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialData = result.current.data

    // Override handler to return different data
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json({
          totalExperts: 30,
          activeExperts: 25,
          inactiveExperts: 5,
          expertsCountBySpecialization: {
            'Backend Development': 10,
            'Frontend Development': 8,
            'DevOps': 5,
            'Data Science': 4,
            'Security': 3
          },
          expertsCountByStatus: {
            active: 25,
            inactive: 5
          },
          expertsCountByExpertiseLevel: {
            expert: 12,
            advanced: 10,
            intermediate: 6,
            beginner: 2
          },
          topExperts: [],
          recentActivity: []
        })
      })
    )

    // Trigger refetch
    await result.current.refetch()

    // Check that data has been updated
    await waitFor(() => {
      expect(result.current.data?.totalExperts).toBe(30)
    })

    expect(result.current.data).not.toEqual(initialData)
  })
})

describe('useOverviewStats - Enhanced Error Handling (TDD Cycle 2)', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  it('should handle authentication errors (401) with appropriate error message', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      })
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    // Check that the error has the correct status code
    expect(result.current.error).toHaveProperty('status', 401)
    expect(result.current.error).toHaveProperty('errorType', 'authentication')
    expect(result.current.error).toHaveProperty('userMessage', 'Please log in to continue')
  })

  it('should handle forbidden errors (403) with appropriate error message', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      })
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toHaveProperty('status', 403)
    expect(result.current.error).toHaveProperty('errorType', 'authorization')
    expect(result.current.error).toHaveProperty('userMessage', 'You do not have permission to access this resource')
  })

  it('should handle not found errors (404) with appropriate error message', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Endpoint not found' },
          { status: 404 }
        )
      })
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toHaveProperty('status', 404)
    expect(result.current.error).toHaveProperty('errorType', 'not_found')
    expect(result.current.error).toHaveProperty('userMessage', 'The requested resource was not found')
  })

  it('should handle rate limiting errors (429) with appropriate error message', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Too many requests' },
          { 
            status: 429,
            headers: {
              'Retry-After': '60'
            }
          }
        )
      })
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toHaveProperty('status', 429)
    expect(result.current.error).toHaveProperty('errorType', 'rate_limit')
    expect(result.current.error).toHaveProperty('userMessage', 'Too many requests. Please try again in 60 seconds')
    expect(result.current.error).toHaveProperty('retryAfter', 60)
  })

  it('should handle custom error messages from API', async () => {
    const customErrorMessage = 'The statistics service is temporarily unavailable due to maintenance'
    
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { 
            error: customErrorMessage,
            code: 'MAINTENANCE_MODE'
          },
          { status: 503 }
        )
      })
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toHaveProperty('status', 503)
    expect(result.current.error).toHaveProperty('errorType', 'server')
    expect(result.current.error).toHaveProperty('userMessage', customErrorMessage)
    expect(result.current.error).toHaveProperty('errorCode', 'MAINTENANCE_MODE')
  })

  it('should handle connection timeout scenarios', async () => {
    server.use(
      http.get('/api/overview/stats', async () => {
        // Simulate timeout by delaying longer than expected
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toHaveProperty('errorType', 'network')
    expect(result.current.error).toHaveProperty('userMessage')
    expect(result.current.error?.userMessage).toContain('connection')
  })

  it('should categorize error types correctly', async () => {
    const testCases = [
      { status: 400, expectedType: 'client' },
      { status: 500, expectedType: 'server' },
      { status: 502, expectedType: 'server' },
      { status: 503, expectedType: 'server' },
      { status: 504, expectedType: 'server' }
    ]

    for (const testCase of testCases) {
      server.use(
        http.get('/api/overview/stats', () => {
          return HttpResponse.json(
            { error: 'Test error' },
            { status: testCase.status }
          )
        })
      )

      const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toHaveProperty('errorType', testCase.expectedType)
    }
  })

  it('should provide retry suggestions for recoverable errors', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Temporary server error' },
          { status: 503 }
        )
      })
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toHaveProperty('isRetryable', true)
    expect(result.current.error).toHaveProperty('retryMessage', 'This is a temporary issue. Please try again')
  })

  it('should mark non-recoverable errors appropriately', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        )
      })
    )

    const { result } = renderHook(() => useOverviewStats(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toHaveProperty('isRetryable', false)
  })
})
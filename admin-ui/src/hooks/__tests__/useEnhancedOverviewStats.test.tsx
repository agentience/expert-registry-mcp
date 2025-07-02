import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useEnhancedOverviewStats, useErrorRecovery } from '../useEnhancedOverviewStats'
import { server } from '../../test-utils/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatsApiError } from '../../api/statsApi'

describe('useEnhancedOverviewStats', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false
        }
      }
    })
    
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  it('should provide enhanced error information', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      })
    )

    const { result } = renderHook(() => useEnhancedOverviewStats(), { 
      wrapper: createWrapper() 
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.errorType).toBe('authentication')
    expect(result.current.errorMessage).toBe('Please log in to continue')
    expect(result.current.canRetry).toBe(false)
  })

  it('should indicate retryable errors correctly', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Server error' },
          { status: 503 }
        )
      })
    )

    const { result } = renderHook(() => useEnhancedOverviewStats(), { 
      wrapper: createWrapper() 
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.error?.errorType).toBe('server')
    expect(result.current.canRetry).toBe(true)
    expect(result.current.error?.isRetryable).toBe(true)
  })

  it('should provide retry function', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => useEnhancedOverviewStats(), { 
      wrapper: createWrapper() 
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(typeof result.current.retry).toBe('function')
    expect(result.current.canRetry).toBe(true)
  })

  it('should handle successful response', async () => {
    const { result } = renderHook(() => useEnhancedOverviewStats(), { 
      wrapper: createWrapper() 
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeTruthy()
    expect(result.current.error).toBe(null)
    expect(result.current.errorMessage).toBeUndefined()
    expect(result.current.canRetry).toBe(true)
  })

  it('should handle rate limiting correctly', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Too many requests' },
          { 
            status: 429,
            headers: { 'Retry-After': '30' }
          }
        )
      })
    )

    const { result } = renderHook(() => useEnhancedOverviewStats(), { 
      wrapper: createWrapper() 
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.errorType).toBe('rate_limit')
    expect(result.current.error?.retryAfter).toBe(30)
    expect(result.current.canRetry).toBe(true)
  })
})

describe('useErrorRecovery', () => {
  it('should return null for no error', () => {
    const { result } = renderHook(() => useErrorRecovery(null))
    expect(result.current).toBe(null)
  })

  it('should provide authentication error suggestions', () => {
    const error = new StatsApiError('Auth failed', 401, 'Unauthorized')
    const { result } = renderHook(() => useErrorRecovery(error))

    expect(result.current?.suggestions).toContain('Please log in to your account')
    expect(result.current?.suggestions).toContain('Check if your session has expired')
    expect(result.current?.isRetryable).toBe(false)
  })

  it('should provide network error suggestions', () => {
    const error = new StatsApiError('Network error', undefined, undefined)
    const { result } = renderHook(() => useErrorRecovery(error))

    expect(result.current?.suggestions).toContain('Check your internet connection')
    expect(result.current?.suggestions).toContain('Try refreshing the page')
    expect(result.current?.isRetryable).toBe(true)
  })

  it('should provide rate limit suggestions with retry time', () => {
    const mockResponse = {
      headers: new Map([['Retry-After', '60']])
    } as unknown as Response
    
    const error = new StatsApiError(
      'Rate limited',
      429,
      'Too Many Requests',
      mockResponse
    )
    
    const { result } = renderHook(() => useErrorRecovery(error))

    expect(result.current?.suggestions).toContain('Wait 60 seconds before trying again')
    expect(result.current?.retryAfter).toBe(60)
    expect(result.current?.isRetryable).toBe(true)
  })

  it('should provide server error suggestions', () => {
    const error = new StatsApiError('Server error', 500, 'Internal Server Error')
    const { result } = renderHook(() => useErrorRecovery(error))

    expect(result.current?.suggestions).toContain('The issue is on our end, please try again later')
    expect(result.current?.suggestions).toContain('Check our status page for any ongoing issues')
    expect(result.current?.isRetryable).toBe(true)
  })

  it('should provide authorization error suggestions', () => {
    const error = new StatsApiError('Access denied', 403, 'Forbidden')
    const { result } = renderHook(() => useErrorRecovery(error))

    expect(result.current?.suggestions).toContain('Contact your administrator for access')
    expect(result.current?.suggestions).toContain('Verify you have the correct permissions')
    expect(result.current?.isRetryable).toBe(false)
  })
})
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { ErrorDisplay, InlineErrorDisplay } from '../ErrorDisplay'
import { StatsApiError } from '../../../api/statsApi'

const renderWithMantine = (component: React.ReactElement) => {
  return render(
    <MantineProvider>{component}</MantineProvider>
  )
}

describe('ErrorDisplay', () => {
  it('should render basic error message', () => {
    const error = new Error('Test error message')
    renderWithMantine(<ErrorDisplay error={error} />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('should render authentication error with appropriate styling', () => {
    const error = new StatsApiError(
      'Auth failed',
      401,
      'Unauthorized'
    )
    
    renderWithMantine(<ErrorDisplay error={error} />)
    
    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.getByText('Please log in to continue')).toBeInTheDocument()
  })

  it('should render authorization error', () => {
    const error = new StatsApiError(
      'Access denied',
      403,
      'Forbidden'
    )
    
    renderWithMantine(<ErrorDisplay error={error} />)
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You do not have permission to access this resource')).toBeInTheDocument()
  })

  it('should render rate limiting error with retry time', () => {
    const mockResponse = {
      headers: new Map([['Retry-After', '60']])
    } as unknown as Response
    
    const error = new StatsApiError(
      'Rate limited',
      429,
      'Too Many Requests',
      mockResponse
    )
    
    renderWithMantine(<ErrorDisplay error={error} />)
    
    expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument()
    expect(screen.getByText('Too many requests. Please try again in 60 seconds')).toBeInTheDocument()
    expect(screen.getByText('Please wait 60 seconds before retrying')).toBeInTheDocument()
  })

  it('should show retry button for retryable errors', () => {
    const onRetry = vi.fn()
    const error = new StatsApiError(
      'Server error',
      500,
      'Internal Server Error'
    )
    
    renderWithMantine(<ErrorDisplay error={error} onRetry={onRetry} />)
    
    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('should not show retry button for non-retryable errors', () => {
    const onRetry = vi.fn()
    const error = new StatsApiError(
      'Bad request',
      400,
      'Bad Request'
    )
    
    renderWithMantine(<ErrorDisplay error={error} onRetry={onRetry} />)
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
  })

  it('should display error code when available', () => {
    const mockResponse = {} as Response
    const responseData = { code: 'MAINTENANCE_MODE' }
    
    const error = new StatsApiError(
      'Service unavailable',
      503,
      'Service Unavailable',
      mockResponse,
      responseData
    )
    
    renderWithMantine(<ErrorDisplay error={error} />)
    
    expect(screen.getByText('Error Code: MAINTENANCE_MODE')).toBeInTheDocument()
  })

  it('should display custom error message from API', () => {
    const customMessage = 'The statistics service is temporarily unavailable due to maintenance'
    const mockResponse = {} as Response
    const responseData = { 
      error: customMessage,
      code: 'MAINTENANCE_MODE' 
    }
    
    const error = new StatsApiError(
      'Service unavailable',
      503,
      'Service Unavailable',
      mockResponse,
      responseData
    )
    
    renderWithMantine(<ErrorDisplay error={error} />)
    
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })
})

describe('InlineErrorDisplay', () => {
  it('should render compact error display', () => {
    const error = new Error('Test error')
    renderWithMantine(<InlineErrorDisplay error={error} />)
    
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should show retry button for retryable errors', () => {
    const onRetry = vi.fn()
    const error = new StatsApiError(
      'Network error',
      0,
      undefined
    )
    
    renderWithMantine(<InlineErrorDisplay error={error} onRetry={onRetry} />)
    
    const retryButton = screen.getByText('Retry')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('should not show retry button for non-retryable errors', () => {
    const onRetry = vi.fn()
    const error = new StatsApiError(
      'Bad request',
      400,
      'Bad Request'
    )
    
    renderWithMantine(<InlineErrorDisplay error={error} onRetry={onRetry} />)
    
    expect(screen.queryByText('Retry')).not.toBeInTheDocument()
  })
})
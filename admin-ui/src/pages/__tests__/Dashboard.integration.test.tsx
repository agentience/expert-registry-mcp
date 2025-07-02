import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Dashboard } from '../Dashboard'
import { renderWithProviders } from '../../test-utils/test-utils'
import { server } from '../../test-utils/server'

describe('Dashboard Integration Tests', () => {
  it('should display overview stats when data loads successfully', async () => {
    renderWithProviders(<Dashboard />)

    // Check that skeleton loaders are shown initially
    const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)

    // Wait for data to load and check that stats cards are displayed
    await waitFor(() => {
      expect(screen.getByText('Total Experts')).toBeInTheDocument()
    })

    // Check that all stats cards are present with correct data
    expect(screen.getByText('Total Experts')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument() // Total experts value

    expect(screen.getByText('Active Experts')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument() // Active experts value

    expect(screen.getByText('Inactive Experts')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Inactive experts value

    expect(screen.getByText('Success Rate')).toBeInTheDocument()
    expect(screen.getByText('80.0%')).toBeInTheDocument() // Success rate value (20/25 * 100)
  })

  it('should display loading skeleton states for stats cards', async () => {
    // Mock a slower API response to test skeleton loading
    server.use(
      http.get('/api/overview/stats', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json({
          totalExperts: 25,
          activeExperts: 20,
          inactiveExperts: 5,
          expertsCountBySpecialization: {},
          expertsCountByStatus: { active: 20, inactive: 5 },
          expertsCountByExpertiseLevel: {},
          topExperts: [],
          recentActivity: []
        })
      })
    )

    renderWithProviders(<Dashboard />)

    // Check that skeleton loaders are shown
    const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Total Experts')).toBeInTheDocument()
    })
  })

  it('should display error state when API call fails', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Failed to fetch overview stats' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<Dashboard />)

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument()
    })

    // Check that error message is displayed
    expect(screen.getByText('An internal server error occurred. Please try again later')).toBeInTheDocument()
    
    // Check that retry button is present
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should handle retry functionality after error', async () => {
    const user = userEvent.setup()
    
    // First request fails
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Failed to fetch overview stats' },
          { status: 500 }
        )
      })
    )

    renderWithProviders(<Dashboard />)

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument()
    })

    // Mock successful retry
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json({
          totalExperts: 25,
          activeExperts: 20,
          inactiveExperts: 5,
          expertsCountBySpecialization: {},
          expertsCountByStatus: { active: 20, inactive: 5 },
          expertsCountByExpertiseLevel: {},
          topExperts: [],
          recentActivity: []
        })
      })
    )

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)

    // Wait for successful data load
    await waitFor(() => {
      expect(screen.getByText('Total Experts')).toBeInTheDocument()
    })

    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('should display empty state when no data is available', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json({
          totalExperts: 0,
          activeExperts: 0,
          inactiveExperts: 0,
          expertsCountBySpecialization: {},
          expertsCountByStatus: { active: 0, inactive: 0 },
          expertsCountByExpertiseLevel: {},
          topExperts: [],
          recentActivity: []
        })
      })
    )

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total Experts')).toBeInTheDocument()
    })

    // Check that zero values are displayed - there should be multiple 0s for different stats
    const zeroValues = screen.getAllByText('0')
    expect(zeroValues.length).toBeGreaterThan(0)
  })

  it('should display top experts section when data is available', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json({
          totalExperts: 25,
          activeExperts: 20,
          inactiveExperts: 5,
          expertsCountBySpecialization: {},
          expertsCountByStatus: { active: 20, inactive: 5 },
          expertsCountByExpertiseLevel: {},
          topExperts: [
            {
              id: 'backend-expert',
              name: 'Backend Expert',
              specialization: 'Backend Development',
              expertiseLevel: 'expert',
              usageCount: 150
            }
          ],
          recentActivity: []
        })
      })
    )

    renderWithProviders(<Dashboard />)

    // Wait for data to load completely by checking for the Total Experts card
    await waitFor(() => {
      expect(screen.getByText('Total Experts')).toBeInTheDocument()
    })

    // Ensure the Top Experts section is visible
    expect(screen.getByText('Top Experts')).toBeInTheDocument()

    // Check that top expert is displayed
    await waitFor(() => {
      expect(screen.getByText('Backend Expert')).toBeInTheDocument()
    })
    expect(screen.getByText('Backend Development')).toBeInTheDocument()
    expect(screen.getByText('150 uses')).toBeInTheDocument()
  })

  it('should handle network errors gracefully', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.error()
      })
    )

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument()
    })

    expect(screen.getByText('Unable to connect to the server. Please check your internet connection and try again')).toBeInTheDocument()
  })

  it('should handle authentication errors appropriately', async () => {
    server.use(
      http.get('/api/overview/stats', () => {
        return HttpResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      })
    )

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    })

    expect(screen.getByText('Please log in to continue')).toBeInTheDocument()
  })

  it('should show trends when available', async () => {
    // The current implementation shows hardcoded trends, but this test prepares for dynamic trends
    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total Experts')).toBeInTheDocument()
    })

    // Check for trend indicators (currently hardcoded in the component)
    const trendElements = screen.getAllByText(/[+\-]\d+(\.\d+)?%/)
    expect(trendElements.length).toBeGreaterThan(0)
  })

  it('should integrate with usage chart component', async () => {
    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total Experts')).toBeInTheDocument()
    })

    // The UsageChart component should be rendered - check that the grid layout contains it
    // We can verify this by checking that the dashboard renders without errors
    // and the layout structure is present
    const gridElements = document.querySelectorAll('.mantine-Grid-root')
    expect(gridElements.length).toBeGreaterThan(0)
  })
})
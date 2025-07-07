import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, runAxeTests, expectElementToBeVisible } from './test-utils/test-utils'
import { AppWithoutRouter } from './App'

/**
 * Expert Discovery Integration Tests - RED PHASE
 * These tests verify the routing and integration of Expert Discovery pages
 */
describe('App - Expert Discovery Integration', () => {
  it('should render Expert Discovery page when navigating to /expert-discovery', () => {
    // ARRANGE & ACT
    renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery']
    })
    
    // ASSERT
    const pageTitle = screen.getByRole('heading', { 
      name: /expert discovery testing/i 
    })
    expectElementToBeVisible(pageTitle)
  })

  it('should have Expert Discovery navigation link in main menu', () => {
    // ARRANGE & ACT
    renderWithProviders(<AppWithoutRouter />)
    
    // ASSERT
    const expertDiscoveryLink = screen.getByRole('link', { 
      name: /expert discovery/i 
    })
    expectElementToBeVisible(expertDiscoveryLink)
    expect(expertDiscoveryLink).toHaveAttribute('href', '/expert-discovery')
  })

  it('should support direct navigation to Expert Discovery page', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<AppWithoutRouter />)
    
    // ACT
    const expertDiscoveryLink = screen.getByRole('link', { 
      name: /expert discovery/i 
    })
    await user.click(expertDiscoveryLink)
    
    // ASSERT
    const pageTitle = screen.getByRole('heading', { 
      name: /expert discovery testing/i 
    })
    expectElementToBeVisible(pageTitle)
  })

  it('should handle 404 for invalid expert discovery routes', () => {
    // ARRANGE & ACT
    renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery/invalid-route']
    })
    
    // ASSERT
    const notFoundMessage = screen.getByText(/page not found/i)
    expectElementToBeVisible(notFoundMessage)
  })

  it('should maintain Expert Discovery state when navigating back', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery']
    })
    
    // ACT - Navigate to a tab, then to another page, then back
    const technologyTab = screen.getByRole('tab', { 
      name: /technology detection/i 
    })
    await user.click(technologyTab)
    
    // Navigate to dashboard
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    await user.click(dashboardLink)
    
    // Navigate back to expert discovery
    const expertDiscoveryLink = screen.getByRole('link', { 
      name: /expert discovery/i 
    })
    await user.click(expertDiscoveryLink)
    
    // ASSERT - Should remember the selected tab
    expect(technologyTab).toHaveAttribute('aria-selected', 'true')
  })

  it('should handle lazy loading of Expert Discovery components', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<AppWithoutRouter />)
    
    // ACT
    const expertDiscoveryLink = screen.getByRole('link', { 
      name: /expert discovery/i 
    })
    await user.click(expertDiscoveryLink)
    
    // ASSERT - Should show loading state briefly, then content
    const loadingIndicator = screen.queryByTestId('route-loading')
    if (loadingIndicator) {
      expect(loadingIndicator).toBeInTheDocument()
    }
    
    // Wait for page to load
    const pageTitle = await screen.findByRole('heading', { 
      name: /expert discovery testing/i 
    })
    expectElementToBeVisible(pageTitle)
  })

  it('should provide proper error boundaries for Expert Discovery', () => {
    // ARRANGE
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Force an error in Expert Discovery component
    const ErrorExpertDiscovery = () => {
      throw new Error('Test error in Expert Discovery')
    }
    
    // ACT
    renderWithProviders(<ErrorExpertDiscovery />)
    
    // ASSERT
    const errorMessage = screen.getByText(/something went wrong/i)
    expectElementToBeVisible(errorMessage)
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    expectElementToBeVisible(refreshButton)
    
    consoleSpy.mockRestore()
  })

  it('should pass accessibility audit for Expert Discovery integration', async () => {
    // ARRANGE
    const { container } = renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery']
    })
    
    // ACT & ASSERT
    await runAxeTests(container)
  })

  it('should support breadcrumb navigation for Expert Discovery', () => {
    // ARRANGE & ACT
    renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery']
    })
    
    // ASSERT
    const breadcrumb = screen.getByRole('navigation', { 
      name: /breadcrumb/i 
    })
    expectElementToBeVisible(breadcrumb)
    
    expect(screen.getByText(/home/i)).toBeInTheDocument()
    expect(screen.getByText(/expert discovery/i)).toBeInTheDocument()
  })

  it('should handle deep linking to specific Expert Discovery tabs', () => {
    // ARRANGE & ACT
    renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery?tab=technology-detection']
    })
    
    // ASSERT
    const technologyTab = screen.getByRole('tab', { 
      name: /technology detection/i 
    })
    expect(technologyTab).toHaveAttribute('aria-selected', 'true')
  })

  it('should provide Expert Discovery help documentation', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery']
    })
    
    // ACT
    const helpButton = screen.getByRole('button', { name: /help/i })
    await user.click(helpButton)
    
    // ASSERT
    const helpModal = screen.getByRole('dialog', { name: /help/i })
    expectElementToBeVisible(helpModal)
    
    expect(screen.getByText(/expert discovery guide/i)).toBeInTheDocument()
  })

  it('should track Expert Discovery page analytics', () => {
    // ARRANGE
    const mockAnalytics = vi.fn()
    Object.defineProperty(window, 'gtag', {
      value: mockAnalytics,
      writable: true
    })
    
    // ACT
    renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery']
    })
    
    // ASSERT
    expect(mockAnalytics).toHaveBeenCalledWith('config', expect.any(String), {
      page_title: 'Expert Discovery Testing',
      page_location: expect.stringContaining('/expert-discovery')
    })
  })

  it('should support keyboard shortcuts for Expert Discovery', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery']
    })
    
    // ACT - Use keyboard shortcut to switch tabs
    await user.keyboard('{Control>}1{/Control}') // Ctrl+1 for first tab
    
    // ASSERT
    const queryTab = screen.getByRole('tab', { name: /query builder/i })
    expect(queryTab).toHaveAttribute('aria-selected', 'true')
    
    // ACT - Use keyboard shortcut for second tab
    await user.keyboard('{Control>}2{/Control}') // Ctrl+2 for second tab
    
    // ASSERT
    const technologyTab = screen.getByRole('tab', { 
      name: /technology detection/i 
    })
    expect(technologyTab).toHaveAttribute('aria-selected', 'true')
  })

  it('should handle Expert Discovery page refresh gracefully', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<AppWithoutRouter />, {
      initialEntries: ['/expert-discovery']
    })
    
    // Set some state
    const technologyTab = screen.getByRole('tab', { 
      name: /technology detection/i 
    })
    await user.click(technologyTab)
    
    // ACT - Simulate page refresh
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    })
    
    await user.keyboard('{F5}')
    
    // ASSERT - Should handle refresh without errors
    const pageTitle = screen.getByRole('heading', { 
      name: /expert discovery testing/i 
    })
    expectElementToBeVisible(pageTitle)
  })
})
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, runAxeTests, expectElementToBeVisible } from '../../test-utils/test-utils'
import { ExpertDiscoveryPage } from './index'

/**
 * TDD Cycle 2: Routing & Page Structure
 * RED PHASE - These tests will fail initially until ExpertDiscoveryPage is implemented
 */
describe('ExpertDiscovery Page', () => {
  it('should render page with correct title', () => {
    // ARRANGE & ACT
    renderWithProviders(<ExpertDiscoveryPage />)
    
    // ASSERT
    const title = screen.getByRole('heading', { name: /expert discovery testing/i })
    expectElementToBeVisible(title)
    expect(title).toHaveProperty('tagName', 'H1')
  })

  it('should have tabbed navigation', () => {
    // ARRANGE & ACT
    renderWithProviders(<ExpertDiscoveryPage />)
    
    // ASSERT
    const tabList = screen.getByRole('tablist')
    expectElementToBeVisible(tabList)
    
    // Check for all required tabs
    expect(screen.getByRole('tab', { name: /query builder/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /technology detection/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /semantic search/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /graph explorer/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /results comparison/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /performance/i })).toBeInTheDocument()
  })

  it('should handle tab switching', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<ExpertDiscoveryPage />)
    
    // ACT - Click on Technology Detection tab
    const technologyTab = screen.getByRole('tab', { name: /technology detection/i })
    await user.click(technologyTab)
    
    // ASSERT
    expect(technologyTab).toHaveAttribute('aria-selected', 'true')
    
    // Default tab should no longer be selected
    const queryTab = screen.getByRole('tab', { name: /query builder/i })
    expect(queryTab).toHaveAttribute('aria-selected', 'false')
  })

  it('should show correct tab panel content', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<ExpertDiscoveryPage />)
    
    // ACT - Switch to different tabs and verify panel content
    const semanticTab = screen.getByRole('tab', { name: /semantic search/i })
    await user.click(semanticTab)
    
    // ASSERT
    const semanticPanel = screen.getByRole('tabpanel')
    expect(semanticPanel).toHaveAttribute('aria-labelledby', expect.stringContaining('semantic'))
  })

  it('should be accessible with keyboard navigation', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<ExpertDiscoveryPage />)
    
    // ACT - Use keyboard to navigate tabs
    const firstTab = screen.getByRole('tab', { name: /query builder/i })
    firstTab.focus()
    
    // Navigate with arrow keys
    await user.keyboard('{ArrowRight}')
    
    // ASSERT
    const secondTab = screen.getByRole('tab', { name: /technology detection/i })
    expect(secondTab).toHaveFocus()
  })

  it('should have proper ARIA attributes', () => {
    // ARRANGE & ACT
    renderWithProviders(<ExpertDiscoveryPage />)
    
    // ASSERT
    const tabList = screen.getByRole('tablist')
    expect(tabList).toHaveAttribute('aria-orientation', 'horizontal')
    
    // Check tabs have proper ARIA attributes
    const tabs = screen.getAllByRole('tab')
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('aria-controls')
      expect(tab).toHaveAttribute('aria-selected')
      expect(tab).toHaveAttribute('tabindex')
    })
  })

  it('should maintain state when switching tabs', async () => {
    // ARRANGE
    const { user } = renderWithProviders(<ExpertDiscoveryPage />)
    
    // ACT - Make some interaction in first tab, then switch and come back
    const queryTab = screen.getByRole('tab', { name: /query builder/i })
    expect(queryTab).toHaveAttribute('aria-selected', 'true')
    
    // Switch to another tab
    await user.click(screen.getByRole('tab', { name: /technology detection/i }))
    
    // Switch back to query tab
    await user.click(queryTab)
    
    // ASSERT
    expect(queryTab).toHaveAttribute('aria-selected', 'true')
  })

  it('should have responsive layout', () => {
    // ARRANGE & ACT
    renderWithProviders(<ExpertDiscoveryPage />)
    
    // ASSERT - Check for responsive container
    const container = screen.getByTestId('expert-discovery-container')
    expect(container).toHaveClass('mantine-Container-root')
  })

  it('should pass accessibility audit', async () => {
    // ARRANGE
    const { container } = renderWithProviders(<ExpertDiscoveryPage />)
    
    // ACT & ASSERT
    await runAxeTests(container)
  })

  it('should handle deep linking to specific tabs', () => {
    // ARRANGE & ACT - Render with URL hash for specific tab
    renderWithProviders(<ExpertDiscoveryPage />, {
      initialEntries: ['/expert-discovery#technology']
    })
    
    // ASSERT
    const technologyTab = screen.getByRole('tab', { name: /technology detection/i })
    expect(technologyTab).toHaveAttribute('aria-selected', 'true')
  })

  it('should display loading state when needed', () => {
    // ARRANGE
    const mockProps = { loading: true }
    
    // ACT
    renderWithProviders(<ExpertDiscoveryPage {...mockProps} />)
    
    // ASSERT
    const loadingIndicator = screen.getByTestId('page-loading')
    expectElementToBeVisible(loadingIndicator)
  })

  it('should handle error state gracefully', () => {
    // ARRANGE
    const mockProps = { error: new Error('Failed to load page') }
    
    // ACT
    renderWithProviders(<ExpertDiscoveryPage {...mockProps} />)
    
    // ASSERT
    const errorDisplay = screen.getByRole('alert')
    expect(errorDisplay).toHaveTextContent(/failed to load page/i)
  })

  it('should track page analytics', () => {
    // ARRANGE
    const mockAnalytics = vi.fn()
    const mockProps = { onPageView: mockAnalytics }
    
    // ACT
    renderWithProviders(<ExpertDiscoveryPage {...mockProps} />)
    
    // ASSERT
    expect(mockAnalytics).toHaveBeenCalledWith({
      page: 'expert-discovery',
      timestamp: expect.any(Date)
    })
  })
})
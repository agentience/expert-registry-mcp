import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithoutRouter, runAxeTests, expectElementToBeVisible } from '../../../../test-utils/test-utils'
import { QueryParameters } from './QueryParameters'
import { parameterFixtures } from '../../../../test-utils/fixtures/mock-data'

/**
 * QueryParameters Component Tests - RED PHASE
 * These tests will fail initially until QueryParameters is implemented
 */
describe('QueryParameters', () => {
  const defaultProps = {
    parameters: parameterFixtures.default,
    onChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Functional Tests', () => {
    it('should render all parameter controls', () => {
      // ARRANGE & ACT
      renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ASSERT
      expect(screen.getByLabelText(/search depth/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/max results/i)).toBeInTheDocument()
      expect(screen.getByText(/show.*advanced options/i)).toBeInTheDocument()
    })

    it('should validate numeric inputs (searchDepth, maxResults)', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryParameters {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT
      const searchDepthInput = screen.getByLabelText(/search depth/i)
      await user.clear(searchDepthInput)
      await user.type(searchDepthInput, '10') // Above max
      
      // ASSERT
      expect(mockOnChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ searchDepth: 10 })
      )
    })

    it('should enforce min/max constraints on parameters', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryParameters {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT - Try to set values outside constraints
      const maxResultsInput = screen.getByLabelText(/max results/i)
      await user.clear(maxResultsInput)
      await user.type(maxResultsInput, '100') // Above max of 50
      
      // ASSERT
      const errorMessage = screen.getByText(/value must be between 1 and 50/i)
      expectElementToBeVisible(errorMessage)
    })

    it('should update parent state on parameter change', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryParameters {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT
      const searchDepthInput = screen.getByLabelText(/search depth/i)
      await user.clear(searchDepthInput)
      await user.type(searchDepthInput, '4')
      
      // ASSERT
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ searchDepth: 4 })
      )
    })

    it('should show/hide advanced options', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ACT
      const toggleButton = screen.getByText(/show.*advanced options/i)
      await user.click(toggleButton)
      
      // ASSERT
      expect(screen.getByLabelText(/score threshold/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/discovery methods/i)).toBeInTheDocument()
      expect(screen.getByText(/hide.*advanced options/i)).toBeInTheDocument()
    })

    it('should reset parameters to defaults', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const modifiedParams = {
        ...parameterFixtures.default,
        searchDepth: 5,
        maxResults: 25
      }
      const { user } = renderWithoutRouter(
        <QueryParameters parameters={modifiedParams} onChange={mockOnChange} />
      )
      
      // ACT
      const resetButton = screen.getByText(/reset to defaults/i)
      await user.click(resetButton)
      
      // ASSERT
      expect(mockOnChange).toHaveBeenCalledWith(parameterFixtures.default)
    })
  })

  describe('Integration Tests', () => {
    it('should sync with query history selections', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const historyParams = parameterFixtures.performance
      
      // ACT
      renderWithoutRouter(
        <QueryParameters 
          parameters={historyParams} 
          onChange={mockOnChange}
          fromHistory={true}
        />
      )
      
      // ASSERT
      const searchDepthInput = screen.getByDisplayValue('1')
      const maxResultsInput = screen.getByDisplayValue('5')
      expect(searchDepthInput).toBeInTheDocument()
      expect(maxResultsInput).toBeInTheDocument()
    })

    it('should enable/disable options based on query type', () => {
      // ARRANGE
      const codeQueryParams = { ...defaultProps.parameters, queryType: 'code' }
      
      // ACT
      renderWithoutRouter(
        <QueryParameters {...defaultProps} parameters={codeQueryParams} />
      )
      
      // ASSERT
      const semanticOptions = screen.getByTestId('semantic-options')
      expect(semanticOptions).toHaveAttribute('disabled')
    })
  })

  describe('Error Boundary Tests', () => {
    it('should handle invalid parameter combinations gracefully', () => {
      // ARRANGE & ACT
      renderWithoutRouter(
        <QueryParameters 
          {...defaultProps} 
          parameters={parameterFixtures.invalid as any}
        />
      )
      
      // ASSERT
      const errorDisplay = screen.getByRole('alert')
      expect(errorDisplay).toHaveTextContent(/invalid parameter configuration/i)
    })

    it('should show meaningful error messages for constraint violations', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ACT
      const searchDepthInput = screen.getByLabelText(/search depth/i)
      await user.clear(searchDepthInput)
      await user.type(searchDepthInput, '0') // Below minimum
      
      // ASSERT
      await waitFor(() => {
        const errorMessage = screen.getByText(/search depth must be at least 1/i)
        expectElementToBeVisible(errorMessage)
      })
    })
  })

  describe('Advanced Options', () => {
    it('should render score threshold slider', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ACT
      await user.click(screen.getByText(/show.*advanced options/i))
      
      // ASSERT
      const slider = screen.getByLabelText(/score threshold/i)
      expect(slider).toHaveAttribute('type', 'range')
      expect(slider).toHaveAttribute('min', '0')
      expect(slider).toHaveAttribute('max', '1')
      expect(slider).toHaveAttribute('step', '0.1')
    })

    it('should render methods multi-select', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ACT
      await user.click(screen.getByText(/show.*advanced options/i))
      
      // ASSERT
      const methodsSelect = screen.getByLabelText(/discovery methods/i)
      expect(methodsSelect).toBeInTheDocument()
      
      // Should have all method options
      expect(screen.getByText('vector')).toBeInTheDocument()
      expect(screen.getByText('graph')).toBeInTheDocument()
      expect(screen.getByText('hybrid')).toBeInTheDocument()
    })

    it('should handle slider value changes', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryParameters {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT
      await user.click(screen.getByText(/show.*advanced options/i))
      const slider = screen.getByLabelText(/score threshold/i)
      
      // Simulate slider change
      await user.clear(slider)
      await user.type(slider, '0.8')
      
      // ASSERT
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ scoreThreshold: 0.8 })
      )
    })

    it('should handle method selection changes', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryParameters {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT
      await user.click(screen.getByText(/show.*advanced options/i))
      const methodsSelect = screen.getByLabelText(/discovery methods/i)
      
      // Deselect 'hybrid' method
      await user.click(methodsSelect)
      await user.click(screen.getByText('hybrid'))
      
      // ASSERT
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          methods: expect.not.arrayContaining(['hybrid'])
        })
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all controls', () => {
      // ARRANGE & ACT
      renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ASSERT
      expect(screen.getByLabelText(/search depth/i)).toHaveAttribute('aria-label')
      expect(screen.getByLabelText(/max results/i)).toHaveAttribute('aria-label')
    })

    it('should support keyboard navigation', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ACT
      await user.tab()
      
      // ASSERT
      const firstInput = screen.getByLabelText(/search depth/i)
      expect(firstInput).toHaveFocus()
      
      // Continue tabbing
      await user.tab()
      const secondInput = screen.getByLabelText(/max results/i)
      expect(secondInput).toHaveFocus()
    })

    it('should announce parameter changes to screen readers', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ACT
      const searchDepthInput = screen.getByLabelText(/search depth/i)
      await user.clear(searchDepthInput)
      await user.type(searchDepthInput, '4')
      
      // ASSERT
      const announcement = screen.getByRole('status')
      expect(announcement).toHaveTextContent(/search depth updated to 4/i)
    })

    it('should pass accessibility audit', async () => {
      // ARRANGE
      const { container } = renderWithoutRouter(<QueryParameters {...defaultProps} />)
      
      // ACT & ASSERT
      await runAxeTests(container)
    })
  })

  describe('Performance', () => {
    it('should debounce rapid parameter changes', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryParameters {...defaultProps} onChange={mockOnChange} debounce={100} />
      )
      
      // ACT
      const input = screen.getByLabelText(/search depth/i)
      
      // Rapid changes
      await user.clear(input)
      await user.type(input, '1')
      await user.type(input, '2')
      await user.type(input, '3')
      
      // ASSERT
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1)
      }, { timeout: 200 })
    })

    it('should memoize expensive validation calculations', () => {
      // ARRANGE
      const expensiveValidation = vi.fn().mockReturnValue(true)
      
      // ACT
      const { rerender } = renderWithoutRouter(
        <QueryParameters 
          {...defaultProps} 
          validateParameters={expensiveValidation}
        />
      )
      
      // Re-render with same props
      rerender(
        <QueryParameters 
          {...defaultProps} 
          validateParameters={expensiveValidation}
        />
      )
      
      // ASSERT
      expect(expensiveValidation).toHaveBeenCalledTimes(1)
    })
  })
})
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithoutRouter, runAxeTests, expectElementToBeVisible, createMockFile } from '../../../../test-utils/test-utils'
import { QueryInput } from './QueryInput'
import { queryFixtures } from '../../../../test-utils/fixtures/mock-data'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { QueryHistoryEntry } from '../../types/history'
import type { QueryParameters } from '../../types'

// Mock the query history hook
vi.mock('../../hooks/useQueryHistory', () => ({
  useQueryHistory: vi.fn()
}))

// Mock the history components
vi.mock('../QueryHistory/ExpandableHistory', () => ({
  ExpandableHistory: ({ entries, onSelect, onDelete, onClear }: any) => (
    <div data-testid="expandable-history">
      <div data-testid="history-header">Recent Queries:</div>
      {entries.map((entry: QueryHistoryEntry, index: number) => (
        <div 
          key={entry.id}
          data-testid={`history-item-${index}`}
          onClick={() => onSelect?.(entry)}
        >
          {entry.query}
          <button 
            data-testid={`delete-${entry.id}`}
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(entry.id)
            }}
          >
            Delete
          </button>
        </div>
      ))}
      <button data-testid="clear-history" onClick={onClear}>
        Clear All
      </button>
    </div>
  )
}))

/**
 * TDD Cycle 3: QueryInput Component
 * RED PHASE - These tests will fail initially until QueryInput is implemented
 */
describe('QueryInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    maxLength: 5000
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Functional Tests', () => {
    it('should render multi-line textarea with proper ARIA labels', () => {
      // ARRANGE & ACT
      renderWithoutRouter(<QueryInput {...defaultProps} />)
      
      // ASSERT
      const textarea = screen.getByRole('textbox', { name: /expert discovery query input/i })
      expectElementToBeVisible(textarea)
      expect(textarea).toHaveAttribute('aria-label', 'Expert discovery query input')
      expect(textarea).toHaveAttribute('aria-describedby', 'query-helper-text')
      expect(textarea).toHaveAttribute('rows', '4')
    })

    it('should accept and display user input', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, queryFixtures.simple)
      
      // ASSERT
      expect(mockOnChange).toHaveBeenCalledWith(queryFixtures.simple)
    })

    it('should enforce max character limit (5000)', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onChange={mockOnChange} maxLength={10} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'this is longer than 10 characters')
      
      // ASSERT - Should only accept first 10 characters
      expect(mockOnChange).toHaveBeenLastCalledWith('this is lo')
    })

    it('should show character count indicator', () => {
      // ARRANGE
      const value = 'test query'
      
      // ACT
      renderWithoutRouter(<QueryInput {...defaultProps} value={value} />)
      
      // ASSERT
      const counter = screen.getByText('10/5000 characters (Ctrl+Enter to submit)')
      expectElementToBeVisible(counter)
      expect(counter).toHaveAttribute('id', 'query-helper-text')
    })

    it('should support keyboard shortcuts (Ctrl+Enter to submit)', async () => {
      // ARRANGE
      const mockOnSubmit = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} value={queryFixtures.simple} onSubmit={mockOnSubmit} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      textarea.focus()
      await user.keyboard('{Control>}{Enter}{/Control}')
      
      // ASSERT
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    it('should support Meta+Enter on Mac', async () => {
      // ARRANGE
      const mockOnSubmit = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} value={queryFixtures.simple} onSubmit={mockOnSubmit} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      textarea.focus()
      await user.keyboard('{Meta>}{Enter}{/Meta}')
      
      // ASSERT
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    it('should handle paste events with large text gracefully', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onChange={mockOnChange} maxLength={100} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      await user.click(textarea)
      
      // Simulate paste event with large text
      const largeText = 'A'.repeat(200)
      const clipboardData = new DataTransfer()
      clipboardData.setData('text/plain', largeText)
      
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true
      })
      
      textarea.dispatchEvent(pasteEvent)
      
      // ASSERT - Should truncate to maxLength
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('A'.repeat(100))
      })
    })
  })

  describe('Error Handling', () => {
    it('should display validation error for empty query on submit', async () => {
      // ARRANGE
      const mockOnSubmit = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} value="" onSubmit={mockOnSubmit} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      textarea.focus()
      await user.keyboard('{Control>}{Enter}{/Control}')
      
      // ASSERT
      expect(mockOnSubmit).not.toHaveBeenCalled()
      const errorMessage = screen.getByText(/query cannot be empty/i)
      expectElementToBeVisible(errorMessage)
    })

    it('should sanitize potentially harmful input', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      const maliciousInput = '<script>alert("xss")</script>Find React experts'
      await user.type(textarea, maliciousInput)
      
      // ASSERT - Should sanitize script tags
      expect(mockOnChange).toHaveBeenCalledWith('Find React experts')
    })

    it('should prevent XSS attacks in query display', () => {
      // ARRANGE
      const xssValue = '<img src="x" onerror="alert(1)">'
      
      // ACT
      renderWithoutRouter(<QueryInput {...defaultProps} value={xssValue} />)
      
      // ASSERT - Should not execute scripts
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).not.toContain('<img')
    })

    it('should handle invalid characters gracefully', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      const invalidInput = 'Query with \u0000 null bytes \uFFFE'
      await user.type(textarea, invalidInput)
      
      // ASSERT - Should filter out invalid characters
      expect(mockOnChange).toHaveBeenCalledWith('Query with  null bytes ')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for screen readers', () => {
      // ARRANGE & ACT
      renderWithoutRouter(<QueryInput {...defaultProps} />)
      
      // ASSERT
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-label', 'Expert discovery query input')
      expect(textarea).toHaveAttribute('aria-describedby', 'query-helper-text')
      expect(textarea).toHaveAttribute('aria-required', 'true')
    })

    it('should be keyboard navigable', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(<QueryInput {...defaultProps} />)
      
      // ACT
      await user.tab()
      
      // ASSERT
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveFocus()
    })

    it('should announce character limit warnings', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} maxLength={10} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, '1234567890')
      
      // ASSERT
      const helperText = screen.getByText('10/10 characters (Ctrl+Enter to submit)')
      expect(helperText).toHaveAttribute('aria-live', 'polite')
    })

    it('should pass accessibility audit', async () => {
      // ARRANGE
      const { container } = renderWithoutRouter(<QueryInput {...defaultProps} />)
      
      // ACT & ASSERT
      await runAxeTests(container)
    })
  })

  describe('Performance', () => {
    it('should debounce input changes for large texts', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onChange={mockOnChange} debounceMs={100} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'rapid typing', { delay: 10 })
      
      // ASSERT - Should debounce rapid changes
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1)
      }, { timeout: 200 })
    })

    it('should not re-render parent on every keystroke', async () => {
      // ARRANGE
      const ParentComponent = vi.fn(() => (
        <QueryInput {...defaultProps} onChange={vi.fn()} />
      ))
      const { user } = renderWithoutRouter(<ParentComponent />)
      
      // ACT
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'test', { delay: 50 })
      
      // ASSERT - Parent should not re-render for each keystroke
      expect(ParentComponent).toHaveBeenCalledTimes(1)
    })

    it('should handle rapid consecutive updates', async () => {
      // ARRANGE
      const mockOnChange = vi.fn()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onChange={mockOnChange} />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox')
      
      // Rapid typing
      for (let i = 0; i < 10; i++) {
        await user.type(textarea, `${i}`, { delay: 1 })
      }
      
      // ASSERT - Should handle all updates
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Integration', () => {
    it('should work with form libraries', () => {
      // ARRANGE
      const mockRegister = vi.fn(() => ({
        onChange: vi.fn(),
        onBlur: vi.fn(),
        name: 'query',
        ref: vi.fn()
      }))
      
      // ACT
      renderWithoutRouter(
        <QueryInput {...defaultProps} {...mockRegister('query')} />
      )
      
      // ASSERT
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('name', 'query')
    })

    it('should support controlled and uncontrolled modes', async () => {
      // ARRANGE
      const { rerender, user } = renderWithoutRouter(
        <QueryInput {...defaultProps} value={undefined} />
      )
      
      // ACT - Uncontrolled mode
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      await user.type(textarea, 'test')
      expect(textarea.value).toBe('test')
      
      // Switch to controlled mode
      rerender(<QueryInput {...defaultProps} value="controlled value" />)
      
      // ASSERT
      expect(textarea.value).toBe('controlled value')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined/null values gracefully', () => {
      // ARRANGE & ACT
      renderWithoutRouter(
        <QueryInput {...defaultProps} value={undefined as any} />
      )
      
      // ASSERT
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toBe('')
    })

    it('should handle extremely long text input', async () => {
      // ARRANGE
      const veryLongText = 'A'.repeat(10000)
      const mockOnChange = vi.fn()
      
      // ACT
      renderWithoutRouter(
        <QueryInput {...defaultProps} value={veryLongText} onChange={mockOnChange} />
      )
      
      // ASSERT - Should handle without performance issues
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value.length).toBe(5000) // Truncated to maxLength
    })

    it('should maintain cursor position during value updates', async () => {
      // ARRANGE
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} value="Hello World" />
      )
      
      // ACT
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      textarea.setSelectionRange(5, 5) // Position cursor after "Hello"
      await user.type(textarea, ' Beautiful')
      
      // ASSERT - Cursor position handling is implementation dependent
      expect(textarea.selectionStart).toBeGreaterThan(5)
    })
  })

  describe('Query History Integration', () => {
    let mockUseQueryHistory: any
    let mockHistoryEntries: QueryHistoryEntry[]

    beforeEach(() => {
      // Setup mock history hook
      mockHistoryEntries = [
        {
          id: 'history-1',
          query: 'React performance optimization',
          parameters: {
            algorithm: 'hybrid' as const,
            maxResults: 10,
            includeInactive: false,
            confidenceThreshold: 0.8,
            technologies: ['React'],
            experienceLevel: 'senior',
            teamSize: 1
          },
          timestamp: Date.now() - 1000,
          success: true,
          version: '2.0.0',
          resultCount: 5
        },
        {
          id: 'history-2', 
          query: 'TypeScript best practices',
          parameters: {
            algorithm: 'vector' as const,
            maxResults: 20,
            includeInactive: true,
            confidenceThreshold: 0.7,
            technologies: ['TypeScript'],
            experienceLevel: 'expert',
            teamSize: 2
          },
          timestamp: Date.now() - 2000,
          success: true,
          version: '2.0.0',
          resultCount: 8
        }
      ]

      mockUseQueryHistory = {
        entries: mockHistoryEntries,
        isLoading: false,
        error: null,
        addEntry: vi.fn(),
        removeEntry: vi.fn(),
        clearHistory: vi.fn(),
        refetch: vi.fn()
      }

      const { useQueryHistory } = require('../../hooks/useQueryHistory')
      useQueryHistory.mockReturnValue(mockUseQueryHistory)
    })

    const createQueryWrapper = () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 }
        }
      })

      return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    it('should toggle history display on button click', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Act
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Assert
      expect(screen.getByTestId('expandable-history')).toBeInTheDocument()
      expect(screen.getByTestId('history-header')).toHaveTextContent('Recent Queries:')
      expect(screen.getByTestId('history-item-0')).toHaveTextContent('React performance optimization')
    })

    it('should hide history display when toggled off', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Open history first
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      expect(screen.getByTestId('expandable-history')).toBeInTheDocument()
      
      // Act - Close history
      await user.click(historyButton)
      
      // Assert
      expect(screen.queryByTestId('expandable-history')).not.toBeInTheDocument()
    })

    it('should populate input when history item is selected', async () => {
      // Arrange
      const onQueryChange = vi.fn()
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onQueryChange={onQueryChange} />,
        { wrapper }
      )
      
      // Open history
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Act
      const historyItem = screen.getByTestId('history-item-0')
      await user.click(historyItem)
      
      // Assert
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('React performance optimization')
      expect(onQueryChange).toHaveBeenCalledWith('React performance optimization')
    })

    it('should restore query parameters when selecting from history', async () => {
      // Arrange
      const onParametersChange = vi.fn()
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onParametersChange={onParametersChange} />,
        { wrapper }
      )
      
      // Open history
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Act
      const historyItem = screen.getByTestId('history-item-1') // TypeScript entry
      await user.click(historyItem)
      
      // Assert
      expect(onParametersChange).toHaveBeenCalledWith({
        algorithm: 'vector',
        maxResults: 20,
        includeInactive: true,
        confidenceThreshold: 0.7,
        technologies: ['TypeScript'],
        experienceLevel: 'expert',
        teamSize: 2
      })
    })

    it('should add entry to history when search is performed', async () => {
      // Arrange
      const onSearch = vi.fn()
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onSearch={onSearch} />,
        { wrapper }
      )
      
      const query = 'New search query'
      const textarea = screen.getByRole('textbox')
      
      // Act
      await user.type(textarea, query)
      await user.keyboard('{Control>}{Enter}{/Control}')
      
      // Assert
      expect(onSearch).toHaveBeenCalledWith(query)
      expect(mockUseQueryHistory.addEntry).toHaveBeenCalledWith(
        query,
        expect.any(Object),
        expect.objectContaining({ success: true })
      )
    })

    it('should delete history item when delete button is clicked', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Open history
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Act
      const deleteButton = screen.getByTestId('delete-history-1')
      await user.click(deleteButton)
      
      // Assert
      expect(mockUseQueryHistory.removeEntry).toHaveBeenCalledWith('history-1')
    })

    it('should clear all history when clear button is clicked', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Open history
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Act
      const clearButton = screen.getByTestId('clear-history')
      await user.click(clearButton)
      
      // Assert
      expect(mockUseQueryHistory.clearHistory).toHaveBeenCalled()
    })

    it('should support keyboard navigation in history', async () => {
      // Arrange
      const onQueryChange = vi.fn()
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} onQueryChange={onQueryChange} />,
        { wrapper }
      )
      
      // Open history
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Act
      const firstItem = screen.getByTestId('history-item-0')
      firstItem.focus()
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      // Assert
      expect(document.activeElement).toHaveAttribute('data-testid', 'history-item-1')
      expect(onQueryChange).toHaveBeenCalledWith('TypeScript best practices')
    })

    it('should close history when Escape key is pressed', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Open history
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      expect(screen.getByTestId('expandable-history')).toBeInTheDocument()
      
      // Act
      await user.keyboard('{Escape}')
      
      // Assert
      expect(screen.queryByTestId('expandable-history')).not.toBeInTheDocument()
    })

    it('should show loading state when history is loading', async () => {
      // Arrange
      mockUseQueryHistory.isLoading = true
      const wrapper = createQueryWrapper()
      
      renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Act
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Assert
      expect(screen.getByTestId('history-loading')).toBeInTheDocument()
    })

    it('should show error state when history loading fails', async () => {
      // Arrange
      mockUseQueryHistory.error = {
        code: 'STORAGE_UNAVAILABLE',
        message: 'Local storage is not available'
      }
      const wrapper = createQueryWrapper()
      
      renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Act
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Assert
      expect(screen.getByTestId('history-error')).toHaveTextContent('Local storage is not available')
    })

    it('should sync across tabs when storage events occur', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Act - Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'expert_discovery_query_history',
        newValue: JSON.stringify([...mockHistoryEntries, {
          id: 'new-cross-tab',
          query: 'Added from another tab',
          parameters: mockHistoryEntries[0].parameters,
          timestamp: Date.now(),
          success: true,
          version: '2.0.0'
        }])
      })
      window.dispatchEvent(storageEvent)
      
      // Assert
      await waitFor(() => {
        expect(mockUseQueryHistory.refetch).toHaveBeenCalled()
      })
    })

    it('should handle empty history state gracefully', async () => {
      // Arrange
      mockUseQueryHistory.entries = []
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Act
      const historyButton = screen.queryByLabelText('Toggle query history')
      
      // Assert - History button should not be visible when no entries
      expect(historyButton).not.toBeInTheDocument()
    })

    it('should limit visible history items for performance', async () => {
      // Arrange
      const manyEntries = Array.from({ length: 100 }, (_, i) => ({
        id: `entry-${i}`,
        query: `Query ${i}`,
        parameters: mockHistoryEntries[0].parameters,
        timestamp: Date.now() - i * 1000,
        success: true,
        version: '2.0.0'
      }))
      
      mockUseQueryHistory.entries = manyEntries
      const wrapper = createQueryWrapper()
      const { user } = renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Act
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Assert - Should only show limited number of items
      const historyItems = screen.getAllByTestId(/^history-item-/)
      expect(historyItems.length).toBeLessThanOrEqual(20) // Assuming 20 item limit
    })

    it('should maintain accessibility standards for history', async () => {
      // Arrange
      const wrapper = createQueryWrapper()
      const { container, user } = renderWithoutRouter(
        <QueryInput {...defaultProps} />,
        { wrapper }
      )
      
      // Act
      const historyButton = screen.getByLabelText('Toggle query history')
      await user.click(historyButton)
      
      // Assert - Run accessibility audit
      await runAxeTests(container)
    })
  })
})
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithoutRouter, runAxeTests, expectElementToBeVisible, createMockFile } from '../../../../test-utils/test-utils'
import { QueryInput } from './QueryInput'
import { queryFixtures } from '../../../../test-utils/fixtures/mock-data'

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
})
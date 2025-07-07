import React, { ReactElement } from 'react'
import { render, RenderOptions, waitFor, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

// Accessibility testing with jest-axe
import { axe } from 'jest-axe'
import { vi } from 'vitest'

const runAxeTests = async (container: HTMLElement) => {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

// Enhanced render function with all necessary providers
export function renderWithProviders(
  ui: ReactElement,
  options?: {
    initialEntries?: string[]
    queryClientOptions?: any
  } & Omit<RenderOptions, 'wrapper'>
) {
  const { initialEntries = ['/'], queryClientOptions, ...renderOptions } = options || {}
  
  // Create a new QueryClient for each test to ensure isolation
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Turn off retries for tests
        staleTime: 0, // Set a shorter stale time for tests
        gcTime: 0, // Immediately garbage collect
      },
      mutations: {
        retry: false,
      },
    },
    ...queryClientOptions,
  })

  function AllProviders({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </MantineProvider>
      </MemoryRouter>
    )
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
    queryClient,
  }
}

// Custom render for components that don't need routing
export function renderWithoutRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MantineProvider>
    )
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}

// Async utilities for better test reliability
export const waitForLoadingToFinish = () => 
  waitFor(
    () => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    },
    { timeout: 3000 }
  )

export const waitForElementToBeRemoved = (element: HTMLElement) =>
  waitFor(() => {
    expect(element).not.toBeInTheDocument()
  })

// Export the accessibility helper
export { runAxeTests }

// Performance testing helper
export const measureRenderTime = (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Mock file upload helper
export const createMockFile = (
  filename: string = 'test.js',
  content: string = 'console.log("test")',
  type: string = 'text/javascript'
): File => {
  const file = new File([content], filename, { type })
  return file
}

// Custom assertions for better test readability
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveAccessibleName = (element: HTMLElement, name: string) => {
  expect(element).toHaveAccessibleName(name)
}

export const expectElementToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled()
}

export const expectElementToBeEnabled = (element: HTMLElement) => {
  expect(element).toBeEnabled()
  expect(element).not.toHaveAttribute('aria-disabled', 'true')
}

// Network testing utilities
export const mockConsoleError = () => {
  const originalError = console.error
  const mockError = vi.fn()
  console.error = mockError
  
  return {
    mockError,
    restore: () => {
      console.error = originalError
    }
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { userEvent }
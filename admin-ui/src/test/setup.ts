import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { setupServer } from 'msw/node'
import { handlers } from '../test-utils/msw-handlers'
import 'jest-axe/extend-expect'

// Extend Vitest's expect with jest-dom matchers and jest-axe
expect.extend(matchers)

// Setup MSW server
export const server = setupServer(...handlers)

beforeAll(() => {
  // Start server before all tests
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  // Clean up after each test
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  // Close server after all tests
  server.close()
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock EventSource
global.EventSource = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  readyState: 1,
  url: '',
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock console methods to reduce noise in tests
Object.defineProperty(window, 'console', {
  value: {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
  },
})

// Mock performance API for testing
Object.defineProperty(window, 'performance', {
  value: {
    ...performance,
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn().mockReturnValue([]),
  },
})
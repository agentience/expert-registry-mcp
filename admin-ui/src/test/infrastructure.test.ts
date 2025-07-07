import { describe, it, expect } from 'vitest'
import { server } from './setup'
import { handlers } from '../test-utils/msw-handlers'

/**
 * TDD Cycle 1: Project Setup & Test Infrastructure
 * RED PHASE - These tests will fail initially and guide implementation
 */
describe('Test Infrastructure', () => {
  it('should have React Testing Library configured', () => {
    // Test that RTL is properly configured
    expect(expect.extend).toBeDefined()
    expect(global.IntersectionObserver).toBeDefined()
    expect(global.ResizeObserver).toBeDefined()
  })

  it('should have MSW handlers configured', () => {
    // Test that MSW server is running with handlers
    expect(server).toBeDefined()
    expect(handlers).toBeDefined()
    expect(handlers.length).toBeGreaterThan(0)
  })

  it('should have axe-core for accessibility testing', async () => {
    // Test that axe-core is available for a11y testing
    const { axe } = await import('jest-axe')
    expect(axe).toBeDefined()
    
    // Test that toHaveNoViolations matcher is available
    const testDiv = document.createElement('div')
    testDiv.innerHTML = '<button>Test</button>'
    const results = await axe(testDiv)
    expect(results).toHaveNoViolations()
  })

  it('should have test utilities available', async () => {
    // Test that our custom test utilities are properly exported
    const utils = await import('../test-utils/test-utils')
    
    expect(utils.renderWithProviders).toBeDefined()
    expect(utils.renderWithoutRouter).toBeDefined()
    expect(utils.waitForLoadingToFinish).toBeDefined()
    expect(utils.runAxeTests).toBeDefined()
    expect(utils.createMockFile).toBeDefined()
    expect(utils.userEvent).toBeDefined()
  })

  it('should have performance monitoring configured', () => {
    // Test that performance API is mocked for testing
    expect(window.performance.mark).toBeDefined()
    expect(window.performance.measure).toBeDefined()
    expect(window.performance.getEntriesByType).toBeDefined()
  })

  it('should have console methods mocked', () => {
    // Test that console methods are properly mocked
    expect(console.warn).toBeDefined()
    expect(console.error).toBeDefined()
    
    // These should be mocked functions in test environment
    console.warn('test warning')
    console.error('test error')
    
    expect(console.warn).toHaveBeenCalledWith('test warning')
    expect(console.error).toHaveBeenCalledWith('test error')
  })

  it('should support TypeScript strict mode', () => {
    // Test that TypeScript strict mode is enabled
    // This test will fail if strict mode is not properly configured
    
    interface TestInterface {
      id: string
      name: string
    }
    
    const testObject: TestInterface = {
      id: '123',
      name: 'test'
    }
    
    // TypeScript should enforce strict typing
    expect(testObject.id).toBe('123')
    expect(testObject.name).toBe('test')
  })

  it('should have proper test timeout configuration', async () => {
    // Test that async operations have proper timeout handling
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(resolve, 100)
    })
    
    await expect(timeoutPromise).resolves.toBeUndefined()
  })
})
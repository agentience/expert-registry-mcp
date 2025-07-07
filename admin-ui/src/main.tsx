import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

// Suppress specific React warnings from third-party libraries in development
if (import.meta.env.DEV) {
  const originalError = console.error
  console.error = (...args: any[]) => {
    const message = args[0]
    // Filter out callback ref warnings from Recharts/Mantine Charts
    if (typeof message === 'string' && message.includes('Unexpected return value from a callback ref')) {
      return
    }
    originalError.apply(console, args)
  }
}

// Add error handling to see what's happening
try {
  const root = document.getElementById('root')
  if (!root) {
    console.error('Root element not found!')
  } else {
    console.log('Rendering React app...')
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    console.log('React app rendered successfully')
  }
} catch (error) {
  console.error('Error rendering React app:', error)
}
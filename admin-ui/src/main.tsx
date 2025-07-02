import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

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
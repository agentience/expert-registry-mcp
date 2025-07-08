import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    // Reset error state and retry
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, showDetails } = this.state

      // Simple fallback without Mantine components to avoid provider dependency
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ fontSize: '48px', color: '#fa5252', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#343a40' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#868e96', maxWidth: '500px' }}>
            {error?.message || 'An unexpected error occurred'}
          </p>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button 
              onClick={this.handleRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#228be6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                color: '#495057',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>

          <button
            onClick={this.toggleDetails}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              color: '#868e96',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </button>

          {showDetails && (
            <div style={{ marginTop: '16px', width: '100%', maxWidth: '600px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Error Details:</strong>
              </div>
              <pre style={{
                background: '#f8f9fa',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                textAlign: 'left'
              }}>
                {error?.stack}
              </pre>
              {errorInfo?.componentStack && (
                <>
                  <div style={{ margin: '16px 0 8px 0' }}>
                    <strong>Component Stack:</strong>
                  </div>
                  <pre style={{
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px',
                    textAlign: 'left'
                  }}>
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
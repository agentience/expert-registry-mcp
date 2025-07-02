import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Center, Stack, Title, Text, Button, Group, Code, Collapse } from '@mantine/core'
import { IconAlertCircle, IconBug, IconRefresh } from '@tabler/icons-react'
import { ErrorDisplay } from './ErrorDisplay'
import type { StatsApiError } from '../../api/statsApi'

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

      // Check if it's a StatsApiError for enhanced display
      const isApiError = error && 'errorType' in error
      
      if (isApiError) {
        return (
          <Center h="100vh" p="md">
            <Stack align="center" maw={500}>
              <ErrorDisplay 
                error={error as StatsApiError} 
                onRetry={this.handleRetry}
              />
              <Group>
                <Button
                  variant="light"
                  color="gray"
                  size="sm"
                  leftSection={<IconBug size={14} />}
                  onClick={this.toggleDetails}
                >
                  {showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>
              </Group>
              <Collapse in={showDetails}>
                <Stack gap="xs">
                  <Code block>{error?.stack}</Code>
                  {errorInfo?.componentStack && (
                    <Code block>{errorInfo.componentStack}</Code>
                  )}
                </Stack>
              </Collapse>
            </Stack>
          </Center>
        )
      }

      // Fallback for non-API errors
      return (
        <Center h="100vh" p="md">
          <Stack align="center" maw={500}>
            <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
            <Title order={2}>Something went wrong</Title>
            <Text c="dimmed" ta="center">
              {error?.message || 'An unexpected error occurred'}
            </Text>
            
            <Group>
              <Button 
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
              <Button 
                variant="light"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </Group>

            <Group>
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                leftSection={<IconBug size={14} />}
                onClick={this.toggleDetails}
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
            </Group>

            <Collapse in={showDetails}>
              <Stack gap="xs" w="100%">
                <Text size="sm" fw={500}>Error Details:</Text>
                <Code block>{error?.stack}</Code>
                {errorInfo?.componentStack && (
                  <>
                    <Text size="sm" fw={500}>Component Stack:</Text>
                    <Code block>{errorInfo.componentStack}</Code>
                  </>
                )}
              </Stack>
            </Collapse>
          </Stack>
        </Center>
      )
    }

    return this.props.children
  }
}
import React from 'react'
import { Alert, Button, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { 
  IconAlertCircle, 
  IconLock, 
  IconLockAccess, 
  IconFileX, 
  IconClock, 
  IconServer, 
  IconWifi, 
  IconRefresh 
} from '@tabler/icons-react'
import type { StatsApiError, ErrorType } from '../../api/statsApi'

interface ErrorDisplayProps {
  error: Error | StatsApiError
  onRetry?: () => void
  className?: string
}

/**
 * Enhanced error display component that provides user-friendly error messages
 * and appropriate actions based on error type
 */
export function ErrorDisplay({ error, onRetry, className }: ErrorDisplayProps) {
  const isStatsApiError = error instanceof Object && 'errorType' in error
  const apiError = isStatsApiError ? error as StatsApiError : null

  const getErrorIcon = (errorType?: ErrorType) => {
    switch (errorType) {
      case 'authentication':
        return IconLock
      case 'authorization':
        return IconLockAccess
      case 'not_found':
        return IconFileX
      case 'rate_limit':
        return IconClock
      case 'server':
        return IconServer
      case 'network':
        return IconWifi
      default:
        return IconAlertCircle
    }
  }

  const getErrorColor = (errorType?: ErrorType) => {
    switch (errorType) {
      case 'authentication':
      case 'authorization':
        return 'yellow'
      case 'not_found':
        return 'blue'
      case 'rate_limit':
        return 'orange'
      case 'server':
      case 'network':
        return 'red'
      default:
        return 'red'
    }
  }

  const getErrorTitle = (errorType?: ErrorType) => {
    switch (errorType) {
      case 'authentication':
        return 'Authentication Required'
      case 'authorization':
        return 'Access Denied'
      case 'not_found':
        return 'Resource Not Found'
      case 'rate_limit':
        return 'Rate Limit Exceeded'
      case 'server':
        return 'Server Error'
      case 'network':
        return 'Connection Error'
      case 'client':
        return 'Request Error'
      default:
        return 'Error'
    }
  }

  const shouldShowRetryButton = () => {
    if (!apiError) return true // Show retry for generic errors
    return apiError.isRetryable
  }

  const getRetryMessage = () => {
    if (apiError?.retryMessage) {
      return apiError.retryMessage
    }
    if (shouldShowRetryButton()) {
      return 'You can try again'
    }
    return null
  }

  const ErrorIcon = getErrorIcon(apiError?.errorType)
  const errorColor = getErrorColor(apiError?.errorType)
  const errorTitle = getErrorTitle(apiError?.errorType)
  const userMessage = apiError?.userMessage || error.message
  const retryMessage = getRetryMessage()

  return (
    <Alert
      variant="light"
      color={errorColor}
      title={errorTitle}
      icon={<ErrorIcon size={16} />}
      className={className}
    >
      <Stack gap="sm">
        <Text size="sm">{userMessage}</Text>
        
        {apiError?.errorCode && (
          <Text size="xs" c="dimmed">
            Error Code: {apiError.errorCode}
          </Text>
        )}

        {retryMessage && (
          <Text size="xs" c="dimmed">
            {retryMessage}
          </Text>
        )}

        {shouldShowRetryButton() && onRetry && (
          <Group>
            <Button
              variant="light"
              color={errorColor}
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={onRetry}
            >
              Try Again
            </Button>
          </Group>
        )}

        {apiError?.retryAfter && apiError.retryAfter > 0 && (
          <Text size="xs" c="dimmed">
            Please wait {apiError.retryAfter} seconds before retrying
          </Text>
        )}
      </Stack>
    </Alert>
  )
}

/**
 * Simplified error display for inline usage
 */
export function InlineErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const isStatsApiError = error instanceof Object && 'errorType' in error
  const apiError = isStatsApiError ? error as StatsApiError : null
  const userMessage = apiError?.userMessage || error.message

  return (
    <Group gap="xs" c="red">
      <ThemeIcon variant="light" color="red" size="sm">
        <IconAlertCircle size={12} />
      </ThemeIcon>
      <Text size="sm">{userMessage}</Text>
      {apiError?.isRetryable && onRetry && (
        <Button variant="subtle" size="xs" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Group>
  )
}
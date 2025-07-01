import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Center, Stack, Title, Text, Button } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Center h="100vh">
          <Stack align="center">
            <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
            <Title order={2}>Something went wrong</Title>
            <Text c="dimmed">{this.state.error?.message}</Text>
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </Stack>
        </Center>
      )
    }

    return this.props.children
  }
}
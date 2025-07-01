import { Center, Loader, Text, Stack } from '@mantine/core'

interface LoadingStateProps {
  text?: string
}

export function LoadingState({ text = 'Loading...' }: LoadingStateProps) {
  return (
    <Center h={400}>
      <Stack align="center">
        <Loader size="lg" />
        <Text c="dimmed">{text}</Text>
      </Stack>
    </Center>
  )
}
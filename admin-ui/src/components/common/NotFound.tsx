import { Container, Title, Text, Button, Stack, Center } from '@mantine/core'
import { IconHome, IconArrowLeft } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <Container size="md" py="xl">
      <Center>
        <Stack align="center" gap="md">
          <Title order={1} size={120} c="dimmed">
            404
          </Title>
          <Title order={2}>Page Not Found</Title>
          <Text size="lg" ta="center" c="dimmed">
            The page you are looking for does not exist or has been moved.
          </Text>
          <Stack gap="sm" mt="md">
            <Button
              leftSection={<IconHome size={16} />}
              onClick={() => navigate('/')}
              size="md"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate(-1)}
              size="md"
            >
              Go Back
            </Button>
          </Stack>
        </Stack>
      </Center>
    </Container>
  )
}

export default NotFound
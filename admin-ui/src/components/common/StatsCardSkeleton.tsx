import { Card, Group, Stack, Skeleton, ThemeIcon } from '@mantine/core'

export function StatsCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Stack gap={0}>
          <Skeleton height={16} width={120} radius="sm" />
          <Skeleton height={28} width={60} mt={4} radius="sm" />
          <Group gap={4} mt={4}>
            <Skeleton height={16} width={16} radius="sm" />
            <Skeleton height={16} width={40} radius="sm" />
          </Group>
        </Stack>
        <ThemeIcon
          color="gray"
          variant="light"
          radius="md"
          size="xl"
        >
          <Skeleton height={24} width={24} radius="sm" />
        </ThemeIcon>
      </Group>
    </Card>
  )
}
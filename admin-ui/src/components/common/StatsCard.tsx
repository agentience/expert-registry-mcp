import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: string
    direction: 'up' | 'down'
  }
  color?: string
}

export function StatsCard({ title, value, icon, trend, color = 'blue' }: StatsCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Stack gap={0}>
          <Text size="sm" c="dimmed" fw={500}>
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {value}
          </Text>
          {trend && (
            <Group gap={4} mt={4}>
              {trend.direction === 'up' ? (
                <IconTrendingUp size={16} color="var(--mantine-color-teal-6)" />
              ) : (
                <IconTrendingDown size={16} color="var(--mantine-color-red-6)" />
              )}
              <Text
                size="sm"
                c={trend.direction === 'up' ? 'teal' : 'red'}
                fw={500}
              >
                {trend.value}
              </Text>
            </Group>
          )}
        </Stack>
        <ThemeIcon
          color={color}
          variant="light"
          radius="md"
          size="xl"
        >
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  )
}
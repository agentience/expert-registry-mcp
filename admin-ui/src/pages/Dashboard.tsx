import { Grid, Card, Text, Stack } from '@mantine/core'
import {
  IconUsers,
  IconActivity,
  IconTrendingUp,
  IconClock,
} from '@tabler/icons-react'
import { StatsCard } from '../components/common/StatsCard'
import { UsageChart } from '../components/analytics/UsageChart'
import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../services/api'
import { LoadingState } from '../components/common/LoadingState'

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => statsApi.overview().then(res => res.data),
  })

  const { data: usageData } = useQuery({
    queryKey: ['stats', 'usage', '7d'],
    queryFn: () => statsApi.usageTimeline({ range: '7d' }).then(res => res.data),
  })

  if (isLoading) {
    return <LoadingState text="Loading dashboard..." />
  }

  return (
    <Stack>
      <Grid>
        <Grid.Col span={3}>
          <StatsCard
            title="Total Experts"
            value={stats?.total_experts || 0}
            icon={<IconUsers />}
            trend={{ value: '+5%', direction: 'up' }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <StatsCard
            title="Active Tasks"
            value={stats?.active_tasks || 0}
            icon={<IconActivity />}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <StatsCard
            title="Success Rate"
            value={`${stats?.success_rate || 0}%`}
            icon={<IconTrendingUp />}
            trend={{ value: '+2.5%', direction: 'up' }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <StatsCard
            title="Avg Response Time"
            value={`${stats?.avg_response_time || 0}ms`}
            icon={<IconClock />}
          />
        </Grid.Col>
      </Grid>

      <Grid mt="lg">
        <Grid.Col span={8}>
          <UsageChart data={usageData || []} />
        </Grid.Col>
        <Grid.Col span={4}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={500}>Top Experts</Text>
            </Card.Section>
            <Card.Section p="md">
              <Stack>
                <Text size="sm" c="dimmed">No data available</Text>
              </Stack>
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
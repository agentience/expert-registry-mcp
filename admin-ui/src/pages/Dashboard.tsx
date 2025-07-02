import { Grid, Card, Text, Stack } from '@mantine/core'
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconTrendingUp,
} from '@tabler/icons-react'
import { StatsCard } from '../components/common/StatsCard'
import { StatsCardSkeleton } from '../components/common/StatsCardSkeleton'
import { UsageChart } from '../components/analytics/UsageChart'
import { ErrorDisplay } from '../components/common/ErrorDisplay'
import { useOverviewStats } from '../hooks/useOverviewStats'

export function Dashboard() {
  const { data: stats, isLoading, isError, error, refetch } = useOverviewStats()

  // Error state
  if (isError) {
    return (
      <Stack>
        <ErrorDisplay 
          error={error || new Error('Failed to load dashboard data. Please try again.')}
          onRetry={refetch}
        />
      </Stack>
    )
  }

  // Calculate success rate from the data
  const successRate = stats?.totalExperts ? 
    ((stats.activeExperts / stats.totalExperts) * 100).toFixed(1) : 
    0

  return (
    <Stack>
      <Grid>
        <Grid.Col span={3}>
          {isLoading ? (
            <StatsCardSkeleton />
          ) : (
            <StatsCard
              title="Total Experts"
              value={stats?.totalExperts || 0}
              icon={<IconUsers />}
              trend={{ value: '+5%', direction: 'up' }}
            />
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          {isLoading ? (
            <StatsCardSkeleton />
          ) : (
            <StatsCard
              title="Active Experts"
              value={stats?.activeExperts || 0}
              icon={<IconUserCheck />}
              color="green"
            />
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          {isLoading ? (
            <StatsCardSkeleton />
          ) : (
            <StatsCard
              title="Inactive Experts"
              value={stats?.inactiveExperts || 0}
              icon={<IconUserX />}
              color="orange"
            />
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          {isLoading ? (
            <StatsCardSkeleton />
          ) : (
            <StatsCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={<IconTrendingUp />}
              trend={{ value: '+2.5%', direction: 'up' }}
              color="teal"
            />
          )}
        </Grid.Col>
      </Grid>

      <Grid mt="lg">
        <Grid.Col span={8}>
          <UsageChart data={[]} />
        </Grid.Col>
        <Grid.Col span={4}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={500}>Top Experts</Text>
            </Card.Section>
            <Card.Section p="md">
              <Stack>
                {isLoading ? (
                  <Text size="sm" c="dimmed">Loading top experts...</Text>
                ) : stats?.topExperts && stats.topExperts.length > 0 ? (
                  stats.topExperts.map((expert) => (
                    <div key={expert.id}>
                      <Text size="sm" fw={500}>{expert.name}</Text>
                      <Text size="xs" c="dimmed">{expert.specialization}</Text>
                      <Text size="xs" c="blue">{expert.usageCount} uses</Text>
                    </div>
                  ))
                ) : (
                  <Text size="sm" c="dimmed">No experts data available</Text>
                )}
              </Stack>
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
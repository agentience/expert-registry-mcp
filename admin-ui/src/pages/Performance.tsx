import { Tabs, Grid, Table, Text, Group, Progress, Badge } from '@mantine/core'
import {
  Sparkline,
} from '@mantine/charts'

// Mock performance data
const performanceData = [
  {
    id: 'aws-amplify-gen2',
    name: 'AWS Amplify Gen 2 Expert',
    successRate: 95.5,
    avgResponseTime: 124,
    adherenceScore: 9.2,
    totalUses: 1523,
    trend: [20, 25, 22, 28, 30, 35, 32],
  },
  {
    id: 'react-native',
    name: 'React Native Expert',
    successRate: 92.3,
    avgResponseTime: 156,
    adherenceScore: 8.8,
    totalUses: 1234,
    trend: [18, 20, 24, 22, 28, 26, 30],
  },
  {
    id: 'fastapi',
    name: 'FastAPI Expert',
    successRate: 94.1,
    avgResponseTime: 98,
    adherenceScore: 9.0,
    totalUses: 987,
    trend: [25, 28, 30, 32, 35, 33, 38],
  },
]

function getScoreColor(score: number): string {
  if (score >= 9) return 'green'
  if (score >= 7) return 'yellow'
  return 'red'
}

export function Performance() {
  return (
    <Tabs defaultValue="overview">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="by-expert">By Expert</Tabs.Tab>
        <Tabs.Tab value="by-task">By Task Type</Tabs.Tab>
        <Tabs.Tab value="comparisons">Comparisons</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="overview" pt="xl">
        <Grid>
          <Grid.Col span={12}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Expert</Table.Th>
                  <Table.Th>Success Rate</Table.Th>
                  <Table.Th>Avg Response Time</Table.Th>
                  <Table.Th>Adherence Score</Table.Th>
                  <Table.Th>Total Uses</Table.Th>
                  <Table.Th>Trend</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {performanceData.map((expert) => (
                  <Table.Tr key={expert.id}>
                    <Table.Td>{expert.name}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Text>{expert.successRate}%</Text>
                        <Progress
                          value={expert.successRate}
                          size="xs"
                          w={60}
                          color={expert.successRate > 90 ? 'green' : 'orange'}
                        />
                      </Group>
                    </Table.Td>
                    <Table.Td>{expert.avgResponseTime}ms</Table.Td>
                    <Table.Td>
                      <Badge color={getScoreColor(expert.adherenceScore)}>
                        {expert.adherenceScore}/10
                      </Badge>
                    </Table.Td>
                    <Table.Td>{expert.totalUses}</Table.Td>
                    <Table.Td>
                      <Sparkline
                        w={100}
                        h={30}
                        data={expert.trend}
                        trendColors={{ positive: 'teal.6', negative: 'red.6', neutral: 'gray.5' }}
                        fillOpacity={0.2}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Grid.Col>
        </Grid>
      </Tabs.Panel>

      <Tabs.Panel value="by-expert" pt="xl">
        <Text c="dimmed">Expert-specific performance analysis coming soon...</Text>
      </Tabs.Panel>

      <Tabs.Panel value="by-task" pt="xl">
        <Text c="dimmed">Task type performance analysis coming soon...</Text>
      </Tabs.Panel>

      <Tabs.Panel value="comparisons" pt="xl">
        <Text c="dimmed">Expert comparison tools coming soon...</Text>
      </Tabs.Panel>
    </Tabs>
  )
}
import { Stack, SegmentedControl, Grid, Card, Text } from '@mantine/core'
import { useState } from 'react'
import { UsageChart } from '../components/analytics/UsageChart'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function Analytics() {
  const [timeRange, setTimeRange] = useState('7d')

  // Mock data
  const usageData = [
    { date: 'Mon', total: 120, successful: 110, failed: 10 },
    { date: 'Tue', total: 140, successful: 125, failed: 15 },
    { date: 'Wed', total: 135, successful: 120, failed: 15 },
    { date: 'Thu', total: 150, successful: 140, failed: 10 },
    { date: 'Fri', total: 180, successful: 165, failed: 15 },
    { date: 'Sat', total: 95, successful: 90, failed: 5 },
    { date: 'Sun', total: 85, successful: 80, failed: 5 },
  ]

  const expertDistribution = [
    { name: 'Backend', value: 35 },
    { name: 'Frontend', value: 30 },
    { name: 'Cloud', value: 20 },
    { name: 'Mobile', value: 10 },
    { name: 'Other', value: 5 },
  ]

  const taskTypeData = [
    { type: 'Feature', count: 245 },
    { type: 'Bug Fix', count: 180 },
    { type: 'Refactoring', count: 120 },
    { type: 'Investigation', count: 95 },
    { type: 'Article', count: 60 },
  ]

  return (
    <Stack>
      <SegmentedControl
        value={timeRange}
        onChange={setTimeRange}
        data={[
          { label: '24 Hours', value: '24h' },
          { label: '7 Days', value: '7d' },
          { label: '30 Days', value: '30d' },
          { label: 'Custom', value: 'custom' },
        ]}
      />

      <Grid>
        <Grid.Col span={12}>
          <UsageChart data={usageData} title="Expert Usage Over Time" />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={500}>Expert Usage Distribution</Text>
            </Card.Section>
            <Card.Section p="md">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expertDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expertDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Section>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={500}>Task Type Distribution</Text>
            </Card.Section>
            <Card.Section p="md">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
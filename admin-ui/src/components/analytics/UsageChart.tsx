import { Card, Text, Select, Group } from '@mantine/core'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useState } from 'react'

interface UsageChartProps {
  data: any[]
  title?: string
}

export function UsageChart({ data, title = 'Usage Over Time' }: UsageChartProps) {
  const [timeRange, setTimeRange] = useState('7d')

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>{title}</Text>
          <Select
            size="xs"
            value={timeRange}
            onChange={(value) => setTimeRange(value || '7d')}
            data={[
              { value: '24h', label: '24 Hours' },
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
            ]}
            style={{ width: 120 }}
          />
        </Group>
      </Card.Section>
      <Card.Section p="md">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8884d8"
              name="Total Requests"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="successful"
              stroke="#82ca9d"
              name="Successful"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="failed"
              stroke="#ff7f7f"
              name="Failed"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card.Section>
    </Card>
  )
}
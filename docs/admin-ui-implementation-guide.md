# Expert Registry Admin UI Implementation Guide

**Last Updated: 2025-07-01**

## Project Structure

```
admin-ui/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── experts/
│   │   │   ├── ExpertForm.tsx
│   │   │   ├── ExpertTable.tsx
│   │   │   ├── ExpertDetails.tsx
│   │   │   └── ExpertSearch.tsx
│   │   ├── analytics/
│   │   │   ├── UsageChart.tsx
│   │   │   ├── PerformanceMetrics.tsx
│   │   │   ├── TaskDistribution.tsx
│   │   │   └── ExpertComparison.tsx
│   │   └── layout/
│   │       ├── AppHeader.tsx
│   │       ├── NavigationMenu.tsx
│   │       └── MainLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ExpertManagement.tsx
│   │   ├── ContextEditor.tsx
│   │   ├── Analytics.tsx
│   │   ├── Performance.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useExperts.ts
│   │   ├── useAnalytics.ts
│   │   ├── useRealtime.ts
│   │   └── useAuth.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── websocket.ts
│   ├── store/
│   │   ├── index.ts
│   │   ├── expertSlice.ts
│   │   └── analyticsSlice.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Package Dependencies

```json
{
  "name": "expert-registry-admin-ui",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@mantine/core": "^8.1.0",
    "@mantine/hooks": "^8.1.0",
    "@mantine/form": "^8.1.0",
    "@mantine/dates": "^8.1.0",
    "@mantine/notifications": "^8.1.0",
    "@mantine/modals": "^8.1.0",
    "@mantine/spotlight": "^8.1.0",
    "@mantine/dropzone": "^8.1.0",
    "@mantine/charts": "^8.1.0",
    "@monaco-editor/react": "^4.6.0",
    "@tabler/icons-react": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.0.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Core Components Implementation

### 1. Main Layout Component

```tsx
// src/components/layout/MainLayout.tsx
import { AppShell, Burger, Group, Text, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NavigationMenu } from './NavigationMenu';
import { AppHeader } from './AppHeader';
import { Outlet } from 'react-router-dom';

export function MainLayout() {
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: { base: 60 } }}
      navbar={{
        width: { base: 250 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <AppHeader opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavigationMenu />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          backgroundColor: theme.colorScheme === 'dark'
            ? theme.colors.dark[8]
            : theme.colors.gray[0],
        }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
```

### 2. Navigation Menu Component

```tsx
// src/components/layout/NavigationMenu.tsx
import { NavLink } from '@mantine/core';
import {
  IconDashboard,
  IconUsers,
  IconFileText,
  IconChartBar,
  IconActivity,
  IconSearch,
  IconSettings,
  IconServerBolt,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: IconDashboard, label: 'Dashboard', path: '/' },
  { icon: IconUsers, label: 'Experts', path: '/experts' },
  { icon: IconFileText, label: 'Context Editor', path: '/context' },
  { icon: IconChartBar, label: 'Analytics', path: '/analytics' },
  { icon: IconActivity, label: 'Performance', path: '/performance' },
  { icon: IconSearch, label: 'Discovery Test', path: '/discovery' },
  { icon: IconServerBolt, label: 'System Logs', path: '/logs' },
  { icon: IconSettings, label: 'Settings', path: '/settings' },
];

export function NavigationMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          active={location.pathname === item.path}
          label={item.label}
          leftSection={<item.icon size={16} stroke={1.5} />}
          onClick={() => navigate(item.path)}
          mb={4}
        />
      ))}
    </>
  );
}
```

### 3. Stats Card Component

```tsx
// src/components/common/StatsCard.tsx
import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  color?: string;
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
  );
}
```

### 4. Expert Management Table

```tsx
// src/components/experts/ExpertTable.tsx
import {
  Table,
  ScrollArea,
  TextInput,
  Badge,
  Group,
  ActionIcon,
  Progress,
  Text,
  Menu,
  rem,
} from '@mantine/core';
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconDots,
  IconEye,
  IconCopy,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Expert } from '../../types';

interface ExpertTableProps {
  experts: Expert[];
  onEdit: (expert: Expert) => void;
  onDelete: (expert: Expert) => void;
  onView: (expert: Expert) => void;
}

export function ExpertTable({ experts, onEdit, onDelete, onView }: ExpertTableProps) {
  const [search, setSearch] = useState('');

  const filteredExperts = experts.filter(
    (expert) =>
      expert.name.toLowerCase().includes(search.toLowerCase()) ||
      expert.id.toLowerCase().includes(search.toLowerCase()) ||
      expert.domains.some((d) => d.toLowerCase().includes(search.toLowerCase()))
  );

  const rows = filteredExperts.map((expert) => (
    <Table.Tr key={expert.id}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {expert.id}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{expert.name}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          {expert.domains.map((domain) => (
            <Badge key={domain} size="sm" variant="light">
              {domain}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Progress
            value={expert.performance_metrics?.success_rate || 0}
            size="sm"
            style={{ width: rem(60) }}
          />
          <Text size="sm">
            {expert.performance_metrics?.success_rate || 0}%
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {expert.performance_metrics?.total_applications || 0}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => onView(expert)}
          >
            <IconEye size={16} stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => onEdit(expert)}
          >
            <IconEdit size={16} stroke={1.5} />
          </ActionIcon>
          <Menu withinPortal position="bottom-end" shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={16} stroke={1.5} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={() => navigator.clipboard.writeText(expert.id)}
              >
                Copy ID
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={() => onDelete(expert)}
              >
                Delete expert
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <TextInput
        placeholder="Search experts..."
        mb="md"
        leftSection={<IconSearch size={16} stroke={1.5} />}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Expert ID</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Domains</Table.Th>
            <Table.Th>Success Rate</Table.Th>
            <Table.Th>Total Uses</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
```

### 5. Expert Form Modal

```tsx
// src/components/experts/ExpertForm.tsx
import {
  TextInput,
  Textarea,
  MultiSelect,
  TagsInput,
  Stack,
  Group,
  Button,
  JsonInput,
  Accordion,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Expert } from '../../types';

interface ExpertFormProps {
  expert?: Expert;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export function ExpertForm({ expert, onSubmit, onCancel }: ExpertFormProps) {
  const form = useForm({
    initialValues: {
      id: expert?.id || '',
      name: expert?.name || '',
      version: expert?.version || '1.0.0',
      description: expert?.description || '',
      domains: expert?.domains || [],
      specializations: expert?.specializations || [
        {
          technology: '',
          frameworks: [],
          expertise_level: 'intermediate',
        },
      ],
      workflow_compatibility: expert?.workflow_compatibility || {
        feature: 0.8,
        'bug-fix': 0.8,
        refactoring: 0.7,
        investigation: 0.6,
        article: 0.5,
      },
      constraints: expert?.constraints || [],
      patterns: expert?.patterns || [],
      quality_standards: expert?.quality_standards || [],
    },

    validate: {
      id: (value) => {
        if (!value) return 'ID is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'ID must contain only lowercase letters, numbers, and hyphens';
        }
        return null;
      },
      name: (value) => (!value ? 'Name is required' : null),
      domains: (value) => (value.length === 0 ? 'At least one domain is required' : null),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Expert ID"
          placeholder="aws-amplify-gen2"
          description="Unique identifier for the expert (lowercase, hyphens allowed)"
          {...form.getInputProps('id')}
          disabled={!!expert}
        />

        <TextInput
          label="Name"
          placeholder="AWS Amplify Gen 2 Expert"
          {...form.getInputProps('name')}
        />

        <TextInput
          label="Version"
          placeholder="1.0.0"
          {...form.getInputProps('version')}
        />

        <Textarea
          label="Description"
          placeholder="Expert in AWS Amplify Gen 2 development..."
          rows={3}
          {...form.getInputProps('description')}
        />

        <MultiSelect
          label="Domains"
          placeholder="Select domains"
          data={[
            'backend',
            'frontend',
            'cloud',
            'mobile',
            'serverless',
            'database',
            'devops',
            'security',
          ]}
          {...form.getInputProps('domains')}
        />

        <Accordion variant="contained">
          <Accordion.Item value="specializations">
            <Accordion.Control>Specializations</Accordion.Control>
            <Accordion.Panel>
              <JsonInput
                label="Specializations"
                placeholder='[{"technology": "AWS Amplify", "frameworks": ["CDK"], "expertise_level": "expert"}]'
                formatOnBlur
                autosize
                minRows={4}
                {...form.getInputProps('specializations')}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="workflow">
            <Accordion.Control>Workflow Compatibility</Accordion.Control>
            <Accordion.Panel>
              <JsonInput
                label="Workflow Scores"
                placeholder='{"feature": 0.9, "bug-fix": 0.8, "refactoring": 0.7}'
                formatOnBlur
                autosize
                minRows={4}
                {...form.getInputProps('workflow_compatibility')}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="guidelines">
            <Accordion.Control>Guidelines</Accordion.Control>
            <Accordion.Panel>
              <Stack>
                <TagsInput
                  label="Constraints"
                  placeholder="Add constraints"
                  {...form.getInputProps('constraints')}
                />

                <TagsInput
                  label="Patterns"
                  placeholder="Add patterns"
                  {...form.getInputProps('patterns')}
                />

                <TagsInput
                  label="Quality Standards"
                  placeholder="Add quality standards"
                  {...form.getInputProps('quality_standards')}
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {expert ? 'Update' : 'Create'} Expert
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
```

### 6. Analytics Chart Component

```tsx
// src/components/analytics/UsageChart.tsx
import { Card, Text, Select, Group } from '@mantine/core';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';

interface UsageChartProps {
  data: any[];
  title?: string;
}

export function UsageChart({ data, title = 'Usage Over Time' }: UsageChartProps) {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>{title}</Text>
          <Select
            size="xs"
            value={timeRange}
            onChange={setTimeRange}
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
  );
}
```

## API Integration

### API Client Setup

```typescript
// src/services/api.ts
import axios from 'axios';
import { notifications } from '@mantine/notifications';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/admin';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      notifications.show({
        title: 'Server Error',
        message: 'Something went wrong. Please try again later.',
        color: 'red',
      });
    }
    return Promise.reject(error);
  }
);

// API methods
export const expertApi = {
  list: (params?: any) => api.get('/experts', { params }),
  get: (id: string) => api.get(`/experts/${id}`),
  create: (data: any) => api.post('/experts', data),
  update: (id: string, data: any) => api.put(`/experts/${id}`, data),
  delete: (id: string) => api.delete(`/experts/${id}`),
  
  getContext: (id: string) => api.get(`/expert-contexts/${id}`),
  updateContext: (id: string, content: string) => 
    api.post(`/expert-contexts/${id}`, { content }),
};

export const statsApi = {
  overview: () => api.get('/stats/overview'),
  expertStats: (id: string) => api.get(`/stats/experts/${id}`),
  usageTimeline: (params?: any) => api.get('/stats/usage/timeline', { params }),
  performance: (params?: any) => api.get('/stats/performance', { params }),
};
```

### React Query Hooks

```typescript
// src/hooks/useExperts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expertApi } from '../services/api';
import { notifications } from '@mantine/notifications';

export function useExperts(params?: any) {
  return useQuery({
    queryKey: ['experts', params],
    queryFn: () => expertApi.list(params).then(res => res.data),
  });
}

export function useExpert(id: string) {
  return useQuery({
    queryKey: ['experts', id],
    queryFn: () => expertApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateExpert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: expertApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      notifications.show({
        title: 'Success',
        message: 'Expert created successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create expert',
        color: 'red',
      });
    },
  });
}

export function useUpdateExpert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      expertApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts', variables.id] });
      notifications.show({
        title: 'Success',
        message: 'Expert updated successfully',
        color: 'green',
      });
    },
  });
}

export function useDeleteExpert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: expertApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      notifications.show({
        title: 'Success',
        message: 'Expert deleted successfully',
        color: 'green',
      });
    },
  });
}
```

## Real-time Updates

```typescript
// src/hooks/useRealtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/admin/events');

    eventSource.addEventListener('expert-update', (event) => {
      const data = JSON.parse(event.data);
      // Invalidate and refetch expert data
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts', data.expertId] });
    });

    eventSource.addEventListener('stats-update', (event) => {
      const data = JSON.parse(event.data);
      // Invalidate stats queries
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    });

    eventSource.addEventListener('task-complete', (event) => {
      const data = JSON.parse(event.data);
      notifications.show({
        title: 'Task Completed',
        message: `${data.expertId} completed task ${data.taskId}`,
        color: 'green',
      });
    });

    eventSource.addEventListener('error', (event) => {
      console.error('SSE Error:', event);
    });

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
```

## Theme Configuration

```typescript
// src/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

const brandColor: MantineColorsTuple = [
  '#e5f4ff',
  '#cde2ff',
  '#9bc2ff',
  '#64a0ff',
  '#3984fe',
  '#1d72fe',
  '#0969ff',
  '#0058e4',
  '#004ecc',
  '#0043b5',
];

export const theme = createTheme({
  colors: {
    brand: brandColor,
  },
  primaryColor: 'brand',
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  },
});
```

## Main App Component

```tsx
// src/App.tsx
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { ExpertManagement } from './pages/ExpertManagement';
import { ContextEditor } from './pages/ContextEditor';
import { Analytics } from './pages/Analytics';
import { Performance } from './pages/Performance';
import { Settings } from './pages/Settings';
import { useRealtimeUpdates } from './hooks/useRealtime';

// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/charts/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  useRealtimeUpdates();

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="experts" element={<ExpertManagement />} />
        <Route path="context" element={<ContextEditor />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="performance" element={<Performance />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <ModalsProvider>
          <Notifications position="top-right" />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
```

## Docker Integration

```dockerfile
# Dockerfile.admin addition
FROM node:20-alpine as admin-builder

WORKDIR /app/admin-ui

COPY admin-ui/package*.json ./
RUN npm ci --no-audit

COPY admin-ui/ ./
RUN npm run build

# In production stage
COPY --from=admin-builder /app/admin-ui/dist /app/static/admin
```

## FastAPI Admin Router

```python
# src/expert_registry_mcp/admin_api.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter()

class ExpertCreate(BaseModel):
    id: str
    name: str
    version: str = "1.0.0"
    description: str
    domains: List[str]
    specializations: List[Dict[str, Any]]
    workflow_compatibility: Dict[str, float]
    constraints: List[str]
    patterns: List[str]
    quality_standards: List[str]

@router.get("/experts")
async def list_experts(
    domain: Optional[str] = None,
    technology: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """List all experts with optional filtering."""
    # Implementation here
    pass

@router.post("/experts")
async def create_expert(expert: ExpertCreate):
    """Create a new expert."""
    # Implementation here
    pass

@router.put("/experts/{expert_id}")
async def update_expert(expert_id: str, expert: ExpertCreate):
    """Update an existing expert."""
    # Implementation here
    pass

@router.delete("/experts/{expert_id}")
async def delete_expert(expert_id: str):
    """Delete an expert."""
    # Implementation here
    pass

@router.get("/stats/overview")
async def get_overview_stats():
    """Get system-wide statistics."""
    return {
        "total_experts": 42,
        "active_tasks": 5,
        "success_rate": 94.5,
        "avg_response_time": 124,
        "total_requests_today": 1523,
        "total_requests_week": 8934,
    }

@router.get("/stats/usage/timeline")
async def get_usage_timeline(
    range: str = "7d",
    expert_id: Optional[str] = None
):
    """Get usage statistics over time."""
    # Generate sample data based on range
    # Implementation here
    pass
```

## Next Steps

1. **Setup Development Environment**
   ```bash
   cd admin-ui
   npm install
   npm run dev
   ```

2. **Implement API Endpoints**
   - Add admin router to main FastAPI app
   - Implement database queries
   - Add authentication middleware

3. **Build Production Image**
   ```bash
   docker build -t expert-registry-admin:latest -f Dockerfile.admin .
   ```

4. **Deploy with Docker Compose**
   ```yaml
   # docker-compose.admin.yml
   services:
     expert-registry-admin:
       image: expert-registry-admin:latest
       ports:
         - "3000:3000"  # Admin UI
         - "8000:8000"  # API
   ```

This implementation guide provides a solid foundation for building the admin interface with Mantine, React, and TypeScript, fully integrated with the Expert Registry MCP system.
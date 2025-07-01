# Expert Registry MCP Admin Interface Design

**Last Updated: 2025-07-01**

## Executive Summary

This document outlines the design and architecture for an administrative interface for the Expert Registry MCP service. The interface will be a React-based single-page application using the Mantine framework, deployed as part of the Docker container alongside the MCP server. It will provide comprehensive CRUD operations for expert management, visualization of usage statistics, and performance analytics.

## Architecture Overview

### Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **UI Component Library**: Mantine v8.1+
- **State Management**: Zustand or React Context API
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charts**: Recharts or Mantine Charts
- **Build Tool**: Vite
- **API Communication**: REST API with SSE for real-time updates

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│         Docker Container                         │
│  ┌────────────────────┐  ┌──────────────────┐  │
│  │   Admin UI (SPA)   │  │   FastAPI Server │  │
│  │   Port: 3000       │  │   Port: 8000     │  │
│  └────────────────────┘  └──────────────────┘  │
│           │                        │             │
│           └────────────────────────┘             │
│                     API                          │
└─────────────────────────────────────────────────┘
                         │
     ┌───────────────────┴────────────────────┐
     │              │              │            │
 ┌────────┐  ┌────────────┐  ┌──────────┐  ┌──────┐
 │ Neo4j  │  │  ChromaDB  │  │  Expert  │  │Redis │
 │  DB    │  │   Vector   │  │  Files   │  │Cache │
 └────────┘  └────────────┘  └──────────┘  └──────┘
```

## API Design

### REST Endpoints

The admin interface will communicate with a new FastAPI-based REST API layer:

```python
# Admin API endpoints
GET    /api/admin/experts                    # List all experts with pagination
GET    /api/admin/experts/{id}              # Get expert details
POST   /api/admin/experts                    # Create new expert
PUT    /api/admin/experts/{id}              # Update expert
DELETE /api/admin/experts/{id}              # Delete expert

GET    /api/admin/stats/overview            # System-wide statistics
GET    /api/admin/stats/experts/{id}        # Expert-specific statistics
GET    /api/admin/stats/usage/timeline      # Usage over time
GET    /api/admin/stats/performance         # Performance metrics

GET    /api/admin/search/logs              # Search usage logs
GET    /api/admin/search/tasks             # Search task history

POST   /api/admin/expert-contexts/{id}      # Update expert context
GET    /api/admin/expert-contexts/{id}      # Get expert context

# WebSocket/SSE endpoints for real-time updates
WS     /api/admin/ws                       # Real-time updates
SSE    /api/admin/events                   # Server-sent events
```

## UI Layout & Components

### Main Layout Structure

```tsx
<AppShell
  header={{ height: 60 }}
  navbar={{ width: 250, breakpoint: 'sm' }}
  padding="md"
>
  <AppShell.Header>
    <HeaderComponent />
  </AppShell.Header>
  
  <AppShell.Navbar>
    <NavigationMenu />
  </AppShell.Navbar>
  
  <AppShell.Main>
    <Routes>
      {/* Route components */}
    </Routes>
  </AppShell.Main>
</AppShell>
```

### Navigation Structure

1. **Dashboard** - Overview statistics and system health
2. **Experts Management** - CRUD operations for experts
3. **Context Editor** - Edit expert context files
4. **Usage Analytics** - Usage statistics and trends
5. **Performance Metrics** - Expert performance analysis
6. **Search & Discovery** - Test expert discovery features
7. **System Logs** - View and search system logs
8. **Settings** - Configuration and preferences

## Page Designs

### 1. Dashboard Page

```tsx
// Key components for dashboard
<Grid>
  <Grid.Col span={3}>
    <StatsCard
      title="Total Experts"
      value={totalExperts}
      icon={<IconUsers />}
      trend="+5%"
    />
  </Grid.Col>
  <Grid.Col span={3}>
    <StatsCard
      title="Active Tasks"
      value={activeTasks}
      icon={<IconActivity />}
    />
  </Grid.Col>
  <Grid.Col span={3}>
    <StatsCard
      title="Success Rate"
      value="94.5%"
      icon={<IconTrendingUp />}
    />
  </Grid.Col>
  <Grid.Col span={3}>
    <StatsCard
      title="Avg Response Time"
      value="124ms"
      icon={<IconClock />}
    />
  </Grid.Col>
</Grid>

<Grid mt="lg">
  <Grid.Col span={8}>
    <Card>
      <Card.Section withBorder inheritPadding py="xs">
        <Text fw={500}>Usage Timeline</Text>
      </Card.Section>
      <UsageChart data={usageData} />
    </Card>
  </Grid.Col>
  <Grid.Col span={4}>
    <Card>
      <Card.Section withBorder inheritPadding py="xs">
        <Text fw={500}>Top Experts</Text>
      </Card.Section>
      <TopExpertsList experts={topExperts} />
    </Card>
  </Grid.Col>
</Grid>
```

### 2. Expert Management Page

```tsx
// Expert list with CRUD operations
<Stack>
  <Group justify="space-between">
    <TextInput
      placeholder="Search experts..."
      leftSection={<IconSearch />}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    <Button leftSection={<IconPlus />} onClick={openCreateModal}>
      Add Expert
    </Button>
  </Group>

  <Table striped highlightOnHover>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>ID</Table.Th>
        <Table.Th>Name</Table.Th>
        <Table.Th>Domains</Table.Th>
        <Table.Th>Success Rate</Table.Th>
        <Table.Th>Last Used</Table.Th>
        <Table.Th>Actions</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {experts.map((expert) => (
        <Table.Tr key={expert.id}>
          <Table.Td>{expert.id}</Table.Td>
          <Table.Td>{expert.name}</Table.Td>
          <Table.Td>
            <Group gap={4}>
              {expert.domains.map((domain) => (
                <Badge key={domain} size="sm">
                  {domain}
                </Badge>
              ))}
            </Group>
          </Table.Td>
          <Table.Td>
            <Progress value={expert.successRate} size="sm" />
          </Table.Td>
          <Table.Td>{formatDate(expert.lastUsed)}</Table.Td>
          <Table.Td>
            <Group gap={4}>
              <ActionIcon
                variant="subtle"
                onClick={() => openEditModal(expert)}
              >
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => confirmDelete(expert)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Table.Td>
        </Table.Tr>
      ))}
    </Table.Tbody>
  </Table>
</Stack>
```

### 3. Context Editor Page

```tsx
// Monaco Editor integration for context editing
<Grid>
  <Grid.Col span={3}>
    <ScrollArea h="calc(100vh - 200px)">
      <NavLink
        label="Expert Context Files"
        childrenOffset={28}
        defaultOpened
      >
        {contextFiles.map((file) => (
          <NavLink
            key={file.id}
            label={file.name}
            active={selectedFile?.id === file.id}
            onClick={() => setSelectedFile(file)}
            leftSection={<IconFile size={16} />}
          />
        ))}
      </NavLink>
    </ScrollArea>
  </Grid.Col>
  
  <Grid.Col span={9}>
    <Card h="calc(100vh - 200px)">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>{selectedFile?.name}</Text>
          <Group>
            <Button
              size="xs"
              variant="subtle"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save
            </Button>
          </Group>
        </Group>
      </Card.Section>
      <Card.Section p="md" h="calc(100% - 50px)">
        <MonacoEditor
          language="markdown"
          value={content}
          onChange={setContent}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </Card.Section>
    </Card>
  </Grid.Col>
</Grid>
```

### 4. Usage Analytics Page

```tsx
// Analytics dashboard with charts
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
      <Card>
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={500}>Expert Usage Over Time</Text>
        </Card.Section>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={usageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="requests"
              stroke="#8884d8"
              name="Total Requests"
            />
            <Line
              type="monotone"
              dataKey="successful"
              stroke="#82ca9d"
              name="Successful"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </Grid.Col>
  </Grid>

  <Grid>
    <Grid.Col span={6}>
      <Card>
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={500}>Expert Usage Distribution</Text>
        </Card.Section>
        <PieChart width={400} height={300}>
          <Pie
            data={expertDistribution}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
          />
          <Tooltip />
        </PieChart>
      </Card>
    </Grid.Col>
    
    <Grid.Col span={6}>
      <Card>
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={500}>Task Type Distribution</Text>
        </Card.Section>
        <BarChart width={400} height={300} data={taskTypeData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </Card>
    </Grid.Col>
  </Grid>
</Stack>
```

### 5. Performance Metrics Page

```tsx
// Performance analysis with detailed metrics
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
                    data={expert.trend}
                    width={100}
                    height={30}
                    strokeWidth={2}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Grid.Col>
    </Grid>
  </Tabs.Panel>
</Tabs>
```

## Component Library

### Reusable Components

```tsx
// StatsCard Component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
}

function StatsCard({ title, value, icon, trend, trendDirection }: StatsCardProps) {
  return (
    <Card>
      <Group justify="space-between">
        <Stack gap={0}>
          <Text size="sm" c="dimmed">{title}</Text>
          <Text size="xl" fw={700}>{value}</Text>
          {trend && (
            <Group gap={4}>
              {trendDirection === 'up' ? (
                <IconTrendingUp size={16} color="green" />
              ) : (
                <IconTrendingDown size={16} color="red" />
              )}
              <Text size="sm" c={trendDirection === 'up' ? 'green' : 'red'}>
                {trend}
              </Text>
            </Group>
          )}
        </Stack>
        <ThemeIcon size="xl" radius="md" variant="light">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

// ExpertForm Component (for create/edit)
interface ExpertFormProps {
  expert?: Expert;
  onSubmit: (data: ExpertFormData) => void;
  onCancel: () => void;
}

function ExpertForm({ expert, onSubmit, onCancel }: ExpertFormProps) {
  const form = useForm({
    initialValues: {
      id: expert?.id || '',
      name: expert?.name || '',
      description: expert?.description || '',
      domains: expert?.domains || [],
      specializations: expert?.specializations || [],
      constraints: expert?.constraints || [],
      patterns: expert?.patterns || [],
      quality_standards: expert?.quality_standards || [],
    },
    validate: {
      id: (value) => (!value ? 'ID is required' : null),
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
          {...form.getInputProps('id')}
          disabled={!!expert}
        />
        
        <TextInput
          label="Name"
          placeholder="AWS Amplify Gen 2 Expert"
          {...form.getInputProps('name')}
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
          data={['backend', 'frontend', 'cloud', 'mobile', 'serverless']}
          {...form.getInputProps('domains')}
        />
        
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
        
        <Group justify="flex-end">
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

## State Management

```typescript
// Zustand store for global state
interface AdminStore {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  
  // Experts state
  experts: Expert[];
  selectedExpert: Expert | null;
  isLoadingExperts: boolean;
  
  // Stats state
  systemStats: SystemStats | null;
  expertStats: Map<string, ExpertStats>;
  
  // Actions
  fetchExperts: () => Promise<void>;
  createExpert: (expert: ExpertFormData) => Promise<void>;
  updateExpert: (id: string, data: Partial<Expert>) => Promise<void>;
  deleteExpert: (id: string) => Promise<void>;
  
  fetchSystemStats: () => Promise<void>;
  fetchExpertStats: (id: string) => Promise<void>;
}

const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  experts: [],
  selectedExpert: null,
  isLoadingExperts: false,
  systemStats: null,
  expertStats: new Map(),
  
  // Actions implementation
  fetchExperts: async () => {
    set({ isLoadingExperts: true });
    try {
      const response = await api.get('/admin/experts');
      set({ experts: response.data, isLoadingExperts: false });
    } catch (error) {
      set({ isLoadingExperts: false });
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch experts',
        color: 'red',
      });
    }
  },
  
  // ... other actions
}));
```

## Real-time Updates

```typescript
// Server-Sent Events for real-time updates
function useRealtimeUpdates() {
  useEffect(() => {
    const eventSource = new EventSource('/api/admin/events');
    
    eventSource.addEventListener('expert-update', (event) => {
      const data = JSON.parse(event.data);
      // Update expert in store
      useAdminStore.getState().updateExpertInStore(data.expert);
    });
    
    eventSource.addEventListener('stats-update', (event) => {
      const data = JSON.parse(event.data);
      // Update stats in store
      useAdminStore.getState().updateStatsInStore(data.stats);
    });
    
    eventSource.addEventListener('task-complete', (event) => {
      const data = JSON.parse(event.data);
      // Show notification
      notifications.show({
        title: 'Task Completed',
        message: `Task ${data.taskId} completed successfully`,
        color: 'green',
      });
    });
    
    return () => {
      eventSource.close();
    };
  }, []);
}
```

## Security Considerations

### Authentication & Authorization

```typescript
// JWT-based authentication
interface AuthConfig {
  loginEndpoint: '/api/admin/auth/login';
  refreshEndpoint: '/api/admin/auth/refresh';
  logoutEndpoint: '/api/admin/auth/logout';
}

// Role-based access control
enum AdminRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

// Protected route component
function ProtectedRoute({ 
  children, 
  requiredRole = AdminRole.VIEWER 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAdminStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!hasRole(user, requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
}
```

### Security Headers

```nginx
# Nginx configuration for security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy loading for routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExpertManagement = lazy(() => import('./pages/ExpertManagement'));
const ContextEditor = lazy(() => import('./pages/ContextEditor'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Route configuration with Suspense
<Suspense fallback={<LoadingOverlay visible />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/experts" element={<ExpertManagement />} />
    <Route path="/context" element={<ContextEditor />} />
    <Route path="/analytics" element={<Analytics />} />
  </Routes>
</Suspense>
```

### Data Caching

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Query hooks
function useExperts() {
  return useQuery({
    queryKey: ['experts'],
    queryFn: () => api.get('/admin/experts').then(res => res.data),
  });
}

function useExpertStats(expertId: string) {
  return useQuery({
    queryKey: ['expert-stats', expertId],
    queryFn: () => api.get(`/admin/stats/experts/${expertId}`).then(res => res.data),
    enabled: !!expertId,
  });
}
```

## Deployment Integration

### Docker Configuration

```dockerfile
# Add to existing Dockerfile
FROM node:20-alpine as ui-builder

WORKDIR /app/admin-ui

# Copy package files
COPY admin-ui/package*.json ./
RUN npm ci

# Copy source files
COPY admin-ui/ ./
RUN npm run build

# In the production stage
FROM python:3.12-slim as production

# ... existing Python setup ...

# Copy built UI files
COPY --from=ui-builder /app/admin-ui/dist /app/admin-ui/dist

# Serve UI through FastAPI
```

### FastAPI Integration

```python
# server.py additions
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount admin UI
app.mount("/admin", StaticFiles(directory="admin-ui/dist", html=True), name="admin")

# Serve index.html for SPA routing
@app.get("/admin/{path:path}")
async def serve_admin_spa(path: str):
    return FileResponse("admin-ui/dist/index.html")

# Admin API routes
from .admin_api import router as admin_router
app.include_router(admin_router, prefix="/api/admin")
```

## Development Workflow

### Local Development

```bash
# Start backend services
docker-compose up -d neo4j redis

# Start MCP server with admin API
cd expert-registry-mcp
python -m expert_registry_mcp.server --with-admin

# Start UI development server
cd admin-ui
npm install
npm run dev
```

### Build and Deploy

```bash
# Build Docker image with admin UI
./scripts/build-with-admin.sh

# Deploy with admin interface enabled
docker-compose -f docker-compose.admin.yml up -d
```

## Testing Strategy

### Unit Tests

```typescript
// Component testing with React Testing Library
describe('ExpertForm', () => {
  it('should validate required fields', async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <ExpertForm onSubmit={onSubmit} onCancel={() => {}} />
    );
    
    fireEvent.click(getByText('Create Expert'));
    
    await waitFor(() => {
      expect(getByText('ID is required')).toBeInTheDocument();
      expect(getByText('Name is required')).toBeInTheDocument();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### E2E Tests

```typescript
// Playwright tests
test('should create new expert', async ({ page }) => {
  await page.goto('/admin/experts');
  await page.click('button:has-text("Add Expert")');
  
  await page.fill('input[name="id"]', 'test-expert');
  await page.fill('input[name="name"]', 'Test Expert');
  await page.fill('textarea[name="description"]', 'Test description');
  
  await page.click('button:has-text("Create Expert")');
  
  await expect(page.locator('text=Expert created successfully')).toBeVisible();
  await expect(page.locator('td:has-text("test-expert")')).toBeVisible();
});
```

## Monitoring & Analytics

### Application Monitoring

```typescript
// Sentry integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});

// Error boundary
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

### Usage Analytics

```typescript
// Analytics tracking
function trackEvent(category: string, action: string, label?: string) {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
}

// Track expert creation
trackEvent('Expert', 'Create', expert.id);
```

## Future Enhancements

1. **Batch Operations**: Bulk import/export of experts
2. **Version Control**: Track changes to expert configurations
3. **A/B Testing**: Test different expert configurations
4. **Workflow Builder**: Visual expert selection workflow designer
5. **Plugin System**: Extensible architecture for custom features
6. **Mobile App**: Responsive design for mobile management
7. **AI Suggestions**: ML-based expert optimization recommendations
8. **Collaboration**: Multi-user editing with conflict resolution

## Conclusion

This admin interface design provides a comprehensive solution for managing the Expert Registry MCP system. It combines modern React development practices with the elegant Mantine UI framework to create a powerful, user-friendly administrative tool that integrates seamlessly with the existing Docker-based deployment architecture.
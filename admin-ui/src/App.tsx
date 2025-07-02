import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { theme } from './theme'
import { MainLayout } from './components/layout/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { ExpertManagement } from './pages/ExpertManagement'
import { ContextEditor } from './pages/ContextEditor'
import { Analytics } from './pages/Analytics'
import { Performance } from './pages/Performance'
import { Settings } from './pages/Settings'
import { useRealtimeUpdates } from './hooks/useRealtime'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Import Mantine styles
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/spotlight/styles.css'
import '@mantine/dropzone/styles.css'
import '@mantine/charts/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  // Temporarily disabled - useRealtimeUpdates()

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
  )
}

export function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}
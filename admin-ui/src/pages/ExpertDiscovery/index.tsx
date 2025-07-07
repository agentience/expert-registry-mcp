import React, { useState, useCallback, useMemo, Suspense, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Container, 
  Title, 
  Tabs, 
  Stack, 
  Breadcrumbs, 
  Anchor,
  Button,
  Modal,
  Text,
  LoadingOverlay,
  Skeleton,
  Paper,
  Group,
  Badge
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconHelp } from '@tabler/icons-react'
import { QueryInput } from './components/QueryBuilder/QueryInput'
import { QueryParameters } from './components/QueryBuilder/QueryParameters'
import { ExpertCard } from './components/ExpertCard'
import { useExpertDiscovery } from './hooks/useExpertDiscovery'
import { useAnalytics } from './hooks/useAnalytics'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useUrlSync } from './hooks/useUrlSync'
import { 
  EXPERT_DISCOVERY_TABS, 
  UI_CONFIG,
  DEFAULT_QUERY_PARAMETERS 
} from './constants'
import type { BreadcrumbItem, QueryParameters as QueryParametersType } from './types'

// Lazy load tab content for better performance
const TechnologyDetectionPanel = React.lazy(() => 
  import('./components/TechnologyDetection/TechnologyDetectionPanel')
)

export function ExpertDiscoveryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(EXPERT_DISCOVERY_TABS[0].value)
  const [queryParameters, setQueryParameters] = useState<QueryParametersType>(DEFAULT_QUERY_PARAMETERS)
  const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false)
  const currentQueryRef = useRef<string>('')
  const hasSearchedRef = useRef<boolean>(false)
  const previousParametersRef = useRef<QueryParametersType>(queryParameters)
  const isSearchingRef = useRef<boolean>(false)
  
  // Custom hooks for feature-specific logic
  const expertDiscovery = useExpertDiscovery()
  const analytics = useAnalytics()
  
  // Track page view for Expert Discovery specifically
  React.useEffect(() => {
    const fullUrl = window.location.origin + location.pathname + location.search
    analytics.trackPageView('Expert Discovery Testing', fullUrl)
  }, [analytics, location])
  
  // Handle tab changes with analytics
  const handleTabChange = useCallback((value: string | null) => {
    if (value && value !== activeTab) {
      analytics.trackTabSwitch(activeTab, value)
      setActiveTab(value)
    }
  }, [activeTab, analytics])

  // URL synchronization
  useUrlSync({
    activeTab,
    onTabChange: handleTabChange,
    parameters: queryParameters,
    onParametersChange: setQueryParameters
  })

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTabChange: handleTabChange,
    enabled: !helpOpened // Disable when modal is open
  })

  // Handle query changes with debouncing
  const handleQueryChange = useCallback((query: string) => {
    currentQueryRef.current = query
  }, [])

  // Handle parameter changes with analytics
  const handleParametersChange = useCallback((newParameters: QueryParametersType) => {
    setQueryParameters(newParameters)
    analytics.trackParameterChange('bulk_update', newParameters)
  }, [analytics])

  // Handle search with validation and analytics
  const handleSearch = useCallback(async (query: string) => {
    if (isSearchingRef.current) return // Prevent concurrent searches
    
    currentQueryRef.current = query
    hasSearchedRef.current = true
    isSearchingRef.current = true
    
    const searchQuery = {
      query,
      ...queryParameters
    }

    try {
      const result = await expertDiscovery.discoverExperts(searchQuery)
      analytics.trackSearch(query, queryParameters.algorithm, result.totalCount)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      isSearchingRef.current = false
    }
  }, [queryParameters, expertDiscovery, analytics])

  // Auto-trigger search when parameters change (but not when query text changes)
  React.useEffect(() => {
    // Check if parameters actually changed
    const parametersChanged = JSON.stringify(queryParameters) !== JSON.stringify(previousParametersRef.current)
    
    // Only trigger search if parameters changed, there's a query, user has searched before, and not currently searching
    if (parametersChanged && currentQueryRef.current && hasSearchedRef.current && !isSearchingRef.current) {
      previousParametersRef.current = queryParameters
      
      // Create a debounced search to avoid too many API calls
      const timeoutId = setTimeout(() => {
        if (isSearchingRef.current) return // Double check to prevent race conditions
        
        isSearchingRef.current = true
        const searchQuery = {
          query: currentQueryRef.current,
          ...queryParameters
        }

        expertDiscovery.discoverExperts(searchQuery).then(result => {
          analytics.trackSearch(currentQueryRef.current, queryParameters.algorithm, result.totalCount)
        }).catch(error => {
          console.error('Auto-search failed:', error)
        }).finally(() => {
          isSearchingRef.current = false
        })
      }, 300) // 300ms debounce delay

      return () => clearTimeout(timeoutId)
    }
  }, [queryParameters, expertDiscovery.discoverExperts, analytics.trackSearch]) // Only trigger on parameter changes

  // Memoized breadcrumb items
  const breadcrumbItems = useMemo((): BreadcrumbItem[] => [
    { title: 'Home', href: '/' },
    { title: 'Expert Discovery', href: '/expert-discovery' }
  ], [])

  // Memoized help content
  const helpContent = useMemo(() => (
    <Stack gap="md">
      <Text>Welcome to the Expert Discovery Testing Interface!</Text>
      <Text>
        This tool allows you to test and validate expert discovery algorithms 
        using different query types and parameters.
      </Text>
      <Text fw={500}>Available Features:</Text>
      <Text component="ul">
        <li>Query Builder - Build and test discovery queries</li>
        <li>Technology Detection - Test technology stack detection</li>
        <li>Real-time results and performance metrics</li>
      </Text>
      <Text fw={500}>Keyboard Shortcuts:</Text>
      <Text component="ul">
        {EXPERT_DISCOVERY_TABS.map(tab => (
          <li key={tab.value}>{tab.shortcut} - Switch to {tab.label}</li>
        ))}
      </Text>
    </Stack>
  ), [])

  // Loading skeleton for lazy-loaded components
  const TabSkeleton = () => (
    <Stack gap="md">
      <Skeleton height={60} />
      <Skeleton height={120} />
      <Skeleton height={80} />
    </Stack>
  )

  return (
    <Container size={UI_CONFIG.containerSize} py={UI_CONFIG.paperPadding}>
      <LoadingOverlay visible={false} />
      
      <Stack gap={UI_CONFIG.stackGap}>
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <Anchor key={`breadcrumb-${index}`} href={item.href}>
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title order={1}>Expert Discovery Testing</Title>
          <Button
            variant="subtle"
            leftSection={<IconHelp size={16} />}
            onClick={openHelp}
            data-testid="help-button"
          >
            Help
          </Button>
        </div>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            {EXPERT_DISCOVERY_TABS.map(tab => (
              <Tabs.Tab 
                key={tab.value} 
                value={tab.value}
                data-testid={`tab-${tab.value}`}
              >
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value="query-builder" pt={UI_CONFIG.paperPadding}>
            <Stack gap={UI_CONFIG.stackGap}>
              <QueryInput 
                onQueryChange={handleQueryChange}
                onSearch={handleSearch}
                isLoading={expertDiscovery.isDiscovering}
                error={expertDiscovery.discoveryError?.message || null}
              />
              <QueryParameters 
                onParametersChange={handleParametersChange}
                initialParameters={queryParameters}
                disabled={expertDiscovery.isDiscovering}
              />
              
              {/* Expert Discovery Results */}
              {expertDiscovery.hasSearched && (
                <Paper shadow="xs" p="md" mt="md">
                  {expertDiscovery.isDiscovering ? (
                    <LoadingOverlay visible />
                  ) : expertDiscovery.experts.length > 0 ? (
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text size="lg" fw={600}>
                          Discovery Results
                        </Text>
                        <Group gap="xs">
                          <Badge color="blue" variant="light">
                            {expertDiscovery.totalCount} experts found
                          </Badge>
                          {expertDiscovery.searchTime > 0 && (
                            <Badge color="gray" variant="light">
                              {expertDiscovery.searchTime}ms
                            </Badge>
                          )}
                        </Group>
                      </Group>
                      <Stack gap="sm">
                        {expertDiscovery.experts.map((expert) => (
                          <ExpertCard
                            key={expert.id}
                            expert={expert}
                            onViewDetails={(expert) => navigate(`/experts/${expert.id}`)}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  ) : (
                    <Text c="dimmed" ta="center" py="xl">
                      No experts found matching your criteria. Try adjusting your search parameters.
                    </Text>
                  )}
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="technology-detection" pt={UI_CONFIG.paperPadding}>
            <Suspense fallback={<TabSkeleton />}>
              <TechnologyDetectionPanel />
            </Suspense>
          </Tabs.Panel>
        </Tabs>

        <Modal 
          opened={helpOpened} 
          onClose={closeHelp} 
          title="Expert Discovery Guide"
          size="lg"
          data-testid="help-modal"
        >
          {helpContent}
        </Modal>
      </Stack>
    </Container>
  )
}

// Memoize the entire component for optimal performance
const MemoizedExpertDiscoveryPage = React.memo(ExpertDiscoveryPage)
export default MemoizedExpertDiscoveryPage
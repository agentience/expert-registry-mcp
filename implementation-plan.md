# Expert Discovery Testing Interface - Implementation Plan

**Last Updated: 2025-01-02**

## Overview

This document provides an expert-validated Test-Driven Development (TDD) implementation plan for the Expert Discovery Testing Interface, following React 18 best practices with TypeScript, Mantine UI, and modern React patterns.

## TDD Implementation Strategy

### Red-Green-Refactor Cycle
1. **Red Phase** - Write failing tests for new functionality
2. **Green Phase** - Write minimal code to pass tests
3. **Refactor Phase** - Improve code quality while keeping tests passing

### Implementation Principles
- Test-first development for all features
- Component-driven architecture
- Hooks for business logic separation
- Error boundaries for resilience
- Performance optimization from the start
- Accessibility as a core requirement

## Sprint 1: Core Infrastructure & Technology Detection

### Day 1-2: Project Setup & Test Infrastructure

#### TDD Cycle 1: Project Configuration
**Red Phase - Tests:**
```typescript
// src/test/setup.test.ts
describe('Test Infrastructure', () => {
  it('should have React Testing Library configured')
  it('should have MSW handlers configured')
  it('should have axe-core for accessibility testing')
  it('should have test utilities available')
})
```

**Green Phase - Implementation:**
1. Initialize React 18 + TypeScript project
2. Configure Jest and React Testing Library
3. Set up MSW for API mocking
4. Create test utilities and custom render
5. Configure TypeScript strict mode

**Refactor Phase:**
- Extract common test configuration
- Create reusable test helpers
- Set up CI/CD test pipeline

#### TDD Cycle 2: Routing & Page Structure
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/ExpertDiscovery.test.tsx
describe('ExpertDiscovery Page', () => {
  it('should render page with correct title')
  it('should have tabbed navigation')
  it('should handle tab switching')
  it('should be accessible with keyboard navigation')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/index.tsx
export const ExpertDiscoveryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('query')
  
  return (
    <Container size="xl">
      <Title order={1}>Expert Discovery Testing</Title>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="query">Query Builder</Tabs.Tab>
          <Tabs.Tab value="technology">Technology Detection</Tabs.Tab>
          <Tabs.Tab value="semantic">Semantic Search</Tabs.Tab>
          <Tabs.Tab value="graph">Graph Explorer</Tabs.Tab>
          <Tabs.Tab value="comparison">Results Comparison</Tabs.Tab>
          <Tabs.Tab value="benchmark">Performance</Tabs.Tab>
        </Tabs.List>
        {/* Tab panels */}
      </Tabs>
    </Container>
  )
}
```

### Day 3-4: Query Builder Components

#### TDD Cycle 3: QueryInput Component
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/components/QueryBuilder/QueryInput.test.tsx
describe('QueryInput', () => {
  it('should render textarea with character counter')
  it('should enforce 5000 character limit')
  it('should support Ctrl+Enter submission')
  it('should validate empty input')
  it('should sanitize malicious input')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/components/QueryBuilder/QueryInput.tsx
interface QueryInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  maxLength?: number
}

export const QueryInput: React.FC<QueryInputProps> = memo(({
  value,
  onChange,
  onSubmit,
  maxLength = 5000
}) => {
  const [error, setError] = useState<string>('')
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitized = DOMPurify.sanitize(e.target.value)
    if (sanitized.length <= maxLength) {
      onChange(sanitized)
      setError('')
    }
  }, [onChange, maxLength])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (value.trim()) {
        onSubmit()
      } else {
        setError('Query cannot be empty')
      }
    }
  }, [value, onSubmit])
  
  return (
    <Stack>
      <Textarea
        label="Discovery Query"
        placeholder="Enter your query..."
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        error={error}
        minRows={4}
        maxRows={12}
        aria-label="Expert discovery query input"
        aria-describedby="query-helper-text"
      />
      <Text size="sm" color="dimmed" id="query-helper-text">
        {value.length}/{maxLength} characters (Ctrl+Enter to submit)
      </Text>
    </Stack>
  )
})
```

#### TDD Cycle 4: QueryParameters Component
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/components/QueryBuilder/QueryParameters.test.tsx
describe('QueryParameters', () => {
  it('should render all parameter controls')
  it('should validate numeric constraints')
  it('should toggle advanced options')
  it('should reset to defaults')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/components/QueryBuilder/QueryParameters.tsx
interface QueryParametersProps {
  parameters: DiscoveryParameters
  onChange: (params: DiscoveryParameters) => void
}

export const QueryParameters: React.FC<QueryParametersProps> = memo(({
  parameters,
  onChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const handleChange = useCallback((field: keyof DiscoveryParameters, value: any) => {
    onChange({ ...parameters, [field]: value })
  }, [parameters, onChange])
  
  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group grow>
          <NumberInput
            label="Search Depth"
            value={parameters.searchDepth}
            onChange={(val) => handleChange('searchDepth', val)}
            min={1}
            max={5}
            aria-label="Search depth parameter"
          />
          <NumberInput
            label="Max Results"
            value={parameters.maxResults}
            onChange={(val) => handleChange('maxResults', val)}
            min={1}
            max={50}
            aria-label="Maximum results parameter"
          />
        </Group>
        
        <Collapse in={showAdvanced}>
          <Stack>
            <Slider
              label="Score Threshold"
              value={parameters.scoreThreshold}
              onChange={(val) => handleChange('scoreThreshold', val)}
              min={0}
              max={1}
              step={0.1}
              marks={[
                { value: 0, label: '0' },
                { value: 0.5, label: '0.5' },
                { value: 1, label: '1' }
              ]}
            />
            <MultiSelect
              label="Discovery Methods"
              data={['vector', 'graph', 'hybrid']}
              value={parameters.methods}
              onChange={(val) => handleChange('methods', val)}
            />
          </Stack>
        </Collapse>
        
        <Group position="apart">
          <Button
            variant="subtle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>
          <Button variant="light" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
})
```

### Day 5-6: Technology Detection Components

#### TDD Cycle 5: CodeInput Component
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/components/TechnologyDetection/CodeInput.test.tsx
describe('CodeInput', () => {
  it('should render code editor with syntax highlighting')
  it('should support file uploads')
  it('should handle large files gracefully')
  it('should debounce detection triggers')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/components/TechnologyDetection/CodeInput.tsx
export const CodeInput: React.FC<CodeInputProps> = memo(({
  value,
  onChange,
  onDetect,
  language = 'javascript'
}) => {
  const debouncedDetect = useDebouncedCallback(onDetect, 500)
  
  const handleChange = useCallback((newValue: string) => {
    onChange(newValue)
    debouncedDetect(newValue)
  }, [onChange, debouncedDetect])
  
  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > 1024 * 1024) { // 1MB limit
      showNotification({
        title: 'File too large',
        message: 'Please upload files smaller than 1MB',
        color: 'red'
      })
      return
    }
    
    const content = await file.text()
    handleChange(content)
  }, [handleChange])
  
  return (
    <Stack>
      <FileButton onChange={handleFileUpload} accept=".js,.ts,.py,.java">
        {(props) => (
          <Button {...props} leftIcon={<IconUpload size={16} />}>
            Upload Code File
          </Button>
        )}
      </FileButton>
      
      <Prism
        language={language}
        value={value}
        onChange={handleChange}
        styles={(theme) => ({
          code: {
            fontSize: 14,
            minHeight: 300
          }
        })}
      />
    </Stack>
  )
})
```

#### TDD Cycle 6: Technology Detection Hook
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/hooks/useTechnologyDetection.test.ts
describe('useTechnologyDetection', () => {
  it('should detect technologies from code')
  it('should handle API errors gracefully')
  it('should debounce rapid requests')
  it('should cache results')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/hooks/useTechnologyDetection.ts
export const useTechnologyDetection = (options?: UseDetectionOptions) => {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/admin/discovery/detect-technologies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'code' })
      })
      
      if (!response.ok) {
        throw new Error('Technology detection failed')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['technologies', data.content], data)
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
  
  const detect = useDebouncedCallback(
    (content: string) => mutation.mutate(content),
    options?.debounceMs ?? 500
  )
  
  return {
    detect,
    isDetecting: mutation.isLoading,
    error: mutation.error,
    data: mutation.data
  }
}
```

## Sprint 2: Semantic Search & Graph Exploration

### Day 7-8: Semantic Search Components

#### TDD Cycle 7: SearchInterface Component
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/components/SemanticSearch/SearchInterface.test.tsx
describe('SearchInterface', () => {
  it('should render search input with suggestions')
  it('should display results with scores')
  it('should handle pagination')
  it('should cancel in-flight requests')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/components/SemanticSearch/SearchInterface.tsx
export const SearchInterface: React.FC = memo(() => {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  
  const { data, isLoading, error } = useSemanticSearch({
    query,
    page,
    enabled: query.length > 2
  })
  
  return (
    <Stack>
      <TextInput
        label="Semantic Search"
        placeholder="Search for experts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon={<IconSearch size={16} />}
        rightSection={isLoading && <Loader size="xs" />}
      />
      
      <ErrorBoundary fallback={<ErrorFallback />}>
        {error && <Alert color="red">{error.message}</Alert>}
        
        {data && (
          <>
            <SearchResults results={data.results} />
            <Pagination
              total={data.totalPages}
              value={page}
              onChange={setPage}
            />
          </>
        )}
      </ErrorBoundary>
    </Stack>
  )
})
```

#### TDD Cycle 8: EmbeddingVisualizer Component
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/components/SemanticSearch/EmbeddingVisualizer.test.tsx
describe('EmbeddingVisualizer', () => {
  it('should render 2D scatter plot')
  it('should handle zoom and pan')
  it('should show tooltips on hover')
  it('should provide keyboard navigation')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/components/SemanticSearch/EmbeddingVisualizer.tsx
export const EmbeddingVisualizer: React.FC<VisualizerProps> = memo(({
  embeddings,
  queryEmbedding,
  width = 600,
  height = 400
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  
  useEffect(() => {
    if (!svgRef.current || !embeddings.length) return
    
    const svg = d3.select(svgRef.current)
    const margin = { top: 20, right: 20, bottom: 40, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    // Apply t-SNE or UMAP for dimensionality reduction
    const reduced = useMemo(() => 
      reduceDimensions(embeddings, 2),
      [embeddings]
    )
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(reduced, d => d[0]))
      .range([0, innerWidth])
    
    const yScale = d3.scaleLinear()
      .domain(d3.extent(reduced, d => d[1]))
      .range([innerHeight, 0])
    
    // Implement zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    
    svg.call(zoom)
    
    // Render points with accessibility
    const g = svg.select('g.main-group')
    
    g.selectAll('circle')
      .data(reduced)
      .join('circle')
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => yScale(d[1]))
      .attr('r', 4)
      .attr('fill', (d, i) => i === 0 ? '#ff6b6b' : '#4dabf7')
      .attr('role', 'img')
      .attr('aria-label', (d, i) => `Expert ${i}: ${embeddings[i].expert.name}`)
      .on('mouseenter', (event, d, i) => setHoveredPoint(i))
      .on('mouseleave', () => setHoveredPoint(null))
      .on('focus', (event, d, i) => setHoveredPoint(i))
      .on('blur', () => setHoveredPoint(null))
      .attr('tabindex', 0)
    
  }, [embeddings, queryEmbedding, width, height])
  
  return (
    <Box>
      <svg ref={svgRef} width={width} height={height}>
        <g className="main-group" />
      </svg>
      {hoveredPoint !== null && (
        <Tooltip label={embeddings[hoveredPoint].expert.name} />
      )}
    </Box>
  )
})
```

### Day 9-10: Graph Explorer Components

#### TDD Cycle 9: NetworkGraph Component
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/components/GraphExplorer/NetworkGraph.test.tsx
describe('NetworkGraph', () => {
  it('should render force-directed graph')
  it('should support node dragging')
  it('should filter by node type')
  it('should export as SVG/PNG')
  it('should handle 1000+ nodes')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/components/GraphExplorer/NetworkGraph.tsx
export const NetworkGraph: React.FC<NetworkGraphProps> = memo(({
  nodes,
  edges,
  filters,
  onNodeClick,
  onNodeHover
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Use React Flow for better React integration
    const graph = new ReactFlow({
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label,
          ...node.metadata
        }
      })),
      edges: edges.map(edge => ({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.weight > 0.8,
        style: {
          strokeWidth: edge.weight * 5
        }
      }))
    })
    
    // Implement viewport culling for performance
    const viewportNodes = useViewportNodes(nodes, containerRef)
    
    // Use web worker for physics simulation
    const worker = new Worker('/workers/graphPhysics.worker.js')
    worker.postMessage({ nodes: viewportNodes, edges })
    
    worker.onmessage = (e) => {
      const { positions } = e.data
      updateNodePositions(positions)
    }
    
    return () => worker.terminate()
  }, [nodes, edges, filters])
  
  const handleExport = useCallback(async (format: 'svg' | 'png') => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    
    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg)
      downloadFile(svgData, 'graph.svg', 'image/svg+xml')
    } else {
      const canvas = await svgToCanvas(svg)
      canvas.toBlob((blob) => {
        if (blob) downloadFile(blob, 'graph.png', 'image/png')
      })
    }
  }, [])
  
  return (
    <ErrorBoundary fallback={<GraphErrorFallback />}>
      <Stack>
        <GraphControls
          onExport={handleExport}
          onFilter={setFilters}
          onLayout={setLayout}
        />
        <Box
          ref={containerRef}
          sx={{ height: 600, border: '1px solid #e9ecef' }}
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeMouseEnter={onNodeHover}
              nodesDraggable
              nodesConnectable={false}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
        </Box>
      </Stack>
    </ErrorBoundary>
  )
})
```

## Sprint 3: Comparison, Benchmarking & Export

### Day 11-12: Results Comparison

#### TDD Cycle 10: ComparisonTable Component
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/components/ResultsComparison/ComparisonTable.test.tsx
describe('ComparisonTable', () => {
  it('should display side-by-side results')
  it('should highlight differences')
  it('should sort by columns')
  it('should virtualize large datasets')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/components/ResultsComparison/ComparisonTable.tsx
export const ComparisonTable: React.FC<ComparisonTableProps> = memo(({
  results,
  methods
}) => {
  const [sortBy, setSortBy] = useState<string>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Use react-window for virtualization
  const rowVirtualizer = useVirtual({
    size: results.length,
    parentRef: tableRef,
    estimateSize: useCallback(() => 50, []),
    overscan: 5
  })
  
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [results, sortBy, sortOrder])
  
  const getDifferenceColor = useCallback((diff: number) => {
    if (diff > 0.2) return 'green'
    if (diff < -0.2) return 'red'
    return 'gray'
  }, [])
  
  return (
    <ScrollArea style={{ height: 600 }}>
      <Table highlightOnHover>
        <thead>
          <tr>
            <th>Expert</th>
            {methods.map(method => (
              <th key={method}>
                {method}
                <ActionIcon
                  size="xs"
                  onClick={() => handleSort(method)}
                >
                  <IconArrowUp size={14} />
                </ActionIcon>
              </th>
            ))}
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>
          {rowVirtualizer.virtualItems.map(virtualRow => {
            const result = sortedResults[virtualRow.index]
            return (
              <tr key={result.expert.id}>
                <td>{result.expert.name}</td>
                {methods.map(method => (
                  <td key={method}>
                    <Badge color={getScoreColor(result[method].score)}>
                      {(result[method].score * 100).toFixed(1)}%
                    </Badge>
                  </td>
                ))}
                <td>
                  <Text color={getDifferenceColor(result.maxDiff)}>
                    {result.maxDiff > 0 ? '+' : ''}{(result.maxDiff * 100).toFixed(1)}%
                  </Text>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </ScrollArea>
  )
})
```

### Day 13-14: Performance Benchmarking

#### TDD Cycle 11: BenchmarkRunner Component
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/components/PerformanceBenchmark/BenchmarkRunner.test.tsx
describe('BenchmarkRunner', () => {
  it('should configure benchmark parameters')
  it('should show progress during execution')
  it('should handle cancellation')
  it('should display results in real-time')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/components/PerformanceBenchmark/BenchmarkRunner.tsx
export const BenchmarkRunner: React.FC = memo(() => {
  const [config, setConfig] = useState<BenchmarkConfig>(defaultConfig)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const abortControllerRef = useRef<AbortController>()
  
  const runBenchmark = useCallback(async () => {
    setIsRunning(true)
    setProgress(0)
    abortControllerRef.current = new AbortController()
    
    try {
      const response = await fetch('/api/admin/discovery/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: abortControllerRef.current.signal
      })
      
      // Handle streaming response for real-time updates
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const text = new TextDecoder().decode(value)
        const updates = text.split('\n').filter(Boolean).map(JSON.parse)
        
        updates.forEach(update => {
          if (update.type === 'progress') {
            setProgress(update.value)
          } else if (update.type === 'result') {
            addResult(update.data)
          }
        })
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        showNotification({
          title: 'Benchmark failed',
          message: error.message,
          color: 'red'
        })
      }
    } finally {
      setIsRunning(false)
    }
  }, [config])
  
  const cancelBenchmark = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])
  
  return (
    <Stack>
      <Paper p="md" withBorder>
        <Stack>
          <TextInput
            label="Queries (one per line)"
            value={config.queries.join('\n')}
            onChange={(e) => setConfig({
              ...config,
              queries: e.target.value.split('\n').filter(Boolean)
            })}
            minRows={3}
          />
          
          <Group grow>
            <NumberInput
              label="Iterations"
              value={config.iterations}
              onChange={(val) => setConfig({ ...config, iterations: val })}
              min={1}
              max={100}
            />
            <MultiSelect
              label="Methods"
              data={['vector', 'graph', 'hybrid']}
              value={config.methods}
              onChange={(val) => setConfig({ ...config, methods: val })}
            />
          </Group>
          
          <Group position="apart">
            <Button
              onClick={runBenchmark}
              loading={isRunning}
              disabled={!config.queries.length}
              leftIcon={<IconPlayerPlay size={16} />}
            >
              Run Benchmark
            </Button>
            {isRunning && (
              <Button
                onClick={cancelBenchmark}
                color="red"
                variant="outline"
                leftIcon={<IconPlayerStop size={16} />}
              >
                Cancel
              </Button>
            )}
          </Group>
        </Stack>
      </Paper>
      
      {isRunning && (
        <Progress
          value={progress}
          label={`${progress}%`}
          size="xl"
          animate
        />
      )}
      
      <BenchmarkResults results={results} />
    </Stack>
  )
})
```

### Day 15: Export & Polish

#### TDD Cycle 12: Export Functionality
**Red Phase - Tests:**
```typescript
// src/pages/ExpertDiscovery/hooks/useExport.test.ts
describe('useExport', () => {
  it('should export as JSON')
  it('should export as CSV')
  it('should generate PDF reports')
  it('should handle large datasets')
})
```

**Green Phase - Implementation:**
```typescript
// src/pages/ExpertDiscovery/hooks/useExport.ts
export const useExport = () => {
  const exportAsJSON = useCallback(async (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    downloadFile(blob, `${filename}.json`)
  }, [])
  
  const exportAsCSV = useCallback(async (data: any[], filename: string) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    downloadFile(blob, `${filename}.csv`)
  }, [])
  
  const exportAsPDF = useCallback(async (data: ExportData, filename: string) => {
    // Use jsPDF for PDF generation
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(20)
    doc.text('Expert Discovery Test Results', 20, 20)
    
    // Add metadata
    doc.setFontSize(12)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    doc.text(`Query: ${data.query}`, 20, 40)
    
    // Add results table
    autoTable(doc, {
      head: [['Expert', 'Score', 'Method', 'Reasoning']],
      body: data.results.map(r => [
        r.expert.name,
        r.score.toFixed(3),
        r.method,
        r.reasoning
      ]),
      startY: 50
    })
    
    // Add performance metrics
    if (data.performance) {
      const finalY = doc.lastAutoTable.finalY + 10
      doc.text('Performance Metrics', 20, finalY)
      doc.text(`Total Time: ${data.performance.totalTime}ms`, 20, finalY + 10)
    }
    
    doc.save(`${filename}.pdf`)
  }, [])
  
  return {
    exportAsJSON,
    exportAsCSV,
    exportAsPDF
  }
}
```

## Performance Optimization Strategy

### React 18 Optimizations
1. **Concurrent Features**
   - Use `useDeferredValue` for search inputs
   - Implement `useTransition` for tab switching
   - Enable Concurrent Mode for better UX

2. **Code Splitting**
   - Lazy load heavy components (graphs, charts)
   - Split routes with React.lazy
   - Preload critical chunks

3. **Memoization**
   - Use `React.memo` for all components
   - Implement `useMemo` for expensive calculations
   - Cache API responses with React Query

### Bundle Optimization
```typescript
// Webpack configuration for optimal bundles
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3)/,
          name: 'charts',
          priority: 20
        }
      }
    }
  }
}
```

## Security Implementation

### Input Validation
```typescript
// Centralized validation utilities
export const validators = {
  query: (value: string) => {
    const sanitized = DOMPurify.sanitize(value)
    if (sanitized !== value) {
      throw new Error('Invalid characters detected')
    }
    if (value.length > 5000) {
      throw new Error('Query too long')
    }
    return sanitized
  },
  
  parameters: (params: any) => {
    const schema = z.object({
      searchDepth: z.number().min(1).max(5),
      maxResults: z.number().min(1).max(50),
      scoreThreshold: z.number().min(0).max(1),
      methods: z.array(z.enum(['vector', 'graph', 'hybrid']))
    })
    
    return schema.parse(params)
  }
}
```

### API Security
```typescript
// API middleware for rate limiting and validation
export const apiMiddleware = {
  rateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later'
  }),
  
  validateAdmin: (req, res, next) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    next()
  },
  
  sanitizeInput: (req, res, next) => {
    req.body = sanitizeObject(req.body)
    next()
  }
}
```

## Monitoring & Observability

### Performance Monitoring
```typescript
// React performance monitoring
export const PerformanceMonitor: React.FC = ({ children }) => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`${entry.name}: ${entry.duration}ms`)
          // Send to analytics
          sendToAnalytics({
            metric: entry.name,
            value: entry.duration,
            tags: { page: 'expert-discovery' }
          })
        }
      })
    })
    
    observer.observe({ entryTypes: ['measure'] })
    return () => observer.disconnect()
  }, [])
  
  return <>{children}</>
}
```

### Error Tracking
```typescript
// Global error boundary with reporting
export class GlobalErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Report to error tracking service
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Alert color="red" title="Something went wrong">
            <Text>An error occurred. Please refresh the page.</Text>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </Alert>
        </Container>
      )
    }
    
    return this.props.children
  }
}
```

## Deployment Strategy

### Docker Configuration
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Test and Deploy
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      - run: npm run build
      - uses: codecov/codecov-action@v3

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t expert-discovery .
      - run: docker push ${{ secrets.REGISTRY }}/expert-discovery
```

## Success Criteria Validation

### Performance Metrics
- [ ] Initial page load < 2s
- [ ] Time to Interactive < 3s
- [ ] 60fps during animations
- [ ] Memory usage < 150MB
- [ ] Bundle size < 500KB (gzipped)

### Quality Metrics
- [ ] 80%+ test coverage
- [ ] 0 accessibility violations
- [ ] TypeScript strict mode compliance
- [ ] All components memoized
- [ ] Error boundaries implemented

### User Experience
- [ ] Keyboard navigation complete
- [ ] Screen reader compatible
- [ ] Mobile responsive
- [ ] Offline capability
- [ ] Progressive enhancement
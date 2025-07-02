# Implementation Plan: Connect Dashboard to Overview Stats API

**Last Updated: 2025-07-01**

## Overview
This implementation plan follows Test-Driven Development (TDD) principles, organized into iterative cycles. Each cycle follows the Red-Green-Refactor pattern.

## TDD Cycle 1: Minimal Feature - Basic Data Fetching

### Objective
Implement the most basic version of `useOverviewStats` hook that can fetch data from the API.

### Red Phase - Write Failing Tests

```typescript
// hooks/useOverviewStats.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useOverviewStats } from './useOverviewStats';
import { wrapper } from '../test-utils/setup';
import { server } from '../test-utils/msw-server';
import { rest } from 'msw';

describe('useOverviewStats - Basic Functionality', () => {
  it('should fetch overview stats successfully', async () => {
    const mockData = {
      total_experts: 42,
      active_tasks: 5,
      success_rate: 94.5,
      avg_response_time: 124
    };

    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        return res(ctx.json(mockData));
      })
    );

    const { result } = renderHook(() => useOverviewStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useOverviewStats(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
```

### Green Phase - Minimal Implementation

```typescript
// hooks/useOverviewStats.ts
import { useQuery } from '@tanstack/react-query';

interface OverviewStats {
  total_experts: number;
  active_tasks: number;
  success_rate: number;
  avg_response_time: number;
}

export const useOverviewStats = () => {
  const query = useQuery<OverviewStats>({
    queryKey: ['overview-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
```

### Refactor Phase

```typescript
// types/stats.ts
export interface OverviewStats {
  total_experts: number;
  active_tasks: number;
  success_rate: number;
  avg_response_time: number;
}

// api/statsApi.ts
export const fetchOverviewStats = async (): Promise<OverviewStats> => {
  const response = await fetch('/api/admin/stats/overview');
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
};

// hooks/useOverviewStats.ts (refactored)
import { useQuery } from '@tanstack/react-query';
import { fetchOverviewStats } from '../api/statsApi';
import type { OverviewStats } from '../types/stats';

export const STATS_QUERY_KEY = ['overview-stats'] as const;

export const useOverviewStats = () => {
  const query = useQuery<OverviewStats>({
    queryKey: STATS_QUERY_KEY,
    queryFn: fetchOverviewStats,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
```

### Integration Test

```typescript
// components/Dashboard.test.tsx
describe('Dashboard Integration - Cycle 1', () => {
  it('should display loading state while fetching', () => {
    render(<Dashboard />, { wrapper });
    
    expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument();
  });

  it('should display stats after successful fetch', async () => {
    render(<Dashboard />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Total Experts')).toBeInTheDocument();
    });
  });
});
```

## TDD Cycle 2: Error Handling

### Objective
Add comprehensive error handling for different failure scenarios.

### Red Phase - Error Handling Tests

```typescript
describe('useOverviewStats - Error Handling', () => {
  it('should handle network errors', async () => {
    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        return res.networkError('Network request failed');
      })
    );

    const { result } = renderHook(() => useOverviewStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.type).toBe('NETWORK_ERROR');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle 500 server errors', async () => {
    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useOverviewStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.error?.type).toBe('SERVER_ERROR');
      expect(result.current.error?.message).toBe('Server error');
    });
  });

  it('should handle timeout errors', async () => {
    jest.useFakeTimers();
    
    server.use(
      rest.get('/api/admin/stats/overview', async (req, res, ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return res(ctx.json({}));
      })
    );

    const { result } = renderHook(() => useOverviewStats(), { wrapper });

    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(result.current.error?.type).toBe('TIMEOUT');
    });

    jest.useRealTimers();
  });
});
```

### Green Phase - Error Handling Implementation

```typescript
// types/errors.ts
export type ErrorType = 'NETWORK_ERROR' | 'SERVER_ERROR' | 'TIMEOUT' | 'UNAUTHORIZED' | 'PARSE_ERROR';

export class StatsError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'StatsError';
  }
}

// api/statsApi.ts (enhanced)
export const fetchOverviewStats = async (): Promise<OverviewStats> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('/api/admin/stats/overview', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        throw new StatsError('UNAUTHORIZED', 'Authentication required', 401);
      }
      if (response.status >= 500) {
        const error = await response.json().catch(() => ({ message: 'Server error' }));
        throw new StatsError('SERVER_ERROR', error.message, response.status);
      }
      throw new StatsError('SERVER_ERROR', `HTTP ${response.status}`, response.status);
    }

    try {
      return await response.json();
    } catch (e) {
      throw new StatsError('PARSE_ERROR', 'Invalid response format');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof StatsError) {
      throw error;
    }
    
    if (error.name === 'AbortError') {
      throw new StatsError('TIMEOUT', 'Request timeout');
    }
    
    throw new StatsError('NETWORK_ERROR', error.message || 'Network request failed');
  }
};

// hooks/useOverviewStats.ts (enhanced)
export const useOverviewStats = () => {
  const query = useQuery<OverviewStats, StatsError>({
    queryKey: STATS_QUERY_KEY,
    queryFn: fetchOverviewStats,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.type === 'UNAUTHORIZED') return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
```

### Refactor Phase - Error UI Components

```typescript
// components/ErrorDisplay.tsx
interface ErrorDisplayProps {
  error: StatsError;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  const errorMessages = {
    NETWORK_ERROR: 'Unable to connect to the server. Please check your connection.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
    UNAUTHORIZED: 'You need to log in to view this data.',
    PARSE_ERROR: 'Received invalid data from server.',
  };

  return (
    <div className="error-container" role="alert">
      <p className="error-message">{errorMessages[error.type] || error.message}</p>
      {error.type !== 'UNAUTHORIZED' && (
        <button onClick={onRetry} className="retry-button">
          Retry
        </button>
      )}
    </div>
  );
};
```

## TDD Cycle 3: Auto-refresh Functionality

### Objective
Implement automatic data refresh every 30 seconds with proper lifecycle management.

### Red Phase - Auto-refresh Tests

```typescript
describe('useOverviewStats - Auto-refresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should refetch data every 30 seconds', async () => {
    let callCount = 0;
    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        callCount++;
        return res(ctx.json({ total_experts: callCount }));
      })
    );

    const { result } = renderHook(() => useOverviewStats(), { wrapper });

    // Wait for initial fetch
    await waitFor(() => expect(result.current.data?.total_experts).toBe(1));

    // Advance time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Wait for refetch
    await waitFor(() => expect(result.current.data?.total_experts).toBe(2));
  });

  it('should pause refetch when window is not focused', async () => {
    let callCount = 0;
    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        callCount++;
        return res(ctx.json({ total_experts: callCount }));
      })
    );

    const { result } = renderHook(() => useOverviewStats(), { wrapper });

    await waitFor(() => expect(result.current.data?.total_experts).toBe(1));

    // Simulate window blur
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    // Advance time
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should not have refetched
    expect(callCount).toBe(1);
  });
});
```

### Green Phase - Auto-refresh Implementation

```typescript
// hooks/useOverviewStats.ts (with auto-refresh)
export interface UseOverviewStatsOptions {
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}

export const useOverviewStats = (options?: UseOverviewStatsOptions) => {
  const {
    refetchInterval = 30000, // 30 seconds
    refetchOnWindowFocus = true,
  } = options || {};

  const query = useQuery<OverviewStats, StatsError>({
    queryKey: STATS_QUERY_KEY,
    queryFn: fetchOverviewStats,
    refetchInterval,
    refetchIntervalInBackground: false, // Pause when tab is not active
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      if (error.type === 'UNAUTHORIZED') return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};
```

### Refactor Phase - Refresh Indicator

```typescript
// components/RefreshIndicator.tsx
interface RefreshIndicatorProps {
  isRefetching: boolean;
  lastUpdated?: Date;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({ 
  isRefetching, 
  lastUpdated 
}) => {
  return (
    <div className="refresh-indicator">
      {isRefetching && (
        <span className="refresh-spinner" aria-label="Refreshing data">
          🔄
        </span>
      )}
      {lastUpdated && (
        <span className="last-updated">
          Last updated: {formatRelativeTime(lastUpdated)}
        </span>
      )}
    </div>
  );
};

// utils/time.ts
export const formatRelativeTime = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  return `${Math.floor(seconds / 3600)} hours ago`;
};
```

## TDD Cycle 4: Caching and Optimization

### Objective
Implement advanced caching strategies and performance optimizations.

### Red Phase - Caching Tests

```typescript
describe('useOverviewStats - Caching', () => {
  it('should use cached data when available', async () => {
    let callCount = 0;
    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        callCount++;
        return res(ctx.json({ total_experts: 42 }));
      })
    );

    // First render
    const { result: result1, unmount: unmount1 } = renderHook(
      () => useOverviewStats(),
      { wrapper }
    );

    await waitFor(() => expect(result1.current.data).toBeDefined());
    unmount1();

    // Second render within stale time
    const { result: result2 } = renderHook(
      () => useOverviewStats(),
      { wrapper }
    );

    // Should use cached data immediately
    expect(result2.current.data).toBeDefined();
    expect(callCount).toBe(1); // No new request
  });

  it('should prefetch data on hover', async () => {
    const { result } = renderHook(
      () => useOverviewStatsPrefetch(),
      { wrapper }
    );

    act(() => {
      result.current.prefetch();
    });

    await waitFor(() => {
      const cache = queryClient.getQueryData(STATS_QUERY_KEY);
      expect(cache).toBeDefined();
    });
  });

  it('should optimize re-renders with structural sharing', async () => {
    const data1 = { total_experts: 42, active_tasks: 5 };
    const data2 = { ...data1 }; // Same values, different object

    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        return res(ctx.json(data1));
      })
    );

    const { result, rerender } = renderHook(
      () => useOverviewStats(),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    const firstDataRef = result.current.data;

    // Trigger refetch with same data
    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        return res(ctx.json(data2));
      })
    );

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isRefetching).toBe(false));

    // Should maintain same reference due to structural sharing
    expect(result.current.data).toBe(firstDataRef);
  });
});
```

### Green Phase - Caching Implementation

```typescript
// config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
      structuralSharing: true, // Optimize re-renders
    },
  },
});

// hooks/useOverviewStats.ts (optimized)
export const useOverviewStats = (options?: UseOverviewStatsOptions) => {
  const {
    refetchInterval = 30000,
    refetchOnWindowFocus = true,
    staleTime = 1000 * 60 * 2, // 2 minutes
  } = options || {};

  const query = useQuery<OverviewStats, StatsError>({
    queryKey: STATS_QUERY_KEY,
    queryFn: fetchOverviewStats,
    refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus,
    staleTime,
    select: useCallback((data: OverviewStats) => ({
      ...data,
      // Computed values
      isHighPerformance: data.success_rate > 90,
      responseTimeStatus: data.avg_response_time < 100 ? 'fast' : 'normal',
    }), []),
    retry: (failureCount, error) => {
      if (error.type === 'UNAUTHORIZED') return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    dataUpdatedAt: query.dataUpdatedAt,
  };
};

// hooks/useOverviewStatsPrefetch.ts
export const useOverviewStatsPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetch = useCallback(() => {
    return queryClient.prefetchQuery({
      queryKey: STATS_QUERY_KEY,
      queryFn: fetchOverviewStats,
      staleTime: 1000 * 60 * 2,
    });
  }, [queryClient]);

  return { prefetch };
};
```

### Refactor Phase - Performance Monitoring

```typescript
// hooks/usePerformanceMonitor.ts
export const usePerformanceMonitor = (queryKey: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 1000) {
        console.warn(`Query ${queryKey} took ${duration}ms`);
      }
    };
  }, [queryKey]);
};

// components/Dashboard.tsx (final integration)
export const Dashboard: React.FC = () => {
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    isRefetching,
    dataUpdatedAt 
  } = useOverviewStats();

  usePerformanceMonitor('overview-stats');

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="dashboard">
      <RefreshIndicator 
        isRefetching={isRefetching}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
      />
      
      <div className="stats-grid">
        <StatsCard
          title="Total Experts"
          value={data.total_experts}
          icon="👥"
        />
        <StatsCard
          title="Active Tasks"
          value={data.active_tasks}
          icon="📋"
        />
        <StatsCard
          title="Success Rate"
          value={`${data.success_rate}%`}
          icon="✅"
          status={data.isHighPerformance ? 'success' : 'normal'}
        />
        <StatsCard
          title="Avg Response Time"
          value={`${data.avg_response_time}ms`}
          icon="⚡"
          status={data.responseTimeStatus}
        />
      </div>
    </div>
  );
};
```

## Final Integration and Polish

### Complete Test Suite

```typescript
// hooks/useOverviewStats.integration.test.tsx
describe('useOverviewStats - Full Integration', () => {
  it('should handle complete user flow', async () => {
    const { container } = render(<Dashboard />, { wrapper });

    // Loading state
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();

    // Data loads
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    // Simulate network error
    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        return res.networkError('Network error');
      })
    );

    // Wait for auto-refresh
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Error state appears
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // User clicks retry
    const retryButton = screen.getByText('Retry');
    
    // Fix the network
    server.use(
      rest.get('/api/admin/stats/overview', (req, res, ctx) => {
        return res(ctx.json({ total_experts: 43 }));
      })
    );

    fireEvent.click(retryButton);

    // Data reloads
    await waitFor(() => {
      expect(screen.getByText('43')).toBeInTheDocument();
    });
  });
});
```

### Performance Optimization

```typescript
// components/StatsCard.tsx (memoized)
export const StatsCard = memo<StatsCardProps>(({ 
  title, 
  value, 
  icon, 
  status = 'normal' 
}) => {
  return (
    <div className={`stats-card stats-card--${status}`}>
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__content">
        <h3 className="stats-card__title">{title}</h3>
        <p className="stats-card__value">{value}</p>
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';
```

## Deployment Checklist

1. **Unit Tests**: All cycles have comprehensive unit tests
2. **Integration Tests**: Dashboard integration fully tested
3. **Performance Tests**: Render performance validated
4. **Error Scenarios**: All error types handled gracefully
5. **Accessibility**: Screen reader support implemented
6. **Documentation**: API documentation and usage examples complete
7. **Monitoring**: Performance tracking in place
8. **Feature Flags**: Can disable auto-refresh if needed

## Next Steps

1. Add WebSocket support for real-time updates
2. Implement data export functionality
3. Add historical data comparison
4. Create admin-configurable refresh intervals
5. Add anomaly detection for stats values
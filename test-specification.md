# Test Specification: Connect Dashboard to Overview Stats API

**Last Updated: 2025-07-01**

## Overview
This document outlines the comprehensive test specification for the `useOverviewStats` hook and its integration with the dashboard, following Test-Driven Development (TDD) principles.

## Test Categories

### 1. Unit Tests - useOverviewStats Hook

#### 1.1 Basic Functionality Tests

```typescript
describe('useOverviewStats hook', () => {
  it('should fetch overview stats successfully', async () => {
    // Given: Mock API returns valid stats data
    // When: Hook is called
    // Then: Should return data with correct shape and values
  });

  it('should return isLoading=true while fetching data', () => {
    // Given: Initial hook mount
    // When: Query is in progress
    // Then: isLoading should be true, data should be undefined
  });

  it('should handle successful data transformation', async () => {
    // Given: API returns raw data
    // When: Data is fetched successfully
    // Then: Data should be properly typed and transformed
  });
});
```

#### 1.2 Error Handling Tests

```typescript
describe('useOverviewStats error handling', () => {
  it('should handle network errors gracefully', async () => {
    // Given: Network request fails
    // When: Hook attempts to fetch data
    // Then: Should return error with type 'NETWORK_ERROR'
  });

  it('should handle 500 server errors', async () => {
    // Given: Server returns 500 status
    // When: Hook receives error response
    // Then: Should return error with type 'SERVER_ERROR' and message
  });

  it('should handle 401 unauthorized errors', async () => {
    // Given: Server returns 401 status
    // When: Hook receives unauthorized response
    // Then: Should return error with type 'UNAUTHORIZED'
  });

  it('should handle timeout errors', async () => {
    // Given: Request exceeds timeout threshold
    // When: Timeout occurs
    // Then: Should return error with type 'TIMEOUT'
  });

  it('should handle malformed JSON responses', async () => {
    // Given: Server returns invalid JSON
    // When: Hook tries to parse response
    // Then: Should return error with type 'PARSE_ERROR'
  });
});
```

#### 1.3 Retry Logic Tests

```typescript
describe('useOverviewStats retry behavior', () => {
  it('should retry failed requests with exponential backoff', async () => {
    // Given: Initial request fails
    // When: Retry logic triggers
    // Then: Should retry 3 times with delays of 1s, 2s, 4s
  });

  it('should not retry on 401 errors', async () => {
    // Given: Request returns 401
    // When: Error occurs
    // Then: Should not attempt retry
  });

  it('should reset retry count on successful request', async () => {
    // Given: Previous request failed and retried
    // When: Subsequent request succeeds
    // Then: Retry count should reset to 0
  });
});
```

#### 1.4 Caching Tests

```typescript
describe('useOverviewStats caching', () => {
  it('should use cached data when available', async () => {
    // Given: Data was previously fetched
    // When: Hook is called again within stale time
    // Then: Should return cached data without new request
  });

  it('should refetch when data is stale', async () => {
    // Given: Cached data exists but is stale
    // When: Hook is called
    // Then: Should trigger background refetch
  });

  it('should respect cache time configuration', async () => {
    // Given: Custom cache time is set
    // When: Time exceeds cache duration
    // Then: Should remove data from cache
  });
});
```

#### 1.5 Auto-refresh Tests

```typescript
describe('useOverviewStats auto-refresh', () => {
  it('should refetch data every 30 seconds', async () => {
    // Given: Hook is mounted and initial fetch completes
    // When: 30 seconds pass
    // Then: Should trigger new fetch
  });

  it('should pause auto-refresh when window is not focused', async () => {
    // Given: Auto-refresh is active
    // When: Window loses focus
    // Then: Should pause refresh interval
  });

  it('should resume auto-refresh when window regains focus', async () => {
    // Given: Auto-refresh was paused
    // When: Window regains focus
    // Then: Should resume refresh and fetch immediately if stale
  });
});
```

### 2. Integration Tests

#### 2.1 Dashboard Integration

```typescript
describe('Dashboard integration with useOverviewStats', () => {
  it('should render loading skeletons while fetching', () => {
    // Given: Dashboard component mounts
    // When: Data is being fetched
    // Then: Should display skeleton loaders in StatsCards
  });

  it('should display fetched stats in StatsCards', async () => {
    // Given: API returns valid stats
    // When: Data fetch completes
    // Then: Each StatsCard should display correct value
  });

  it('should show error state with retry button', async () => {
    // Given: API request fails
    // When: Error state is active
    // Then: Should display error message and retry button
  });

  it('should update stats on manual refresh', async () => {
    // Given: Stats are displayed
    // When: User clicks refresh button
    // Then: Should refetch and update displayed values
  });
});
```

#### 2.2 React Query Provider Integration

```typescript
describe('React Query Provider configuration', () => {
  it('should use correct default options', () => {
    // Given: QueryClient is configured
    // When: Checking default options
    // Then: Should have correct staleTime, cacheTime, retry settings
  });

  it('should handle query invalidation correctly', async () => {
    // Given: Stats query is cached
    // When: Query is invalidated
    // Then: Should refetch data
  });
});
```

### 3. Performance Tests

#### 3.1 Render Performance

```typescript
describe('Performance optimization', () => {
  it('should not cause unnecessary re-renders', () => {
    // Given: Hook is used in component
    // When: Unrelated state changes
    // Then: Should not trigger hook re-execution
  });

  it('should memoize computed values correctly', () => {
    // Given: Hook returns derived data
    // When: Source data hasn't changed
    // Then: Should return same object reference
  });
});
```

#### 3.2 Network Performance

```typescript
describe('Network optimization', () => {
  it('should batch multiple hook calls into single request', async () => {
    // Given: Multiple components use useOverviewStats
    // When: They mount simultaneously
    // Then: Should only make one API request
  });

  it('should cancel in-flight requests on unmount', async () => {
    // Given: Request is in progress
    // When: Component unmounts
    // Then: Should cancel the request
  });
});
```

### 4. Edge Cases

```typescript
describe('Edge cases', () => {
  it('should handle empty response gracefully', async () => {
    // Given: API returns empty object
    // When: Hook processes response
    // Then: Should provide default values
  });

  it('should handle very large numbers correctly', async () => {
    // Given: API returns numbers exceeding safe integer
    // When: Hook processes data
    // Then: Should handle without precision loss
  });

  it('should handle rapid mount/unmount cycles', async () => {
    // Given: Component rapidly mounts and unmounts
    // When: Multiple requests may be in flight
    // Then: Should not cause memory leaks or errors
  });

  it('should handle system time changes', async () => {
    // Given: Auto-refresh is active
    // When: System time changes significantly
    // Then: Should continue functioning correctly
  });
});
```

## Test Data Fixtures

```typescript
// fixtures/statsData.ts
export const mockStatsResponse = {
  total_experts: 42,
  active_tasks: 5,
  success_rate: 94.5,
  avg_response_time: 124
};

export const mockEmptyResponse = {};

export const mockLargeNumbersResponse = {
  total_experts: Number.MAX_SAFE_INTEGER,
  active_tasks: 0,
  success_rate: 100,
  avg_response_time: 999999
};

export const mockErrorResponses = {
  networkError: new Error('Network request failed'),
  serverError: { status: 500, message: 'Internal server error' },
  unauthorizedError: { status: 401, message: 'Unauthorized' },
  timeoutError: new Error('Request timeout')
};
```

## Performance Criteria

### Response Time Requirements
- Initial data fetch: < 2 seconds
- Cached data access: < 10ms
- Background refetch: Should not block UI

### Memory Usage
- Hook should not cause memory leaks
- Cached data should be garbage collected appropriately
- Maximum cache size: 10MB

### Rendering Performance
- StatsCard updates: < 16ms (60fps)
- No layout shifts during loading/error states
- Smooth transitions between states

## Accessibility Testing

```typescript
describe('Accessibility', () => {
  it('should announce loading state to screen readers', () => {
    // Given: Screen reader is active
    // When: Data is loading
    // Then: Should announce "Loading statistics"
  });

  it('should announce errors to screen readers', () => {
    // Given: Screen reader is active
    // When: Error occurs
    // Then: Should announce error message
  });

  it('should provide keyboard navigation for retry', () => {
    // Given: Error state with retry button
    // When: User navigates with keyboard
    // Then: Retry button should be focusable and actionable
  });
});
```

## Test Environment Setup

```typescript
// test-utils/setup.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
  },
});

export const wrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);
```

## Coverage Requirements
- Unit test coverage: > 95%
- Integration test coverage: > 85%
- Edge case coverage: 100%
- Performance test execution: All tests < 5 seconds

## Test Execution Strategy
1. Run unit tests on every commit
2. Run integration tests on pull requests
3. Run performance tests nightly
4. Run full test suite before deployment
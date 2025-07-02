# Design Document: Connect Dashboard to Overview Stats API

## Feature Overview
Implement data fetching for dashboard statistics using React Query v5 (TanStack Query) to connect the dashboard UI to the backend stats API.

## Functional Requirements
1. Fetch overview statistics from `/api/admin/stats/overview` endpoint
2. Display loading states while data is being fetched
3. Handle error states gracefully with user-friendly messages
4. Implement automatic refresh every 30 seconds
5. Cache data appropriately to minimize unnecessary API calls

## Technical Specifications

### API Endpoint
- **URL**: `GET /api/admin/stats/overview`
- **Response Format**:
```json
{
  "total_experts": 42,
  "active_tasks": 5,
  "success_rate": 94.5,
  "avg_response_time": 124
}
```

### React Query Implementation
1. Create custom hook `useOverviewStats`
2. Configure query with:
   - Automatic refetch interval (30 seconds)
   - Stale time configuration
   - Cache time configuration
   - Retry logic with exponential backoff

### UI Integration
1. Update Dashboard component to use the new hook
2. Display skeleton loaders during loading state
3. Show error messages with retry button on failure
4. Update StatsCard components with real data

### Error Handling
1. Network errors: Display connection error message
2. Server errors: Show appropriate error based on status code
3. Timeout errors: Inform user and provide retry option
4. Provide manual refresh capability

### Performance Considerations
1. Implement proper cache invalidation
2. Use React Query's optimistic updates where applicable
3. Minimize re-renders with proper memoization
4. Configure appropriate stale/cache times

## Success Criteria
1. Dashboard displays real-time statistics from API
2. Loading states are smooth and user-friendly
3. Errors are handled gracefully
4. Auto-refresh works reliably
5. Performance is optimized with proper caching
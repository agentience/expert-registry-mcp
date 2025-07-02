export const mockStatsResponse = {
  total_experts: 42,
  active_tasks: 5,
  success_rate: 94.5,
  avg_response_time: 124
}

export const mockEmptyResponse = {}

export const mockLargeNumbersResponse = {
  total_experts: Number.MAX_SAFE_INTEGER,
  active_tasks: 0,
  success_rate: 100,
  avg_response_time: 999999
}

export const mockErrorResponses = {
  networkError: new Error('Network request failed'),
  serverError: { status: 500, message: 'Internal server error' },
  unauthorizedError: { status: 401, message: 'Unauthorized' },
  timeoutError: new Error('Request timeout')
}
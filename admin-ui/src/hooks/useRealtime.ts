import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'

export function useRealtimeUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const eventSource = new EventSource('/api/admin/events')

    eventSource.addEventListener('expert-update', (event) => {
      const data = JSON.parse(event.data)
      // Invalidate and refetch expert data
      queryClient.invalidateQueries({ queryKey: ['experts'] })
      queryClient.invalidateQueries({ queryKey: ['experts', data.expertId] })
    })

    eventSource.addEventListener('stats-update', (event) => {
      const data = JSON.parse(event.data)
      // Invalidate stats queries
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    })

    eventSource.addEventListener('task-complete', (event) => {
      const data = JSON.parse(event.data)
      notifications.show({
        title: 'Task Completed',
        message: `${data.expertId} completed task ${data.taskId}`,
        color: 'green',
      })
    })

    eventSource.addEventListener('error', (event) => {
      console.error('SSE Error:', event)
    })

    return () => {
      eventSource.close()
    }
  }, [queryClient])
}
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'

export function useRealtimeUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Skip SSE in development if API is not running
    if (import.meta.env.DEV) {
      console.log('Skipping SSE connection in development')
      return
    }
    
    let eventSource: EventSource | null = null
    
    try {
      eventSource = new EventSource('/api/admin/events')

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
    } catch (error) {
      console.error('Failed to establish SSE connection:', error)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [queryClient])
}
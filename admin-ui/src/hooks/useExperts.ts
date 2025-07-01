import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expertApi } from '../services/api'
import { notifications } from '@mantine/notifications'

export function useExperts(params?: any) {
  return useQuery({
    queryKey: ['experts', params],
    queryFn: () => expertApi.list(params).then(res => res.data),
  })
}

export function useExpert(id: string) {
  return useQuery({
    queryKey: ['experts', id],
    queryFn: () => expertApi.get(id).then(res => res.data),
    enabled: !!id,
  })
}

export function useCreateExpert() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expertApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] })
      notifications.show({
        title: 'Success',
        message: 'Expert created successfully',
        color: 'green',
      })
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create expert',
        color: 'red',
      })
    },
  })
}

export function useUpdateExpert() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      expertApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['experts'] })
      queryClient.invalidateQueries({ queryKey: ['experts', variables.id] })
      notifications.show({
        title: 'Success',
        message: 'Expert updated successfully',
        color: 'green',
      })
    },
  })
}

export function useDeleteExpert() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expertApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] })
      notifications.show({
        title: 'Success',
        message: 'Expert deleted successfully',
        color: 'green',
      })
    },
  })
}
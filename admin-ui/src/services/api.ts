import axios from 'axios'
import { notifications } from '@mantine/notifications'

// Handle both absolute URLs and relative paths
const API_BASE_URL = (() => {
  const envUrl = (import.meta as any).env?.VITE_API_URL
  if (!envUrl) {
    return '/api/admin'
  }
  // If it's an absolute URL, append /api/admin
  if (envUrl.startsWith('http')) {
    return `${envUrl}/api/admin`
  }
  return envUrl
})()

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login'
    } else if (error.response?.status >= 500) {
      notifications.show({
        title: 'Server Error',
        message: 'Something went wrong. Please try again later.',
        color: 'red',
      })
    }
    return Promise.reject(error)
  }
)

// API methods
export const expertApi = {
  list: (params?: any) => api.get('/experts', { params }),
  get: (id: string) => api.get(`/experts/${id}`),
  create: (data: any) => api.post('/experts', data),
  update: (id: string, data: any) => api.put(`/experts/${id}`, data),
  delete: (id: string) => api.delete(`/experts/${id}`),
  
  getContext: (id: string) => api.get(`/expert-contexts/${id}`),
  updateContext: (id: string, content: string) => 
    api.post(`/expert-contexts/${id}`, { content }),
}

export const statsApi = {
  overview: () => api.get('/stats/overview'),
  expertStats: (id: string) => api.get(`/stats/experts/${id}`),
  usageTimeline: (params?: any) => api.get('/stats/usage/timeline', { params }),
  performance: (params?: any) => api.get('/stats/performance', { params }),
}
/**
 * Custom hook for URL synchronization
 */

import { useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createSearchParams, extractQueryParametersFromUrl } from '../utils'
import type { QueryParameters } from '../types'

interface UseUrlSyncProps {
  activeTab: string
  onTabChange: (tab: string) => void
  parameters?: QueryParameters
  onParametersChange?: (parameters: Partial<QueryParameters>) => void
}

export const useUrlSync = ({ 
  activeTab, 
  onTabChange, 
  parameters, 
  onParametersChange 
}: UseUrlSyncProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const hasInitialized = useRef(false)

  // Initialize from URL on mount only
  useEffect(() => {
    if (!hasInitialized.current) {
      const tabParam = searchParams.get('tab')
      if (tabParam && tabParam !== activeTab) {
        onTabChange(tabParam)
      }

      // Extract and apply query parameters from URL
      if (onParametersChange) {
        const urlParameters = extractQueryParametersFromUrl(searchParams)
        if (Object.keys(urlParameters).length > 0) {
          onParametersChange(urlParameters)
        }
      }
      
      hasInitialized.current = true
    }
  }, [searchParams, activeTab, onTabChange, onParametersChange]) // Include dependencies but guard with ref

  // Update URL when tab changes
  const updateUrlTab = useCallback((newTab: string) => {
    const newParams = createSearchParams(newTab, parameters)
    setSearchParams(newParams, { replace: true })
  }, [parameters, setSearchParams])

  // Update URL when parameters change
  const updateUrlParameters = useCallback((newParameters: QueryParameters) => {
    const newParams = createSearchParams(activeTab, newParameters)
    setSearchParams(newParams, { replace: true })
  }, [activeTab, setSearchParams])

  // Sync tab changes to URL
  useEffect(() => {
    const currentTab = searchParams.get('tab')
    if (currentTab !== activeTab) {
      updateUrlTab(activeTab)
    }
  }, [activeTab, searchParams, updateUrlTab])

  return {
    updateUrlTab,
    updateUrlParameters
  }
}
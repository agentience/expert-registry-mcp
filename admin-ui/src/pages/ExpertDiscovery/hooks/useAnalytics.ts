/**
 * Custom hook for analytics tracking
 */

import { useEffect, useCallback } from 'react'
import { ANALYTICS_CONFIG } from '../constants'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export const useAnalytics = () => {
  // Track page view
  const trackPageView = useCallback((pageTitle?: string, pageLocation?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', ANALYTICS_CONFIG.measurementId, {
        page_title: pageTitle || ANALYTICS_CONFIG.pageTitle,
        page_location: pageLocation || window.location.href
      })
    }
  }, [])

  // Track custom events
  const trackEvent = useCallback((eventName: string, eventParameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParameters)
    }
  }, [])

  // Track tab switch
  const trackTabSwitch = useCallback((fromTab: string, toTab: string) => {
    trackEvent(ANALYTICS_CONFIG.events.tabSwitch, {
      from_tab: fromTab,
      to_tab: toTab,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  // Track search
  const trackSearch = useCallback((query: string, algorithm: string, resultCount: number) => {
    trackEvent(ANALYTICS_CONFIG.events.search, {
      search_query: query.substring(0, 100), // Limit PII exposure
      algorithm,
      result_count: resultCount,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  // Track parameter change
  const trackParameterChange = useCallback((parameterName: string, value: any) => {
    trackEvent(ANALYTICS_CONFIG.events.parameterChange, {
      parameter_name: parameterName,
      parameter_value: String(value),
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  // Initialize page tracking on mount
  useEffect(() => {
    trackPageView()
  }, [trackPageView])

  return {
    trackPageView,
    trackEvent,
    trackTabSwitch,
    trackSearch,
    trackParameterChange
  }
}
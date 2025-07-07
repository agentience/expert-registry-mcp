/**
 * Custom hook for keyboard shortcuts management
 */

import { useEffect, useCallback } from 'react'
import { KEYBOARD_SHORTCUTS } from '../constants'

interface UseKeyboardShortcutsProps {
  onTabChange: (tab: string) => void
  enabled?: boolean
}

export const useKeyboardShortcuts = ({ onTabChange, enabled = true }: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const shortcutKey = `${event.ctrlKey ? 'Ctrl+' : ''}${event.key}`
    const targetTab = KEYBOARD_SHORTCUTS[shortcutKey as keyof typeof KEYBOARD_SHORTCUTS]
    
    if (targetTab) {
      event.preventDefault()
      onTabChange(targetTab)
    }
  }, [onTabChange, enabled])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])

  // Return available shortcuts for documentation
  const availableShortcuts = Object.entries(KEYBOARD_SHORTCUTS).map(([key, tab]) => ({
    key,
    tab,
    description: `Switch to ${tab.replace('-', ' ')} tab`
  }))

  return {
    availableShortcuts
  }
}
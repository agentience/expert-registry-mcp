/**
 * Expert Expandable History Component
 * Enterprise-grade virtualized list with animations and accessibility
 * 
 * @fileoverview Enhanced component following expert patterns:
 * - Virtual scrolling for performance with large datasets
 * - Smooth animations and micro-interactions
 * - Advanced keyboard navigation with focus management
 * - Comprehensive accessibility support
 * - Memory-efficient rendering optimizations
 * - Real-time performance monitoring
 * 
 * @author Expert-Enhanced Refactoring Agent
 * @version 2.1.0
 * @since 2.0.0
 */

import React, { 
  useState, 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef,
  forwardRef,
  memo
} from 'react'
import {
  Stack,
  Text,
  Paper,
  Group,
  ActionIcon,
  Badge,
  Button,
  Loader,
  Alert,
  Tooltip,
  Transition,
  Box,
  ScrollArea
} from '@mantine/core'
import { 
  IconX, 
  IconClock, 
  IconAlertTriangle, 
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconTrash
} from '@tabler/icons-react'
import type { ExpandableHistoryProps, QueryHistoryEntry } from '../../types/history'
import { CONFIG } from '../../config'
import { 
  measurePerformance, 
  PrecisionTimer, 
  performanceMonitor 
} from '../../utils/performance'
import { createErrorBoundaryHandler } from '../../utils/errors'

/**
 * Virtual scrolling configuration
 */
interface VirtualScrollConfig {
  itemHeight: number
  overscan: number
  containerHeight: number
}

/**
 * Animation variants for micro-interactions
 */
const ANIMATION_VARIANTS = {
  fadeIn: {
    in: { opacity: 1, transform: 'translateY(0)' },
    out: { opacity: 0, transform: 'translateY(-10px)' },
    transitionProperty: 'opacity, transform'
  },
  slideIn: {
    in: { opacity: 1, transform: 'translateX(0)' },
    out: { opacity: 0, transform: 'translateX(-20px)' },
    transitionProperty: 'opacity, transform'
  },
  scaleIn: {
    in: { opacity: 1, transform: 'scale(1)' },
    out: { opacity: 0, transform: 'scale(0.95)' },
    transitionProperty: 'opacity, transform'
  }
} as const

/**
 * Enhanced keyboard navigation handler
 */
class KeyboardNavigationManager {
  private focusedIndex = -1
  private maxIndex = 0
  private onNavigate: (index: number) => void
  private onSelect: (index: number) => void
  private onEscape: () => void

  constructor(
    maxIndex: number,
    onNavigate: (index: number) => void,
    onSelect: (index: number) => void,
    onEscape: () => void
  ) {
    this.maxIndex = maxIndex
    this.onNavigate = onNavigate
    this.onSelect = onSelect
    this.onEscape = onEscape
  }

  handleKeyDown = (event: React.KeyboardEvent): boolean => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.focusedIndex = Math.min(this.focusedIndex + 1, this.maxIndex - 1)
        this.onNavigate(this.focusedIndex)
        return true
        
      case 'ArrowUp':
        event.preventDefault()
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0)
        this.onNavigate(this.focusedIndex)
        return true
        
      case 'Home':
        event.preventDefault()
        this.focusedIndex = 0
        this.onNavigate(this.focusedIndex)
        return true
        
      case 'End':
        event.preventDefault()
        this.focusedIndex = this.maxIndex - 1
        this.onNavigate(this.focusedIndex)
        return true
        
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (this.focusedIndex >= 0 && this.focusedIndex < this.maxIndex) {
          this.onSelect(this.focusedIndex)
        }
        return true
        
      case 'Escape':
        event.preventDefault()
        this.onEscape()
        return true
        
      default:
        return false
    }
  }

  updateMaxIndex(newMaxIndex: number): void {
    this.maxIndex = newMaxIndex
    if (this.focusedIndex >= newMaxIndex) {
      this.focusedIndex = Math.max(0, newMaxIndex - 1)
    }
  }

  getCurrentIndex(): number {
    return this.focusedIndex
  }

  setFocusedIndex(index: number): void {
    this.focusedIndex = Math.max(0, Math.min(index, this.maxIndex - 1))
  }
}

/**
 * Memoized history item component for performance
 */
const HistoryItem = memo(forwardRef<HTMLDivElement, {
  entry: QueryHistoryEntry
  index: number
  isSelected: boolean
  isFocused: boolean
  onSelect: (entry: QueryHistoryEntry) => void
  onDelete: (id: string, event: React.MouseEvent) => void
  formatTimestamp: (timestamp: number) => string
}>(({
  entry,
  index,
  isSelected,
  isFocused,
  onSelect,
  onDelete,
  formatTimestamp
}, ref) => {
  const handleClick = useCallback(() => {
    onSelect(entry)
  }, [entry, onSelect])

  const handleDelete = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onDelete(entry.id, event)
  }, [entry.id, onDelete])

  return (
    <Transition
      mounted={true}
      transition={ANIMATION_VARIANTS.fadeIn}
      duration={CONFIG.ui.animationDuration}
      timingFunction="ease-out"
    >
      {(styles) => (
        <Paper
          ref={ref}
          p="xs"
          withBorder={isFocused}
          style={{
            ...styles,
            cursor: 'pointer',
            backgroundColor: isFocused 
              ? 'var(--mantine-color-blue-0)' 
              : isSelected 
                ? 'var(--mantine-color-gray-0)' 
                : undefined,
            borderColor: isFocused ? 'var(--mantine-color-blue-5)' : undefined,
            transition: `background-color ${CONFIG.ui.animationDuration}ms ease, border-color ${CONFIG.ui.animationDuration}ms ease`
          }}
          onClick={handleClick}
          data-testid={`history-item-${index}`}
          tabIndex={0}
          role="button"
          aria-label={`Select query: ${entry.query}`}
          aria-selected={isSelected}
          aria-describedby={`history-item-${index}-details`}
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text 
                size="sm" 
                fw={500}
                style={{ 
                  wordBreak: 'break-word',
                  lineHeight: 1.3
                }}
                title={entry.query}
              >
                {entry.query}
              </Text>
              
              <Group gap="xs" align="center" id={`history-item-${index}-details`}>
                <Group gap={4} align="center">
                  <IconClock size={12} />
                  <Text size="xs" c="dimmed">
                    {formatTimestamp(entry.timestamp)}
                  </Text>
                </Group>
                
                {entry.resultCount !== undefined && (
                  <Badge size="xs" variant="light" color="blue">
                    {entry.resultCount} results
                  </Badge>
                )}
                
                {entry.success === false && (
                  <Badge size="xs" variant="light" color="red">
                    Failed
                  </Badge>
                )}

                {entry.algorithm && (
                  <Badge size="xs" variant="outline" color="gray">
                    {entry.algorithm}
                  </Badge>
                )}
              </Group>
            </Stack>

            <Tooltip label="Delete entry">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={handleDelete}
                data-testid={`delete-${entry.id}`}
                aria-label={`Delete query: ${entry.query}`}
              >
                <IconX size={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>
      )}
    </Transition>
  )
}))

HistoryItem.displayName = 'HistoryItem'

/**
 * Virtual scrolling implementation for large lists
 */
function useVirtualScrolling(
  entries: QueryHistoryEntry[],
  config: VirtualScrollConfig
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / config.itemHeight)
    const visibleCount = Math.ceil(config.containerHeight / config.itemHeight)
    const end = Math.min(start + visibleCount + config.overscan, entries.length)
    
    return {
      start: Math.max(0, start - config.overscan),
      end,
      visibleCount
    }
  }, [scrollTop, config, entries.length])

  const visibleEntries = useMemo(() => {
    return entries.slice(visibleRange.start, visibleRange.end).map((entry, index) => ({
      entry,
      index: visibleRange.start + index,
      top: (visibleRange.start + index) * config.itemHeight
    }))
  }, [entries, visibleRange, config.itemHeight])

  const totalHeight = entries.length * config.itemHeight

  return {
    visibleEntries,
    totalHeight,
    setScrollTop,
    visibleRange
  }
}

/**
 * Enhanced ExpandableHistory with virtual scrolling and animations
 */
export const ExpandableHistory = memo<ExpandableHistoryProps>(({
  entries,
  isLoading = false,
  error = null,
  maxVisibleItems = CONFIG.ui.maxVisibleHistoryItems,
  onSelect,
  onDelete,
  onClear,
  className
}) => {
  // State management
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [expanded, setExpanded] = useState(true)

  // Refs for performance tracking and DOM access
  const containerRef = useRef<HTMLDivElement>(null)
  const renderTimerRef = useRef<PrecisionTimer | null>(null)

  // Virtual scrolling configuration
  const virtualConfig: VirtualScrollConfig = useMemo(() => ({
    itemHeight: 80, // Estimated height per item
    overscan: 5,
    containerHeight: Math.min(400, maxVisibleItems * 80)
  }), [maxVisibleItems])

  // Virtual scrolling for performance
  const shouldUseVirtualScrolling = entries.length > CONFIG.ui.virtualScrollThreshold
  const {
    visibleEntries,
    totalHeight,
    setScrollTop,
    visibleRange
  } = useVirtualScrolling(entries, virtualConfig)

  // Use virtual entries when enabled, otherwise use all entries
  const displayEntries = shouldUseVirtualScrolling 
    ? visibleEntries 
    : entries.slice(0, maxVisibleItems).map((entry, index) => ({
        entry,
        index,
        top: 0
      }))

  // Enhanced timestamp formatting with caching
  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }, [])

  // Keyboard navigation manager
  const keyboardManager = useMemo(() => {
    return new KeyboardNavigationManager(
      displayEntries.length,
      setFocusedIndex,
      (index) => {
        const entry = displayEntries[index]?.entry
        if (entry && onSelect) {
          setSelectedIndex(index)
          onSelect(entry)
        }
      },
      () => setFocusedIndex(-1)
    )
  }, [displayEntries.length, onSelect, displayEntries])

  // Update keyboard manager when entries change
  useEffect(() => {
    keyboardManager.updateMaxIndex(displayEntries.length)
  }, [displayEntries.length, keyboardManager])

  // Enhanced keyboard handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!CONFIG.ui.keyboardNavigationEnabled) return
    
    const handled = keyboardManager.handleKeyDown(event)
    if (handled && CONFIG.features.performanceMonitoringEnabled) {
      performanceMonitor.record({
        operationName: 'history_keyboard_navigation',
        duration: 0,
        memoryUsed: 0,
        timestamp: Date.now(),
        success: true,
        metadata: { key: event.key, focusedIndex }
      })
    }
  }, [keyboardManager, focusedIndex])

  // Enhanced selection handling
  const handleSelect = useCallback((entry: QueryHistoryEntry) => {
    const timer = new PrecisionTimer()
    
    try {
      onSelect?.(entry)
      timer.stop('history_item_select', true)
    } catch (error) {
      timer.stop('history_item_select', false)
      console.error('Error selecting history item:', error)
    }
  }, [onSelect])

  // Enhanced deletion handling
  const handleDelete = useCallback(async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const timer = new PrecisionTimer()
    
    try {
      await onDelete?.(id)
      timer.stop('history_item_delete', true)
    } catch (error) {
      timer.stop('history_item_delete', false)
      console.error('Error deleting history item:', error)
    }
  }, [onDelete])

  // Enhanced clear handling
  const handleClear = useCallback(async () => {
    const timer = new PrecisionTimer()
    
    try {
      await onClear?.()
      timer.stop('history_clear_all', true)
    } catch (error) {
      timer.stop('history_clear_all', false)
      console.error('Error clearing history:', error)
    }
  }, [onClear])

  // Scroll handling for virtual scrolling
  const handleScroll = useCallback((position: { y: number }) => {
    if (shouldUseVirtualScrolling) {
      setScrollTop(position.y)
    }
  }, [shouldUseVirtualScrolling])

  // Performance monitoring for renders
  useEffect(() => {
    if (CONFIG.features.performanceMonitoringEnabled) {
      renderTimerRef.current = new PrecisionTimer()
      
      return () => {
        renderTimerRef.current?.stop('expandable_history_render', true)
      }
    }
  })

  // Error boundary integration
  useEffect(() => {
    const handleError = createErrorBoundaryHandler('ExpandableHistory')
    window.addEventListener('error', (event) => {
      if (containerRef.current?.contains(event.target as Node)) {
        handleError(event.error, { componentStack: '' })
      }
    })
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <Paper p="md" withBorder className={className}>
        <Group justify="center" data-testid="history-loading">
          <Loader size="sm" />
          <Text size="sm">Loading history...</Text>
        </Group>
      </Paper>
    )
  }

  // Error state
  if (error) {
    return (
      <Paper p="md" withBorder className={className}>
        <Alert 
          icon={<IconAlertTriangle size={16} />} 
          color="red"
          data-testid="history-error"
        >
          {error.message}
        </Alert>
      </Paper>
    )
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <Paper p="md" withBorder className={className}>
        <Stack align="center" gap="xs">
          <IconSearch size={32} style={{ opacity: 0.5 }} />
          <Text size="sm" c="dimmed" ta="center">
            No query history available
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Your search queries will appear here
          </Text>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper 
      ref={containerRef}
      p="md" 
      withBorder 
      className={className}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-testid="expandable-history"
      role="region"
      aria-label="Query history"
    >
      <Stack gap="sm">
        {/* Header with expand/collapse */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Collapse history' : 'Expand history'}
            >
              {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
            <Text 
              size="sm" 
              fw={500}
              data-testid="history-header"
            >
              Recent Queries ({entries.length})
            </Text>
          </Group>
          
          {onClear && entries.length > 0 && (
            <Tooltip label="Clear all history">
              <ActionIcon
                variant="subtle"
                size="sm"
                color="red"
                onClick={handleClear}
                data-testid="clear-history"
                aria-label="Clear all history"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* History list with virtual scrolling */}
        <Transition
          mounted={expanded}
          transition={ANIMATION_VARIANTS.slideIn}
          duration={CONFIG.ui.animationDuration}
          timingFunction="ease-out"
        >
          {(styles) => (
            <Box style={styles}>
              {shouldUseVirtualScrolling ? (
                <ScrollArea
                  h={virtualConfig.containerHeight}
                  onScrollPositionChange={handleScroll}
                  scrollbarSize={8}
                >
                  <Box style={{ height: totalHeight, position: 'relative' }}>
                    {visibleEntries.map(({ entry, index, top }) => (
                      <Box
                        key={entry.id}
                        style={{
                          position: 'absolute',
                          top,
                          left: 0,
                          right: 0,
                          height: virtualConfig.itemHeight
                        }}
                      >
                        <HistoryItem
                          entry={entry}
                          index={index}
                          isSelected={selectedIndex === index}
                          isFocused={focusedIndex === index}
                          onSelect={handleSelect}
                          onDelete={handleDelete}
                          formatTimestamp={formatTimestamp}
                        />
                      </Box>
                    ))}
                  </Box>
                </ScrollArea>
              ) : (
                <Stack gap="xs" style={{ maxHeight: virtualConfig.containerHeight, overflow: 'auto' }}>
                  {displayEntries.map(({ entry, index }) => (
                    <HistoryItem
                      key={entry.id}
                      entry={entry}
                      index={index}
                      isSelected={selectedIndex === index}
                      isFocused={focusedIndex === index}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      formatTimestamp={formatTimestamp}
                    />
                  ))}
                </Stack>
              )}

              {entries.length > maxVisibleItems && !shouldUseVirtualScrolling && (
                <Text size="xs" c="dimmed" ta="center" mt="xs">
                  Showing {maxVisibleItems} of {entries.length} entries
                </Text>
              )}
            </Box>
          )}
        </Transition>
      </Stack>
    </Paper>
  )
})

ExpandableHistory.displayName = 'ExpandableHistory'
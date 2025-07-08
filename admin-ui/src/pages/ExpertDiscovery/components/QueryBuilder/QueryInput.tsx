import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Paper,
  Stack,
  Text,
  Textarea,
  Button,
  Group,
  Badge,
  Alert,
  Loader,
  Progress,
  ActionIcon,
  Tooltip
} from '@mantine/core'
import { IconSearch, IconClearAll, IconAlertTriangle, IconHistory, IconX } from '@tabler/icons-react'
import type { QueryInputProps } from '../../types'
import type { QueryParameters } from '../../types'
import { 
  VALIDATION_RULES, 
  UI_CONFIG 
} from '../../constants'
import { 
  validateQuery, 
  truncateText, 
  debounce 
} from '../../utils'
import { useQueryHistory } from '../../hooks/useQueryHistory'
import { ExpandableHistory } from '../QueryHistory/ExpandableHistory'

interface ExtendedQueryInputProps extends QueryInputProps {
  onParametersChange?: (parameters: QueryParameters) => void
  value?: string
  onChange?: (value: string) => void
  onSubmit?: () => void
  debounceMs?: number
}

export function QueryInput({ 
  onQueryChange, 
  onSearch, 
  onParametersChange,
  value: controlledValue,
  onChange,
  onSubmit,
  debounceMs = 150,
  isLoading = false, 
  error = null,
  placeholder = "Enter your expert discovery query here...",
  maxLength = VALIDATION_RULES.queryMaxLength
}: ExtendedQueryInputProps) {
  const [query, setQuery] = useState(controlledValue || '')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Use query history hook
  const { entries, isLoading: historyLoading, error: historyError, addEntry, removeEntry, clearHistory } = useQueryHistory()

  // Update local state when controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setQuery(controlledValue)
    }
  }, [controlledValue])

  // Debounced query change to improve performance
  const debouncedOnQueryChange = useMemo(
    () => onQueryChange ? debounce(onQueryChange, debounceMs) : undefined,
    [onQueryChange, debounceMs]
  )

  const handleQueryChange = useCallback((value: string) => {
    // Sanitize input to prevent XSS
    const sanitized = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                          .replace(/[\u0000\uFFFE]/g, '')
    
    // Truncate if exceeds max length
    const truncated = sanitized.length > maxLength ? sanitized.slice(0, maxLength) : sanitized
    
    setQuery(truncated)
    
    // Validate query
    const errors = validateQuery(truncated)
    setValidationErrors(errors)
    
    // Call debounced callback only if no validation errors
    if (errors.length === 0) {
      debouncedOnQueryChange?.(truncated)
    }
    
    // Call controlled component callback
    onChange?.(truncated)
  }, [debouncedOnQueryChange, onChange, maxLength])

  const handleSearch = useCallback(async () => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setValidationErrors(['Query cannot be empty'])
      return
    }
    
    if (validationErrors.length === 0) {
      onSearch?.(trimmedQuery)
      onSubmit?.()
      
      // Add to history with basic parameters (will be enhanced later)
      const basicParameters: QueryParameters = {
        algorithm: 'hybrid',
        maxResults: 10,
        includeInactive: false,
        confidenceThreshold: 0.8,
        technologies: [],
        experienceLevel: 'senior',
        teamSize: 1
      }
      
      try {
        await addEntry(trimmedQuery, basicParameters, { success: true })
      } catch (error) {
        console.warn('Failed to add query to history:', error)
      }
    }
  }, [query, onSearch, onSubmit, validationErrors, addEntry])

  const handleClear = useCallback(() => {
    setQuery('')
    setValidationErrors([])
    onQueryChange?.('')
    onChange?.('')
  }, [onQueryChange, onChange])

  const handleHistorySelect = useCallback((entry) => {
    setQuery(entry.query)
    setValidationErrors([])
    onQueryChange?.(entry.query)
    onChange?.(entry.query)
    onParametersChange?.(entry.parameters)
    setShowHistory(false)
  }, [onQueryChange, onChange, onParametersChange])

  const handleHistoryDelete = useCallback(async (id: string) => {
    try {
      await removeEntry(id)
    } catch (error) {
      console.warn('Failed to delete history entry:', error)
    }
  }, [removeEntry])

  const handleHistoryClear = useCallback(async () => {
    try {
      await clearHistory()
      setShowHistory(false)
    } catch (error) {
      console.warn('Failed to clear history:', error)
    }
  }, [clearHistory])

  // Handle Enter key for search and escape for history
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' && event.ctrlKey) || (event.key === 'Enter' && event.metaKey)) {
      event.preventDefault()
      handleSearch()
    } else if (event.key === 'Escape' && showHistory) {
      event.preventDefault()
      setShowHistory(false)
    }
  }, [handleSearch, showHistory])

  // Handle paste events with large text gracefully
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    const pastedText = event.clipboardData.getData('text/plain')
    if (pastedText.length > maxLength) {
      event.preventDefault()
      const truncated = pastedText.slice(0, maxLength)
      handleQueryChange(truncated)
    }
  }, [maxLength, handleQueryChange])

  // Character count and progress
  const characterCount = useMemo(() => query.length, [query])
  const characterProgress = useMemo(() => (characterCount / maxLength) * 100, [characterCount, maxLength])
  const isNearLimit = characterProgress > 80

  // Show history button only if there are entries
  const shouldShowHistoryButton = entries.length > 0

  return (
    <Paper p={UI_CONFIG.paperPadding} withBorder>
      <Stack gap={UI_CONFIG.stackGap}>
        <Group justify="space-between" align="center">
          <Text fw={500} size="lg">Query Input</Text>
          {shouldShowHistoryButton && (
            <Tooltip label="Toggle query history">
              <ActionIcon 
                variant="subtle" 
                onClick={() => setShowHistory(!showHistory)}
                size="sm"
                aria-label="Toggle query history"
              >
                <IconHistory size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        
        {(error || validationErrors.length > 0) && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red">
            {error || validationErrors.join(', ')}
          </Alert>
        )}

        <Stack gap="xs">
          <Textarea
            placeholder={placeholder}
            value={controlledValue !== undefined ? controlledValue : query}
            onChange={(e) => handleQueryChange(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={4}
            autosize
            disabled={isLoading}
            maxLength={maxLength}
            error={validationErrors.length > 0}
            aria-label="Expert discovery query input"
            aria-describedby="query-helper-text"
            aria-required="true"
          />
          <Text 
            size="xs" 
            c="dimmed" 
            id="query-helper-text"
            aria-live="polite"
          >
            {characterCount}/{maxLength} characters (Ctrl+Enter to submit)
          </Text>
          
          {isNearLimit && (
            <Progress 
              value={characterProgress} 
              color={characterProgress > 95 ? 'red' : 'orange'}
              size="xs"
            />
          )}
        </Stack>

        <Group justify="space-between">
          <Button
            variant="outline"
            leftSection={<IconClearAll size={16} />}
            onClick={handleClear}
            disabled={!query || isLoading}
            size="sm"
          >
            Clear
          </Button>
          
          <Button
            leftSection={isLoading ? <Loader size={16} /> : <IconSearch size={16} />}
            onClick={handleSearch}
            disabled={!query.trim() || isLoading || validationErrors.length > 0}
            loading={isLoading}
          >
            Search Experts
          </Button>
        </Group>

        {showHistory && (
          <ExpandableHistory
            entries={entries}
            isLoading={historyLoading}
            error={historyError}
            onSelect={handleHistorySelect}
            onDelete={handleHistoryDelete}
            onClear={handleHistoryClear}
            maxVisibleItems={20}
          />
        )}
      </Stack>
    </Paper>
  )
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedQueryInput = React.memo(QueryInput)
export default MemoizedQueryInput
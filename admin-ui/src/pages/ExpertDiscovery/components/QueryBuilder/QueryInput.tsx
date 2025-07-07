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
import { 
  VALIDATION_RULES, 
  UI_CONFIG 
} from '../../constants'
import { 
  validateQuery, 
  truncateText, 
  debounce 
} from '../../utils'

export function QueryInput({ 
  onQueryChange, 
  onSearch, 
  isLoading = false, 
  error = null,
  placeholder = "Enter your expert discovery query here...",
  maxLength = VALIDATION_RULES.queryMaxLength
}: QueryInputProps) {
  const [query, setQuery] = useState('')
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Debounced query change to improve performance
  const debouncedOnQueryChange = useMemo(
    () => onQueryChange ? debounce(onQueryChange, 150) : undefined,
    [onQueryChange]
  )

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    
    // Validate query
    const errors = validateQuery(value)
    setValidationErrors(errors)
    
    // Call debounced callback only if no validation errors
    if (errors.length === 0) {
      debouncedOnQueryChange?.(value)
    }
  }, [debouncedOnQueryChange])

  const handleSearch = useCallback(() => {
    const trimmedQuery = query.trim()
    if (trimmedQuery && validationErrors.length === 0) {
      onSearch?.(trimmedQuery)
      setQueryHistory(prev => {
        const updated = [trimmedQuery, ...prev.filter(q => q !== trimmedQuery)]
        return updated.slice(0, UI_CONFIG.maxQueryHistoryItems)
      })
    }
  }, [query, onSearch, validationErrors])

  const handleClear = useCallback(() => {
    setQuery('')
    setValidationErrors([])
    onQueryChange?.('')
  }, [onQueryChange])

  const handleHistorySelect = useCallback((historyQuery: string) => {
    setQuery(historyQuery)
    setValidationErrors([])
    onQueryChange?.(historyQuery)
    setShowHistory(false)
  }, [onQueryChange])

  const handleHistoryRemove = useCallback((indexToRemove: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setQueryHistory(prev => prev.filter((_, index) => index !== indexToRemove))
  }, [])

  const clearHistory = useCallback(() => {
    setQueryHistory([])
    setShowHistory(false)
  }, [])

  // Handle Enter key for search
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSearch()
    }
  }, [handleSearch])

  // Character count and progress
  const characterCount = useMemo(() => query.length, [query])
  const characterProgress = useMemo(() => (characterCount / maxLength) * 100, [characterCount, maxLength])
  const isNearLimit = characterProgress > 80

  // Memoized history items
  const historyItems = useMemo(() => 
    queryHistory.map((historyQuery, index) => ({
      id: `${historyQuery}-${index}`,
      query: historyQuery,
      truncated: truncateText(historyQuery, 30),
      index
    })),
    [queryHistory]
  )

  return (
    <Paper p={UI_CONFIG.paperPadding} withBorder>
      <Stack gap={UI_CONFIG.stackGap}>
        <Group justify="space-between" align="center">
          <Text fw={500} size="lg">Query Input</Text>
          {queryHistory.length > 0 && (
            <Group gap="xs">
              <Tooltip label="Toggle query history">
                <ActionIcon 
                  variant="subtle" 
                  onClick={() => setShowHistory(!showHistory)}
                  size="sm"
                >
                  <IconHistory size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Clear history">
                <ActionIcon 
                  variant="subtle" 
                  color="red" 
                  onClick={clearHistory}
                  size="sm"
                >
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
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
            value={query}
            onChange={(e) => handleQueryChange(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            minRows={3}
            maxRows={6}
            autosize
            disabled={isLoading}
            maxLength={maxLength}
            error={validationErrors.length > 0}
            description={`${characterCount}/${maxLength} characters • Ctrl+Enter to search`}
          />
          
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

        {showHistory && historyItems.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>Recent Queries:</Text>
            <Group gap="xs">
              {historyItems.map((item) => (
                <Badge
                  key={item.id}
                  variant="light"
                  style={{ cursor: 'pointer', position: 'relative' }}
                  onClick={() => handleHistorySelect(item.query)}
                  pr={20}
                >
                  {item.truncated}
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    style={{ 
                      position: 'absolute', 
                      right: 2, 
                      top: '50%', 
                      transform: 'translateY(-50%)' 
                    }}
                    onClick={(e) => handleHistoryRemove(item.index, e)}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                </Badge>
              ))}
            </Group>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedQueryInput = React.memo(QueryInput)
export default MemoizedQueryInput
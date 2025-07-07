import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Paper,
  Stack,
  Text,
  Select,
  NumberInput,
  Switch,
  Group,
  Slider,
  Badge,
  MultiSelect,
  Grid,
  Skeleton
} from '@mantine/core'
import type { QueryParametersProps, QueryParameters } from '../../types'
import { 
  DEFAULT_QUERY_PARAMETERS,
  ALGORITHM_OPTIONS,
  TECHNOLOGY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  VALIDATION_RULES,
  CONFIDENCE_SLIDER_MARKS,
  UI_CONFIG
} from '../../constants'
import { 
  validateQueryParameters, 
  formatConfidencePercentage, 
  mergeQueryParameters,
  debounce
} from '../../utils'

export function QueryParameters({ 
  onParametersChange, 
  initialParameters,
  disabled = false 
}: QueryParametersProps) {
  const [parameters, setParameters] = useState<QueryParameters>(() => 
    initialParameters 
      ? mergeQueryParameters(DEFAULT_QUERY_PARAMETERS, initialParameters)
      : DEFAULT_QUERY_PARAMETERS
  )
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Debounced parameter change callback to improve performance
  const debouncedOnParametersChange = useMemo(
    () => onParametersChange ? debounce(onParametersChange, 300) : undefined,
    [onParametersChange]
  )

  const updateParameter = useCallback(<K extends keyof QueryParameters>(
    key: K,
    value: QueryParameters[K]
  ) => {
    const newParameters = { ...parameters, [key]: value }
    setParameters(newParameters)
    
    // Validate parameters
    const errors = validateQueryParameters(newParameters)
    setValidationErrors(errors)
    
    // Call debounced callback only if no validation errors
    if (errors.length === 0) {
      debouncedOnParametersChange?.(newParameters)
    }
  }, [parameters, debouncedOnParametersChange])

  // Handle initial parameters changes
  useEffect(() => {
    if (initialParameters) {
      const merged = mergeQueryParameters(DEFAULT_QUERY_PARAMETERS, initialParameters)
      setParameters(merged)
    }
  }, [initialParameters])

  // Memoized parameter summary for performance
  const parameterSummary = useMemo(() => {
    const techCount = parameters.technologies.length
    const confidencePercent = formatConfidencePercentage(parameters.confidenceThreshold)
    
    return {
      algorithm: parameters.algorithm,
      maxResults: parameters.maxResults,
      confidencePercent,
      techCount,
      techLabel: techCount === 1 ? 'tech' : 'techs'
    }
  }, [parameters])

  // Loading skeleton for async technology options
  const [isLoadingTechnologies, setIsLoadingTechnologies] = useState(false)

  const ParameterSkeleton = () => (
    <Skeleton height={60} radius="md" />
  )

  if (isLoadingTechnologies) {
    return (
      <Paper p={UI_CONFIG.paperPadding} withBorder>
        <Stack gap={UI_CONFIG.stackGap}>
          <Text fw={500} size="lg">Query Parameters</Text>
          <ParameterSkeleton />
          <ParameterSkeleton />
          <ParameterSkeleton />
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper p={UI_CONFIG.paperPadding} withBorder>
      <Stack gap={UI_CONFIG.stackGap}>
        <Text fw={500} size="lg">Query Parameters</Text>
        
        {validationErrors.length > 0 && (
          <Text c="red" size="sm">
            {validationErrors.join(', ')}
          </Text>
        )}
        
        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Search Algorithm"
              description="Choose the discovery algorithm to use"
              data={ALGORITHM_OPTIONS}
              value={parameters.algorithm}
              onChange={(value) => value && updateParameter('algorithm', value as any)}
              disabled={disabled}
              clearable={false}
            />
          </Grid.Col>
          
          <Grid.Col span={6}>
            <NumberInput
              label="Max Results"
              description="Maximum number of experts to return"
              value={parameters.maxResults}
              onChange={(value) => typeof value === 'number' && updateParameter('maxResults', value)}
              min={VALIDATION_RULES.maxResults.min}
              max={VALIDATION_RULES.maxResults.max}
              disabled={disabled}
              error={validationErrors.find(err => err.includes('Max results'))}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Experience Level"
              description="Filter by expert experience level"
              data={EXPERIENCE_LEVEL_OPTIONS}
              value={parameters.experienceLevel}
              onChange={(value) => value && updateParameter('experienceLevel', value)}
              disabled={disabled}
              clearable={false}
            />
          </Grid.Col>
          
          <Grid.Col span={6}>
            <NumberInput
              label="Team Size"
              description="Number of experts needed for the team"
              value={parameters.teamSize}
              onChange={(value) => typeof value === 'number' && updateParameter('teamSize', value)}
              min={VALIDATION_RULES.teamSize.min}
              max={VALIDATION_RULES.teamSize.max}
              disabled={disabled}
              error={validationErrors.find(err => err.includes('Team size'))}
            />
          </Grid.Col>
        </Grid>

        <MultiSelect
          label="Technology Stack"
          description="Filter experts by specific technologies"
          data={TECHNOLOGY_OPTIONS}
          value={parameters.technologies}
          onChange={(value) => updateParameter('technologies', value)}
          placeholder="Select technologies..."
          searchable
          clearable
          disabled={disabled}
          maxDropdownHeight={200}
        />

        <Stack gap="xs">
          <Group justify="space-between" align="end">
            <div>
              <Text size="sm" fw={500}>
                Confidence Threshold
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                Minimum confidence score required for expert matches
              </Text>
            </div>
            <Badge variant="light" color="orange" size="lg">
              {parameterSummary.confidencePercent}
            </Badge>
          </Group>
          <Slider
            value={parameters.confidenceThreshold}
            onChange={(value) => updateParameter('confidenceThreshold', value)}
            min={VALIDATION_RULES.confidenceThreshold.min}
            max={VALIDATION_RULES.confidenceThreshold.max}
            step={VALIDATION_RULES.confidenceThreshold.step}
            marks={CONFIDENCE_SLIDER_MARKS}
            disabled={disabled}
            mt="md"
            mb="sm"
          />
        </Stack>

        <Group>
          <Switch
            label="Include Inactive Experts"
            description="Include experts who are currently inactive"
            checked={parameters.includeInactive}
            onChange={(event) => updateParameter('includeInactive', event.currentTarget.checked)}
            disabled={disabled}
          />
        </Group>

        <Group gap="xs">
          <Text size="sm" fw={500}>Current Parameters:</Text>
          <Badge variant="light" color="blue">{parameterSummary.algorithm}</Badge>
          <Badge variant="light" color="green">Max: {parameterSummary.maxResults}</Badge>
          <Badge variant="light" color="orange">
            Confidence: {parameterSummary.confidencePercent}
          </Badge>
          {parameterSummary.techCount > 0 && (
            <Badge variant="light" color="grape">
              {parameterSummary.techCount} {parameterSummary.techLabel}
            </Badge>
          )}
        </Group>
      </Stack>
    </Paper>
  )
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedQueryParameters = React.memo(QueryParameters)
export default MemoizedQueryParameters
import { useState } from 'react'
import {
  Paper,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Progress,
  Collapse,
  Grid,
  ThemeIcon,
  Tooltip,
  ActionIcon
} from '@mantine/core'
import {
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconBrain,
  IconHistory,
  IconTarget,
  IconNetwork,
  IconDatabase,
  IconInfoCircle
} from '@tabler/icons-react'
import type { Expert } from '../types'

interface ExpertCardProps {
  expert: Expert
  onViewDetails: (expert: Expert) => void
}

const scoreMetrics = [
  { key: 'technology_match', label: 'Technology Match', icon: IconCode, color: 'blue' },
  { key: 'semantic_similarity', label: 'Semantic Similarity', icon: IconBrain, color: 'indigo' },
  { key: 'workflow_compatibility', label: 'Workflow Compatibility', icon: IconTarget, color: 'green' },
  { key: 'performance_history', label: 'Performance History', icon: IconHistory, color: 'orange' },
  { key: 'capability_assessment', label: 'Capability Assessment', icon: IconDatabase, color: 'teal' },
  { key: 'graph_connectivity', label: 'Graph Connectivity', icon: IconNetwork, color: 'grape' }
]

export function ExpertCard({ expert, onViewDetails }: ExpertCardProps) {
  const [showScores, setShowScores] = useState(false)

  return (
    <Paper p="md" radius="sm" withBorder>
      <Group justify="space-between" mb="xs">
        <div>
          <Group gap="xs" align="center">
            <Text fw={600} size="lg">{expert.name}</Text>
            {!expert.active && (
              <Badge color="gray" variant="filled" size="xs">
                Inactive
              </Badge>
            )}
            {expert.experience_level && (
              <Badge 
                color={
                  expert.experience_level === 'expert' ? 'violet' :
                  expert.experience_level === 'senior' ? 'blue' :
                  expert.experience_level === 'mid' ? 'green' : 'gray'
                } 
                variant="light" 
                size="sm"
              >
                {expert.experience_level.charAt(0).toUpperCase() + expert.experience_level.slice(1)}
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">{expert.id}</Text>
        </div>
        <Group gap="xs">
          <Stack gap={4} align="end">
            <Text size="xs" c="dimmed">Confidence</Text>
            <Group gap={4}>
              <Text fw={600} size="sm">
                {(expert.confidence * 100).toFixed(0)}%
              </Text>
              <Progress 
                value={expert.confidence * 100} 
                color={expert.confidence >= 0.8 ? 'green' : expert.confidence >= 0.6 ? 'yellow' : 'red'}
                size="sm"
                style={{ width: 60 }}
              />
            </Group>
          </Stack>
          <Button
            variant="light"
            size="sm"
            onClick={() => onViewDetails(expert)}
          >
            View Details
          </Button>
        </Group>
      </Group>
      
      <Text size="sm" mb="sm">{expert.description}</Text>
      
      <Group gap="xs" mb="sm">
        {expert.domains.map((domain) => (
          <Badge key={domain} variant="light" size="sm">
            {domain}
          </Badge>
        ))}
      </Group>
      
      {expert.specializations.length > 0 && (
        <Group gap="xs" mb={expert.scores ? 'sm' : 0}>
          <Text size="xs" c="dimmed">Technologies:</Text>
          {expert.specializations.map((spec, index) => (
            <Badge key={index} color="blue" variant="dot" size="sm">
              {spec.technology} ({spec.expertise_level})
            </Badge>
          ))}
        </Group>
      )}
      
      {expert.scores && (
        <>
          <Button
            variant="subtle"
            size="xs"
            leftSection={showScores ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            onClick={() => setShowScores(!showScores)}
            fullWidth
            mt="sm"
          >
            {showScores ? 'Hide' : 'Show'} Detailed Scores
          </Button>
          
          <Collapse in={showScores}>
            <Paper p="sm" mt="xs" bg="gray.0" radius="sm">
              <Group gap="xs" mb="xs">
                <Text size="sm" fw={600}>Score Breakdown</Text>
                <Tooltip label="These scores show how well the expert matches your query across different dimensions">
                  <ThemeIcon size="sm" variant="light" color="gray">
                    <IconInfoCircle size={14} />
                  </ThemeIcon>
                </Tooltip>
              </Group>
              
              <Grid gutter="xs">
                {scoreMetrics.map(({ key, label, icon: Icon, color }) => {
                  const score = expert.scores[key as keyof typeof expert.scores] || 0
                  return (
                    <Grid.Col key={key} span={6}>
                      <Group gap={8} wrap="nowrap">
                        <ThemeIcon size="sm" variant="light" color={color}>
                          <Icon size={14} />
                        </ThemeIcon>
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Group justify="space-between" gap={4}>
                            <Text size="xs" c="dimmed">{label}</Text>
                            <Text size="xs" fw={600}>{(score * 100).toFixed(0)}%</Text>
                          </Group>
                          <Progress 
                            value={score * 100} 
                            size="xs" 
                            color={color}
                          />
                        </Stack>
                      </Group>
                    </Grid.Col>
                  )
                })}
              </Grid>
            </Paper>
          </Collapse>
        </>
      )}
    </Paper>
  )
}
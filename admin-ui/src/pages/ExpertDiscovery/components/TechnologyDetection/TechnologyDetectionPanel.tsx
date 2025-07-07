/**
 * Technology Detection Panel Component
 * Lazy-loaded panel for technology stack detection functionality
 */

import React from 'react'
import { Paper, Stack, Text, Alert, Progress } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { UI_CONFIG } from '../../constants'

export function TechnologyDetectionPanel() {
  return (
    <Paper p={UI_CONFIG.paperPadding} withBorder>
      <Stack gap={UI_CONFIG.stackGap}>
        <Text fw={500} size="lg">Technology Detection</Text>
        
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          Technology Detection functionality is currently under development. 
          This feature will allow automatic detection of technology stacks from code repositories, 
          project descriptions, and expert profiles.
        </Alert>
        
        <Stack gap="xs">
          <Text size="sm" fw={500}>Planned Features:</Text>
          <Text component="ul" size="sm">
            <li>Automatic technology stack detection from GitHub repositories</li>
            <li>Code analysis for framework and library identification</li>
            <li>Expert skill inference from project history</li>
            <li>Technology trend analysis and recommendations</li>
            <li>Integration with expert discovery algorithms</li>
          </Text>
        </Stack>
        
        <Stack gap="xs">
          <Text size="sm" fw={500}>Development Progress:</Text>
          <Stack gap="xs">
            <div>
              <Text size="xs" c="dimmed">API Integration (75%)</Text>
              <Progress value={75} color="blue" size="sm" />
            </div>
            <div>
              <Text size="xs" c="dimmed">UI Components (30%)</Text>
              <Progress value={30} color="orange" size="sm" />
            </div>
            <div>
              <Text size="xs" c="dimmed">Testing Suite (10%)</Text>
              <Progress value={10} color="red" size="sm" />
            </div>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default TechnologyDetectionPanel
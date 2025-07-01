import { Stack, Card, Text, Switch, NumberInput, TextInput, Button, Group } from '@mantine/core'
import { useState } from 'react'

export function Settings() {
  const [settings, setSettings] = useState({
    enableRealtime: true,
    cacheExpiry: 300,
    maxExperts: 100,
    apiTimeout: 30,
    embedModel: 'all-MiniLM-L6-v2',
    neo4jUri: 'bolt://localhost:7687',
  })

  const handleSave = () => {
    console.log('Save settings:', settings)
    // TODO: Implement save
  }

  return (
    <Stack>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={500}>General Settings</Text>
        </Card.Section>
        <Card.Section p="md">
          <Stack>
            <Switch
              label="Enable real-time updates"
              checked={settings.enableRealtime}
              onChange={(event) => 
                setSettings({ ...settings, enableRealtime: event.currentTarget.checked })
              }
            />
            <NumberInput
              label="Cache expiry (seconds)"
              value={settings.cacheExpiry}
              onChange={(value) => 
                setSettings({ ...settings, cacheExpiry: Number(value) || 300 })
              }
              min={60}
              max={3600}
            />
            <NumberInput
              label="Maximum experts to display"
              value={settings.maxExperts}
              onChange={(value) => 
                setSettings({ ...settings, maxExperts: Number(value) || 100 })
              }
              min={10}
              max={500}
            />
          </Stack>
        </Card.Section>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={500}>API Configuration</Text>
        </Card.Section>
        <Card.Section p="md">
          <Stack>
            <NumberInput
              label="API timeout (seconds)"
              value={settings.apiTimeout}
              onChange={(value) => 
                setSettings({ ...settings, apiTimeout: Number(value) || 30 })
              }
              min={5}
              max={120}
            />
            <TextInput
              label="Embedding model"
              value={settings.embedModel}
              onChange={(event) => 
                setSettings({ ...settings, embedModel: event.currentTarget.value })
              }
            />
            <TextInput
              label="Neo4j URI"
              value={settings.neo4jUri}
              onChange={(event) => 
                setSettings({ ...settings, neo4jUri: event.currentTarget.value })
              }
            />
          </Stack>
        </Card.Section>
      </Card>

      <Group justify="flex-end">
        <Button variant="outline">Reset to defaults</Button>
        <Button onClick={handleSave}>Save changes</Button>
      </Group>
    </Stack>
  )
}
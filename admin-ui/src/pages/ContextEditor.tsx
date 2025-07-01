import { useState } from 'react'
import { Grid, Card, ScrollArea, NavLink, Text, Group, Button, Stack } from '@mantine/core'
import { IconFile } from '@tabler/icons-react'
import Editor from '@monaco-editor/react'

export function ContextEditor() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  // Mock data - would come from API
  const contextFiles = [
    { id: 'aws-amplify-gen2', name: 'aws-amplify-gen2.md' },
    { id: 'react-native', name: 'react-native.md' },
    { id: 'fastapi', name: 'fastapi.md' },
  ]

  const handleSave = () => {
    // TODO: Implement save
    console.log('Save context:', selectedFile, content)
    setHasChanges(false)
  }

  return (
    <Grid>
      <Grid.Col span={3}>
        <ScrollArea h="calc(100vh - 200px)">
          <NavLink
            label="Expert Context Files"
            childrenOffset={28}
            defaultOpened
          >
            {contextFiles.map((file) => (
              <NavLink
                key={file.id}
                label={file.name}
                active={selectedFile === file.id}
                onClick={() => setSelectedFile(file.id)}
                leftSection={<IconFile size={16} />}
              />
            ))}
          </NavLink>
        </ScrollArea>
      </Grid.Col>
      
      <Grid.Col span={9}>
        {selectedFile ? (
          <Card h="calc(100vh - 200px)">
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Text fw={500}>{contextFiles.find(f => f.id === selectedFile)?.name}</Text>
                <Group>
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={handleSave}
                    disabled={!hasChanges}
                  >
                    Save
                  </Button>
                </Group>
              </Group>
            </Card.Section>
            <Card.Section p="md" h="calc(100% - 50px)">
              <Editor
                height="100%"
                language="markdown"
                value={content}
                onChange={(value) => {
                  setContent(value || '')
                  setHasChanges(true)
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            </Card.Section>
          </Card>
        ) : (
          <Card h="calc(100vh - 200px)">
            <Stack h="100%" justify="center" align="center">
              <Text c="dimmed">Select a context file to edit</Text>
            </Stack>
          </Card>
        )}
      </Grid.Col>
    </Grid>
  )
}
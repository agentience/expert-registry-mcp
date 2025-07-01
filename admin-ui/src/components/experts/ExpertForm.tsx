import {
  TextInput,
  Textarea,
  MultiSelect,
  TagsInput,
  Stack,
  Group,
  Button,
  JsonInput,
  Accordion,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { Expert } from '../../types'

interface ExpertFormProps {
  expert?: Expert
  onSubmit: (values: any) => void
  onCancel: () => void
}

export function ExpertForm({ expert, onSubmit, onCancel }: ExpertFormProps) {
  const form = useForm({
    initialValues: {
      id: expert?.id || '',
      name: expert?.name || '',
      version: expert?.version || '1.0.0',
      description: expert?.description || '',
      domains: expert?.domains || [],
      specializations: expert?.specializations || [
        {
          technology: '',
          frameworks: [],
          expertise_level: 'intermediate',
        },
      ],
      workflow_compatibility: expert?.workflow_compatibility || {
        feature: 0.8,
        'bug-fix': 0.8,
        refactoring: 0.7,
        investigation: 0.6,
        article: 0.5,
      },
      constraints: expert?.constraints || [],
      patterns: expert?.patterns || [],
      quality_standards: expert?.quality_standards || [],
    },

    validate: {
      id: (value) => {
        if (!value) return 'ID is required'
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'ID must contain only lowercase letters, numbers, and hyphens'
        }
        return null
      },
      name: (value) => (!value ? 'Name is required' : null),
      domains: (value) => (value.length === 0 ? 'At least one domain is required' : null),
    },
  })

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Expert ID"
          placeholder="aws-amplify-gen2"
          description="Unique identifier for the expert (lowercase, hyphens allowed)"
          {...form.getInputProps('id')}
          disabled={!!expert}
        />

        <TextInput
          label="Name"
          placeholder="AWS Amplify Gen 2 Expert"
          {...form.getInputProps('name')}
        />

        <TextInput
          label="Version"
          placeholder="1.0.0"
          {...form.getInputProps('version')}
        />

        <Textarea
          label="Description"
          placeholder="Expert in AWS Amplify Gen 2 development..."
          rows={3}
          {...form.getInputProps('description')}
        />

        <MultiSelect
          label="Domains"
          placeholder="Select domains"
          data={[
            'backend',
            'frontend',
            'cloud',
            'mobile',
            'serverless',
            'database',
            'devops',
            'security',
          ]}
          {...form.getInputProps('domains')}
        />

        <Accordion variant="contained">
          <Accordion.Item value="specializations">
            <Accordion.Control>Specializations</Accordion.Control>
            <Accordion.Panel>
              <JsonInput
                label="Specializations"
                placeholder='[{"technology": "AWS Amplify", "frameworks": ["CDK"], "expertise_level": "expert"}]'
                formatOnBlur
                autosize
                minRows={4}
                {...form.getInputProps('specializations')}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="workflow">
            <Accordion.Control>Workflow Compatibility</Accordion.Control>
            <Accordion.Panel>
              <JsonInput
                label="Workflow Scores"
                placeholder='{"feature": 0.9, "bug-fix": 0.8, "refactoring": 0.7}'
                formatOnBlur
                autosize
                minRows={4}
                {...form.getInputProps('workflow_compatibility')}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="guidelines">
            <Accordion.Control>Guidelines</Accordion.Control>
            <Accordion.Panel>
              <Stack>
                <TagsInput
                  label="Constraints"
                  placeholder="Add constraints"
                  {...form.getInputProps('constraints')}
                />

                <TagsInput
                  label="Patterns"
                  placeholder="Add patterns"
                  {...form.getInputProps('patterns')}
                />

                <TagsInput
                  label="Quality Standards"
                  placeholder="Add quality standards"
                  {...form.getInputProps('quality_standards')}
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {expert ? 'Update' : 'Create'} Expert
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
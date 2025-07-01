import {
  Table,
  ScrollArea,
  TextInput,
  Badge,
  Group,
  ActionIcon,
  Progress,
  Text,
  Menu,
  rem,
} from '@mantine/core'
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconDots,
  IconEye,
  IconCopy,
} from '@tabler/icons-react'
import { useState } from 'react'
import { Expert } from '../../types'

interface ExpertTableProps {
  experts: Expert[]
  onEdit: (expert: Expert) => void
  onDelete: (expert: Expert) => void
  onView: (expert: Expert) => void
}

export function ExpertTable({ experts, onEdit, onDelete, onView }: ExpertTableProps) {
  const [search, setSearch] = useState('')

  const filteredExperts = experts.filter(
    (expert) =>
      expert.name.toLowerCase().includes(search.toLowerCase()) ||
      expert.id.toLowerCase().includes(search.toLowerCase()) ||
      expert.domains.some((d) => d.toLowerCase().includes(search.toLowerCase()))
  )

  const rows = filteredExperts.map((expert) => (
    <Table.Tr key={expert.id}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {expert.id}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{expert.name}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          {expert.domains.map((domain) => (
            <Badge key={domain} size="sm" variant="light">
              {domain}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Progress
            value={expert.performance_metrics?.success_rate || 0}
            size="sm"
            style={{ width: rem(60) }}
          />
          <Text size="sm">
            {expert.performance_metrics?.success_rate || 0}%
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {expert.performance_metrics?.total_applications || 0}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => onView(expert)}
          >
            <IconEye size={16} stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => onEdit(expert)}
          >
            <IconEdit size={16} stroke={1.5} />
          </ActionIcon>
          <Menu withinPortal position="bottom-end" shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={16} stroke={1.5} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={() => navigator.clipboard.writeText(expert.id)}
              >
                Copy ID
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={() => onDelete(expert)}
              >
                Delete expert
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <ScrollArea>
      <TextInput
        placeholder="Search experts..."
        mb="md"
        leftSection={<IconSearch size={16} stroke={1.5} />}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Expert ID</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Domains</Table.Th>
            <Table.Th>Success Rate</Table.Th>
            <Table.Th>Total Uses</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  )
}
import { AppShell, Burger, Group, Title, ActionIcon, useMantineColorScheme } from '@mantine/core'
import { IconSun, IconMoon } from '@tabler/icons-react'

interface AppHeaderProps {
  opened: boolean
  toggle: () => void
}

export function AppHeader({ opened, toggle }: AppHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Title order={3}>Expert Registry Admin</Title>
      </Group>
      <ActionIcon
        variant="outline"
        onClick={() => toggleColorScheme()}
        size="lg"
        radius="md"
      >
        {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Group>
  )
}
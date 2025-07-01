import { AppShell, Burger, Group, Text, useMantineTheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavigationMenu } from './NavigationMenu'
import { AppHeader } from './AppHeader'
import { Outlet } from 'react-router-dom'

export function MainLayout() {
  const theme = useMantineTheme()
  const [opened, { toggle }] = useDisclosure()

  return (
    <AppShell
      header={{ height: { base: 60 } }}
      navbar={{
        width: { base: 250 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <AppHeader opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavigationMenu />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          backgroundColor: theme.colorScheme === 'dark'
            ? theme.colors.dark[8]
            : theme.colors.gray[0],
        }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
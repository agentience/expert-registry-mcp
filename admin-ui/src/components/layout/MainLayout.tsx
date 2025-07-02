import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavigationMenu } from './NavigationMenu'
import { AppHeader } from './AppHeader'
import { Outlet } from 'react-router-dom'

export function MainLayout() {
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

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
import { NavLink } from '@mantine/core'
import {
  IconDashboard,
  IconUsers,
  IconFileText,
  IconChartBar,
  IconActivity,
  IconSearch,
  IconSettings,
  IconServerBolt,
} from '@tabler/icons-react'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { icon: IconDashboard, label: 'Dashboard', path: '/' },
  { icon: IconUsers, label: 'Experts', path: '/experts' },
  { icon: IconFileText, label: 'Context Editor', path: '/context' },
  { icon: IconChartBar, label: 'Analytics', path: '/analytics' },
  { icon: IconActivity, label: 'Performance', path: '/performance' },
  { icon: IconSearch, label: 'Expert Discovery', path: '/expert-discovery' },
  { icon: IconServerBolt, label: 'System Logs', path: '/logs' },
  { icon: IconSettings, label: 'Settings', path: '/settings' },
]

export function NavigationMenu() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          active={location.pathname === item.path}
          label={item.label}
          leftSection={<item.icon size={16} stroke={1.5} />}
          onClick={() => navigate(item.path)}
          mb={4}
        />
      ))}
    </>
  )
}
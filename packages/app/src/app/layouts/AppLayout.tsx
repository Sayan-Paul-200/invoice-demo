import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  AppShell, 
  Group, 
  Title, 
  ActionIcon, 
  useMantineColorScheme, 
  useComputedColorScheme,
  Avatar,
  Menu,
  rem,
  Paper,
  ThemeIcon,
  // Text,
  Box
} from '@mantine/core';
import { IconSun, IconMoon, IconLogout, IconLayoutDashboard } from '@tabler/icons-react';

import { Navbar } from '@components/Navbar/Navbar';
import { UserButton } from '@components/Navbar/UserButton';
import { tokenManager } from '@lib/axios';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarWidth = '200px';

  // --- Dark Mode Logic ---
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  // --- Dynamic Page Title Logic ---
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentPath = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : 'Home';
  const pageTitle = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  // --- Logout Logic ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const path = location.pathname;
    const roleFromPath = path.split('/')[1];
    const validRoles = ['admin', 'staff', 'accountant', 'other'];
    const storedRole = tokenManager.getCurrentRole();

    if (validRoles.includes(roleFromPath) && storedRole !== roleFromPath) {
      navigate('/not-found', { replace: true });
    }
  }, [location, navigate]);

  return (
    <AppShell>
      <AppShell.Navbar w={sidebarWidth}>
        <Navbar footerElement={<UserButton />} />
      </AppShell.Navbar>

      {/* Added bg prop here to give contrast to the white paper header */}
      <AppShell.Main pl={sidebarWidth} bg={isDark ? 'dark.8' : 'gray.0'}
      >
        <Box p="md">
        
        {/* --- MODIFIED: Header Section --- */}
        <Paper 
          shadow="xs" 
          radius="md" 
          p="md" 
          mb="lg" 
          bg={isDark ? 'dark.7' : 'white'} // Explicit white background in light mode
        >
          <Group justify="space-between" align="center">
            
            {/* Left side: Icon + Title */}
            <Group gap="sm">
              <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                <IconLayoutDashboard style={{ width: rem(20), height: rem(20) }} />
              </ThemeIcon>
              <Title order={3} size="h4">{pageTitle}</Title>
            </Group>

            {/* Right side: Actions */}
            <Group gap="sm">
              {/* Dark Mode Toggle */}
              <ActionIcon
                onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="Toggle color scheme"
              >
                <IconSun style={{ width: rem(20), height: rem(20), display: isDark ? 'block' : 'none' }} stroke={1.5} />
                <IconMoon style={{ width: rem(20), height: rem(20), display: isDark ? 'none' : 'block' }} stroke={1.5} />
              </ActionIcon>

              {/* Avatar & Logout Menu */}
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Avatar 
                    radius="xl" 
                    color="blue" 
                    variant="filled"
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Fallback initials if no image */}
                    {pageTitle.slice(0, 2).toUpperCase()}
                  </Avatar>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>User Menu</Menu.Label>
                  <Menu.Item 
                    color="red" 
                    leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                    onClick={handleLogout}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Paper>
        {/* --- End Header Section --- */}

        <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
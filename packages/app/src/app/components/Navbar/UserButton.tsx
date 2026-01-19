import { useNavigate } from 'react-router-dom';
import { Flex, Menu, Text, Tooltip } from '@mantine/core';
import { IconCategory2, IconLogout2, IconSettings, IconUser } from '@tabler/icons-react';
import classes from './UserButton.module.scss';

import { appStateManager } from '@lib/appState';

const MAX_NAME_LENGTH = 25;
const MAX_ACCOUNT_LENGTH = 30;

export function UserButton() {
  const navigate = useNavigate();

  const appState = appStateManager.getState();
  const account = `[${appState.role.toUpperCase()}] ${appState.projectName}`;

  return (
    <Menu shadow="md" width={200} trigger="click">
      <Menu.Target>
        <button className={classes.user}>
          <Flex gap={10}>
            <IconUser size={36} />

            <div style={{ cursor: 'default' }}>
              <Tooltip disabled={appState.fullName.length <= MAX_NAME_LENGTH} label={appState.fullName} position="bottom" withArrow>
                <Text size="sm" fw={500}>
                  {truncateText(appState.fullName, MAX_NAME_LENGTH)}
                </Text>
              </Tooltip>

              <Tooltip disabled={account.length <= MAX_ACCOUNT_LENGTH} label={account} position="bottom" withArrow>
                <Text c="dimmed" size="xs">
                  {truncateText(account, MAX_ACCOUNT_LENGTH)}
                </Text>
              </Tooltip>
            </div>
          </Flex>
        </button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Application</Menu.Label>
        <Menu.Item
          leftSection={<IconSettings size={14} />}
          onClick={() => {
            navigate('/settings');
          }}
        >
          Settings
        </Menu.Item>
        <Menu.Divider />

        <Menu.Label>Account</Menu.Label>
        <Menu.Item
          leftSection={<IconCategory2 size={14} />}
          onClick={() => {
            navigate('/account-picker');
          }}
        >
          Account Picker
        </Menu.Item>
        <Menu.Item
          color="yellow"
          leftSection={<IconLogout2 size={14} />}
          onClick={() => {
            navigate('/logout');
          }}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

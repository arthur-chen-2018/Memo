import { ShellBar, Avatar, ShellBarItem } from '@ui5/webcomponents-react';
import { useNavigate } from 'react-router';
import { useAppContext } from '@/context/AppContext';

import '@ui5/webcomponents-icons/dist/alert.js';
import '@ui5/webcomponents-icons/dist/bell.js';

export default function AppShellBar() {
  const navigate = useNavigate();
  const { unreadCount, errorCount } = useAppContext();

  return (
    <ShellBar
      primaryTitle="Memo App"
      profile={<Avatar initials="CU" colorScheme="Accent6" />}
      onLogoClick={() => navigate('/')}
      startButton={undefined}
    >
      <ShellBarItem
        icon="alert"
        text="Errors"
        count={String(errorCount)}
        onClick={() => navigate('/errors')}
      />
      <ShellBarItem
        icon="bell"
        text="Notifications"
        count={String(unreadCount)}
      />
    </ShellBar>
  );
}

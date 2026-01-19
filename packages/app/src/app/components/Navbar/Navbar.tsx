import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Code, Group, ScrollArea } from '@mantine/core';
import { LinksGroup } from './LinksGroup';

// import { Logo } from './Logo';
import classes from './Navbar.module.scss';

import { generateNavbarMenu } from '@routes/utils';

import { adminRoutes } from '@routes/routes.admin';
// import { staffRoutes } from '@routes/routes.staff';
// import { ownerRoutes } from '@routes/routes.owner';
// import { tenantRoutes } from '@routes/routes.tenant';
// import { settingsRoutes } from '@routes/settings';

type NavbarProps = {
  footerElement: React.ReactNode;
};

export function Navbar({ footerElement }: NavbarProps) {
  const location = useLocation();

  const navbarMenu = useMemo(
    () => generateNavbarMenu([
        adminRoutes,
        // staffRoutes,
        // ownerRoutes,
        // tenantRoutes,
        // settingsRoutes
    ], location.pathname),
    [location.pathname],
  );

  // Return null if no menu items are available
  if (!navbarMenu || navbarMenu.length === 0) {
    return <div />;
  }

  const links = navbarMenu.map((item) => <LinksGroup {...item} key={item.label} />);

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <Group justify="space-between">
          {/* <Logo style={{ width: 120 }} /> */}
          <Code fw={700}>v3.1.2</Code>
        </Group>
      </div>

      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>

      <div className={classes.footer}>{footerElement}</div>
    </nav>
  );
}

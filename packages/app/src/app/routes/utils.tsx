import { RouteObject } from 'react-router-dom';
import { TablerIcon } from '@tabler/icons-react';

export type AppRoute = {
  path: string;
  element: React.ReactNode;
  children?: NavbarMenuItem[];
};

// This defines the sidebar menu structure.
type NavbarMenuItem = {
  label: string;
  icon: TablerIcon;
  path: string;
  element?: React.ReactNode;
  children?: NavbarSubMenuItem[];
};

type NavbarSubMenuItem = {
  label: string;
  path: string;
  element: React.ReactNode;
  hidden?: boolean;
};

export type NavbarMenu = {
  label: string;
  icon: TablerIcon;
  initiallyOpened?: boolean;
  link?: string;
  submenus?: NavbarSubmenu[];
};

type NavbarSubmenu = {
  label: string;
  link: string;
};

export function generateRouterConfig(appMenu: AppRoute[]): RouteObject[] {
  const routes: RouteObject[] = [];

  for (const appRoute of appMenu) {
    const route: RouteObject = {
      path: `/${normalizePath(appRoute.path)}`,
      element: appRoute.element,
      children: [],
    };

    for (const appRouteMenuItem of appRoute.children ?? []) {
      route.children?.push({
        path: normalizePath(appRouteMenuItem.path),
        element: appRouteMenuItem.element,
      });

      for (const appRouteSubmenuItem of appRouteMenuItem.children ?? []) {
        route.children?.push({
          path: `${normalizePath(appRouteMenuItem.path)}/${normalizePath(appRouteSubmenuItem.path)}`,
          element: appRouteSubmenuItem.element,
        });
      }
    }

    routes.push(route);
  }

  return routes;
}

export function generateNavbarMenu(appRoutes: AppRoute[], appUrl: string): NavbarMenu[] {
  // Generate a map of app routes for quick lookup
  const appRoutesMap: Record<string, AppRoute> = {};
  appRoutes.forEach((route) => {
    appRoutesMap[normalizePath(route.path)] = route;
  });

  const navbarMenu: NavbarMenu[] = [];

  // Split the URL into segments and filter out valid and non-falsy segments
  const urlSegments = normalizePath(appUrl).split('/').filter(Boolean);

  // Return if there are no valid URL segments
  if (urlSegments.length === 0) {
    return navbarMenu;
  }

  const appRoute = appRoutesMap[normalizePath(urlSegments[0])];

  // Return if app route doesn't have children routes
  if (!appRoute || !appRoute.children || appRoute.children.length === 0) {
    return navbarMenu;
  }

  appRoute.children.forEach((menuItem) => {
    const menu: NavbarMenu = {
      label: menuItem.label,
      icon: menuItem.icon,
      link: createHashedLink(appRoute.path, menuItem.path),
    };

    // If the URL matches the menu item path, set it as initially opened
    if (urlSegments.length > 1 && menuItem.path === urlSegments[1]) {
      menu.initiallyOpened = true;
    }

    // If the menu item has children, create submenus
    if (menuItem.children && menuItem.children.length > 0) {
      menu.submenus = menuItem.children
        .filter((subMenuItem) => !subMenuItem.hidden)
        .map((subMenuItem) => ({
          label: subMenuItem.label,
          link: createHashedLink(appRoute.path, menuItem.path, subMenuItem.path),
        }));

      // Remove direct link if there are submenus
      delete menu.link;
    }

    navbarMenu.push(menu);
  });

  return navbarMenu;
}

/**
 * Normalizes a URL path by converting it to lowercase and removing all leading and trailing slashes,
 * while preserving path parameters (segments starting with ':').
 */
export function normalizePath(path: string): string {
  return path
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .map((segment) => (segment.startsWith(':') ? segment : segment.toLowerCase()))
    .join('/');
}

export function createHashedLink(...path: string[]): string {
  // FIX: Removed the '/#' prefix. Now returns a clean path compatible with useNavigate.
  // Example: returns "/admin/users" instead of "/#/admin/users"
  return `/${path.map(normalizePath).join('/')}`;
}
import { useState, useEffect } from 'react';
import { Box, Collapse, Group, ThemeIcon } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavbarMenu } from '@routes/utils';
import classes from './LinksGroup.module.scss';

export function LinksGroup({ icon: Icon, label, initiallyOpened, link, submenus }: NavbarMenu) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasSubmenus = !!submenus && Array.isArray(submenus);
  
  // Auto-expand if a submenu is currently active
  const isSubmenuActive = hasSubmenus && submenus.some(s => s.link === location.pathname);
  const [opened, setOpened] = useState(initiallyOpened || isSubmenuActive || false);

  useEffect(() => {
    if (isSubmenuActive) {
      setOpened(true);
    }
  }, [location.pathname]);

  const handleMainLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (hasSubmenus) {
      setOpened((o) => !o);
    } else if (link) {
      navigate(link);
    }
  };

  const items = (hasSubmenus ? submenus : []).map((submenu) => (
    <a 
      className={classes.link} 
      // FIX: Add '#' manually for visual href, but submenu.link is now a clean path
      href={`#${submenu.link}`} 
      key={submenu.label}
      data-active={location.pathname === submenu.link || undefined}
      onClick={(e) => {
        e.preventDefault();
        navigate(submenu.link);
      }}
    >
      {submenu.label}
    </a>
  ));

  return (
    <>
      <a 
        // FIX: Add '#' manually for visual href
        href={link ? `#${link}` : '#'} 
        className={classes.control} 
        onClick={handleMainLinkClick}
        data-active={location.pathname === link || undefined}
      >
        <Group justify="space-between" gap={0}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeIcon variant="light" size={30}>
              <Icon size={18} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasSubmenus && (
            <IconChevronRight 
              className={classes.chevron} 
              stroke={1.5} 
              size={16} 
              style={{ transform: opened ? 'rotate(-90deg)' : 'none' }} 
            />
          )}
        </Group>
      </a>
      {hasSubmenus ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}
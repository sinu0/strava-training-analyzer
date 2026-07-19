import WidgetsIcon from '@mui/icons-material/Widgets';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { useUiPreferences } from '@/hooks/useUiPreferences';
import { PRIMARY_NAVIGATION_BY_PATH } from '@/navigation/appNavigation';
import { DEFAULT_UI_PREFERENCES } from '@/utils/uiPreferences';

interface MobileNavigationItem {
  label: string;
  path: string;
  icon: React.ReactElement;
}

function resolveCurrentValue(pathname: string, items: MobileNavigationItem[]) {
  const matched = items.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );

  return matched?.path ?? '/more';
}

/**
 * Renders the primary mobile navigation for the most common app destinations.
 */
export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const preferences = useUiPreferences();
  const savedPaths = preferences.data?.mobileNavigation ?? DEFAULT_UI_PREFERENCES.mobileNavigation;
  const shortcuts = savedPaths
    .map((path) => PRIMARY_NAVIGATION_BY_PATH.get(path))
    .filter((item) => item != null);
  const navigationItems: MobileNavigationItem[] = [
    ...(shortcuts.length === 4
      ? shortcuts
      : DEFAULT_UI_PREFERENCES.mobileNavigation.map((path) => PRIMARY_NAVIGATION_BY_PATH.get(path)!)),
    { label: 'Więcej', path: '/more', icon: <WidgetsIcon /> },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        pb: 'env(safe-area-inset-bottom)',
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: '1px solid',
        borderColor: (theme) => theme.tokens.surfaceBorder,
        boxShadow: (theme) => theme.tokens.cardShadow,
        bgcolor: (theme) => theme.palette.background.paper,
      }}
    >
      <BottomNavigation
        showLabels
        value={resolveCurrentValue(location.pathname, navigationItems)}
        onChange={(_, nextValue) => navigate(nextValue)}
        sx={{
          height: 64,
          bgcolor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            maxWidth: 'none',
            color: 'text.secondary',
            px: 0.5,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.74rem',
            mt: 0.25,
          },
          '& .Mui-selected': {
            color: 'primary.main',
            '& .MuiSvgIcon-root': {
              filter: 'drop-shadow(0 0 8px rgba(255,107,53,0.32))',
            },
          },
        }}
      >
        {navigationItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            value={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', value: '/', path: '/', icon: <DashboardIcon /> },
  { label: 'Trening', value: '/activities', path: '/activities', icon: <DirectionsBikeIcon /> },
  { label: 'Analiza', value: '/analytics', path: '/analytics', icon: <BarChartIcon /> },
  { label: 'Zdrowie', value: '/health', path: '/health', icon: <MonitorHeartIcon /> },
  { label: 'Więcej', value: '/profile', path: '/profile', icon: <WidgetsIcon /> },
] as const;

function resolveCurrentValue(pathname: string) {
  const matched = NAV_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );

  return matched?.value ?? '/';
}

/**
 * Renders the primary mobile navigation for the most common app destinations.
 */
export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Paper
      elevation={0}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: 4,
        border: '1px solid',
        borderColor: (theme) => theme.tokens.surfaceBorder,
        boxShadow: (theme) => theme.tokens.cardShadowHover,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.92),
        backdropFilter: 'blur(18px)',
        overflow: 'hidden',
      }}
    >
      <BottomNavigation
        showLabels
        value={resolveCurrentValue(location.pathname)}
        onChange={(_, nextValue) => navigate(nextValue)}
        sx={{
          height: 66,
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
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.value}
            value={item.value}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

import BarChartIcon from '@mui/icons-material/BarChart';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TodayIcon from '@mui/icons-material/Today';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dzisiaj', value: '/', path: '/', icon: <TodayIcon /> },
  { label: 'Historia', value: '/activities', path: '/activities', icon: <DirectionsBikeIcon /> },
  { label: 'Analiza', value: '/analytics', path: '/analytics', icon: <BarChartIcon /> },
  { label: 'Plan', value: '/training', path: '/training', icon: <FitnessCenterIcon /> },
  { label: 'Więcej', value: '/more', path: '/more', icon: <WidgetsIcon /> },
] as const;

function resolveCurrentValue(pathname: string) {
  const matched = NAV_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );

  return matched?.value ?? '/more';
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
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: 3.25,
        border: '1px solid',
        borderColor: (theme) => theme.tokens.surfaceBorder,
        boxShadow: (theme) => theme.tokens.cardShadowHover,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(22px)',
        overflow: 'hidden',
      }}
    >
      <BottomNavigation
        showLabels
        value={resolveCurrentValue(location.pathname)}
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

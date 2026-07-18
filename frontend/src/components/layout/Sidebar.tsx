import BarChartIcon from '@mui/icons-material/BarChart';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ScaleIcon from '@mui/icons-material/Scale';
import SettingsIcon from '@mui/icons-material/Settings';
import TodayIcon from '@mui/icons-material/Today';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  width: number;
  open: boolean;
  onNavigateComplete?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const HERO_ITEM: NavItem = { label: 'Dzisiaj', path: '/', icon: <TodayIcon /> };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Główne',
    items: [
      { label: 'Historia', path: '/activities', icon: <DirectionsBikeIcon /> },
      { label: 'Analiza', path: '/analytics', icon: <BarChartIcon /> },
      { label: 'Plan', path: '/training', icon: <FitnessCenterIcon /> },
    ],
  },
  {
    label: 'Więcej',
    items: [
      { label: 'Pełna pogoda', path: '/weather', icon: <WbSunnyOutlinedIcon /> },
      { label: 'Profil i strefy', path: '/profile', icon: <PersonOutlineIcon /> },
      { label: 'Zdrowie', path: '/health', icon: <MonitorHeartIcon /> },
      { label: 'Masa ciała', path: '/weight', icon: <ScaleIcon /> },
    ],
  },
];

const BOTTOM_ITEM: NavItem = { label: 'Dane i zadania', path: '/admin', icon: <SettingsIcon /> };

function NavButton({ item, selected, onClick }: { item: NavItem; selected: boolean; onClick: () => void }) {
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        mx: 1,
        borderRadius: 2.5,
        mb: 0.25,
        py: 0.85,
        '&.Mui-selected': {
          bgcolor: (theme) => theme.tokens.activeOverlay,
          '&:hover': { bgcolor: (theme) => alpha(theme.tokens.chart.primary, 0.16) },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 34, color: selected ? 'primary.main' : 'text.secondary' }}>
        {item.icon}
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{
          fontSize: '0.9rem',
          fontWeight: selected ? 600 : 400,
        }}
      />
    </ListItemButton>
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        px: 2.5,
        pt: 2,
        pb: 0.5,
        fontSize: '0.68rem',
        fontWeight: 600,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        opacity: 0.7,
      }}
    >
      {label}
    </Typography>
  );
}

/**
 * Renders the grouped primary navigation used by the application shell.
 */
export default function Sidebar({ width, open, onNavigateComplete }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isSelected = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navigateTo = (path: string) => {
    navigate(path);
    onNavigateComplete?.();
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onNavigateComplete}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', md: 'block' },
        width: !isMobile && open ? width : 0,
        flexShrink: 0,
        transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: (t) => t.tokens.surfaceBorder,
          bgcolor: '#0d1117',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/illustrations/bg-sidebar.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.14,
            filter: 'saturate(0.6) contrast(0.85) brightness(0.65) blur(1px)',
            transform: 'scale(1.04)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(13,17,23,0.72) 0%, rgba(13,17,23,0.88) 45%, rgba(13,17,23,0.97) 100%), radial-gradient(circle at 20% 10%, rgba(78,205,196,0.06), transparent 32%), radial-gradient(circle at 90% 90%, rgba(255,107,53,0.05), transparent 30%)',
            pointerEvents: 'none',
          },
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        },
      }}
    >
      {/* Header */}
      <Toolbar sx={{ gap: 1, px: 2 }}>
        <Box
          component="img"
          src="/illustrations/logo.png"
          alt="Strava Analizator"
          sx={{ width: 44, height: 44, objectFit: 'contain' }}
        />
        <Typography
          variant="subtitle1"
          color="primary"
          noWrap
          sx={{ fontWeight: 700, fontSize: '0.95rem' }}
        >
          Strava Analizator
        </Typography>
      </Toolbar>

      {/* Primary daily decision */}
      <List sx={{ px: 0 }}>
        <NavButton
          item={HERO_ITEM}
          selected={isSelected(HERO_ITEM.path)}
          onClick={() => navigateTo(HERO_ITEM.path)}
        />
      </List>

      {/* Grouped navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {NAV_GROUPS.map((group) => (
          <Box key={group.label}>
            <GroupLabel label={group.label} />
            <List disablePadding>
              {group.items.map((item) => (
                <NavButton
                  key={item.path}
                  item={item}
                  selected={isSelected(item.path)}
                  onClick={() => navigateTo(item.path)}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom-pinned settings */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: (t) => t.tokens.surfaceBorder,
          pb: 1,
          pt: 0.5,
        }}
      >
        <List disablePadding>
          <NavButton
            item={BOTTOM_ITEM}
            selected={isSelected(BOTTOM_ITEM.path)}
            onClick={() => navigateTo(BOTTOM_ITEM.path)}
          />
        </List>
      </Box>
    </Drawer>
  );
}

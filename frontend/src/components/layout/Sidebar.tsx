import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate, useLocation } from 'react-router-dom';

import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION, type AppNavigationItem } from '@/navigation/appNavigation';

interface SidebarProps {
  width: number;
  open: boolean;
  onNavigateComplete?: () => void;
}

interface NavGroup {
  label: string;
  items: AppNavigationItem[];
}

const HERO_ITEM = PRIMARY_NAVIGATION[0]!;

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Główne',
    items: PRIMARY_NAVIGATION.slice(1),
  },
  {
    label: 'Więcej',
    items: SECONDARY_NAVIGATION,
  },
];

function NavButton({ item, selected, onClick }: { item: AppNavigationItem; selected: boolean; onClick: () => void }) {
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        mx: 1.25,
        borderRadius: 2,
        mb: 0.35,
        py: 0.95,
        position: 'relative',
        '&.Mui-selected': {
          bgcolor: (theme) => alpha(theme.tokens.chart.primary, 0.115),
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 9,
            bottom: 9,
            width: 3,
            borderRadius: 4,
            bgcolor: 'primary.main',
          },
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
          fontSize: '0.88rem',
          fontWeight: selected ? 700 : 500,
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
        px: 2.75,
        pt: 2.25,
        pb: 0.5,
        fontSize: '0.68rem',
        fontWeight: 600,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        opacity: 0.76,
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
          bgcolor: '#0A1017',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 10% 5%, rgba(255,107,53,0.09), transparent 32%), radial-gradient(circle at 95% 85%, rgba(78,205,196,0.045), transparent 28%)',
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
      <Toolbar sx={{ gap: 1.25, px: 2.25, minHeight: 78 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 2.2,
            color: '#fff',
            background: 'linear-gradient(135deg, #FC4C02, #FF7A3D)',
            boxShadow: '0 10px 28px rgba(252,76,2,0.24)',
          }}
        >
          <SpeedOutlinedIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.primary" noWrap sx={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.055em' }}>
            TRAINING LAB
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.68rem' }}>
            cycling performance
          </Typography>
        </Box>
      </Toolbar>

      {/* Primary daily decision */}
      <List component="div" sx={{ px: 0 }}>
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
            <List component="div" disablePadding>
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

      {/* Privacy status */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: (t) => t.tokens.surfaceBorder,
          pb: 1.25,
          pt: 0.75,
        }}
      >
        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ px: 2.75, pt: 0.75 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', boxShadow: '0 0 10px rgba(63,185,80,0.55)' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
            Local-only · dane prywatne
          </Typography>
        </Stack>
      </Box>
    </Drawer>
  );
}

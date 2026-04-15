import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Avatar,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import StatusPill from '@/components/layout/StatusPill';
import type { ReadinessData, FtpProgress, WeatherGradient } from '@/types/analytics';

import type { Theme } from '@mui/material/styles';

interface TopBarProps {
  onToggleSidebar: () => void;
  readiness?: ReadinessData;
  ftpProgress?: FtpProgress;
  weatherGradient?: WeatherGradient;
  profileName?: string;
}

/**
 * Displays the main app bar with the sidebar toggle, status summary, and profile menu.
 */
export default function TopBar({
  onToggleSidebar,
  readiness,
  ftpProgress,
  weatherGradient,
  profileName,
}: TopBarProps) {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const initials = profileName
    ? profileName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: (t) => t.tokens.surfaceElevated,
          borderBottom: '1px solid',
          borderColor: (t) => t.tokens.surfaceBorder,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 60 }, gap: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle menu"
            onClick={onToggleSidebar}
            sx={{ color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          <StatusPill
            readiness={readiness}
            ftpProgress={ftpProgress}
            weatherGradient={weatherGradient}
          />

          <IconButton
            onClick={(e) => setAnchor(e.currentTarget)}
            sx={{ ml: 0.5, p: 0.5 }}
            aria-label="profil"
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: '0.82rem',
                fontWeight: 700,
                bgcolor: 'primary.main',
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: (t: Theme) => t.tokens.surfaceBorder,
              borderRadius: 2,
              boxShadow: (t: Theme) => t.tokens.cardShadow,
              minWidth: 180,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {profileName ?? 'Użytkownik'}
          </Typography>
        </Box>
        <List disablePadding sx={{ py: 0.5 }}>
          <ListItemButton
            onClick={() => {
              setAnchor(null);
              navigate('/profile');
            }}
            sx={{ py: 0.75, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Profil"
              primaryTypographyProps={{ fontSize: '0.85rem' }}
            />
          </ListItemButton>
        </List>
      </Popover>
    </>
  );
}

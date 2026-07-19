import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PedalBikeOutlinedIcon from '@mui/icons-material/PedalBikeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
  AppBar,
  Box,
  Chip,
  IconButton,
  InputBase,
  Avatar,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TopBarSyncButton from '@/components/layout/TopBarSyncButton';
import { useColorMode } from '@/context/ThemeModeContext';

interface TopBarProps {
  onToggleSidebar: () => void;
}

/**
 * Round white action button used across the TopBar cluster.
 * Stays opaque on hover; the token overlay only tints the surface slightly.
 */
const roundActionButtonSx = (theme: Theme) => ({
  width: 40,
  height: 40,
  flexShrink: 0,
  bgcolor: theme.tokens.searchPill,
  color: theme.palette.text.primary,
  boxShadow: theme.tokens.cardShadow,
  transition: theme.tokens.transition,
  '&:hover': {
    bgcolor: theme.tokens.searchPill,
    backgroundImage: `linear-gradient(${theme.tokens.hoverOverlay}, ${theme.tokens.hoverOverlay})`,
    boxShadow: theme.tokens.cardShadowHover,
  },
});

/**
 * Displays the main app bar with the sidebar toggle, global search, and profile menu.
 */
export default function TopBar({
  onToggleSidebar,
}: TopBarProps) {
  const navigate = useNavigate();
  const { mode, toggleMode } = useColorMode();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const term = searchTerm.trim();
    if (!term) return;
    navigate(`/activities?q=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: (theme) => theme.tokens.topBar,
          color: 'text.primary',
          borderBottom: (theme) =>
            theme.tokens.mode === 'dark' ? `1px solid ${theme.tokens.surfaceBorder}` : 'none',
          backdropFilter: 'blur(18px)',
          overflow: 'visible',
          zIndex: (theme) => theme.zIndex.appBar + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, gap: 1.25 }}>
          {/* Left: menu + wordmark */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.1 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="toggle menu"
              onClick={onToggleSidebar}
              sx={{ color: 'text.secondary' }}
            >
              <MenuIcon />
            </IconButton>
            <Box
              sx={{
                width: 34,
                height: 34,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                borderRadius: '12px',
                color: '#fff',
                background: (theme) => theme.tokens.gradients.strava,
                boxShadow: '0 8px 20px rgba(252,76,2,0.28)',
              }}
            >
              <PedalBikeOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              Training Lab
            </Typography>
          </Box>

          {/* Center: global search pill */}
          <Box sx={{ flex: '0 1 420px', display: { xs: 'none', sm: 'flex' }, justifyContent: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                width: '100%',
                minHeight: 42,
                px: 1.75,
                borderRadius: 999,
                bgcolor: (theme) => theme.tokens.searchPill,
                boxShadow: (theme) => theme.tokens.cardShadow,
                transition: (theme) => theme.tokens.transition,
                '&:focus-within': {
                  boxShadow: (theme) => theme.tokens.cardShadowHover,
                },
              }}
            >
              <SearchIcon sx={{ fontSize: 20, color: 'text.secondary', flexShrink: 0 }} />
              <InputBase
                fullWidth
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Szukaj aktywności lub metryk…"
                inputProps={{ 'aria-label': 'Szukaj aktywności lub metryk' }}
                sx={{
                  fontSize: '0.9rem',
                  color: 'text.primary',
                }}
              />
            </Box>
          </Box>

          {/* Right: context + actions */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 0.75,
            }}
          >
            <Chip
              size="small"
              label="LOCAL"
              variant="outlined"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                height: 27,
                fontSize: '0.66rem',
                letterSpacing: '0.08em',
                color: 'success.main',
                borderColor: (theme) => alpha(theme.palette.success.main, 0.34),
                bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
              }}
            />
            <TopBarSyncButton />

            <Tooltip title={mode === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}>
              <IconButton
                aria-label={mode === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
                aria-pressed={mode === 'light'}
                onClick={toggleMode}
                sx={roundActionButtonSx}
              >
                {mode === 'dark' ? (
                  <LightModeOutlinedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <DarkModeOutlinedIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>

            <IconButton
              onClick={(e) => setAnchor(e.currentTarget)}
              sx={{ p: 0.25 }}
              aria-label="profil"
            >
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.13),
                  color: 'primary.main',
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.34)}`,
                }}
              >
                <PedalBikeOutlinedIcon fontSize="small" />
              </Avatar>
            </IconButton>
          </Box>
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
              borderRadius: 3,
              boxShadow: (t: Theme) => t.tokens.cardShadow,
              minWidth: 180,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Użytkownik
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

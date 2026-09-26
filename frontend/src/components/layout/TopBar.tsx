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
import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useColorMode } from '@/context/ThemeModeContext';
import { useI18n } from '@/i18n';
import { getAppThemeTokens } from '@/theme/theme';
import BrandMark from '@/ui/BrandMark';

// Sync status pulls the analytics hooks; loading it after first paint keeps the entry chunk small.
const TopBarSyncButton = lazy(() => import('@/components/layout/TopBarSyncButton'));

interface TopBarProps {
  onToggleSidebar: () => void;
  showBrand?: boolean;
}

/**
 * Round white action button used across the TopBar cluster.
 * Stays opaque on hover; the token overlay only tints the surface slightly.
 */
const roundActionButtonSx = (theme: Theme) => ({
  width: getAppThemeTokens(theme).control.md,
  height: getAppThemeTokens(theme).control.md,
  flexShrink: 0,
  bgcolor: getAppThemeTokens(theme).searchPill,
  color: theme.palette.text.primary,
  boxShadow: getAppThemeTokens(theme).cardShadow,
  transition: getAppThemeTokens(theme).transition,
  '&:hover': {
    bgcolor: getAppThemeTokens(theme).searchPill,
    backgroundImage: `linear-gradient(${getAppThemeTokens(theme).hoverOverlay}, ${getAppThemeTokens(theme).hoverOverlay})`,
    boxShadow: getAppThemeTokens(theme).cardShadowHover,
  },
});

/**
 * Displays the main app bar with the sidebar toggle, global search, and profile menu.
 */
export default function TopBar({
  onToggleSidebar,
  showBrand = true,
}: TopBarProps) {
  const navigate = useNavigate();
  const { mode, toggleMode } = useColorMode();
  const { language, t, toggleLanguage } = useI18n();
  const themeToggleLabel = mode === 'dark' ? t('topBar.enableLightMode') : t('topBar.enableDarkMode');
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
          bgcolor: (theme) => getAppThemeTokens(theme).topBar,
          color: 'text.primary',
          borderBottom: (theme) =>
            getAppThemeTokens(theme).mode === 'dark' ? `1px solid ${getAppThemeTokens(theme).surfaceBorder}` : 'none',
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
              aria-label={t('topBar.toggleMenu')}
              onClick={onToggleSidebar}
              sx={{ color: 'text.secondary' }}
            >
              <MenuIcon />
            </IconButton>
            {showBrand ? (
              <>
                <BrandMark size={34} icon={<PedalBikeOutlinedIcon />} />
                <Typography variant="subtitle1" sx={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  Training Lab
                </Typography>
              </>
            ) : null}
          </Box>

          {/* Center: global search pill */}
          <Box sx={{ flex: '0 1 420px', display: { xs: 'none', sm: 'flex' }, justifyContent: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                width: '100%',
                minHeight: (theme) => getAppThemeTokens(theme).control.md,
                px: 1.75,
                borderRadius: 999,
                bgcolor: (theme) => getAppThemeTokens(theme).searchPill,
                boxShadow: (theme) => getAppThemeTokens(theme).cardShadow,
                transition: (theme) => getAppThemeTokens(theme).transition,
                '&:focus-within': {
                  boxShadow: (theme) => getAppThemeTokens(theme).cardShadowHover,
                },
              }}
            >
              <SearchIcon sx={{ fontSize: (theme) => getAppThemeTokens(theme).icon.md, color: 'text.secondary', flexShrink: 0 }} />
              <InputBase
                fullWidth
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('topBar.searchPlaceholder')}
                inputProps={{ 'aria-label': t('topBar.searchLabel') }}
                sx={{
                  fontSize: '0.875rem',
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
            <Suspense fallback={<Box sx={{ width: 44, height: 44 }} />}>
              <TopBarSyncButton />
            </Suspense>

            <Tooltip title={t('topBar.switchLanguage')}>
              <IconButton
                aria-label={t('topBar.switchLanguage')}
                onClick={toggleLanguage}
                sx={[
                  roundActionButtonSx,
                  (theme) => ({ fontSize: '0.72rem', fontWeight: getAppThemeTokens(theme).type.weight.label, letterSpacing: '0.06em' }),
                ]}
              >
                {language.toUpperCase()}
              </IconButton>
            </Tooltip>

            <Tooltip title={themeToggleLabel}>
              <IconButton
                aria-label={themeToggleLabel}
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
              aria-label={t('topBar.profileMenu')}
            >
              <Avatar
                sx={{
                  width: (theme) => getAppThemeTokens(theme).control.md,
                  height: (theme) => getAppThemeTokens(theme).control.md,
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
              borderColor: (t: Theme) => getAppThemeTokens(t).surfaceBorder,
              borderRadius: 3,
              boxShadow: (t: Theme) => getAppThemeTokens(t).cardShadow,
              minWidth: 180,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: (theme) => getAppThemeTokens(theme).type.weight.label }}>
            {t('topBar.user')}
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
              primary={t('topBar.profile')}
              slotProps={{
                primary: { sx: { fontSize: '0.85rem', fontWeight: 550 } }
              }}
            />
          </ListItemButton>
        </List>
      </Popover>
    </>
  );
}

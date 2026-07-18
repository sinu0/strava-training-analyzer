import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  IconButton,
  Avatar,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import TopBarSyncButton from '@/components/layout/TopBarSyncButton';

import type { Theme } from '@mui/material/styles';

interface TopBarProps {
  onToggleSidebar: () => void;
}

function getPageContext(pathname: string) {
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    return {
      eyebrow: 'Dzisiaj',
      title: 'Decyzja treningowa',
      subtitle: 'Wniosek, dowody, jakość danych i kontekst kolejnej sesji.',
    };
  }
  if (pathname.startsWith('/weather')) {
    return {
      eyebrow: 'Pogoda',
      title: 'Pełna pogoda',
      subtitle: 'Warunki godzinowe, prognoza tygodnia, lokalizacje i ustawienia.',
    };
  }
  if (pathname.startsWith('/training')) {
    return {
      eyebrow: 'Plan',
      title: 'Kalendarz treningowy',
      subtitle: 'Planowane i wykonane sesje oraz scenariusz obciążenia.',
    };
  }
  if (pathname.startsWith('/activities')) {
    return {
      eyebrow: 'Historia',
      title: 'Aktywności',
      subtitle: 'Lista, kalendarz, mapa i szczegół wykonanej sesji.',
    };
  }
  if (pathname.startsWith('/analytics')) {
    return {
      eyebrow: 'Analiza',
      title: 'Porównania i trendy',
      subtitle: 'Obciążenie, regeneracja, moc i trwałość.',
    };
  }
  if (pathname.startsWith('/health')) {
    return {
      eyebrow: 'Zdrowie',
      title: 'Regeneracja',
      subtitle: 'Sygnały wellness i codzienna gotowość.',
    };
  }
  if (pathname.startsWith('/more')) {
    return {
      eyebrow: 'Więcej',
      title: 'Dane i ustawienia',
      subtitle: 'Profil, zdrowie, integracje, jakość danych i zadania.',
    };
  }
  return {
    eyebrow: 'Aplikacja',
    title: 'Strava Analizator',
    subtitle: 'Operacyjny cockpit treningowy.',
  };
}

/**
 * Displays the main app bar with the sidebar toggle, status summary, and profile menu.
 */
export default function TopBar({
  onToggleSidebar,
}: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const pageContext = getPageContext(location.pathname);

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: (t) => t.tokens.surfaceElevated,
          borderBottom: '1px solid',
          borderColor: (t) => t.tokens.surfaceBorder,
          overflow: 'visible',
          zIndex: (theme) => theme.zIndex.appBar + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 72, sm: 80 }, gap: 1, alignItems: 'flex-start', pt: 1.2, pb: 1.8 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle menu"
            onClick={onToggleSidebar}
            sx={{ color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {pageContext.eyebrow}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {pageContext.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', md: 'block' }, maxWidth: 560 }}
            >
              {pageContext.subtitle}
            </Typography>
          </Box>

          <Box
            data-testid="topbar-floating-cluster"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ml: 0.5,
              pl: 1.05,
              pr: 0.75,
              py: 0.75,
              mt: 0.3,
              mb: -2.75,
              borderRadius: 999,
              bgcolor: 'rgba(17, 24, 39, 0.88)',
              border: '1px solid',
              borderColor: (theme) => theme.tokens.surfaceStrongBorder,
              boxShadow: '0 18px 38px rgba(0,0,0,0.28), 0 3px 8px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
              backdropFilter: 'blur(18px)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 1,
                borderRadius: 999,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 60%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              },
            }}
          >
            <TopBarSyncButton />

            <IconButton
              onClick={(e) => setAnchor(e.currentTarget)}
              sx={{ p: 0.25, position: 'relative', zIndex: 1 }}
              aria-label="profil"
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  bgcolor: 'primary.main',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.10), 0 14px 28px rgba(0,0,0,0.22)',
                }}
              >
                ?
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
              borderRadius: 2,
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

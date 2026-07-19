import { Alert, Box, Snackbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { STATUS_COLORS, alphaColor } from '@/utils/colors';

import MobileBottomNav from './MobileBottomNav';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const SIDEBAR_WIDTH = 260;

/**
 * Composes the app shell with the sidebar, top bar, routed content, and Strava notice.
 */
export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile);
  const [oauthNoticeOpen, setOauthNoticeOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const stravaState = searchParams.get('strava');
  const showStravaConnected = stravaState === 'connected' && oauthNoticeOpen;

  const handleCloseOauthNotice = () => {
    setOauthNoticeOpen(false);
    if (stravaState === 'connected') {
      searchParams.delete('strava');
      const nextSearch = searchParams.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true },
      );
    }
  };

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'fixed',
          left: 16,
          top: 12,
          zIndex: (currentTheme) => currentTheme.zIndex.tooltip + 1,
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontWeight: 800,
          textDecoration: 'none',
          transform: 'translateY(-160%)',
          '&:focus': { transform: 'translateY(0)' },
        }}
      >
        Przejdź do treści
      </Box>
      <Snackbar
        open={showStravaConnected}
        autoHideDuration={5000}
        onClose={handleCloseOauthNotice}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={handleCloseOauthNotice}
          sx={{
            width: '100%',
            fontWeight: 700,
            boxShadow: `0 12px 32px ${alphaColor(STATUS_COLORS.success, 0.28)}`,
          }}
        >
          Konto Strava zostało połączone. Możesz teraz uruchomić synchronizację aktywności.
        </Alert>
      </Snackbar>
      <Sidebar
        width={SIDEBAR_WIDTH}
        open={sidebarOpen}
        onNavigateComplete={() => {
          if (isMobile) {
            setSidebarOpen(false);
          }
        }}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{
            flexGrow: 1,
            position: 'relative',
            p: { xs: 1.5, sm: 2.5, md: 3.5, xl: 4.5 },
            pt: { xs: 3, sm: 3.5, md: 4 },
            pb: { xs: 11, md: 4 },
            bgcolor: 'background.default',
            '&::before': {
              content: '""',
              position: 'fixed',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at 88% 8%, rgba(255,107,53,0.045), transparent 26%), radial-gradient(circle at 55% 92%, rgba(78,205,196,0.025), transparent 28%)',
            },
            '& > *': { position: 'relative', zIndex: 1 },
          }}
        >
          <Outlet />
        </Box>
        <MobileBottomNav />
      </Box>
    </Box>
  );
}

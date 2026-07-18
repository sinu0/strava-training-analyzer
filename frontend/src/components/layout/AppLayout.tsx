import { Alert, Box, Snackbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { STATUS_COLORS, alphaColor } from '@/utils/colors';

import MobileBottomNav from './MobileBottomNav';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const SIDEBAR_WIDTH = 240;

/**
 * Composes the app shell with the sidebar, top bar, routed content, and Strava notice.
 */
export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            pt: { xs: 5, sm: 6, md: 7 },
            pb: { xs: 12, md: 3.5 },
            bgcolor: 'background.default',
          }}
        >
          <Outlet />
        </Box>
        <MobileBottomNav />
      </Box>
    </Box>
  );
}

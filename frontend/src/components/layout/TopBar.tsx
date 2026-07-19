import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import PedalBikeOutlinedIcon from '@mui/icons-material/PedalBikeOutlined';
import {
  AppBar,
  Box,
  Chip,
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
import { useNavigate } from 'react-router-dom';

import TopBarSyncButton from '@/components/layout/TopBarSyncButton';

import type { Theme } from '@mui/material/styles';

interface TopBarProps {
  onToggleSidebar: () => void;
}

/**
 * Displays the main app bar with the sidebar toggle, status summary, and profile menu.
 */
export default function TopBar({
  onToggleSidebar,
}: TopBarProps) {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(8, 13, 19, 0.82)',
          borderBottom: '1px solid',
          borderColor: (t) => t.tokens.surfaceBorder,
          backdropFilter: 'blur(18px)',
          overflow: 'visible',
          zIndex: (theme) => theme.zIndex.appBar + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 68 }, gap: 1.25 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle menu"
            onClick={onToggleSidebar}
            sx={{ color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 1.1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 760, lineHeight: 1.2 }}>
              Training Lab
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', lg: 'block' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              Prywatny kokpit kolarski
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
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
                borderColor: 'rgba(63,185,80,0.34)',
                bgcolor: 'rgba(63,185,80,0.06)',
              }}
            />
            <TopBarSyncButton />

            <IconButton
              onClick={(e) => setAnchor(e.currentTarget)}
              sx={{ p: 0.25 }}
              aria-label="profil"
            >
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: 'rgba(255,107,53,0.13)',
                  color: 'primary.main',
                  border: '1px solid rgba(255,107,53,0.34)',
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

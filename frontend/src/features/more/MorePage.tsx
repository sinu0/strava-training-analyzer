import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Box, ButtonBase, Grid, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import PageContainer from '@/components/common/PageContainer';
import PerformanceSurface from '@/components/v2/PerformanceSurface';

const items = [
  { label: 'Pełna pogoda', description: 'Prognoza, lokalizacje i ustawienia', path: '/weather', icon: <CloudOutlinedIcon /> },
  { label: 'Profil i strefy', description: 'FTP, tętno i ustawienia sportowe', path: '/profile', icon: <PersonOutlineIcon /> },
  { label: 'Zdrowie', description: 'Ręczny check-in i dostępność danych', path: '/health', icon: <MonitorHeartOutlinedIcon /> },
  { label: 'Masa ciała', description: 'Historia oraz cel masy', path: '/weight', icon: <ScaleOutlinedIcon /> },
  { label: 'Dane i zadania', description: 'Synchronizacja, przeliczenia i diagnostyka', path: '/admin', icon: <DataObjectOutlinedIcon /> },
  { label: 'Ustawienia', description: 'Integracje i konfiguracja aplikacji', path: '/admin', icon: <SettingsOutlinedIcon /> },
];

export default function MorePage() {
  const navigate = useNavigate();
  return (
    <PageContainer title="Więcej" subtitle="Pełna pogoda, profil sportowy, zdrowie oraz kontrola danych w jednym miejscu." maxWidth={1100}>
      <Grid container spacing={2}>
        {items.map((item, index) => (
          <Grid
            key={`${item.path}-${item.label}`}
            size={{
              xs: 12,
              sm: 6
            }}>
            <PerformanceSurface interactive accent={index === 0} sx={{ height: '100%' }}>
              <ButtonBase
                onClick={() => navigate(item.path)}
                sx={{ width: '100%', height: '100%', p: { xs: 2, md: 2.5 }, textAlign: 'left', alignItems: 'stretch' }}
              >
                <Stack direction="row" spacing={1.6} sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 2,
                      color: index === 0 ? '#fff' : 'primary.main',
                      bgcolor: index === 0 ? 'primary.main' : 'rgba(255,107,53,0.09)',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 760 }}>{item.label}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>{item.description}</Typography>
                  </Box>
                  <ArrowForwardRoundedIcon sx={{ color: 'text.secondary', alignSelf: 'center' }} />
                </Stack>
              </ButtonBase>
            </PerformanceSurface>
          </Grid>
        ))}
      </Grid>
    </PageContainer>
  );
}

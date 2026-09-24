import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Alert, Box, ButtonBase, Grid, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import MobileNavigationSettings from '@/components/settings/MobileNavigationSettings';
import { useSaveUiPreferences, useUiPreferences } from '@/hooks/useUiPreferences';
import { getAppThemeTokens } from '@/theme/theme';
import { Page, Surface } from '@/ui';

const items = [
  { label: 'Pogoda', description: 'Prognoza, lokalizacje i ustawienia', path: '/weather', icon: <CloudOutlinedIcon /> },
  { label: 'Profil', description: 'FTP, tętno i ustawienia sportowe', path: '/profile', icon: <PersonOutlineIcon /> },
  { label: 'Zdrowie', description: 'Ręczny check-in i dostępność danych', path: '/health', icon: <MonitorHeartOutlinedIcon /> },
  { label: 'Masa ciała', description: 'Historia oraz cel masy', path: '/weight', icon: <ScaleOutlinedIcon /> },
  { label: 'Dane', description: 'Synchronizacja, przeliczenia i diagnostyka', path: '/data', icon: <DataObjectOutlinedIcon /> },
  { label: 'Ustawienia', description: 'Integracje i konfiguracja aplikacji', path: '/settings', icon: <SettingsOutlinedIcon /> },
];

export default function MorePage() {
  const navigate = useNavigate();
  const preferences = useUiPreferences();
  const savePreferences = useSaveUiPreferences();
  return (
    <Page title="Więcej" subtitle="Pełna pogoda, profil sportowy, zdrowie oraz kontrola danych w jednym miejscu." maxWidth={1100}>
      <Grid container spacing={2}>
        {items.map((item, index) => (
          <Grid
            key={`${item.path}-${item.label}`}
            size={{
              xs: 12,
              sm: 6
            }}>
            <Surface padding="none" interactive variant={index === 0 ? 'accent' : 'default'} sx={{ height: '100%' }}>
              <ButtonBase
                onClick={() => navigate(item.path)}
                sx={{
                  width: '100%',
                  height: '100%',
                  p: (theme) => getAppThemeTokens(theme).space.card,
                  borderRadius: (theme) => `${getAppThemeTokens(theme).radius.card}px`,
                  textAlign: 'left',
                  alignItems: 'stretch',
                  '&:focus-visible': { boxShadow: (theme) => getAppThemeTokens(theme).focusRing },
                }}
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
                      bgcolor: index === 0 ? 'primary.main' : (theme) => theme.tokens.activeOverlay,
                      '& svg': { fontSize: (theme) => getAppThemeTokens(theme).icon.lg },
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1">{item.label}</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mt: 0.35
                      }}>{item.description}</Typography>
                  </Box>
                  <ArrowForwardRoundedIcon sx={{ color: 'text.secondary', alignSelf: 'center' }} />
                </Stack>
              </ButtonBase>
            </Surface>
          </Grid>
        ))}
        <Grid size={12}>
          <Surface>
            {preferences.data ? (
              <MobileNavigationSettings
                preferences={preferences.data}
                saving={savePreferences.isPending}
                onSave={async (nextPreferences) => {
                  await savePreferences.mutateAsync(nextPreferences);
                }}
              />
            ) : preferences.isError ? (
              <Alert severity="warning">Nie udało się wczytać ustawień skrótów mobilnych.</Alert>
            ) : (
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>Wczytywanie skrótów mobilnych…</Typography>
            )}
          </Surface>
        </Grid>
      </Grid>
    </Page>
  );
}

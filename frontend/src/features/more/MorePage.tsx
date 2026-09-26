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
import { useI18n } from '@/i18n';
import { getAppThemeTokens } from '@/theme/theme';
import { Page, Surface } from '@/ui';

import type { ReactElement } from 'react';

const items: Array<{ key: 'weather' | 'profile' | 'health' | 'weight' | 'data' | 'settings'; path: string; icon: ReactElement }> = [
  { key: 'weather', path: '/weather', icon: <CloudOutlinedIcon /> },
  { key: 'profile', path: '/profile', icon: <PersonOutlineIcon /> },
  { key: 'health', path: '/health', icon: <MonitorHeartOutlinedIcon /> },
  { key: 'weight', path: '/weight', icon: <ScaleOutlinedIcon /> },
  { key: 'data', path: '/data', icon: <DataObjectOutlinedIcon /> },
  { key: 'settings', path: '/settings', icon: <SettingsOutlinedIcon /> },
];

export default function MorePage() {
  const navigate = useNavigate();
  const preferences = useUiPreferences();
  const savePreferences = useSaveUiPreferences();
  const { t } = useI18n();
  return (
    <Page title={t('more.title')} subtitle={t('more.subtitle')} maxWidth={1100}>
      <Grid container spacing={2}>
        {items.map((item, index) => (
          <Grid
            key={item.key}
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
                      color: index === 0 ? 'primary.contrastText' : 'primary.main',
                      bgcolor: index === 0 ? 'primary.main' : (theme) => getAppThemeTokens(theme).activeOverlay,
                      '& svg': { fontSize: (theme) => getAppThemeTokens(theme).icon.lg },
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1">{t(`more.items.${item.key}.label`)}</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mt: 0.35
                      }}>{t(`more.items.${item.key}.description`)}</Typography>
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
              <Alert severity="warning">{t('more.shortcutsError')}</Alert>
            ) : (
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>{t('more.shortcutsLoading')}</Typography>
            )}
          </Surface>
        </Grid>
      </Grid>
    </Page>
  );
}

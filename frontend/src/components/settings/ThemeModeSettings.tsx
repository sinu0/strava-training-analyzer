import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { useColorMode } from '@/context/ThemeModeContext';
import { useI18n } from '@/i18n';
import type { AppColorMode } from '@/theme/theme';
import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

const OPTIONS: Array<{ mode: AppColorMode; icon: ReactNode }> = [
  { mode: 'dark', icon: <DarkModeOutlinedIcon /> },
  { mode: 'light', icon: <LightModeOutlinedIcon /> },
];

/** Lets people change the persistent color preference from Settings. */
export default function ThemeModeSettings() {
  const { mode, setMode } = useColorMode();
  const { t } = useI18n();

  return (
    <Box>
      <Typography component="h2" variant="h6" sx={{
        fontWeight: 780
      }}>{t('themeSettings.title')}</Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mt: 0.5
        }}>
        {t('themeSettings.description')}
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={mode}
        aria-label={t('themeSettings.ariaLabel')}
        onChange={(_event, nextMode: AppColorMode | null) => {
          if (nextMode) setMode(nextMode);
        }}
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
          '& .MuiToggleButtonGroup-grouped': {
            m: '0 !important',
            border: '1px solid !important',
            borderColor: 'divider !important',
            borderRadius: '14px !important',
          },
        }}
      >
        {OPTIONS.map((option) => (
          <ToggleButton
            key={option.mode}
            value={option.mode}
            aria-label={t(`themeSettings.${option.mode}.label`)}
            sx={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              px: 1.5,
              py: 1.3,
              gap: 1.25,
              color: 'text.primary',
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: (theme) => getAppThemeTokens(theme).activeOverlay,
                borderColor: 'primary.main !important',
              },
            }}
          >
            {option.icon}
            <Stack spacing={0.15} sx={{
              alignItems: "flex-start"
            }}>
              <Typography variant="body2" sx={{
                fontWeight: 760
              }}>{t(`themeSettings.${option.mode}.label`)}</Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textTransform: 'none'
                }}>
                {t(`themeSettings.${option.mode}.description`)}
              </Typography>
            </Stack>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

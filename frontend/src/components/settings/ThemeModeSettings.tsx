import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { useColorMode } from '@/context/ThemeModeContext';
import type { AppColorMode } from '@/theme/theme';

import type { ReactNode } from 'react';

const OPTIONS: Array<{
  mode: AppColorMode;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    mode: 'dark',
    label: 'Ciemny motyw',
    description: 'Domyślny, kontrastowy widok do pracy wieczorem.',
    icon: <DarkModeOutlinedIcon />,
  },
  {
    mode: 'light',
    label: 'Jasny motyw',
    description: 'Lekki widok inspirowany panelem treningowym.',
    icon: <LightModeOutlinedIcon />,
  },
];

/** Lets people change the persistent color preference from Settings. */
export default function ThemeModeSettings() {
  const { mode, setMode } = useColorMode();

  return (
    <Box>
      <Typography component="h2" variant="h6" fontWeight={780}>Motyw aplikacji</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Wybierz jasny lub ciemny wygląd. Zapisujemy tę preferencję lokalnie na tym urządzeniu.
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={mode}
        aria-label="Wybór motywu aplikacji"
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
            aria-label={option.label}
            sx={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              px: 1.5,
              py: 1.3,
              gap: 1.25,
              color: 'text.primary',
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: (theme) => theme.tokens.activeOverlay,
                borderColor: 'primary.main !important',
              },
            }}
          >
            {option.icon}
            <Stack spacing={0.15} alignItems="flex-start">
              <Typography variant="body2" fontWeight={760}>{option.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'none' }}>
                {option.description}
              </Typography>
            </Stack>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

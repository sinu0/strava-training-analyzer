import { Box, Stack, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

export interface GlassStatProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  icon?: ReactNode;
  size?: 'sm' | 'lg';
}

/** Frosted figure tile placed over photography (hero cards). */
export default function GlassStat({ label, value, unit, icon, size = 'sm' }: GlassStatProps) {
  return (
    <Box
      sx={(theme) => {
        const tokens = getAppThemeTokens(theme);
        return {
          px: size === 'lg' ? 2 : 1.25,
          py: size === 'lg' ? 1.4 : 0.9,
          minWidth: size === 'lg' ? 108 : 92,
          borderRadius: `${size === 'lg' ? tokens.radius.panel : tokens.radius.control}px`,
          bgcolor: tokens.glass.bg,
          border: `1px solid ${tokens.glass.border}`,
          backdropFilter: tokens.glass.blur,
          WebkitBackdropFilter: tokens.glass.blur,
          color: tokens.media.ink,
        };
      }}
    >
      {icon ? <Box sx={{ mb: 0.75, display: 'flex', '& svg': { fontSize: 20 } }}>{icon}</Box> : null}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline' }}>
        <Typography component="span" sx={(theme) => ({ color: 'inherit', fontWeight: getAppThemeTokens(theme).type.weight.display, fontSize: size === 'lg' ? '1.65rem' : '0.95rem', letterSpacing: '-0.02em', lineHeight: 1.1 })}>
          {value}
        </Typography>
        {unit ? <Typography component="span" variant="caption" sx={(theme) => ({ color: getAppThemeTokens(theme).media.inkMuted, fontWeight: 600 })}>{unit}</Typography> : null}
      </Stack>
      <Typography variant="caption" sx={(theme) => { const tokens = getAppThemeTokens(theme); return { display: 'block', mt: 0.2, color: tokens.media.inkMuted, fontWeight: 650, letterSpacing: '0.06em', textTransform: 'uppercase' }; }}>
        {label}
      </Typography>
    </Box>
  );
}

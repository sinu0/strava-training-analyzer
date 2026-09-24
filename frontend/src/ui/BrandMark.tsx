import { Box } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

/** Rounded brand tile with the accent gradient; the app logo in top bar and sidebar. */
export default function BrandMark({ icon, size = 40 }: { icon: ReactNode; size?: number }) {
  return (
    <Box
      aria-hidden
      sx={(theme) => {
        const tokens = getAppThemeTokens(theme);
        return {
          width: size,
          height: size,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: `${tokens.radius.control - 2}px`,
          color: tokens.onAccent,
          background: tokens.gradients.strava,
          boxShadow: tokens.glow.accent,
          '& svg': { fontSize: size * 0.55 },
        };
      }}
    >
      {icon}
    </Box>
  );
}

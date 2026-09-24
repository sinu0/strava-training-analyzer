import { Box, type SxProps, type Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getAppThemeTokens } from '@/theme/theme';

import { toneColor, type Tone } from './tokens';

import type { ReactNode } from 'react';

export interface IconBubbleProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** `neutral` keeps the quiet bubble of the reference; other tones tint icon and bubble. */
  tone?: Tone;
  variant?: 'soft' | 'solid' | 'glass';
  sx?: SxProps<Theme>;
  /** Icons are decorative by default; set false when the bubble holds meaningful content. */
  decorative?: boolean;
}

/** Circular icon holder used by widget headers, stat rows and empty states. */
export default function IconBubble({ children, size = 'md', tone = 'neutral', variant = 'soft', sx, decorative = true }: IconBubbleProps) {
  return (
    <Box
      aria-hidden={decorative || undefined}
      sx={[
        (theme) => {
          const tokens = getAppThemeTokens(theme);
          const dimension = { sm: tokens.control.sm, md: tokens.control.md, lg: 64 }[size];
          const color = toneColor(theme, tone);
          return {
            width: dimension,
            height: dimension,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            color: variant === 'solid' ? theme.palette.getContrastText(color)
              : variant === 'glass' ? tokens.media.ink
                : tone === 'neutral' ? 'text.primary' : color,
            bgcolor: variant === 'solid' ? color
              : variant === 'glass' ? tokens.glass.bgStrong
                : tone === 'neutral' ? tokens.iconBubble : alpha(color, 0.12),
            backdropFilter: variant === 'glass' ? tokens.glass.blur : undefined,
            '& svg': { fontSize: size === 'lg' ? tokens.icon.xl : size === 'sm' ? tokens.icon.sm : tokens.icon.md },
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

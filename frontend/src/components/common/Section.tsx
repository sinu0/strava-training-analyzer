import { Box, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
  accentColor?: string;
  interactive?: boolean;
  contentSx?: SxProps<Theme>;
  children: ReactNode;
}

/**
 * Creates the shared surfaced section shell used across dashboard-style panels.
 */
export default function Section({
  title,
  subtitle,
  action,
  noPadding,
  accentColor,
  interactive = false,
  contentSx,
  children,
}: SectionProps) {
  const bodySx: SxProps<Theme> = noPadding
    ? contentSx ?? {}
    : [
        {
          px: (theme) => getAppThemeTokens(theme).space.card,
          pb: (theme) => getAppThemeTokens(theme).space.card,
          pt: title ? 1 : (theme) => getAppThemeTokens(theme).space.card,
        },
        ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : []),
      ];

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: (theme) => `${getAppThemeTokens(theme).radius.card}px`,
        border: (theme) => `1px solid ${theme.tokens?.surfaceBorder ?? theme.palette.divider}`,
        boxShadow: (theme) => theme.tokens?.cardShadow ?? 'none',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
        transition: (theme) => theme.tokens?.transition ?? 'all 160ms ease',
        animation: 'sectionFadeInUp 320ms ease',
        '&::before': accentColor ? {
          content: '""',
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 4,
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
          opacity: 0.9,
        } : undefined,
        ...(interactive
          ? {
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => theme.tokens?.cardShadowHover ?? 'none',
              },
            }
          : null),
      }}
    >
      {!!(title || action) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: (theme) => getAppThemeTokens(theme).space.card,
            pt: (theme) => getAppThemeTokens(theme).space.card,
            pb: subtitle ? 0.5 : 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {!!title && (
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: (theme) => getAppThemeTokens(theme).type.weight.heading,
                  letterSpacing: (theme) => getAppThemeTokens(theme).type.tracking.heading,
                }}
              >
                {title}
              </Typography>
            )}
            {!!subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      <Box sx={bodySx}>
        {children}
      </Box>
    </Box>
  );
}

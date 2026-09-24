import { Paper, type PaperProps } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getAppThemeTokens } from '@/theme/theme';

export type SurfaceVariant = 'default' | 'accent' | 'muted' | 'glass' | 'outlined';
export type SurfacePadding = 'none' | 'sm' | 'md';

export interface SurfaceProps extends Omit<PaperProps, 'variant'> {
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
  /** Lifts on hover; use for surfaces that navigate. */
  interactive?: boolean;
  radius?: 'panel' | 'card' | 'hero';
}

/**
 * The single card surface of the application. Every widget, panel and hero sits on it,
 * so radius, border, shadow and padding change in one place.
 */
export default function Surface({
  variant = 'default',
  padding = 'md',
  interactive = false,
  radius = 'card',
  children,
  sx,
  ...props
}: SurfaceProps) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={[
        (theme) => {
          const tokens = getAppThemeTokens(theme);
          const accent = theme.palette.primary.main;
          const background = {
            default: theme.palette.background.paper,
            accent: theme.palette.background.paper,
            muted: tokens.surfaceMuted,
            glass: tokens.glass.bg,
            outlined: 'transparent',
          }[variant];
          return {
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
            p: padding === 'none' ? 0 : padding === 'sm' ? { xs: 2, md: 2.5 } : tokens.space.card,
            bgcolor: background,
            border: '1px solid',
            borderColor: variant === 'accent' ? alpha(accent, 0.42)
              : variant === 'glass' ? tokens.glass.border
                : variant === 'outlined' ? tokens.surfaceStrongBorder : tokens.surfaceBorder,
            borderRadius: `${tokens.radius[radius]}px`,
            backgroundImage: variant === 'accent'
              ? `radial-gradient(circle at 96% 0%, ${alpha(accent, tokens.mode === 'light' ? 0.14 : 0.16)}, transparent 38%), linear-gradient(145deg, ${tokens.surfaceSubtle}, transparent)`
              : variant === 'default' ? `linear-gradient(145deg, ${tokens.surfaceSubtle}, transparent)` : 'none',
            boxShadow: variant === 'muted' || variant === 'outlined' || variant === 'glass' ? 'none'
              : variant === 'accent' ? tokens.cardShadowHover : tokens.cardShadow,
            backdropFilter: variant === 'glass' ? tokens.glass.blur : undefined,
            transition: `transform ${tokens.motion.standard}, border-color ${tokens.motion.standard}, box-shadow ${tokens.motion.standard}`,
            ...(interactive ? {
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)', borderColor: alpha(accent, 0.38), boxShadow: tokens.cardShadowHover },
              '&:focus-visible': { boxShadow: tokens.focusRing },
            } : {}),
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Paper>
  );
}

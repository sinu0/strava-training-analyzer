import { Paper, type PaperProps } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

interface PerformanceSurfaceProps extends PaperProps {
  accent?: boolean;
  interactive?: boolean;
}

export default function PerformanceSurface({
  accent = false,
  interactive = false,
  children,
  sx,
  ...props
}: PerformanceSurfaceProps) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={[
        {
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: (theme) => accent ? 'rgba(252,76,2,0.42)' : theme.tokens?.surfaceBorder ?? theme.palette.divider,
          borderRadius: (theme) => `${getAppThemeTokens(theme).radius.card}px`,
          bgcolor: 'background.paper',
          backgroundImage: (theme) => {
            const subtle = theme.tokens?.surfaceSubtle ?? 'rgba(255,255,255,0.025)';
            const accentOpacity = theme.tokens?.mode === 'light' ? '0.14' : '0.16';
            return accent
              ? `radial-gradient(circle at 96% 0%, rgba(252,76,2,${accentOpacity}), transparent 38%), linear-gradient(145deg, ${subtle}, transparent)`
              : `linear-gradient(145deg, ${subtle}, transparent)`;
          },
          boxShadow: (theme) => accent
            ? theme.tokens?.cardShadowHover ?? '0 20px 48px rgba(0,0,0,0.26)'
            : theme.tokens?.cardShadow ?? '0 12px 34px rgba(0,0,0,0.18)',
          transition: (theme) => {
            const tokens = getAppThemeTokens(theme);
            return `transform ${tokens.motion.standard}, border-color ${tokens.motion.standard}, box-shadow ${tokens.motion.standard}`;
          },
          ...(interactive ? {
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: 'rgba(252,76,2,0.38)',
              boxShadow: (theme) => theme.tokens?.cardShadowHover ?? '0 20px 48px rgba(0,0,0,0.26)',
            },
          } : {}),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Paper>
  );
}

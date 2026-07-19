import { Paper, type PaperProps } from '@mui/material';

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
          borderColor: accent ? 'rgba(255,107,53,0.42)' : 'divider',
          borderRadius: 3,
          bgcolor: 'background.paper',
          backgroundImage: accent
            ? 'radial-gradient(circle at 96% 0%, rgba(255,107,53,0.13), transparent 38%), linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0))'
            : 'linear-gradient(145deg, rgba(255,255,255,0.025), rgba(255,255,255,0))',
          boxShadow: accent ? '0 22px 70px rgba(0,0,0,0.28)' : '0 12px 34px rgba(0,0,0,0.18)',
          transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
          ...(interactive ? {
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: 'rgba(255,107,53,0.38)',
              boxShadow: '0 20px 48px rgba(0,0,0,0.26)',
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

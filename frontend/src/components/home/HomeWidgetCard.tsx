import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { Box, Paper, Stack, Typography } from '@mui/material';

import { SURFACE_COLORS, alphaColor } from '@/utils/colors';

type HomeWidgetResponsiveValue =
  | number
  | string
  | Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number | string>>;

type HomeWidgetArtwork = {
  src: string;
  alt: string;
  testId?: string;
  objectPosition?: string;
  objectFit?: 'cover' | 'contain';
  height?: HomeWidgetResponsiveValue;
};

type HomeWidgetCardProps = {
  title: string;
  subtitle?: string;
  accentColor: string;
  aspectRatio?: HomeWidgetResponsiveValue;
  minHeight?: HomeWidgetResponsiveValue;
  subtitleLines?: number;
  testId?: string;
  artwork?: HomeWidgetArtwork;
  onClick?: () => void;
  children: React.ReactNode;
};

/**
 * Compact editorial widget surface used by the Home page side rail, with optional atmospheric artwork.
 */
export default function HomeWidgetCard({
  title,
  subtitle,
  accentColor,
  aspectRatio = 'auto',
  minHeight,
  subtitleLines = 2,
  testId,
  artwork,
  onClick,
  children,
}: HomeWidgetCardProps) {
  return (
    <Paper
      data-testid={testId}
      onClick={onClick}
      sx={{
        pt: { xs: 1.8, md: 2 },
        pb: { xs: 1.75, md: 1.95 },
        pl: { xs: 1.8, md: 2 },
        pr: { xs: 1.7, md: 1.9 },
        height: 'auto',
        aspectRatio,
        minHeight: minHeight ?? (artwork ? { xs: 360, sm: 400 } : undefined),
        minWidth: 0,
        borderRadius: 4.5,
        border: '1px solid',
        borderColor: alphaColor(accentColor, 0.18),
        bgcolor: SURFACE_COLORS.elevated,
        backgroundImage: `linear-gradient(180deg, ${alphaColor(SURFACE_COLORS.subtle, 0.7)} 0%, ${alphaColor(
          SURFACE_COLORS.elevated,
          0.98,
        )} 100%)`,
        overflow: 'hidden',
        boxShadow: (theme: { tokens?: { cardShadow?: string } }) => theme.tokens?.cardShadow ?? 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              borderColor: alphaColor(accentColor, 0.38),
              '& .home-widget-art-image': {
                transform: 'scale(1.03)',
              },
            }
          : undefined,
      }}
    >
      <Stack spacing={1.25} sx={{ height: '100%' }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
          sx={{ px: 0.35 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'text.primary',
                letterSpacing: '0.09em',
                fontWeight: 800,
                lineHeight: 1.1,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                pl: '0.08em',
              }}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                variant="caption"
                color="text.primary"
                sx={{
                  display: '-webkit-box',
                  mt: 0.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: 0.78,
                  lineHeight: 1.28,
                  WebkitLineClamp: subtitleLines,
                  WebkitBoxOrient: 'vertical',
                  pl: '0.08em',
                }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>

          {onClick ? (
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: alphaColor(accentColor, 0.16),
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowOutwardIcon sx={{ fontSize: 16 }} />
            </Box>
          ) : null}
        </Stack>

        {artwork ? (
          <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3.25,
                height: artwork.height ?? { xs: 94, sm: 112 },
                border: '1px solid',
                borderColor: alphaColor(accentColor, 0.16),
                bgcolor: alphaColor(SURFACE_COLORS.subtle, 0.4),
            }}
          >
            <Box
              component="img"
              src={artwork.src}
              alt={artwork.alt}
              data-testid={artwork.testId}
              className="home-widget-art-image"
              sx={{
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: artwork.objectFit ?? 'cover',
                objectPosition: artwork.objectPosition ?? 'center',
                filter: 'saturate(0.9) contrast(1.03)',
                transform: artwork.objectFit === 'contain' ? 'none' : 'scale(1.01)',
                transition: 'transform 0.24s ease',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, ${alphaColor(SURFACE_COLORS.subtle, 0.08)} 0%, ${alphaColor(
                  '#0D1117',
                  0.34,
                )} 100%)`,
              }}
            />
          </Box>
        ) : null}

        <Box
          sx={{
            minHeight: 0,
            minWidth: 0,
            flex: 1,
            overflow: 'hidden',
            p: { xs: 1.35, md: 1.5 },
            borderRadius: 3.25,
            bgcolor: alphaColor('#0D1117', 0.28),
            border: '1px solid',
            borderColor: alphaColor(accentColor, 0.12),
          }}
        >
          {children}
        </Box>
      </Stack>
    </Paper>
  );
}

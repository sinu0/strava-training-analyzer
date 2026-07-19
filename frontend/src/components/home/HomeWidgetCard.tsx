import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { Box, Paper, Stack, Typography } from '@mui/material';

import { alphaColor } from '@/utils/colors';

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
        p: { xs: 2.5, md: 3 },
        height: 'auto',
        aspectRatio,
        minHeight: minHeight ?? (artwork ? { xs: 360, sm: 400 } : undefined),
        minWidth: 0,
        borderRadius: 3.5,
        border: '1px solid',
        borderColor: (theme) => theme.tokens?.surfaceBorder ?? theme.palette.divider,
        bgcolor: 'background.paper',
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
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'text.primary',
                fontWeight: 800,
                lineHeight: 1.2,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  mt: 0.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.28,
                  WebkitLineClamp: subtitleLines,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>

          {onClick ? (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                bgcolor: (theme) => theme.tokens?.iconBubble ?? 'rgba(255,255,255,0.05)',
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowOutwardIcon sx={{ fontSize: 18 }} />
            </Box>
          ) : null}
        </Stack>

        {artwork ? (
          <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3,
                height: artwork.height ?? { xs: 94, sm: 112 },
                border: '1px solid',
                borderColor: (theme) => theme.tokens?.surfaceBorder ?? theme.palette.divider,
                bgcolor: (theme) => theme.tokens?.iconBubble ?? 'rgba(255,255,255,0.05)',
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
                background: 'linear-gradient(180deg, rgba(13,17,23,0.03) 0%, rgba(13,17,23,0.32) 100%)',
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
            borderRadius: 3,
            bgcolor: (theme) => theme.tokens?.iconBubble ?? 'rgba(255,255,255,0.05)',
            border: '1px solid',
            borderColor: (theme) => theme.tokens?.surfaceBorder ?? theme.palette.divider,
          }}
        >
          {children}
        </Box>
      </Stack>
    </Paper>
  );
}

import { Box, Paper, Stack, Typography } from '@mui/material';

import { SURFACE_COLORS, alphaColor } from '@/utils/colors';

type EditorialHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  accentColor: string;
  imageSrc: string;
  imageAlt: string;
  highlights?: string[];
  imagePosition?: string;
};

/**
 * Shared editorial hero surface for key top-level pages using the app's darker illustration style.
 */
export default function EditorialHero({
  eyebrow,
  title,
  description,
  accentColor,
  imageSrc,
  imageAlt,
  highlights = [],
  imagePosition = 'center',
}: EditorialHeroProps) {
  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2 },
        mb: { xs: 2, md: 2.5 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: alphaColor(accentColor, 0.18),
        bgcolor: SURFACE_COLORS.elevated,
        overflow: 'hidden',
        boxShadow: (theme: { tokens?: { cardShadow?: string } }) => theme.tokens?.cardShadow ?? 'none',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1.5, md: 2 }} alignItems="stretch">
        <Stack spacing={1.25} sx={{ flex: 1, justifyContent: 'space-between', minWidth: 0 }}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                mb: 0.25,
                color: 'text.primary',
                letterSpacing: '0.09em',
                fontWeight: 800,
              }}
            >
              {eyebrow}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05, maxWidth: 620 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
              {description}
            </Typography>
          </Box>

          {highlights.length ? (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {highlights.map((highlight) => (
                <Box
                  key={highlight}
                  sx={{
                    px: 1.1,
                    py: 0.7,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: alphaColor(accentColor, 0.2),
                    bgcolor: alphaColor('#0D1117', 0.28),
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>
                    {highlight}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : null}
        </Stack>

        <Box
          sx={{
            position: 'relative',
            flexBasis: { xs: 'auto', md: '40%' },
            minWidth: { md: 280 },
            borderRadius: 3,
            overflow: 'hidden',
            minHeight: { xs: 160, md: 220 },
            border: '1px solid',
            borderColor: alphaColor(accentColor, 0.14),
          }}
        >
          <Box
            component="img"
            src={imageSrc}
            alt={imageAlt}
            sx={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
              objectPosition: imagePosition,
              filter: 'saturate(0.88) contrast(1.03)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${alphaColor('#0D1117', 0.12)} 0%, ${alphaColor(
                '#0D1117',
                0.58,
              )} 100%)`,
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

import { Box, Paper, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getAppThemeTokens } from '@/theme/theme';

type EditorialHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  accentColor: string;
  imageSrc: string;
  imageAlt: string;
  highlights?: string[];
  imagePosition?: string;
  compact?: boolean;
};

/**
 * Shared editorial hero surface for key top-level pages using the app's darker illustration style.
 */
export default function EditorialHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  accentColor,
  highlights = [],
  imagePosition = 'center',
  compact = false,
}: EditorialHeroProps) {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: compact ? { xs: 1.25, md: 1.5 } : { xs: 1.5, md: 2 },
        mb: compact ? { xs: 1.5, md: 2 } : { xs: 2, md: 2.5 },
        borderRadius: (currentTheme) => `${getAppThemeTokens(currentTheme).radius.card}px`,
        border: '1px solid',
        borderColor: (currentTheme) => currentTheme.tokens.surfaceBorder,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        boxShadow: (currentTheme) => currentTheme.tokens.cardShadow,
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
                color: accentColor,
                letterSpacing: (currentTheme) => getAppThemeTokens(currentTheme).type.tracking.eyebrow,
              }}
            >
              {eyebrow}
            </Typography>
            <Typography variant={compact ? 'h5' : 'h4'} sx={{ maxWidth: 620 }}>
              {title}
            </Typography>
            <Typography variant={compact ? 'body2' : 'body2'} color="text.secondary" sx={{ mt: compact ? 0.75 : 1, maxWidth: 720, ...(compact && { fontSize: '0.82rem' }) }}>
              {description}
            </Typography>
          </Box>

          {highlights.length ? (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {highlights.map((highlight) => (
                <Box
                  key={highlight}
                  sx={{
                    px: compact ? 0.9 : 1.1,
                    py: compact ? 0.45 : 0.7,
                    borderRadius: 999,
                    bgcolor: (currentTheme) => getAppThemeTokens(currentTheme).iconBubble,
                    border: '1px solid',
                    borderColor: (currentTheme) => currentTheme.tokens.surfaceBorder,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: (currentTheme) => getAppThemeTokens(currentTheme).type.weight.label }}>
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
            borderRadius: (currentTheme) => `${getAppThemeTokens(currentTheme).radius.panel}px`,
            overflow: 'hidden',
            minHeight: { xs: compact ? 92 : 150, md: compact ? 120 : 210 },
            border: '1px solid',
            borderColor: (currentTheme) => currentTheme.tokens.surfaceBorder,
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
              background: theme.tokens?.heroScrim ?? 'linear-gradient(135deg, rgba(8,13,19,0.12), rgba(8,13,19,0.58))',
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

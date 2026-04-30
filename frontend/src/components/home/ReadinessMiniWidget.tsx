import { Box, Stack, Typography } from '@mui/material';

import HomeWidgetCard from './HomeWidgetCard';
import { alphaColor } from '@/utils/colors';
import { getHomeWidgetIllustrationPath } from '@/utils/illustrationAssets';
import { getReadinessColor } from '@/utils/readinessScales';

const READINESS_ART = getHomeWidgetIllustrationPath('readiness');

interface ReadinessMiniWidgetProps {
  readiness: { score?: number; dayLabel?: string; dayFocus?: string } | undefined;
  onOpen: () => void;
  artTestId?: string;
}

export default function ReadinessMiniWidget({ readiness, onOpen, artTestId }: ReadinessMiniWidgetProps) {
  const accentColor = getReadinessColor(readiness?.score ?? 55);

  return (
    <HomeWidgetCard
      title="Gotowość"
      subtitle={readiness?.dayLabel ?? 'Brak decyzji dnia'}
      accentColor={accentColor}
      minHeight={{ xs: 432, sm: 456, xl: 476 }}
      artwork={{
        src: READINESS_ART,
        alt: 'Gotowość na Home',
        testId: artTestId ?? 'home-widget-art-readiness',
        objectPosition: 'center 48%',
        height: { xs: 122, sm: 146 },
      }}
      subtitleLines={1}
      onClick={onOpen}
    >
      <Stack justifyContent="space-between" alignItems="center" spacing={1.4} sx={{ height: '100%', minWidth: 0 }}>
        <Box
          sx={{
            width: { xs: 82, sm: 96 },
            height: { xs: 82, sm: 96 },
            borderRadius: '50%',
            border: { xs: '7px solid', sm: '8px solid' },
            borderColor: alphaColor(accentColor, 0.2),
            boxShadow: `inset 0 0 0 1px ${alphaColor(accentColor, 0.18)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alphaColor(accentColor, 0.08),
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1, color: accentColor }}>
              {readiness?.score ?? '--'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              /100
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 0, maxWidth: 240 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.35,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {readiness?.dayFocus ?? 'Po porannym check-inie pojawi się decyzja.'}
          </Typography>
        </Box>
      </Stack>
    </HomeWidgetCard>
  );
}

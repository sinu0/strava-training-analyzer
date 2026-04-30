import { Box, Stack, Typography } from '@mui/material';

import HomeWidgetCard from './HomeWidgetCard';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';
import { getHomeWidgetIllustrationPath } from '@/utils/illustrationAssets';

const BLOCK_ART = getHomeWidgetIllustrationPath('block');

interface BlockMiniWidgetProps {
  blockHealth: {
    status?: string;
    label?: string;
    description?: string | null;
    nextFocus?: string | null;
  } | undefined;
  onOpen: () => void;
  artTestId?: string;
}

export default function BlockMiniWidget({ blockHealth, onOpen, artTestId }: BlockMiniWidgetProps) {
  return (
    <HomeWidgetCard
      title="Blok"
      subtitle={blockHealth?.status ?? 'Brak aktywnego programu'}
      accentColor={STATUS_COLORS.warning}
      minHeight={{ xs: 392, sm: 408, xl: 428 }}
      artwork={{
        src: BLOCK_ART,
        alt: 'Blok treningowy na Home',
        testId: artTestId ?? 'home-widget-art-blok',
        objectPosition: 'center 50%',
        height: { xs: 124, sm: 146 },
      }}
      subtitleLines={1}
      onClick={onOpen}
    >
      <Stack justifyContent="space-between" sx={{ height: '100%' }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              lineHeight: 1.05,
              mb: 0.75,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {blockHealth?.label ?? 'Brak aktywnego bloku'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {blockHealth?.description ?? 'Planner pokaże stan bloku, gdy pojawi się aktywny program.'}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1,
            borderRadius: 3,
            bgcolor: alphaColor(STATUS_COLORS.warning, 0.12),
            border: '1px solid',
            borderColor: alphaColor(STATUS_COLORS.warning, 0.18),
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Najbliższy focus
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              mt: 0.25,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {blockHealth?.nextFocus ?? 'Po aktywacji programu pojawi się kolejny krok.'}
          </Typography>
        </Box>
      </Stack>
    </HomeWidgetCard>
  );
}

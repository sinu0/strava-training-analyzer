import BoltIcon from '@mui/icons-material/Bolt';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Stack, Typography } from '@mui/material';

import HomeWidgetCard from './HomeWidgetCard';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';
import { getHomeWidgetIllustrationPath } from '@/utils/illustrationAssets';

const PROGRESS_ART = getHomeWidgetIllustrationPath('progress');

interface ProgressionLevel {
  system: string;
  label: string;
  level: number;
  currentLoad: number;
  previousLoad: number;
  targetLoad: number;
  trend: string;
  description: string;
  nextRecommendation: string;
}

interface ProgressMiniWidgetProps {
  progression: ProgressionLevel | undefined;
  subtitle?: string;
  onOpen: () => void;
  artTestId?: string;
}

export default function ProgressMiniWidget({ progression, subtitle, onOpen, artTestId }: ProgressMiniWidgetProps) {
  const trendIcon =
    progression?.trend === 'UP' ? (
      <TrendingUpIcon sx={{ fontSize: 16 }} />
    ) : progression?.trend === 'DOWN' ? (
      <TrendingDownIcon sx={{ fontSize: 16 }} />
    ) : (
      <TrendingFlatIcon sx={{ fontSize: 16 }} />
    );

  return (
    <HomeWidgetCard
      title="Postęp"
      subtitle={subtitle ?? 'Brak sygnału progresji'}
      accentColor={STATUS_COLORS.accent}
      minHeight={{ xs: 408, sm: 424, xl: 444 }}
      artwork={{
        src: PROGRESS_ART,
        alt: 'Postęp na Home',
        testId: artTestId ?? 'home-widget-art-progres',
        objectPosition: 'center 52%',
        height: { xs: 118, sm: 138 },
      }}
      subtitleLines={1}
      onClick={onOpen}
    >
      <Stack justifyContent="space-between" sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1 }}>
              {progression?.level ?? '--'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {progression?.label ?? 'Brak systemu'}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: alphaColor(STATUS_COLORS.accent, 0.16),
              color: STATUS_COLORS.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {trendIcon}
          </Box>
        </Stack>

        <Stack spacing={0.75}>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              minWidth: 0,
              flex: '1 1 96px',
              px: 0.95,
              py: 0.75,
              borderRadius: 999,
              bgcolor: alphaColor(STATUS_COLORS.accent, 0.12),
              border: '1px solid',
              borderColor: alphaColor(STATUS_COLORS.accent, 0.16),
            }}
          >
            <Box sx={{ color: STATUS_COLORS.accent, display: 'flex', alignItems: 'center' }}>
              <BoltIcon sx={{ fontSize: 14 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                Obciążenie
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {progression ? `${Math.round(progression.currentLoad)}/${Math.round(progression.targetLoad)}` : '--'}
              </Typography>
            </Box>
          </Stack>
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
            {progression?.nextRecommendation ?? 'Brak mocnego sygnału progresji dla tego systemu.'}
          </Typography>
        </Stack>
      </Stack>
    </HomeWidgetCard>
  );
}

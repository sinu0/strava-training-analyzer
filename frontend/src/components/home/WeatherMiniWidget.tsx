import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { Box, Stack, Typography } from '@mui/material';

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon';
import type { WeatherGradient } from '@/types/analytics';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';
import { getHomeWidgetIllustrationPath } from '@/utils/illustrationAssets';

import HomeWidgetCard from './HomeWidgetCard';

const WEATHER_ART = getHomeWidgetIllustrationPath('weather');

function getWeatherAccent(score: number | undefined) {
  if (score == null) return STATUS_COLORS.info;
  if (score >= 80) return STATUS_COLORS.success;
  if (score >= 60) return STATUS_COLORS.accent;
  if (score >= 40) return STATUS_COLORS.warning;
  return STATUS_COLORS.error;
}

function MetricPill({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
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
        bgcolor: alphaColor(accentColor, 0.12),
        border: '1px solid',
        borderColor: alphaColor(accentColor, 0.16),
      }}
    >
      <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

interface WeatherMiniWidgetProps {
  gradient: WeatherGradient | undefined;
  onOpen: () => void;
  artTestId?: string;
}

export default function WeatherMiniWidget({ gradient, onOpen, artTestId }: WeatherMiniWidgetProps) {
  const current = gradient?.current;
  const accentColor = getWeatherAccent(current?.outdoorScore);

  return (
    <HomeWidgetCard
      title="Pogoda"
      subtitle={gradient?.locationName ?? 'Aktywna lokalizacja'}
      accentColor={accentColor}
      minHeight={{ xs: 392, sm: 408, xl: 428 }}
      artwork={{
        src: WEATHER_ART,
        alt: 'Pogoda na Home',
        testId: artTestId ?? 'home-widget-art-pogoda',
        objectPosition: 'center 62%',
        height: { xs: 124, sm: 146 },
      }}
      subtitleLines={1}
      onClick={onOpen}
    >
      <Stack justifyContent="space-between" sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1 }}>
              {current ? `${Math.round(current.temperature)}°` : '--'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: '-webkit-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {current?.weatherDescription ?? 'Ładowanie warunków'}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: alphaColor(accentColor, 0.16),
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WeatherConditionIcon
              code={current?.weatherCode}
              size={20}
              alt={current?.weatherDescription ?? 'Ikona pogody'}
            />
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <MetricPill
            icon={<AirIcon sx={{ fontSize: 14 }} />}
            label="Wiatr"
            value={current ? `${Math.round(current.windSpeed)} km/h` : '--'}
            accentColor={accentColor}
          />
          <MetricPill
            icon={<WaterDropIcon sx={{ fontSize: 14 }} />}
            label="Opad"
            value={current ? `${current.precipitation} mm` : '--'}
            accentColor={accentColor}
          />
          <MetricPill
            icon={<WeatherConditionIcon kind="sunny" size={14} alt="" />}
            label="Outdoor"
            value={current ? `${current.outdoorScore}/100` : '--'}
            accentColor={accentColor}
          />
        </Stack>
      </Stack>
    </HomeWidgetCard>
  );
}

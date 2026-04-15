
import AirIcon from '@mui/icons-material/Air';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon';
import type { CyclistType } from '@/components/weather/weatherWidgetUtils';
import {
  CHART_COLORS,
  SURFACE_COLORS,
  WEATHER_METRIC_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getWeatherIllustrationPath } from '@/utils/illustrationAssets';

import type { MouseEvent } from 'react';

interface WeatherWidgetHeaderProps {
  locationName: string;
  weatherDescription: string;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
  outdoorScore: number;
  cyclistType: CyclistType;
  onOpenSettings: (event: MouseEvent<HTMLButtonElement>) => void;
}

export default function WeatherWidgetHeader({
  locationName,
  weatherDescription,
  temperature,
  weatherCode,
  windSpeed,
  precipitation,
  outdoorScore,
  cyclistType,
  onOpenSettings,
}: WeatherWidgetHeaderProps) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Tooltip title="Zarządzaj lokalizacjami">
          <IconButton
            aria-label="Zarządzaj lokalizacjami"
            size="small"
            onClick={onOpenSettings}
            sx={{
              color: CHART_COLORS.primary,
              p: 0.5,
              bgcolor: alphaColor(CHART_COLORS.primary, 0.1),
              border: `1px solid ${alphaColor(CHART_COLORS.primary, 0.3)}`,
              '&:hover': { bgcolor: alphaColor(CHART_COLORS.primary, 0.2) },
            }}
          >
            <SettingsIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: CHART_COLORS.primary }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, lineHeight: 1.1, color: CHART_COLORS.primary }}
            >
              {locationName}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
            {weatherDescription}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 1.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: SURFACE_COLORS.subtle,
          border: `1px solid ${alphaColor(CHART_COLORS.grid, 0.5)}`,
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={getWeatherIllustrationPath(cyclistType)}
          alt={cyclistType}
          sx={{
            width: 110,
            height: 92,
            objectFit: 'contain',
            borderRadius: 1.5,
            flexShrink: 0,
          }}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {Math.round(temperature)}°
            </Typography>
            <WeatherConditionIcon code={weatherCode} size={24} />
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <AirIcon sx={{ fontSize: 16, color: WEATHER_METRIC_COLORS.wind }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {Math.round(windSpeed)} km/h
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <WaterDropIcon sx={{ fontSize: 16, color: WEATHER_METRIC_COLORS.precipitation }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {precipitation} mm
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ThermostatIcon sx={{ fontSize: 16, color: WEATHER_METRIC_COLORS.temperature }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {outdoorScore}/100
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </>
  );
}

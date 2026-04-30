import { Box } from '@mui/material';

import { getWeatherIconConfig, type WeatherIconKind } from '@/constants/weatherIcons';
import { getWeatherUiIconPath } from '@/utils/illustrationAssets';

interface WeatherConditionIconProps {
  code?: number;
  kind?: WeatherIconKind;
  size?: number;
  alt?: string;
}

export default function WeatherConditionIcon({
  code,
  kind,
  size = 20,
  alt,
}: WeatherConditionIconProps) {
  const resolvedKind = kind ?? getWeatherIconConfig(code ?? 2).kind;
  const resolvedAlt = alt ?? `Ikona pogody: ${resolvedKind}`;

  return (
    <Box
      component="img"
      src={getWeatherUiIconPath(resolvedKind)}
      alt={resolvedAlt}
      sx={{
        width: size,
        height: size,
        display: 'block',
        objectFit: 'contain',
        filter: 'drop-shadow(0 6px 12px rgba(15, 23, 42, 0.24))',
      }}
    />
  );
}

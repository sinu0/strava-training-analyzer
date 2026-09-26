import { Box } from '@mui/material';

import { weatherMessages } from '@/components/weather/messages';
import { getWeatherIconConfig, type WeatherIconKind } from '@/constants/weatherIcons';
import { getAppThemeTokens } from '@/theme/theme';
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
  const t = weatherMessages.useT();
  const resolvedKind = kind ?? getWeatherIconConfig(code ?? 2).kind;
  const resolvedAlt = alt ?? t('conditionIcon.alt', { kind: resolvedKind });

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
        filter: (theme) => getAppThemeTokens(theme).iconShadow,
      }}
    />
  );
}

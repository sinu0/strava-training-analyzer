import { WEATHER_ICON_COLORS } from '@/utils/colors';

export type WeatherIconKind = 'sunny' | 'cloud' | 'rain' | 'snow' | 'storm';

export interface WeatherIconConfig {
  kind: WeatherIconKind;
  color: string;
}

const WEATHER_ICON_RULES: Array<{
  matches: (code: number) => boolean;
  config: WeatherIconConfig;
}> = [
  { matches: (code) => code <= 1, config: { kind: 'sunny', color: WEATHER_ICON_COLORS.sunny } },
  { matches: (code) => code <= 3, config: { kind: 'cloud', color: WEATHER_ICON_COLORS.cloud } },
  { matches: (code) => code >= 95, config: { kind: 'storm', color: WEATHER_ICON_COLORS.storm } },
  { matches: (code) => code >= 71, config: { kind: 'snow', color: WEATHER_ICON_COLORS.snow } },
  { matches: (code) => code >= 51, config: { kind: 'rain', color: WEATHER_ICON_COLORS.rain } },
];

const DEFAULT_WEATHER_ICON: WeatherIconConfig = {
  kind: 'cloud',
  color: WEATHER_ICON_COLORS.cloud,
};

export function getWeatherIconConfig(code: number): WeatherIconConfig {
  return WEATHER_ICON_RULES.find((rule) => rule.matches(code))?.config ?? DEFAULT_WEATHER_ICON;
}

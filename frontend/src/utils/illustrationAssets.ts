import type { CyclistType } from '@/components/weather/weatherWidgetUtils';

import type { ReadinessImage } from './readinessScales';

export type EmptyStateType =
  | 'activities'
  | 'analytics'
  | 'training'
  | 'ai'
  | 'weight'
  | 'routes'
  | 'gallery'
  | 'health';

const WEATHER_FILE_MAP: Record<CyclistType, string> = {
  sunny: 'weather-sunny',
  rainy: 'weather-rainy',
  windy: 'weather-windy',
  snowy: 'weather-snowy',
  foggy: 'weather-foggy',
  night_clear: 'weather-night',
  cloudy: 'weather-cloudy',
  stormy: 'weather-stormy',
  partly_cloudy: 'weather-partly-cloudy',
  hot: 'weather-hot',
};

export function getReadinessIllustrationPath(image: ReadinessImage): string {
  return `/illustrations/readiness-${image}.png`;
}

export function getWeatherIllustrationPath(cyclistType: CyclistType): string {
  return `/illustrations/${WEATHER_FILE_MAP[cyclistType]}.png`;
}

export function getEmptyStateIllustrationPath(type: EmptyStateType): string {
  return `/illustrations/empty-${type}.png`;
}

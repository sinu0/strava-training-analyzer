import type { CyclistType } from '@/components/weather/weatherWidgetUtils';
import type { WeatherIconKind } from '@/constants/weatherIcons';

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

export type HomeWidgetIllustration = 'weather' | 'readiness' | 'block' | 'progress';
export type PageHeroIllustration = 'dashboard' | 'analytics' | 'training';

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

export function getWeatherUiIconPath(kind: WeatherIconKind): string {
  return `/illustrations/weather-ui-${kind}.svg`;
}

export function getEmptyStateIllustrationPath(type: EmptyStateType): string {
  return `/illustrations/empty-${type}.png`;
}

export function getHomeWidgetIllustrationPath(type: HomeWidgetIllustration): string {
  return `/illustrations/home-${type}.jpg`;
}

export function getPageHeroIllustrationPath(type: PageHeroIllustration): string {
  return `/illustrations/hero-${type}.png`;
}

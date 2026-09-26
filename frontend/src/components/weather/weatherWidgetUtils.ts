
import { localized } from '@/i18n';
import type { GradientDay } from '@/types/analytics';
import { WEATHER_SCORE_COLORS } from '@/utils/colors';
import { localDate } from '@/utils/localDate';
import { getScoreColor, getScoreLabel } from '@/utils/scoreColor';

export type CyclistType =
  | 'sunny'
  | 'rainy'
  | 'windy'
  | 'snowy'
  | 'foggy'
  | 'night_clear'
  | 'cloudy'
  | 'stormy'
  | 'partly_cloudy'
  | 'hot';

// Labels are pulled from the already-localized score scale (see utils/scoreColor.ts) so both
// stay in sync without duplicating the translated strings here.
export const WEATHER_SCORE_LEGEND = [
  { color: WEATHER_SCORE_COLORS.excellent, get label() { return getScoreLabel(75); } },
  { color: WEATHER_SCORE_COLORS.good, get label() { return getScoreLabel(50); } },
  { color: WEATHER_SCORE_COLORS.poor, get label() { return getScoreLabel(25); } },
  { color: WEATHER_SCORE_COLORS.severe, get label() { return getScoreLabel(0); } },
] as const;

export function getCyclistType(weatherCode: number, windSpeed: number, temperature?: number): CyclistType {
  const currentHour = new Date().getHours();
  const isNight = currentHour < 6 || currentHour >= 21;

  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return 'snowy';
  }

  if (weatherCode >= 95) {
    return 'stormy';
  }

  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return 'rainy';
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return 'foggy';
  }

  if (windSpeed > 35) {
    return 'windy';
  }

  if (weatherCode <= 1 && isNight) {
    return 'night_clear';
  }

  if (temperature != null && temperature > 32 && weatherCode <= 2) {
    return 'hot';
  }

  if (weatherCode <= 1) {
    return 'sunny';
  }

  if (weatherCode === 2) {
    return 'partly_cloudy';
  }

  if (weatherCode === 3) {
    return 'cloudy';
  }

  return 'sunny';
}

export function getCyclistForDay(weatherCode: number, windSpeed: number, tempMax?: number): CyclistType {
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return 'snowy';
  }

  if (weatherCode >= 95) {
    return 'stormy';
  }

  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return 'rainy';
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return 'foggy';
  }

  if (windSpeed > 35) {
    return 'windy';
  }

  if (tempMax != null && tempMax > 32 && weatherCode <= 2) {
    return 'hot';
  }

  if (weatherCode <= 1) {
    return 'sunny';
  }

  if (weatherCode === 2) {
    return 'partly_cloudy';
  }

  if (weatherCode === 3) {
    return 'cloudy';
  }

  return 'sunny';
}

export function getGradientColor(score: number): string {
  return getScoreColor(score);
}

const SHORT_WEEKDAYS = localized({
  pl: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
});

export function formatDayName(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const dayNum = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${SHORT_WEEKDAYS[date.getDay()]} ${dayNum}.${month}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === localDate();
}

export function getTodayData(days: GradientDay[]): GradientDay | undefined {
  return days.find((day) => isToday(day.date));
}

import type { GradientDay } from '@/types/analytics';
import { WEATHER_SCORE_COLORS } from '@/utils/colors';
import { getScoreColor } from '@/utils/scoreColor';

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

export const WEATHER_SCORE_LEGEND = [
  { color: WEATHER_SCORE_COLORS.excellent, label: 'Świetne' },
  { color: WEATHER_SCORE_COLORS.good, label: 'Dobre' },
  { color: WEATHER_SCORE_COLORS.poor, label: 'Słabe' },
  { color: WEATHER_SCORE_COLORS.severe, label: 'Kiepskie' },
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

export function formatDayName(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const days = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
  const dayNum = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${days[date.getDay()]} ${dayNum}.${month}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export function getTodayData(days: GradientDay[]): GradientDay | undefined {
  return days.find((day) => isToday(day.date));
}

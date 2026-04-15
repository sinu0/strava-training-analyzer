import { WEATHER_SCORE_COLORS } from '@/utils/colors';

export interface ScoreScale {
  min: number;
  label: string;
  color: string;
}

export const DEFAULT_SCORE_SCALES: ScoreScale[] = [
  { min: 75, label: 'Świetne', color: WEATHER_SCORE_COLORS.excellent },
  { min: 50, label: 'Dobre', color: WEATHER_SCORE_COLORS.good },
  { min: 25, label: 'Słabe', color: WEATHER_SCORE_COLORS.poor },
  { min: 0, label: 'Kiepskie', color: WEATHER_SCORE_COLORS.severe },
];

export function getScoreScale(
  score: number,
  scales: ScoreScale[] = DEFAULT_SCORE_SCALES,
): ScoreScale {
  return scales.find((scale) => score >= scale.min) ?? scales[scales.length - 1]!;
}

export function getScoreColor(
  score: number,
  scales: ScoreScale[] = DEFAULT_SCORE_SCALES,
): string {
  return getScoreScale(score, scales).color;
}

export function getScoreLabel(
  score: number,
  scales: ScoreScale[] = DEFAULT_SCORE_SCALES,
): string {
  return getScoreScale(score, scales).label;
}

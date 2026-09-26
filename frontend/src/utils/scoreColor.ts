import { localized } from '@/i18n';
import { WEATHER_SCORE_COLORS } from '@/utils/colors';

export interface ScoreScale {
  min: number;
  label: string;
  color: string;
}

const SCORE_LABELS = localized({
  pl: { excellent: 'Świetne', good: 'Dobre', poor: 'Słabe', severe: 'Kiepskie' },
  en: { excellent: 'Excellent', good: 'Good', poor: 'Poor', severe: 'Bad' },
});

export const DEFAULT_SCORE_SCALES: ScoreScale[] = [
  { min: 75, get label() { return SCORE_LABELS.excellent; }, color: WEATHER_SCORE_COLORS.excellent },
  { min: 50, get label() { return SCORE_LABELS.good; }, color: WEATHER_SCORE_COLORS.good },
  { min: 25, get label() { return SCORE_LABELS.poor; }, color: WEATHER_SCORE_COLORS.poor },
  { min: 0, get label() { return SCORE_LABELS.severe; }, color: WEATHER_SCORE_COLORS.severe },
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

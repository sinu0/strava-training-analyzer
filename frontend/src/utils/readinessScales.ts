import { STATUS_COLORS } from '@/utils/colors';

export type ReadinessImage =
  | 'exhausted'
  | 'struggling'
  | 'tired'
  | 'recovering'
  | 'good'
  | 'fresh'
  | 'energetic'
  | 'rested'
  | 'peak';

export interface ReadinessScale {
  min: number;
  label: string;
  color: string;
  emoji: string;
  image: ReadinessImage;
  level: string;
}

export const READINESS_SCALES: ReadinessScale[] = [
  {
    min: 95,
    label: 'Pełna moc',
    color: STATUS_COLORS.success,
    emoji: '🔥',
    image: 'peak',
    level: 'pełna moc',
  },
  {
    min: 85,
    label: 'Wypoczęty',
    color: STATUS_COLORS.success,
    emoji: '🌟',
    image: 'rested',
    level: 'wypoczęty',
  },
  {
    min: 75,
    label: 'Energia',
    color: STATUS_COLORS.successLight,
    emoji: '⚡',
    image: 'energetic',
    level: 'energia',
  },
  {
    min: 65,
    label: 'Świeży',
    color: STATUS_COLORS.successLight,
    emoji: '💚',
    image: 'fresh',
    level: 'świeży',
  },
  {
    min: 55,
    label: 'Dobra',
    color: STATUS_COLORS.secondary,
    emoji: '💪',
    image: 'good',
    level: 'dobra',
  },
  {
    min: 45,
    label: 'Regeneracja',
    color: STATUS_COLORS.secondary,
    emoji: '🔄',
    image: 'recovering',
    level: 'regeneracja',
  },
  {
    min: 35,
    label: 'Zmęczenie',
    color: STATUS_COLORS.warning,
    emoji: '😓',
    image: 'tired',
    level: 'zmęczenie',
  },
  {
    min: 15,
    label: 'Trudność',
    color: STATUS_COLORS.warningStrong,
    emoji: '🥵',
    image: 'struggling',
    level: 'trudność',
  },
  {
    min: 0,
    label: 'Wyczerpanie',
    color: STATUS_COLORS.error,
    emoji: '😴',
    image: 'exhausted',
    level: 'wyczerpanie',
  },
];

function normalizeValue(value: string): string {
  return value.trim().toLocaleLowerCase('pl-PL');
}

export function getReadinessScale(score: number): ReadinessScale {
  return READINESS_SCALES.find((scale) => score >= scale.min) ?? READINESS_SCALES[READINESS_SCALES.length - 1]!;
}

export function getReadinessColor(score: number): string {
  return getReadinessScale(score).color;
}

export function getReadinessLabel(score: number): string {
  return getReadinessScale(score).label;
}

export function getReadinessImage(score: number): ReadinessImage {
  return getReadinessScale(score).image;
}

export function getReadinessLevelLabel(level: string): string {
  const normalized = normalizeValue(level);
  const scale = READINESS_SCALES.find((entry) => entry.level === normalized)
    ?? READINESS_SCALES[READINESS_SCALES.length - 1]!;
  return `${scale.emoji} ${scale.label}`;
}

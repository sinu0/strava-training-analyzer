import { LOAD_COLORS, STATUS_COLORS } from '@/utils/colors';

export const LOAD_STATUS_COLORS = {
  INSUFFICIENT: LOAD_COLORS.INSUFFICIENT,
  UNDER: LOAD_COLORS.UNDER,
  OPTIMAL: LOAD_COLORS.OPTIMAL,
  OVER: LOAD_COLORS.OVER,
  DANGER: LOAD_COLORS.DANGER,
  NO_DATA: LOAD_COLORS.NO_DATA,
  FUTURE: LOAD_COLORS.FUTURE,
} as const;

export const LOAD_STATUS_LABELS = {
  OPTIMAL: 'Optymalne',
  UNDER: 'Niskie',
  OVER: 'Przekroczone',
  DANGER: 'Ryzyko',
  INSUFFICIENT: 'Za mało',
  NO_DATA: 'Brak CTL',
} as const;

export const PERFORMANCE_TREND_COLORS = {
  up: STATUS_COLORS.success,
  down: STATUS_COLORS.error,
  stagnant: STATUS_COLORS.warning,
} as const;

export const WEIGHT_TREND_COLORS = {
  down: STATUS_COLORS.success,
  up: STATUS_COLORS.error,
  flat: STATUS_COLORS.warning,
} as const;

export const CONFIDENCE_COLORS = {
  wysoki: STATUS_COLORS.success,
  średni: STATUS_COLORS.warning,
  niski: STATUS_COLORS.error,
} as const;

export function getLoadStatusColor(status: string): string {
  return LOAD_STATUS_COLORS[status as keyof typeof LOAD_STATUS_COLORS] ?? LOAD_STATUS_COLORS.NO_DATA;
}

export function getLoadStatusLabel(status: string): string {
  return LOAD_STATUS_LABELS[status as keyof typeof LOAD_STATUS_LABELS] ?? LOAD_STATUS_LABELS.NO_DATA;
}

export function getConfidenceColor(confidence: string | null | undefined): string {
  return CONFIDENCE_COLORS[confidence as keyof typeof CONFIDENCE_COLORS] ?? STATUS_COLORS.error;
}

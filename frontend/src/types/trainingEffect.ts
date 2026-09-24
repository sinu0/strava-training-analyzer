import { tokens } from '@/theme/theme';

export interface ActivityTrainingEffect {
  id: string;
  activityId: string;
  trainingScore: number;
  aerobicTe: number | null;
  anaerobicTe: number | null;
  aerobicLabel: string | null;
  anaerobicLabel: string | null;
  primaryBenefit: string;
  secondaryBenefit: string | null;
  recoveryTimeHours: number;
  qualityScore: number | null;
  calculatedAt: string;
  dataQuality: string;
  details: Record<string, unknown> | null;
}

export const BENEFIT_LABELS: Record<string, string> = {
  RECOVERY: 'Regeneracja',
  ENDURANCE: 'Wytrzymałość',
  TEMPO: 'Tempo',
  THRESHOLD: 'Próg',
  VO2MAX: 'VO2max',
  ANAEROBIC: 'Anaerobowy',
  SPRINT: 'Sprint',
};

export const BENEFIT_COLORS: Record<string, string> = tokens.chart.benefit;

export function getTrainingScoreLabel(score: number): string {
  if (score >= 80) return 'Ekstremalny';
  if (score >= 60) return 'Intensywny';
  if (score >= 40) return 'Umiarkowany';
  if (score >= 20) return 'Łagodny';
  return 'Lekki';
}

export function getTrainingScoreColor(score: number): string {
  const benefit = tokens.chart.benefit;
  if (score >= 80) return benefit.VO2MAX;
  if (score >= 60) return benefit.THRESHOLD;
  if (score >= 40) return benefit.TEMPO;
  if (score >= 20) return benefit.ENDURANCE;
  return benefit.RECOVERY;
}

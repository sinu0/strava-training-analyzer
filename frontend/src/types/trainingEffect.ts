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

export const BENEFIT_COLORS: Record<string, string> = {
  RECOVERY: '#39D353',
  ENDURANCE: '#58A6FF',
  TEMPO: '#D29922',
  THRESHOLD: '#F85149',
  VO2MAX: '#DA3633',
  ANAEROBIC: '#FFA657',
  SPRINT: '#BC8CFF',
};

export function getTrainingScoreLabel(score: number): string {
  if (score >= 80) return 'Ekstremalny';
  if (score >= 60) return 'Intensywny';
  if (score >= 40) return 'Umiarkowany';
  if (score >= 20) return 'Łagodny';
  return 'Lekki';
}

export function getTrainingScoreColor(score: number): string {
  if (score >= 80) return '#DA3633';
  if (score >= 60) return '#F85149';
  if (score >= 40) return '#D29922';
  if (score >= 20) return '#58A6FF';
  return '#39D353';
}

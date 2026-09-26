import type { WorkoutStep } from '@/types/training';

import { cockpitMessages } from './messages';

export function formatClock(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

export function formatDurationShort(seconds: number | undefined): string {
  if (seconds == null) return 'LAP';
  if (seconds < 60) return `${seconds} s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

export function stepLabel(step: WorkoutStep | undefined, index: number): string {
  if (!step) return cockpitMessages.t('format.workoutEnd');
  return step.name ?? cockpitMessages.t(`format.stepNames.${step.type}`) ?? cockpitMessages.t('format.stepFallback', { index: index + 1 });
}

export interface StepTargetText {
  pct: string;
  watts: string;
  lowWatts: number | null;
  highWatts: number | null;
}

/** Planned intensity of a step as text, including the live intensity adjustment. */
export function stepTargetText(step: WorkoutStep | undefined, ftpWatts: number | null, adjustmentPct: number): StepTargetText {
  const low = step?.powerPctFtpLow ?? step?.onPowerPctFtpLow;
  const high = step?.powerPctFtpHigh ?? step?.onPowerPctFtpHigh ?? low;
  if (low == null || high == null) return { pct: cockpitMessages.t('format.anyIntensity'), watts: '—', lowWatts: null, highWatts: null };
  const factor = 1 + adjustmentPct / 100;
  const lowPct = Math.round(low * factor);
  const highPct = Math.round(high * factor);
  const pct = lowPct === highPct ? `${lowPct}%` : `${lowPct}–${highPct}%`;
  if (ftpWatts == null) return { pct, watts: '—', lowWatts: null, highWatts: null };
  const lowWatts = Math.round((ftpWatts * low * factor) / 100);
  const highWatts = Math.round((ftpWatts * high * factor) / 100);
  return { pct, watts: lowWatts === highWatts ? `${lowWatts}` : `${lowWatts}–${highWatts}`, lowWatts, highWatts };
}

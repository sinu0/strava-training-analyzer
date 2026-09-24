import type { WorkoutStep } from '@/types/training';
import type { Tone } from '@/ui';

import type { ErgTarget } from '../devices/ergController';
import type { Compliance } from '../devices/liveMetrics';

export interface Cue {
  key: string;
  tone: Tone;
  text: string;
}

const CADENCE_TOLERANCE_RPM = 5;

export interface CueInput {
  /** The trainer currently holds the target itself (ERG). */
  ergActive: boolean;
  compliance: Compliance;
  target: ErgTarget | null;
  powerWatts: number | null;
  cadenceRpm: number | null;
  step: WorkoutStep | undefined;
}

/** What the rider should change right now; null when everything is on target. */
export function computeCue({ ergActive, compliance, target, powerWatts, cadenceRpm, step }: CueInput): Cue | null {
  if (!ergActive && target && powerWatts != null) {
    if (compliance === 'below') return { key: 'power-up', tone: 'warning', text: `Zwiększ moc do ${target.lowWatts} W` };
    if (compliance === 'above') return { key: 'power-down', tone: 'error', text: `Zmniejsz moc do ${target.highWatts} W` };
  }
  const low = step?.cadenceRpmLow;
  const high = step?.cadenceRpmHigh ?? low;
  if (cadenceRpm != null && low != null && high != null) {
    const range = low === high ? `${low} rpm` : `${low}–${high} rpm`;
    if (cadenceRpm < low - CADENCE_TOLERANCE_RPM) return { key: 'cadence-up', tone: 'warning', text: `Kadencja ${range}` };
    if (cadenceRpm > high + CADENCE_TOLERANCE_RPM) return { key: 'cadence-down', tone: 'warning', text: `Kadencja ${range}` };
  }
  return null;
}

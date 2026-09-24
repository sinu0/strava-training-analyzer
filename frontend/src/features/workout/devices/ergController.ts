import type { WorkoutStep } from '@/types/training';

export interface StepTarget {
  lowPct: number;
  highPct: number;
  /** The single value the trainer should hold now (% FTP). */
  targetPct: number;
}

export interface ErgTarget {
  watts: number;
  lowWatts: number;
  highWatts: number;
}

export interface ErgCommand {
  watts: number;
  stepIndex: number;
}

const MIN_DELTA_WATTS = 2;
const MIN_INTERVAL_MS = 1_000;

function range(low: number | undefined, high: number | undefined): [number, number] | null {
  if (low == null && high == null) return null;
  return [low ?? high ?? 0, high ?? low ?? 0];
}

/** Target intensity of a workout step at a point in time (ramps interpolate, intervals follow on/off phases). */
export function stepTarget(step: WorkoutStep | undefined, stepElapsedMs: number): StepTarget | null {
  if (!step) return null;
  const elapsedSec = Math.max(0, stepElapsedMs / 1000);

  if (step.repeat && step.onDurationSec) {
    const cycle = step.onDurationSec + (step.offDurationSec ?? 0);
    const inWork = cycle <= 0 || elapsedSec % cycle < step.onDurationSec;
    const phase = inWork
      ? range(step.onPowerPctFtpLow, step.onPowerPctFtpHigh)
      : range(step.offPowerPctFtpLow, step.offPowerPctFtpHigh);
    if (!phase) return null;
    return { lowPct: phase[0], highPct: phase[1], targetPct: (phase[0] + phase[1]) / 2 };
  }

  const bounds = range(step.powerPctFtpLow, step.powerPctFtpHigh);
  if (!bounds) return null;
  const [lowPct, highPct] = bounds;
  const progress = step.durationSec ? Math.min(1, elapsedSec / step.durationSec) : 0;
  if (step.type === 'warmup' || step.type === 'ramp') {
    return { lowPct, highPct, targetPct: lowPct + (highPct - lowPct) * progress };
  }
  if (step.type === 'cooldown') {
    return { lowPct, highPct, targetPct: highPct - (highPct - lowPct) * progress };
  }
  return { lowPct, highPct, targetPct: (lowPct + highPct) / 2 };
}

/** ERG target in watts, including the athlete's live intensity adjustment. */
export function ergTarget(
  step: WorkoutStep | undefined,
  stepElapsedMs: number,
  ftpWatts: number | null,
  adjustmentPct: number,
): ErgTarget | null {
  const target = stepTarget(step, stepElapsedMs);
  if (!target || !ftpWatts) return null;
  const factor = (1 + adjustmentPct / 100) * (ftpWatts / 100);
  return {
    watts: Math.round(target.targetPct * factor),
    lowWatts: Math.round(target.lowPct * factor),
    highWatts: Math.round(target.highPct * factor),
  };
}

/** Throttles trainer writes: step changes go out at once, drift needs ≥ 2 W and ≥ 1 s. */
export function shouldSendErg(
  previous: (ErgCommand & { at: number }) | null,
  next: ErgCommand,
  nowMs: number,
): boolean {
  if (!previous) return true;
  if (previous.stepIndex !== next.stepIndex) return true;
  if (Math.abs(previous.watts - next.watts) < MIN_DELTA_WATTS) return false;
  return nowMs - previous.at >= MIN_INTERVAL_MS;
}

import type { ErgTarget } from './ergController';

export interface PowerSample {
  at: number;
  watts: number;
}

export interface TickValues {
  powerWatts: number | null;
  heartRateBpm: number | null;
  cadenceRpm: number | null;
}

export interface MetricsWindow {
  durationSec: number;
  avgPower: number | null;
  maxPower: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgCadence: number | null;
}

export interface SessionMetrics extends MetricsWindow {
  kilojoules: number;
  normalizedPower: number | null;
  intensityFactor: number | null;
  tss: number | null;
}

export type Compliance = 'in' | 'below' | 'above' | 'unknown';

const SMOOTHING_MS = 3_000;
const NP_WINDOW_SEC = 30;
const RANGE_TOLERANCE = 0.03;
const SINGLE_TARGET_TOLERANCE = 0.05;

/** Mean power over the last 3 s — the value athletes read while riding. */
export function smoothPower(samples: PowerSample[], nowMs: number): number | null {
  const recent = samples.filter((sample) => sample.at > nowMs - SMOOTHING_MS && sample.at <= nowMs);
  if (!recent.length) return null;
  return Math.round(recent.reduce((sum, sample) => sum + sample.watts, 0) / recent.length);
}

export function complianceOf(powerWatts: number | null, target: ErgTarget | null): Compliance {
  if (powerWatts == null || !target) return 'unknown';
  const single = target.lowWatts === target.highWatts;
  const tolerance = single ? SINGLE_TARGET_TOLERANCE : RANGE_TOLERANCE;
  if (powerWatts < target.lowWatts * (1 - tolerance)) return 'below';
  if (powerWatts > target.highWatts * (1 + tolerance)) return 'above';
  return 'in';
}

class Accumulator {
  durationSec = 0;
  private power = { sum: 0, count: 0, max: 0 };
  private heart = { sum: 0, count: 0, max: 0 };
  private cadence = { sum: 0, count: 0 };

  add(values: TickValues) {
    this.durationSec += 1;
    if (values.powerWatts != null) {
      this.power.sum += values.powerWatts;
      this.power.count += 1;
      this.power.max = Math.max(this.power.max, values.powerWatts);
    }
    if (values.heartRateBpm != null) {
      this.heart.sum += values.heartRateBpm;
      this.heart.count += 1;
      this.heart.max = Math.max(this.heart.max, values.heartRateBpm);
    }
    if (values.cadenceRpm != null) {
      this.cadence.sum += values.cadenceRpm;
      this.cadence.count += 1;
    }
  }

  window(): MetricsWindow {
    const mean = (bucket: { sum: number; count: number }) => (bucket.count ? Math.round(bucket.sum / bucket.count) : null);
    return {
      durationSec: this.durationSec,
      avgPower: mean(this.power),
      maxPower: this.power.count ? this.power.max : null,
      avgHeartRate: mean(this.heart),
      maxHeartRate: this.heart.count ? this.heart.max : null,
      avgCadence: mean(this.cadence),
    };
  }
}

/**
 * Session and step statistics fed once per second (the recording rate).
 * NP uses the standard 30 s rolling average raised to the 4th power.
 */
export function createLiveMetrics(ftpWatts: number | null) {
  const session = new Accumulator();
  let step = new Accumulator();
  let stepIndex: number | null = null;
  let joules = 0;
  const rolling: number[] = [];
  let rollingSum = 0;
  let fourthPowerSum = 0;
  let fourthPowerCount = 0;

  return {
    tick(values: TickValues, currentStepIndex: number) {
      if (stepIndex !== currentStepIndex) {
        step = new Accumulator();
        stepIndex = currentStepIndex;
      }
      session.add(values);
      step.add(values);
      const watts = values.powerWatts ?? 0;
      joules += watts;
      rolling.push(watts);
      rollingSum += watts;
      if (rolling.length > NP_WINDOW_SEC) rollingSum -= rolling.shift() ?? 0;
      if (rolling.length === NP_WINDOW_SEC) {
        fourthPowerSum += (rollingSum / NP_WINDOW_SEC) ** 4;
        fourthPowerCount += 1;
      }
    },
    snapshot(): { session: SessionMetrics; step: MetricsWindow } {
      const base = session.window();
      const normalizedPower = fourthPowerCount && base.avgPower != null ? Math.round((fourthPowerSum / fourthPowerCount) ** 0.25) : null;
      const intensityFactor = normalizedPower != null && ftpWatts ? normalizedPower / ftpWatts : null;
      const tss = intensityFactor != null && ftpWatts && normalizedPower != null
        ? (base.durationSec * normalizedPower * intensityFactor) / (ftpWatts * 3600) * 100
        : null;
      return {
        session: { ...base, kilojoules: joules / 1000, normalizedPower, intensityFactor, tss },
        step: step.window(),
      };
    },
  };
}

export type LiveMetrics = ReturnType<typeof createLiveMetrics>;

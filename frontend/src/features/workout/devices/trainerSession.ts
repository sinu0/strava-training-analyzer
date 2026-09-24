import type { WorkoutStep } from '@/types/training';

import { ergTarget, shouldSendErg, type ErgCommand, type ErgTarget } from './ergController';
import { complianceOf, createLiveMetrics, smoothPower, type Compliance, type LiveMetrics, type PowerSample } from './liveMetrics';
import { isTrainer } from './types';

import type { DeviceKind, DeviceReading, DeviceStatus, FitnessDevice, Trainer } from './types';

export type ControlMode = 'erg' | 'resistance' | 'free';

export interface LiveValues {
  powerWatts: number | null;
  cadenceRpm: number | null;
  heartRateBpm: number | null;
  speedKph: number | null;
}

/** One recorded second of the ride. */
export interface RideSample extends LiveValues {
  /** Wall-clock time of the sample (epoch ms), needed for FIT records. */
  atMs: number;
  elapsedMs: number;
  stepIndex: number;
}

export interface ControlInput {
  running: boolean;
  steps: WorkoutStep[];
  stepIndex: number;
  stepElapsedMs: number;
  adjustmentPct: number;
  nowMs: number;
}

export interface SessionSnapshot {
  live: LiveValues;
  metrics: ReturnType<LiveMetrics['snapshot']>;
  target: ErgTarget | null;
  compliance: Compliance;
  mode: ControlMode;
  resistancePct: number;
  devices: Partial<Record<DeviceKind, DeviceStatus>>;
  controlError: string | null;
}

interface Latest {
  value: number;
  at: number;
}

const STALE_MS = 3_000;
const POWER_HISTORY_MS = 5_000;

/**
 * Framework-free core of the trainer mode: merges device readings, keeps
 * per-second metrics and drives ERG / resistance on the trainer.
 */
export class TrainerSession {
  private readonly devices = new Map<DeviceKind, { device: FitnessDevice; unsubscribe: () => void }>();
  private readonly listeners = new Set<() => void>();
  private powerHistory: PowerSample[] = [];
  private readonly latest: Partial<Record<'cadence' | 'speed' | 'strapHeartRate' | 'trainerHeartRate', Latest>> = {};
  private readonly metrics: LiveMetrics;
  private mode: ControlMode = 'erg';
  private resistancePct = 30;
  private lastErg: (ErgCommand & { at: number }) | null = null;
  private lastResistance: number | null = null;
  private released = false;
  private target: ErgTarget | null = null;
  private controlError: string | null = null;

  constructor(private readonly options: { ftpWatts: number | null; onSample?: (sample: RideSample) => void }) {
    this.metrics = createLiveMetrics(options.ftpWatts);
  }

  attach(device: FitnessDevice) {
    this.detach(device.kind);
    const offReading = device.onReading((reading, at) => this.ingest(device.kind, reading, at));
    const offStatus = device.onStatus(() => this.emit());
    this.devices.set(device.kind, { device, unsubscribe: () => { offReading(); offStatus(); } });
    if (device.kind === 'trainer') this.resetControl();
    this.emit();
  }

  detach(kind: DeviceKind) {
    this.devices.get(kind)?.unsubscribe();
    this.devices.delete(kind);
    this.emit();
  }

  device(kind: DeviceKind): FitnessDevice | null {
    return this.devices.get(kind)?.device ?? null;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  setMode(mode: ControlMode) {
    this.mode = mode;
    this.resetControl();
    this.emit();
  }

  setResistance(percent: number) {
    this.resistancePct = Math.max(0, Math.min(100, Math.round(percent)));
    this.emit();
  }

  live(nowMs: number): LiveValues {
    const fresh = (entry: Latest | undefined) => (entry && nowMs - entry.at <= STALE_MS ? entry.value : null);
    return {
      powerWatts: smoothPower(this.powerHistory, nowMs),
      cadenceRpm: fresh(this.latest.cadence),
      heartRateBpm: fresh(this.latest.strapHeartRate) ?? fresh(this.latest.trainerHeartRate),
      speedKph: fresh(this.latest.speed),
    };
  }

  /** Called once per second while the workout runs: records a sample and updates metrics. */
  tick(stepIndex: number, elapsedMs: number, nowMs: number) {
    const values = this.live(nowMs);
    this.metrics.tick(values, stepIndex);
    this.options.onSample?.({ atMs: nowMs, elapsedMs, stepIndex, ...values });
    this.emit();
  }

  snapshot(nowMs: number): SessionSnapshot {
    const live = this.live(nowMs);
    const devices: SessionSnapshot['devices'] = {};
    this.devices.forEach(({ device }, kind) => { devices[kind] = device.status(); });
    return {
      live,
      metrics: this.metrics.snapshot(),
      target: this.target,
      compliance: complianceOf(live.powerWatts, this.target),
      mode: this.mode,
      resistancePct: this.resistancePct,
      devices,
      controlError: this.controlError,
    };
  }

  /** Applies the current workout position to the trainer (idempotent, throttled). */
  async syncControl(input: ControlInput): Promise<void> {
    const step = input.steps[input.stepIndex];
    this.target = ergTarget(step, input.stepElapsedMs, this.options.ftpWatts, input.adjustmentPct);
    const trainer = this.trainer();
    if (!trainer) return;

    try {
      if (!input.running || this.mode === 'free' || (this.mode === 'erg' && !this.target)) {
        if (!this.released) {
          this.released = true;
          this.lastErg = null;
          this.lastResistance = null;
          await trainer.release();
        }
        return;
      }
      if (this.mode === 'erg' && this.target) {
        if (!trainer.status().capabilities.erg) return;
        const next = { watts: this.target.watts, stepIndex: input.stepIndex };
        if (!this.released && !shouldSendErg(this.lastErg, next, input.nowMs)) return;
        this.released = false;
        this.lastErg = { ...next, at: input.nowMs };
        await trainer.setTargetPower(next.watts);
      } else if (this.mode === 'resistance') {
        if (!trainer.status().capabilities.resistance) return;
        if (!this.released && this.lastResistance === this.resistancePct) return;
        this.released = false;
        this.lastResistance = this.resistancePct;
        this.lastErg = null;
        await trainer.setResistance(this.resistancePct);
      }
      this.setControlError(null);
    } catch (error) {
      this.setControlError(error instanceof Error ? error.message : 'Nie udało się wysłać polecenia do trenażera');
    }
  }

  dispose() {
    this.devices.forEach(({ unsubscribe }) => unsubscribe());
    this.devices.clear();
    this.listeners.clear();
  }

  private trainer(): Trainer | null {
    const device = this.device('trainer');
    return isTrainer(device) && device.status().state === 'CONNECTED' ? device : null;
  }

  /** Forget what the trainer holds (new device or mode): the next sync sends a fresh command. */
  private resetControl() {
    this.lastErg = null;
    this.lastResistance = null;
    this.released = false;
  }

  private setControlError(message: string | null) {
    if (this.controlError === message) return;
    this.controlError = message;
    this.emit();
  }

  private ingest(kind: DeviceKind, reading: DeviceReading, at: number) {
    if (reading.powerWatts != null) {
      this.powerHistory.push({ at, watts: reading.powerWatts });
      this.powerHistory = this.powerHistory.filter((sample) => sample.at > at - POWER_HISTORY_MS);
    }
    if (reading.cadenceRpm != null) this.latest.cadence = { value: reading.cadenceRpm, at };
    if (reading.speedKph != null) this.latest.speed = { value: reading.speedKph, at };
    if (reading.heartRateBpm != null) {
      this.latest[kind === 'heartRate' ? 'strapHeartRate' : 'trainerHeartRate'] = { value: reading.heartRateBpm, at };
    }
    this.emit();
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

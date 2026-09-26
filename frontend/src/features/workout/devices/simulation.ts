import { devicesMessages } from './messages';
import { NO_CAPABILITIES } from './types';

import type { DeviceKind, DeviceReading, DeviceStatus, FitnessDevice, Trainer } from './types';

const TRAINER_INTERVAL_MS = 250;
const HEART_INTERVAL_MS = 1_000;
const POWER_TIME_CONSTANT_S = 1.6;
const HEART_TIME_CONSTANT_S = 18;
const FREE_RIDE_WATTS = 150;

/** Small deterministic PRNG (mulberry32) so demo rides and e2e runs repeat exactly. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class SimulatedDevice implements FitnessDevice {
  protected current: DeviceStatus;
  private readonly statusListeners = new Set<(status: DeviceStatus) => void>();
  private readonly readingListeners = new Set<(reading: DeviceReading, atMs: number) => void>();

  constructor(readonly kind: DeviceKind, name: string, capabilities: Partial<DeviceStatus['capabilities']>, batteryPct: number) {
    this.current = {
      kind, state: 'CONNECTED', name, batteryPct, error: null, targetWatts: null,
      capabilities: { ...NO_CAPABILITIES, ...capabilities },
    };
  }

  status() { return this.current; }
  onStatus(listener: (status: DeviceStatus) => void) { this.statusListeners.add(listener); return () => { this.statusListeners.delete(listener); }; }
  onReading(listener: (reading: DeviceReading, atMs: number) => void) { this.readingListeners.add(listener); return () => { this.readingListeners.delete(listener); }; }
  async disconnect() { this.update({ state: 'IDLE' }); }

  update(patch: Partial<DeviceStatus>) {
    this.current = { ...this.current, ...patch };
    this.statusListeners.forEach((listener) => listener(this.current));
  }

  emit(reading: DeviceReading) {
    if (this.current.state !== 'CONNECTED') return;
    const at = Date.now();
    this.readingListeners.forEach((listener) => listener(reading, at));
  }
}

class SimulatedTrainer extends SimulatedDevice implements Trainer {
  mode: 'erg' | 'resistance' | 'free' = 'free';
  resistancePct = 30;

  constructor() {
    super('trainer', devicesMessages.t('simulatedTrainerName'), { power: true, cadence: true, speed: true, erg: true, resistance: true, simulation: true }, 72);
  }

  async setTargetPower(watts: number) {
    this.mode = 'erg';
    this.update({ targetWatts: Math.round(watts) });
  }

  async setResistance(percent: number) {
    this.mode = 'resistance';
    this.resistancePct = percent;
    this.update({ targetWatts: null });
  }

  async release() {
    this.mode = 'free';
    this.update({ targetWatts: null });
  }

  desiredWatts(): number {
    if (this.mode === 'erg' && this.current.targetWatts != null) return this.current.targetWatts;
    if (this.mode === 'resistance') return 80 + this.resistancePct * 2.6;
    return FREE_RIDE_WATTS;
  }
}

export interface SimulatedRig {
  connectTrainer(): Promise<Trainer>;
  connectHeartRate(): Promise<FitnessDevice>;
  /** Simulates a lost Bluetooth link that recovers after `forMs`. */
  drop(kind: DeviceKind, forMs: number): void;
  dispose(): void;
}

/**
 * Deterministic stand-in for a Suito + HRM pair, used by the demo mode
 * (`?devices=sim`) and end-to-end tests. Power follows ERG with inertia and
 * heart rate lags behind power, like a real ride.
 */
export function createSimulatedRig({ seed = 1 }: { seed?: number } = {}): SimulatedRig {
  const rand = random(seed);
  const trainer = new SimulatedTrainer();
  const strap = new SimulatedDevice('heartRate', devicesMessages.t('simulatedHrName'), { heartRate: true }, 88);
  let power = FREE_RIDE_WATTS;
  let heartRate = 72;
  const timers: Array<ReturnType<typeof setInterval>> = [];
  let trainerOn = false;
  let strapOn = false;

  const startTrainer = () => {
    if (trainerOn) return;
    trainerOn = true;
    timers.push(setInterval(() => {
      const dt = TRAINER_INTERVAL_MS / 1000;
      power += (trainer.desiredWatts() - power) * (1 - Math.exp(-dt / POWER_TIME_CONSTANT_S));
      const watts = Math.max(0, Math.round(power + (rand() - 0.5) * 8));
      const cadence = Math.round(86 + (rand() - 0.5) * 6 + (trainer.mode === 'erg' ? 2 : 0));
      const speed = Math.round(Math.cbrt(Math.max(watts, 1) / 0.32) * 3.6 * 10) / 10;
      trainer.emit({ powerWatts: watts, cadenceRpm: cadence, speedKph: speed });
    }, TRAINER_INTERVAL_MS));
  };

  const startStrap = () => {
    if (strapOn) return;
    strapOn = true;
    timers.push(setInterval(() => {
      const dt = HEART_INTERVAL_MS / 1000;
      const goal = 62 + power * 0.42;
      heartRate += (goal - heartRate) * (1 - Math.exp(-dt / HEART_TIME_CONSTANT_S));
      strap.emit({ heartRateBpm: Math.round(heartRate + (rand() - 0.5) * 2) });
    }, HEART_INTERVAL_MS));
  };

  return {
    async connectTrainer() { trainer.update({ state: 'CONNECTED' }); startTrainer(); return trainer; },
    async connectHeartRate() { strap.update({ state: 'CONNECTED' }); startStrap(); return strap; },
    drop(kind, forMs) {
      const device = kind === 'trainer' ? trainer : strap;
      device.update({ state: 'RECONNECTING' });
      timers.push(setTimeout(() => device.update({ state: 'CONNECTED' }), forMs) as unknown as ReturnType<typeof setInterval>);
    },
    dispose() {
      timers.splice(0).forEach((timer) => clearInterval(timer));
      trainerOn = false;
      strapOn = false;
    },
  };
}

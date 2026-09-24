import { describe, expect, it } from 'vitest';

import type { WorkoutStep } from '@/types/training';

import { stubDevice } from '../testing/stubDevices';
import { TrainerSession } from '../trainerSession';

const steps: WorkoutStep[] = [
  { type: 'steady', durationSec: 60, powerPctFtpLow: 80, powerPctFtpHigh: 80 },
  { type: 'steady', durationSec: 60, powerPctFtpLow: 100, powerPctFtpHigh: 100 },
];

function controlInput(overrides: Partial<Parameters<TrainerSession['syncControl']>[0]> = {}) {
  return { running: true, steps, stepIndex: 0, stepElapsedMs: 0, adjustmentPct: 0, nowMs: 0, ...overrides };
}

describe('TrainerSession', () => {
  it('merges trainer and strap readings into live values with 3 s smoothing', () => {
    const session = new TrainerSession({ ftpWatts: 250 });
    const trainer = stubDevice('trainer', { erg: true, power: true, cadence: true });
    const strap = stubDevice('heartRate', { heartRate: true });
    session.attach(trainer);
    session.attach(strap);

    trainer.push({ powerWatts: 200, cadenceRpm: 90, speedKph: 32 }, 1_000);
    trainer.push({ powerWatts: 220 }, 2_000);
    strap.push({ heartRateBpm: 140 }, 2_000);

    expect(session.live(2_500)).toEqual({ powerWatts: 210, cadenceRpm: 90, heartRateBpm: 140, speedKph: 32 });
  });

  it('prefers the strap over heart rate reported by the trainer', () => {
    const session = new TrainerSession({ ftpWatts: 250 });
    const trainer = stubDevice('trainer');
    const strap = stubDevice('heartRate', { heartRate: true });
    session.attach(trainer);
    session.attach(strap);
    trainer.push({ heartRateBpm: 100 }, 1_000);
    strap.push({ heartRateBpm: 150 }, 1_000);
    expect(session.live(1_500).heartRateBpm).toBe(150);
  });

  it('drops values that are older than 3 s so stale data is never shown', () => {
    const session = new TrainerSession({ ftpWatts: 250 });
    const trainer = stubDevice('trainer');
    session.attach(trainer);
    trainer.push({ powerWatts: 200, cadenceRpm: 90 }, 1_000);
    expect(session.live(5_000)).toEqual({ powerWatts: null, cadenceRpm: null, heartRateBpm: null, speedKph: null });
  });

  it('emits one sample per tick and feeds step and session metrics', () => {
    const samples: unknown[] = [];
    const session = new TrainerSession({ ftpWatts: 250, onSample: (sample) => samples.push(sample) });
    const trainer = stubDevice('trainer');
    session.attach(trainer);
    trainer.push({ powerWatts: 250, cadenceRpm: 92 }, 1_000);
    session.tick(0, 60_000, 1_500);
    expect(samples).toEqual([{ atMs: 1_500, elapsedMs: 60_000, stepIndex: 0, powerWatts: 250, cadenceRpm: 92, heartRateBpm: null, speedKph: null }]);
    expect(session.snapshot(1_500).metrics.session.avgPower).toBe(250);
  });

  it('holds ERG targets, follows steps and releases the trainer on pause', async () => {
    const session = new TrainerSession({ ftpWatts: 250 });
    const trainer = stubDevice('trainer', { erg: true });
    session.attach(trainer);

    await session.syncControl(controlInput());
    await session.syncControl(controlInput({ nowMs: 300 }));
    expect(trainer.setTargetPower).toHaveBeenCalledTimes(1);
    expect(trainer.setTargetPower).toHaveBeenLastCalledWith(200);

    await session.syncControl(controlInput({ stepIndex: 1, nowMs: 400 }));
    expect(trainer.setTargetPower).toHaveBeenLastCalledWith(250);

    await session.syncControl(controlInput({ stepIndex: 1, adjustmentPct: 5, nowMs: 2_000 }));
    expect(trainer.setTargetPower).toHaveBeenLastCalledWith(263);

    await session.syncControl(controlInput({ running: false, stepIndex: 1, nowMs: 3_000 }));
    await session.syncControl(controlInput({ running: false, stepIndex: 1, nowMs: 4_000 }));
    expect(trainer.release).toHaveBeenCalledTimes(1);

    await session.syncControl(controlInput({ stepIndex: 1, nowMs: 5_000 }));
    expect(trainer.setTargetPower).toHaveBeenLastCalledWith(250);
  });

  it('switches between ERG, resistance and free ride on request', async () => {
    const session = new TrainerSession({ ftpWatts: 250 });
    const trainer = stubDevice('trainer', { erg: true, resistance: true });
    session.attach(trainer);

    session.setMode('resistance');
    session.setResistance(35);
    await session.syncControl(controlInput());
    expect(trainer.setResistance).toHaveBeenLastCalledWith(35);
    expect(trainer.setTargetPower).not.toHaveBeenCalled();

    session.setMode('free');
    await session.syncControl(controlInput({ nowMs: 1_000 }));
    expect(trainer.release).toHaveBeenCalled();

    expect(session.snapshot(1_000).mode).toBe('free');
  });

  it('falls back from ERG to free ride when the step has no power target', async () => {
    const session = new TrainerSession({ ftpWatts: 250 });
    const trainer = stubDevice('trainer', { erg: true });
    session.attach(trainer);
    await session.syncControl(controlInput({ steps: [{ type: 'freeRide', durationSec: 600 }] }));
    expect(trainer.setTargetPower).not.toHaveBeenCalled();
    expect(session.snapshot(0).target).toBeNull();
  });

  it('notifies subscribers when data or device status changes', () => {
    const session = new TrainerSession({ ftpWatts: 250 });
    const trainer = stubDevice('trainer');
    let calls = 0;
    session.subscribe(() => { calls += 1; });
    session.attach(trainer);
    trainer.setStatus({ state: 'RECONNECTING' });
    expect(calls).toBeGreaterThanOrEqual(2);
    expect(session.snapshot(0).devices.trainer?.state).toBe('RECONNECTING');
  });
});

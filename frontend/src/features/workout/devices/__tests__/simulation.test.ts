import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSimulatedRig } from '../simulation';

describe('simulated rig', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('connects a trainer with ERG and a strap, and streams readings', async () => {
    const rig = createSimulatedRig({ seed: 7 });
    const trainer = await rig.connectTrainer();
    const strap = await rig.connectHeartRate();
    const power: number[] = [];
    const heart: number[] = [];
    trainer.onReading((reading) => { if (reading.powerWatts != null) power.push(reading.powerWatts); });
    strap.onReading((reading) => { if (reading.heartRateBpm != null) heart.push(reading.heartRateBpm); });

    await vi.advanceTimersByTimeAsync(2_000);

    expect(trainer.status()).toMatchObject({ state: 'CONNECTED', name: 'SUITO (symulator)' });
    expect(trainer.status().capabilities).toMatchObject({ erg: true, resistance: true, power: true, cadence: true });
    expect(power.length).toBeGreaterThanOrEqual(7);
    expect(heart.length).toBeGreaterThanOrEqual(2);
    rig.dispose();
  });

  it('settles power close to the ERG target', async () => {
    const rig = createSimulatedRig({ seed: 1 });
    const trainer = await rig.connectTrainer();
    let last = 0;
    trainer.onReading((reading) => { if (reading.powerWatts != null) last = reading.powerWatts; });
    await trainer.setTargetPower(250);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(Math.abs(last - 250)).toBeLessThanOrEqual(12);
    expect(trainer.status().targetWatts).toBe(250);
    rig.dispose();
  });

  it('is deterministic for a seed', async () => {
    const run = async () => {
      const rig = createSimulatedRig({ seed: 42 });
      const trainer = await rig.connectTrainer();
      const values: number[] = [];
      trainer.onReading((reading) => { if (reading.powerWatts != null) values.push(reading.powerWatts); });
      await vi.advanceTimersByTimeAsync(3_000);
      rig.dispose();
      return values;
    };
    expect(await run()).toEqual(await run());
  });

  it('can simulate a dropped link that recovers by itself', async () => {
    const rig = createSimulatedRig({ seed: 3 });
    const trainer = await rig.connectTrainer();
    rig.drop('trainer', 4_000);
    expect(trainer.status().state).toBe('RECONNECTING');
    await vi.advanceTimersByTimeAsync(4_100);
    expect(trainer.status().state).toBe('CONNECTED');
    rig.dispose();
  });
});

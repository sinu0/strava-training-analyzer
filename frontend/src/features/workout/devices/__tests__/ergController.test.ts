import { describe, expect, it } from 'vitest';

import type { WorkoutStep } from '@/types/training';

import { ergTarget, shouldSendErg, stepTarget } from '../ergController';

const steady: WorkoutStep = { type: 'steady', durationSec: 600, powerPctFtpLow: 88, powerPctFtpHigh: 94 };
const warmup: WorkoutStep = { type: 'warmup', durationSec: 600, powerPctFtpLow: 50, powerPctFtpHigh: 70 };
const cooldown: WorkoutStep = { type: 'cooldown', durationSec: 300, powerPctFtpLow: 40, powerPctFtpHigh: 60 };
const intervals: WorkoutStep = {
  type: 'interval', repeat: 3, onDurationSec: 60, offDurationSec: 30,
  onPowerPctFtpLow: 120, onPowerPctFtpHigh: 120, offPowerPctFtpLow: 50, offPowerPctFtpHigh: 50,
};

describe('step targets', () => {
  it('uses the middle of a steady range', () => {
    expect(stepTarget(steady, 0)).toEqual({ lowPct: 88, highPct: 94, targetPct: 91 });
  });

  it('ramps warmup upwards and cooldown downwards', () => {
    expect(stepTarget(warmup, 0)?.targetPct).toBe(50);
    expect(stepTarget(warmup, 300_000)?.targetPct).toBe(60);
    expect(stepTarget(warmup, 600_000)?.targetPct).toBe(70);
    expect(stepTarget(cooldown, 0)?.targetPct).toBe(60);
    expect(stepTarget(cooldown, 300_000)?.targetPct).toBe(40);
  });

  it('follows on/off phases of a repeated interval', () => {
    expect(stepTarget(intervals, 10_000)?.targetPct).toBe(120);
    expect(stepTarget(intervals, 70_000)?.targetPct).toBe(50);
    expect(stepTarget(intervals, 95_000)?.targetPct).toBe(120);
  });

  it('has no target for free ride or steps without power', () => {
    expect(stepTarget({ type: 'freeRide', durationSec: 600 }, 0)).toBeNull();
    expect(stepTarget(undefined, 0)).toBeNull();
  });
});

describe('ERG watts', () => {
  it('scales by FTP and the intensity adjustment', () => {
    expect(ergTarget(steady, 0, 250, 0)).toEqual({ watts: 228, lowWatts: 220, highWatts: 235 });
    expect(ergTarget(steady, 0, 250, 10)?.watts).toBe(250);
  });

  it('returns null without FTP', () => {
    expect(ergTarget(steady, 0, null, 0)).toBeNull();
  });
});

describe('ERG write throttling', () => {
  it('sends the first target and every step change immediately', () => {
    expect(shouldSendErg(null, { watts: 200, stepIndex: 0 }, 0)).toBe(true);
    expect(shouldSendErg({ watts: 200, stepIndex: 0, at: 0 }, { watts: 200, stepIndex: 1 }, 100)).toBe(true);
  });

  it('ignores changes below 2 W and limits updates to one per second', () => {
    expect(shouldSendErg({ watts: 200, stepIndex: 0, at: 0 }, { watts: 201, stepIndex: 0 }, 5_000)).toBe(false);
    expect(shouldSendErg({ watts: 200, stepIndex: 0, at: 0 }, { watts: 210, stepIndex: 0 }, 400)).toBe(false);
    expect(shouldSendErg({ watts: 200, stepIndex: 0, at: 0 }, { watts: 210, stepIndex: 0 }, 1_000)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import type { WorkoutExecution } from '@/types/training';

import { createMonotonicClock, reconcileWorkout, workoutReducer } from '../workoutRunner';


const started = Date.parse('2026-09-03T18:00:00.000Z');

function state(): WorkoutExecution {
  return {
    id: 'execution-1', scheduledWorkoutId: 'plan-1', workoutNameSnapshot: 'Test',
    stepsSnapshot: [
      { type: 'warmup', durationSec: 60, powerPctFtpLow: 50, powerPctFtpHigh: 60 },
      { type: 'steady', durationSec: 120, powerPctFtpLow: 90, powerPctFtpHigh: 95 },
      { type: 'freeRide', durationType: 'LAP_BUTTON' },
    ],
    ftpWatts: 280, lthrBpm: null, maxHrBpm: null, restingHrBpm: null,
    startedAt: new Date(started).toISOString(), finishedAt: null, status: 'RUNNING',
    currentStepIndex: 0, workoutElapsedMs: 0, stepElapsedMs: 0,
    runningSince: new Date(started).toISOString(), intensityAdjustmentPct: 0,
    skippedStepIndexes: [], repeatedStepIndexes: [], rpe: null, feeling: null, notes: null,
    activityId: null, activityMatchStatus: 'PENDING', complianceStatus: 'UNKNOWN',
    complianceScore: null, complianceAlgorithmVersion: 'workout-compliance-v1',
    deliveryMethod: 'ON_DEVICE', stateVersion: 1, updatedAt: new Date(started).toISOString(),
  };
}

describe('workoutReducer', () => {
  it('uses timestamps to cross steps after a long background period', () => {
    const restored = reconcileWorkout(state(), started + 150_000);
    expect(restored.currentStepIndex).toBe(1);
    expect(restored.stepElapsedMs).toBe(90_000);
    expect(restored.workoutElapsedMs).toBe(150_000);
  });

  it('does not count paused wall time and resumes from a fresh timestamp', () => {
    const paused = workoutReducer(state(), { type: 'PAUSE', nowMs: started + 30_000 });
    expect(paused.workoutElapsedMs).toBe(30_000);
    const unchanged = reconcileWorkout(paused, started + 3_600_000);
    expect(unchanged.workoutElapsedMs).toBe(30_000);
    const resumed = workoutReducer(paused, { type: 'RESUME', nowMs: started + 3_600_000 });
    expect(reconcileWorkout(resumed, started + 3_610_000).workoutElapsedMs).toBe(40_000);
  });

  it('keeps open steps running until LAP and records skip/repeat/intensity', () => {
    const open = reconcileWorkout(state(), started + 200_000);
    expect(open.currentStepIndex).toBe(2);
    expect(reconcileWorkout(open, started + 260_000).status).toBe('RUNNING');
    const previous = workoutReducer(open, { type: 'PREVIOUS', nowMs: started + 200_000 });
    expect(previous.repeatedStepIndexes).toEqual([1]);
    const boosted = workoutReducer(previous, { type: 'INTENSITY', nowMs: started + 200_000, deltaPct: 5 });
    expect(boosted.intensityAdjustmentPct).toBe(5);
    const skipped = workoutReducer(open, { type: 'SKIP', nowMs: started + 200_000 });
    expect(skipped.status).toBe('COMPLETED');
    expect(skipped.skippedStepIndexes).toEqual([2]);
  });

  it('derives presentation time from a monotonic source', () => {
    let mono = 10;
    const clock = createMonotonicClock(() => 1_000, () => mono);
    mono = 2_510;
    expect(clock()).toBe(3_500);
  });
});

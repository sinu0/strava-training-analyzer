import { beforeEach, describe, expect, it } from 'vitest';

import type { WorkoutExecution } from '@/types/training';

import {
  acquireExecutionLock, clearActiveExecution, enqueueWorkoutMutation, loadActiveExecution,
  queuedWorkoutMutations, saveActiveExecution,
} from '../offlineStore';


function execution(): WorkoutExecution {
  return {
    id: 'execution-1', scheduledWorkoutId: 'plan-1', workoutNameSnapshot: 'Offline',
    stepsSnapshot: [{ type: 'steady', durationSec: 60 }],
    ftpWatts: null, lthrBpm: null, maxHrBpm: null, restingHrBpm: null,
    startedAt: new Date().toISOString(), finishedAt: null, status: 'RUNNING',
    currentStepIndex: 0, workoutElapsedMs: 0, stepElapsedMs: 0, runningSince: new Date().toISOString(),
    intensityAdjustmentPct: 0, skippedStepIndexes: [], repeatedStepIndexes: [],
    rpe: null, feeling: null, notes: null, activityId: null, activityMatchStatus: 'PENDING',
    complianceStatus: 'UNKNOWN', complianceScore: null, complianceAlgorithmVersion: 'v1',
    deliveryMethod: 'ON_DEVICE', stateVersion: 1, updatedAt: new Date().toISOString(),
  };
}

describe('offline workout persistence', () => {
  const originalIndexedDb = window.indexedDB;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    if (originalIndexedDb) {
      Object.defineProperty(window, 'indexedDB', { configurable: true, value: originalIndexedDb });
    } else {
      Reflect.deleteProperty(window, 'indexedDB');
    }
  });

  it('restores the active snapshot after a simulated reload', async () => {
    await saveActiveExecution(execution());
    expect((await loadActiveExecution())?.workoutNameSnapshot).toBe('Offline');
    await clearActiveExecution();
    expect(await loadActiveExecution()).toBeNull();
  });

  it('keeps offline mutations in chronological order', async () => {
    await enqueueWorkoutMutation({ id: 'later', method: 'POST', url: '/later', body: {}, createdAt: '2026-09-03T12:01:00Z' });
    await enqueueWorkoutMutation({ id: 'first', method: 'POST', url: '/first', body: {}, createdAt: '2026-09-03T12:00:00Z' });
    expect((await queuedWorkoutMutations()).map(item => item.id)).toEqual(['first', 'later']);
  });

  it('uses the local fallback when IndexedDB is present but unavailable', async () => {
    const unavailable = {
      open: () => {
        const request: Partial<IDBOpenDBRequest> = {};
        queueMicrotask(() => {
          Object.defineProperty(request, 'error', { value: new DOMException('blocked') });
          request.onerror?.call(request as IDBOpenDBRequest, new Event('error'));
        });
        return request as IDBOpenDBRequest;
      },
    };
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: unavailable });

    await expect(saveActiveExecution(execution())).resolves.toBeUndefined();
    expect((await loadActiveExecution())?.id).toBe('execution-1');

    await expect(enqueueWorkoutMutation({
      id: 'offline', method: 'POST', url: '/events', body: {}, createdAt: '2026-09-03T12:00:00Z',
    })).resolves.toBeUndefined();
    expect((await queuedWorkoutMutations()).map(item => item.id)).toEqual(['offline']);
  });

  it('prevents two device players from owning one active execution', () => {
    const release = acquireExecutionLock('execution-1');
    expect(release).not.toBeNull();
    sessionStorage.clear();
    expect(acquireExecutionLock('execution-1')).toBeNull();
    release?.();
  });
});

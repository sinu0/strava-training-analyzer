import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { WorkoutExecution } from '@/types/training';

import { acquireExecutionLock, loadActiveExecution, saveActiveExecution } from './offlineStore';
import { flushWorkoutQueue, getActiveExecution, getExecution, sendExecutionMutation } from './workoutApi';
import { createMonotonicClock, reconcileWorkout, workoutReducer } from './workoutRunner';

type WakeSentinel = { release: () => Promise<void>; released?: boolean };
type WakeNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeSentinel> } };

export type WorkoutAction = 'PAUSE' | 'RESUME' | 'SKIP_STEP' | 'PREVIOUS_STEP' | 'INTENSITY';
export type WakeMode = 'ACTIVE' | 'FALLBACK' | 'OFF';

function stepEndCue() {
  navigator.vibrate?.([120, 80, 120]);
  try {
    const context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = 0.05;
    oscillator.frequency.value = 880;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  } catch {
    // Vibration and the visible transition remain available if audio is blocked.
  }
}

/**
 * Durable workout execution: restores from device or server, reconciles the
 * clock, persists offline, keeps the screen awake and syncs rider actions.
 */
export function useWorkoutExecution(executionId: string) {
  const monotonicNow = useMemo(() => createMonotonicClock(), []);
  const [execution, setExecution] = useState<WorkoutExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [wakeMode, setWakeMode] = useState<WakeMode>('OFF');
  const persistedBucket = useRef(-1);
  const warnedStep = useRef(-1);
  const finalized = useRef(false);
  const activeExecutionId = execution?.id;
  const executionStatus = execution?.status;

  useEffect(() => {
    let active = true;
    void (async () => {
      let restored: WorkoutExecution | null = null;
      try {
        const local = await loadActiveExecution();
        if (local?.id === executionId) {
          restored = reconcileWorkout(local, Date.now());
          if (active) setExecution(restored);
        }
      } catch {
        // A server copy can still recover execution when local persistence is unavailable.
      }
      if (navigator.onLine) {
        try {
          const activeServer = await getActiveExecution();
          const server = activeServer?.id === executionId ? activeServer : await getExecution(executionId ?? '');
          if (server?.id === executionId) {
            restored = server;
            if (active) setExecution(restored);
            await saveActiveExecution(server);
          }
        } catch {
          if (active) setOnline(false);
        }
      }
      if (active && !restored) setLoadError(true);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [executionId]);

  useEffect(() => {
    if (!activeExecutionId) return;
    const release = acquireExecutionLock(activeExecutionId);
    if (!release) {
      setLocked(true);
      return;
    }
    return release;
  }, [activeExecutionId]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setSaving(true);
      void flushWorkoutQueue().finally(() => setSaving(false));
    };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (executionStatus !== 'RUNNING') return;
    const timer = window.setInterval(() => {
      setExecution((current) => (current ? reconcileWorkout(current, monotonicNow()) : current));
    }, 250);
    return () => window.clearInterval(timer);
  }, [executionStatus, monotonicNow]);

  useEffect(() => {
    if (!execution) return;
    const bucket = Math.floor(execution.workoutElapsedMs / 10_000);
    if (bucket !== persistedBucket.current || execution.status !== 'RUNNING') {
      persistedBucket.current = bucket;
      void saveActiveExecution(execution);
    }
  }, [execution]);

  useEffect(() => {
    if (!execution || execution.status !== 'RUNNING') return;
    const step = execution.stepsSnapshot[execution.currentStepIndex];
    if (!step?.durationSec) return;
    const remaining = step.durationSec * 1000 - execution.stepElapsedMs;
    if (remaining <= 3_000 && remaining > 0 && warnedStep.current !== execution.currentStepIndex) {
      warnedStep.current = execution.currentStepIndex;
      stepEndCue();
    }
  }, [execution]);

  useEffect(() => {
    if (!execution || (execution.status !== 'COMPLETED' && execution.status !== 'ABORTED') || finalized.current) return;
    finalized.current = true;
    const key = localStorage.getItem(`workout-finish-key:${execution.id}`)
      ?? (globalThis.crypto?.randomUUID?.() ?? `finish-${Date.now()}`);
    localStorage.setItem(`workout-finish-key:${execution.id}`, key);
    setSaving(true);
    void sendExecutionMutation(execution.id, execution.status === 'ABORTED' ? 'abort' : 'complete', {
      idempotencyKey: key, occurredAt: execution.finishedAt ?? new Date().toISOString(),
    }).then((server) => server && setExecution(server)).finally(() => setSaving(false));
  }, [execution]);

  useEffect(() => {
    let sentinel: WakeSentinel | null = null;
    const request = async () => {
      if (executionStatus !== 'RUNNING') return;
      try {
        const wakeLock = (navigator as WakeNavigator).wakeLock;
        if (!wakeLock) {
          setWakeMode('FALLBACK');
          return;
        }
        sentinel = await wakeLock.request('screen');
        setWakeMode('ACTIVE');
      } catch {
        setWakeMode('FALLBACK');
      }
    };
    const visibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) void request();
    };
    void request();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      void sentinel?.release();
      setWakeMode('OFF');
    };
  }, [executionStatus]);

  const sendAction = useCallback((type: WorkoutAction, delta?: number) => {
    if (!execution) return;
    const nowMs = monotonicNow();
    const localType = type === 'SKIP_STEP' ? 'SKIP' : type === 'PREVIOUS_STEP' ? 'PREVIOUS' : type;
    const local = workoutReducer(execution, localType === 'INTENSITY'
      ? { type: 'INTENSITY', nowMs, deltaPct: delta ?? 0 }
      : { type: localType, nowMs } as Parameters<typeof workoutReducer>[1]);
    setExecution(local);
    const key = globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}-${type}`;
    setSaving(true);
    void sendExecutionMutation(execution.id, 'events', {
      type, idempotencyKey: key, occurredAt: new Date(nowMs).toISOString(),
      ...(delta != null ? { intensityDeltaPct: delta } : {}),
    }).then((server) => server && setExecution(server)).finally(() => setSaving(false));
  }, [execution, monotonicNow]);

  const abort = useCallback(() => {
    setExecution((current) => (current ? workoutReducer(current, { type: 'ABORT', nowMs: monotonicNow() }) : current));
  }, [monotonicNow]);

  return { execution, setExecution, loading, loadError, locked, online, saving, setSaving, wakeMode, sendAction, abort };
}

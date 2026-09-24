import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import type { WorkoutExecution } from '@/types/training';

import { resolveDeviceSource, type DeviceSource } from './deviceSource';
import { TrainerSession, type ControlMode, type RideSample, type SessionSnapshot } from './trainerSession';

import type { DeviceKind } from './types';

const TICK_MS = 1_000;

export interface TrainerSessionApi {
  snapshot: SessionSnapshot;
  sourceKind: DeviceSource['kind'];
  bluetoothAvailable: boolean | null;
  connecting: Partial<Record<DeviceKind, boolean>>;
  connectError: string | null;
  connect(kind: DeviceKind): Promise<void>;
  disconnect(kind: DeviceKind): Promise<void>;
  setMode(mode: ControlMode): void;
  setResistance(percent: number): void;
}

function describeError(error: unknown): string | null {
  if (error instanceof DOMException && error.name === 'NotFoundError') return null; // chooser dismissed
  if (error instanceof Error) return error.message;
  return 'Nie udało się połączyć z urządzeniem';
}

/**
 * Connects the workout execution to live devices: ticks metrics at 1 Hz,
 * applies ERG/resistance on every execution change and cleans up on exit.
 */
export function useTrainerSession(
  execution: WorkoutExecution | null,
  { search = typeof window === 'undefined' ? '' : window.location.search, onSample }: { search?: string; onSample?: (sample: RideSample) => void } = {},
): TrainerSessionApi {
  const source = useMemo(() => resolveDeviceSource(search), [search]);
  const sampleRef = useRef(onSample);
  sampleRef.current = onSample;
  const ftpWatts = execution?.ftpWatts ?? null;
  const session = useMemo(
    () => new TrainerSession({ ftpWatts, onSample: (sample) => sampleRef.current?.(sample) }),
    [ftpWatts],
  );
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const [connecting, setConnecting] = useState<Partial<Record<DeviceKind, boolean>>>({});
  const [connectError, setConnectError] = useState<string | null>(null);
  const [bluetoothAvailable, setBluetoothAvailable] = useState<boolean | null>(null);
  const executionRef = useRef(execution);
  executionRef.current = execution;

  useEffect(() => session.subscribe(rerender), [session]);

  useEffect(() => {
    let active = true;
    // Exposed for end-to-end tests and manual demo checks (e.g. simulating a dropped link).
    if (source.simulation) (window as Window & { __trainerSim?: unknown }).__trainerSim = source.simulation;
    void source.isAvailable().then((available) => { if (active) setBluetoothAvailable(available); });
    (['trainer', 'heartRate'] as const).forEach((kind) => {
      void source.reconnectKnown(kind).then((device) => { if (active && device) session.attach(device); });
    });
    return () => {
      active = false;
      (['trainer', 'heartRate'] as const).forEach((kind) => {
        const device = session.device(kind);
        void device?.disconnect();
      });
      session.dispose();
      source.dispose();
    };
  }, [session, source]);

  const running = execution?.status === 'RUNNING';
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const current = executionRef.current;
      if (current) session.tick(current.currentStepIndex, current.workoutElapsedMs, Date.now());
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [running, session]);

  useEffect(() => {
    if (!execution) return;
    void session.syncControl({
      running: execution.status === 'RUNNING',
      steps: execution.stepsSnapshot,
      stepIndex: execution.currentStepIndex,
      stepElapsedMs: execution.stepElapsedMs,
      adjustmentPct: execution.intensityAdjustmentPct,
      nowMs: Date.now(),
    });
  }, [execution, session]);

  const connect = useCallback(async (kind: DeviceKind) => {
    setConnectError(null);
    setConnecting((current) => ({ ...current, [kind]: true }));
    try {
      const device = kind === 'trainer' ? await source.connectTrainer() : await source.connectHeartRate();
      session.attach(device);
    } catch (error) {
      setConnectError(describeError(error));
    } finally {
      setConnecting((current) => ({ ...current, [kind]: false }));
    }
  }, [session, source]);

  const disconnect = useCallback(async (kind: DeviceKind) => {
    const device = session.device(kind);
    session.detach(kind);
    await device?.disconnect();
  }, [session]);

  return {
    snapshot: session.snapshot(Date.now()),
    sourceKind: source.kind,
    bluetoothAvailable,
    connecting,
    connectError,
    connect,
    disconnect,
    setMode: useCallback((mode: ControlMode) => session.setMode(mode), [session]),
    setResistance: useCallback((percent: number) => session.setResistance(percent), [session]),
  };
}

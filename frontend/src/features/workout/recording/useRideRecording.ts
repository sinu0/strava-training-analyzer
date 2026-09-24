import { useCallback, useEffect, useRef, useState } from 'react';

import type { WorkoutExecution } from '@/types/training';

import { activityFitUrl, uploadRideSamples } from '../workoutApi';
import { createRideRecorder, indexedDbRecordingStorage, uploadPendingChunks, type RideRecorder } from './rideRecorder';

import type { RideSample } from '../devices/trainerSession';

export type RecordingState = 'none' | 'uploading' | 'ready' | 'failed';

const flagKey = (executionId: string) => `ride-recording:${executionId}`;

function readFlag(executionId: string | undefined): boolean {
  if (!executionId) return false;
  try { return localStorage.getItem(flagKey(executionId)) === '1'; } catch { return false; }
}

/** Optional in-app recording of the ride (1 Hz), uploaded after the workout for FIT export. */
export function useRideRecording(execution: WorkoutExecution | null) {
  const executionId = execution?.id;
  const finished = execution?.status === 'COMPLETED' || execution?.status === 'ABORTED';
  const [enabled, setEnabledState] = useState(() => readFlag(executionId));
  const [state, setState] = useState<RecordingState>('none');
  const storage = useRef(indexedDbRecordingStorage());
  const recorder = useRef<Promise<RideRecorder> | null>(null);

  useEffect(() => { setEnabledState(readFlag(executionId)); }, [executionId]);

  const setEnabled = useCallback((value: boolean) => {
    if (!executionId) return;
    try { localStorage.setItem(flagKey(executionId), value ? '1' : '0'); } catch { /* flag is a convenience */ }
    setEnabledState(value);
  }, [executionId]);

  const onSample = useCallback((sample: RideSample) => {
    if (!enabled || !executionId) return;
    recorder.current ??= createRideRecorder(executionId, { storage: storage.current });
    void recorder.current.then((instance) => instance.append(sample));
  }, [enabled, executionId]);

  const upload = useCallback(async () => {
    if (!executionId) return;
    setState('uploading');
    if (recorder.current) await (await recorder.current).flush();
    const result = await uploadPendingChunks(executionId, storage.current, uploadRideSamples);
    setState(result.pending > 0 ? 'failed' : 'ready');
  }, [executionId]);

  useEffect(() => {
    if (!finished || !enabled) return;
    void upload();
    const retry = () => { void upload(); };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [finished, enabled, upload]);

  return {
    enabled,
    setEnabled,
    locked: finished,
    onSample,
    state: enabled ? state : 'none' as RecordingState,
    fitUrl: executionId && enabled ? activityFitUrl(executionId) : null,
  };
}

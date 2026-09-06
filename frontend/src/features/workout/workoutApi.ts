import axios from 'axios';

import apiClient from '@/api/client';
import type { TrainingPlan, WorkoutDeliveryCapability, WorkoutExecution } from '@/types/training';

import {
  enqueueWorkoutMutation,
  queuedWorkoutMutations,
  removeQueuedWorkoutMutation,
  saveActiveExecution,
} from './offlineStore';

function isTransportUnavailable(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return axios.isAxiosError(error) && !axios.isCancel(error) && !error.response;
}

export async function getScheduledWorkout(id: string): Promise<TrainingPlan> {
  return (await apiClient.get<TrainingPlan>(`/v2/workouts/scheduled/${id}`)).data;
}

export async function getActiveExecution(): Promise<WorkoutExecution | null> {
  const response = await apiClient.get<WorkoutExecution>('/v2/workouts/executions/active');
  return response.status === 204 || !response.data ? null : response.data;
}

export async function getExecution(id: string): Promise<WorkoutExecution> {
  return (await apiClient.get<WorkoutExecution>(`/v2/workouts/executions/${id}`)).data;
}

export async function startExecution(planId: string, idempotencyKey: string): Promise<WorkoutExecution> {
  const { data } = await apiClient.post<WorkoutExecution>(`/v2/workouts/scheduled/${planId}/executions/start`, {
    idempotencyKey,
    occurredAt: new Date().toISOString(),
    deliveryMethod: 'ON_DEVICE',
  });
  await saveActiveExecution(data);
  return data;
}

export async function deliveryCapabilities(): Promise<WorkoutDeliveryCapability[]> {
  return (await apiClient.get<WorkoutDeliveryCapability[]>('/v2/workouts/delivery-capabilities')).data;
}

export async function sendExecutionMutation(
  executionId: string,
  suffix: string,
  body: Record<string, unknown>,
  method: 'POST' | 'PUT' = 'POST',
): Promise<WorkoutExecution | null> {
  const url = `/v2/workouts/executions/${executionId}/${suffix}`;
  const queueId = String(body.idempotencyKey ?? `${method}:${url}:${JSON.stringify(body)}`);
  try {
    const response = method === 'POST'
      ? await apiClient.post<WorkoutExecution>(url, body)
      : await apiClient.put<WorkoutExecution>(url, body);
    await saveActiveExecution(response.data);
    return response.data;
  } catch (error) {
    if (isTransportUnavailable(error)) {
      await enqueueWorkoutMutation({ id: queueId, url, method, body, createdAt: new Date().toISOString() });
      return null;
    }
    throw error;
  }
}

export async function flushWorkoutQueue(): Promise<number> {
  if (!navigator.onLine) return 0;
  let completed = 0;
  for (const mutation of await queuedWorkoutMutations()) {
    try {
      const response = mutation.method === 'POST'
        ? await apiClient.post<WorkoutExecution>(mutation.url, mutation.body)
        : await apiClient.put<WorkoutExecution>(mutation.url, mutation.body);
      await saveActiveExecution(response.data);
      await removeQueuedWorkoutMutation(mutation.id);
      completed += 1;
    } catch {
      break;
    }
  }
  return completed;
}

export function scheduledExportUrl(planId: string, format: 'fit' | 'zwo'): string {
  return `/api/v2/workouts/scheduled/${planId}/export/${format}`;
}

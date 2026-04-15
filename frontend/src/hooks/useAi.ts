import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import apiClient from '@/api/client';
import {
  POLL_STANDARD,
  STALE_REALTIME,
  STALE_SHORT,
  STALE_STANDARD,
} from '@/constants/queryConfig';
import type {
  AiActivityNote,
  AiModuleStatus,
  AiNoteAskResponse,
  PredictionRequest,
  PredictionResponse,
} from '@/types/ai';

const PREDICTION_RECOVERY_ATTEMPTS = 8;
const PREDICTION_RECOVERY_DELAY_MS = 3_000;
const PREDICTION_RECOVERY_LIMIT = 3;
const PREDICTION_RECOVERY_CLOCK_SKEW_MS = 5_000;

type SilentRequestConfig = {
  params?: Record<string, string | number>;
  skipErrorNotification?: boolean;
};

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}

function isGatewayTimeout(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 504;
}

function isRecoveredPrediction(prediction: PredictionResponse, requestStartedAt: number) {
  const createdAt = Date.parse(prediction.createdAt);
  return Number.isFinite(createdAt) && createdAt >= requestStartedAt - PREDICTION_RECOVERY_CLOCK_SKEW_MS;
}

async function recoverTimedOutPrediction(
  predictionType: PredictionRequest['predictionType'],
  requestStartedAt: number,
) {
  const requestConfig: SilentRequestConfig = {
    params: { type: predictionType, limit: PREDICTION_RECOVERY_LIMIT },
    skipErrorNotification: true,
  };

  for (let attempt = 0; attempt < PREDICTION_RECOVERY_ATTEMPTS; attempt += 1) {
    const { data } = await apiClient.get<PredictionResponse[]>('/ai/predictions', requestConfig);
    const recoveredPrediction = data.find((prediction) => isRecoveredPrediction(prediction, requestStartedAt));

    if (recoveredPrediction) {
      return recoveredPrediction;
    }

    if (attempt < PREDICTION_RECOVERY_ATTEMPTS - 1) {
      await sleep(PREDICTION_RECOVERY_DELAY_MS);
    }
  }

  return null;
}

export async function requestPredictionWithRecovery(request: PredictionRequest) {
  const requestStartedAt = Date.now();
  const requestConfig: SilentRequestConfig = { skipErrorNotification: true };

  try {
    const { data } = await apiClient.post<PredictionResponse>('/ai/predict', request, requestConfig);
    return data;
  } catch (error) {
    if (isGatewayTimeout(error)) {
      const recoveredPrediction = await recoverTimedOutPrediction(request.predictionType, requestStartedAt);
      if (recoveredPrediction) {
        return recoveredPrediction;
      }
    }

    throw error;
  }
}

export function useAiStatus() {
  return useQuery<AiModuleStatus>({
    queryKey: ['aiStatus'],
    queryFn: async () => {
      const { data } = await apiClient.get<AiModuleStatus>('/ai/status');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useAiPredict() {
  const queryClient = useQueryClient();
  return useMutation<PredictionResponse, Error, PredictionRequest>({
    mutationFn: requestPredictionWithRecovery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiHistory'] });
    },
  });
}

export function useAiHistory(type?: string, limit = 20) {
  return useQuery<PredictionResponse[]>({
    queryKey: ['aiHistory', type, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit };
      if (type) params.type = type;
      const { data } = await apiClient.get<PredictionResponse[]>('/ai/predictions', { params });
      return data;
    },
  });
}

export function useTodayAiTips() {
  return useQuery<PredictionResponse[]>({
    queryKey: ['todayAiTips'],
    queryFn: async () => {
      const { data } = await apiClient.get<PredictionResponse[]>('/ai/today-tips');
      return data;
    },
    staleTime: STALE_STANDARD,
  });
}

export function useRunAiBatch() {
  const queryClient = useQueryClient();
  return useMutation<{ success: number; skipped: number; failed: number; message: string }, Error, boolean>({
    mutationFn: async (skipExisting) => {
      const { data } = await apiClient.post(
        `/ai/batch/run?skipExisting=${skipExisting}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayAiTips'] });
      queryClient.invalidateQueries({ queryKey: ['aiHistory'] });
    },
  });
}

// --- AI Activity Notes (Coach) ---

export function useAiNote(activityId: string | undefined) {
  return useQuery<AiActivityNote>({
    queryKey: ['aiNote', activityId],
    queryFn: async () => {
      const { data } = await apiClient.get<AiActivityNote>(`/activities/${activityId}/ai-note`);
      return data;
    },
    enabled: !!activityId,
    staleTime: STALE_SHORT,
    // Poll while note is being generated in the queue
    refetchInterval: (query) => {
      const note = query.state.data;
      if (note && !note.summary && (note.queueStatus === 'pending' || note.queueStatus === 'processing')) {
        return POLL_STANDARD;
      }
      return false;
    },
  });
}

export function useGenerateAiNote() {
  const queryClient = useQueryClient();
  return useMutation<AiActivityNote, Error, string>({
    mutationFn: async (activityId) => {
      const { data } = await apiClient.post<AiActivityNote>(`/activities/${activityId}/ai-note/generate`);
      return data;
    },
    onSuccess: (_data, activityId) => {
      queryClient.invalidateQueries({ queryKey: ['aiNote', activityId] });
    },
  });
}

export function useRefreshAiNote() {
  const queryClient = useQueryClient();
  return useMutation<AiActivityNote, Error, string>({
    mutationFn: async (activityId) => {
      const { data } = await apiClient.post<AiActivityNote>(`/activities/${activityId}/ai-note/refresh`);
      return data;
    },
    onSuccess: (_data, activityId) => {
      queryClient.invalidateQueries({ queryKey: ['aiNote', activityId] });
    },
  });
}

export function useAskAiNote() {
  return useMutation<AiNoteAskResponse, Error, { activityId: string; question: string }>({
    mutationFn: async ({ activityId, question }) => {
      const { data } = await apiClient.post<AiNoteAskResponse>(
        `/activities/${activityId}/ai-note/ask`,
        { question }
      );
      return data;
    },
  });
}

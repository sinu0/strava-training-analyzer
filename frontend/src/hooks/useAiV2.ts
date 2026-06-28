import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import { STALE_STANDARD } from '@/constants/queryConfig';

import type {
  PredictionRequestV2,
  PredictionResponseV2,
  CompareRequest,
  KnowledgeStatus,
} from '@/types/aiV2';

export function useAiPredictV2() {
  const queryClient = useQueryClient();
  return useMutation<PredictionResponseV2, Error, PredictionRequestV2>({
    mutationFn: async (request) => {
      const { data } = await apiClient.post<PredictionResponseV2>('/v2/ai/predict', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiV2History'] });
      queryClient.refetchQueries({ queryKey: ['aiV2History'] });
    },
  });
}

export function useAiCompare(request: CompareRequest | null) {
  return useQuery<PredictionResponseV2[]>({
    queryKey: ['aiV2Compare', request],
    queryFn: async () => {
      const { data } = await apiClient.post<PredictionResponseV2[]>('/v2/ai/compare', request);
      return data;
    },
    enabled: !!request,
    staleTime: STALE_STANDARD,
  });
}

export function useAiModels() {
  return useQuery<{ primary: string; providers: string[]; available: boolean }>({
    queryKey: ['aiV2Models'],
    queryFn: async () => {
      const { data } = await apiClient.get<
        { primary: string; providers: string[]; available: boolean }
      >('/v2/ai/models');
      return data;
    },
    staleTime: STALE_STANDARD,
  });
}

export function useKnowledgeStatus() {
  return useQuery<KnowledgeStatus>({
    queryKey: ['aiV2KnowledgeStatus'],
    queryFn: async () => {
      const { data } = await apiClient.get<KnowledgeStatus>('/v2/ai/knowledge/status');
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useRefreshKnowledge() {
  const queryClient = useQueryClient();
  return useMutation<{ status: string; documentsIndexed?: number; error?: string }, Error>({
    mutationFn: async () => {
      const { data } = await apiClient.post<
        { status: string; documentsIndexed?: number; error?: string }
      >('/v2/ai/knowledge/refresh');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiV2KnowledgeStatus'] });
    },
  });
}

export function useAiHistoryV2(type?: string, limit = 20) {
  return useQuery<PredictionResponseV2[]>({
    queryKey: ['aiV2History', type, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit };
      if (type) params.type = type;
      const { data } = await apiClient.get<PredictionResponseV2[]>('/v2/ai/history', { params });
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });
}

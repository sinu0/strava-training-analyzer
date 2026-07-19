import { useQuery, useMutation } from '@tanstack/react-query';

import apiClient from '@/api/client';
import { STALE_REALTIME } from '@/constants/queryConfig';
import type { AdaptiveCoachResponse, AdaptiveCoachRequest } from '@/types/adaptiveCoach';

export function useCoachToday() {
  return useQuery<AdaptiveCoachResponse>({
    queryKey: ['coach', 'today'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdaptiveCoachResponse>('/coach/today');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useCoachDecide() {
  return useMutation<AdaptiveCoachResponse, Error, AdaptiveCoachRequest>({
    mutationFn: async (request) => {
      const { data } = await apiClient.post<AdaptiveCoachResponse>('/coach/decide', request);
      return data;
    },
  });
}

export interface PostSessionFeedback {
  rpe: number;
  subjectiveFeedback: string;
  executionQuality: number;
  completed: boolean;
  actualTss: number;
  actualDurationMinutes: number;
  plannedType: string;
}

export function useCoachFeedback() {
  return useMutation<void, Error, PostSessionFeedback>({
    mutationFn: async (feedback) => {
      await apiClient.post('/coach/feedback', feedback);
    },
  });
}

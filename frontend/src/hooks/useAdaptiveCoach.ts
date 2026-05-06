import { useQuery, useMutation } from '@tanstack/react-query';

import apiClient from '@/api/client';
import { STALE_REALTIME } from '@/constants/queryConfig';
import type { AdaptiveCoachRequest, AdaptiveCoachResponse } from '@/types/adaptiveCoach';

export function useAdaptiveCoachToday(
  goalType?: string,
  targetValue?: number,
  currentValue?: number,
  aiInput?: string,
  overrideState?: string,
  timeAvailableMinutes?: number,
) {
  return useQuery<AdaptiveCoachResponse>({
    queryKey: ['adaptive-coach-today', goalType, targetValue, currentValue, aiInput, overrideState, timeAvailableMinutes],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (goalType) params.set('goalType', goalType);
      if (targetValue) params.set('targetValue', String(targetValue));
      if (currentValue) params.set('currentValue', String(currentValue));
      if (aiInput) params.set('aiInput', aiInput);
      if (overrideState && overrideState !== 'NONE') params.set('overrideState', overrideState);
      if (timeAvailableMinutes) params.set('timeAvailableMinutes', String(timeAvailableMinutes));
      const { data } = await apiClient.get<AdaptiveCoachResponse>(
        `/adaptive-coach/today?${params.toString()}`,
      );
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useAdaptiveCoach(request: AdaptiveCoachRequest | null) {
  return useQuery<AdaptiveCoachResponse>({
    queryKey: ['adaptive-coach', request],
    queryFn: async () => {
      const { data } = await apiClient.post<AdaptiveCoachResponse>('/adaptive-coach/decide', request);
      return data;
    },
    staleTime: STALE_REALTIME,
    enabled: request !== null,
  });
}

export interface PostFeedbackRequest {
  rpe: number;
  subjectiveFeedback: string;
  executionQuality: number;
  completed: boolean;
  actualTss: number;
  actualDurationMinutes: number;
  plannedType: string;
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async (request: PostFeedbackRequest) => {
      await apiClient.post('/adaptive-coach/feedback', request);
    },
  });
}


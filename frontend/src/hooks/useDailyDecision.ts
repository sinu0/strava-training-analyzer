import { useQuery, useMutation } from '@tanstack/react-query';

import apiClient from '@/api/client';
import { STALE_REALTIME } from '@/constants/queryConfig';
import type { DailyDecisionDto } from '@/types/dailyDecision';

export function useDailyDecision() {
  return useQuery<DailyDecisionDto>({
    queryKey: ['daily-decision'],
    queryFn: async () => {
      const { data } = await apiClient.get<DailyDecisionDto>('/daily-decision');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export interface AcceptDecisionRequest {
  decision: string;
  workoutType: string;
  durationMin: number;
  targetTss: number;
}

export function useAcceptDecision() {
  return useMutation({
    mutationFn: async (request: AcceptDecisionRequest) => {
      const { data } = await apiClient.post('/daily-decision/accept', request);
      return data;
    },
  });
}

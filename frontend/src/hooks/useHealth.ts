import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';
import { STALE_STANDARD } from '@/constants/queryConfig';
import type { HealthOverview, HealthDay, RecoveryStatus } from '@/types/health';

export function useHealthOverview(days = 30) {
  return useQuery<HealthOverview>({
    queryKey: ['healthOverview', days],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthOverview>('/health/overview', {
        params: { days },
      });
      return data;
    },
    staleTime: STALE_STANDARD,
  });
}

export function useHealthTimeline(from: string, to: string) {
  return useQuery<HealthDay[]>({
    queryKey: ['healthTimeline', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthDay[]>('/health/timeline', {
        params: { from, to },
      });
      return data;
    },
    enabled: !!from && !!to,
    staleTime: STALE_STANDARD,
  });
}

export function useRecoveryStatus() {
  return useQuery<RecoveryStatus>({
    queryKey: ['recoveryStatus'],
    queryFn: async () => {
      const { data } = await apiClient.get<RecoveryStatus>('/health/recovery');
      return data;
    },
    staleTime: STALE_STANDARD,
  });
}

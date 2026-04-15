import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';

import type { WeeklyMmp, WPrimeBalanceData } from '../types/power';

export function useWeeklyMmp(from: string, to: string) {
  return useQuery<WeeklyMmp[]>({
    queryKey: ['weeklyMmp', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<WeeklyMmp[]>('/analytics/weekly-mmp', {
        params: { from, to },
      });
      return data;
    },
    enabled: !!from && !!to,
  });
}

export function useWPrimeBalance(activityId: string | null) {
  return useQuery<WPrimeBalanceData>({
    queryKey: ['wPrimeBalance', activityId],
    queryFn: async () => {
      const { data } = await apiClient.get<WPrimeBalanceData>(
        `/analytics/w-prime/${activityId}`
      );
      return data;
    },
    enabled: !!activityId,
  });
}

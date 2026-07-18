import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';

import type { TodayResponse } from './types';

export function useToday() {
  return useQuery({
    queryKey: ['v2', 'today'],
    queryFn: async () => {
      const response = await apiClient.get<TodayResponse>('/v2/today');
      return response.data;
    },
    staleTime: 60_000,
  });
}

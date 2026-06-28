import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';

import type { Nudge } from '../types/challenges';

export function useNudges() {
  return useQuery<Nudge[]>({
    queryKey: ['nudges'],
    queryFn: async () => {
      const { data } = await apiClient.get<Nudge[]>('/nudges');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

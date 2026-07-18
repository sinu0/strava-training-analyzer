import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';

export interface LoadScenario {
  from: string;
  to: string;
  availability: 'UNKNOWN' | 'PARTIAL' | 'AVAILABLE';
  assumptions: string[];
  points: Array<{ date: string; plannedTss: number; ctl: number; atl: number; form: number }>;
}

export function useLoadScenario(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ['v2', 'planning', 'load-scenario', from, to],
    enabled,
    queryFn: async () => (await apiClient.get<LoadScenario>('/v2/planning/load-scenario', { params: { from, to } })).data,
  });
}

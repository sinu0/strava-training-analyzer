import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';
import { STALE_REALTIME } from '@/constants/queryConfig';
import type { TrainingPrioritiesData } from '@/types/trainingPriorities';

export function useTrainingPriorities() {
  return useQuery<TrainingPrioritiesData>({
    queryKey: ['trainingPriorities'],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingPrioritiesData>(
        '/training-priorities',
      );
      return data;
    },
    staleTime: STALE_REALTIME,
    retry: 1,
  });
}

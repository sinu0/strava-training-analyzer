import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import type { TrainingContext, WeeklyReview } from '@/types/trainingContext';

export function useTrainingContext() {
  return useQuery({ queryKey: ['v2', 'training', 'context'], queryFn: async () => (await apiClient.get<TrainingContext>('/v2/training/context')).data });
}

export function useSaveTrainingContext() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (context: TrainingContext) => (await apiClient.put<TrainingContext>('/v2/training/context', context)).data,
    onSuccess: async (data) => {
      client.setQueryData(['v2', 'training', 'context'], data);
      await client.invalidateQueries({ queryKey: ['v2', 'today'] });
      await client.invalidateQueries({ queryKey: ['v2', 'training', 'weekly-review'] });
    },
  });
}

export function useWeeklyReview(from?: string) {
  return useQuery({ queryKey: ['v2', 'training', 'weekly-review', from], queryFn: async () => (await apiClient.get<WeeklyReview>('/v2/training/weekly-review', { params: { from } })).data });
}

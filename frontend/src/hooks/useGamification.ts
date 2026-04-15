import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '../api/client';

import type { Achievement } from '../types/analytics';

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data } = await apiClient.get<Achievement[]>('/gamification/achievements');
      return data;
    },
  });
}

export function useEvaluateAchievements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<Achievement[]>('/gamification/achievements/evaluate');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '../api/client';

import type { Challenge, ChallengeTemplate, SaveChallengeRequest } from '../types/challenges';

export function useChallenges() {
  return useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data } = await apiClient.get<Challenge[]>('/challenges');
      return data;
    },
  });
}

export function useActiveChallenges() {
  return useQuery<Challenge[]>({
    queryKey: ['challenges-active'],
    queryFn: async () => {
      const { data } = await apiClient.get<Challenge[]>('/challenges/active');
      return data;
    },
  });
}

export function useChallengeTemplates() {
  return useQuery<ChallengeTemplate[]>({
    queryKey: ['challenge-templates'],
    queryFn: async () => {
      const { data } = await apiClient.get<ChallengeTemplate[]>('/challenges/templates');
      return data;
    },
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SaveChallengeRequest) => {
      const { data } = await apiClient.post<Challenge>('/challenges', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges-active'] });
    },
  });
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/challenges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges-active'] });
    },
  });
}

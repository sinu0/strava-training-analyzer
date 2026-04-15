import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import {
  invalidateProfileQueries,
  invalidateWeightQueries,
} from '@/hooks/queryInvalidation';
import type {
  WeightOverview,
  WeightRecord,
  AddWeightRequest,
  WeightGoal,
  SetWeightGoalRequest,
} from '@/types/weight';

export function useWeightOverview() {
  return useQuery<WeightOverview>({
    queryKey: ['weightOverview'],
    queryFn: async () => {
      const { data } = await apiClient.get<WeightOverview>('/weight');
      return data;
    },
  });
}

export function useWeightHistory(from?: string, to?: string) {
  return useQuery<WeightRecord[]>({
    queryKey: ['weightHistory', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<WeightRecord[]>('/weight/history', {
        params: { from, to },
      });
      return data;
    },
  });
}

export function useAddWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: AddWeightRequest) => {
      const { data } = await apiClient.post<WeightRecord>('/weight', request);
      return data;
    },
    onSuccess: () => {
      invalidateWeightQueries(queryClient);
      invalidateProfileQueries(queryClient);
    },
  });
}

export function useDeleteWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/weight/${id}`);
    },
    onSuccess: () => {
      invalidateWeightQueries(queryClient);
    },
  });
}

export function useSetWeightGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SetWeightGoalRequest) => {
      const { data } = await apiClient.post<WeightGoal>('/weight/goal', request);
      return data;
    },
    onSuccess: () => {
      invalidateWeightQueries(queryClient);
    },
  });
}

export function useDeleteWeightGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/weight/goal/${id}`);
    },
    onSuccess: () => {
      invalidateWeightQueries(queryClient);
    },
  });
}

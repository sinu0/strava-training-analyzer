import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import { STALE_REALTIME } from '@/constants/queryConfig';
import type { GarminStatus, GarminHealthData, GarminSyncResult } from '@/types/garmin';

export function useGarminStatus() {
  return useQuery<GarminStatus>({
    queryKey: ['garminStatus'],
    queryFn: async () => {
      const { data } = await apiClient.get<GarminStatus>('/garmin/status');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useGarminHealth(from: string, to: string) {
  return useQuery<GarminHealthData[]>({
    queryKey: ['garminHealth', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<GarminHealthData[]>('/garmin/health/range', {
        params: { from, to },
      });
      return data;
    },
    enabled: !!from && !!to,
  });
}

export function useSaveGarminCredentials() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { email: string; password: string }>({
    mutationFn: async (credentials) => {
      await apiClient.post('/garmin/credentials', credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garminStatus'] });
    },
  });
}

export function useDeleteGarminCredentials() {
  const queryClient = useQueryClient();
  return useMutation<void, Error>({
    mutationFn: async () => {
      await apiClient.delete('/garmin/credentials');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garminStatus'] });
      queryClient.invalidateQueries({ queryKey: ['garminHealth'] });
    },
  });
}

export function useGarminSync() {
  const queryClient = useQueryClient();
  return useMutation<GarminSyncResult, Error, { from?: string; to?: string } | void>({
    mutationFn: async (params) => {
      const { data } = await apiClient.post<GarminSyncResult>('/garmin/sync', null, {
        params: params ? { from: params.from, to: params.to } : undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garminStatus'] });
      queryClient.invalidateQueries({ queryKey: ['garminHealth'] });
    },
  });
}

import { useMutation, useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';

export interface DataQualitySummary {
  totalActivities: number;
  assessedActivities: number;
  available: number;
  partial: number;
  unknown: number;
}

export interface ProcessingJob {
  id: string;
  jobType: string;
  mode: string;
  stage: string;
  status: 'QUEUED' | 'RUNNING' | 'RETRYABLE' | 'FAILED' | 'COMPLETED';
  attempt: number;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt: string;
}

export function useDataQualitySummary() {
  return useQuery({
    queryKey: ['v2', 'data-quality', 'summary'],
    queryFn: async () => (await apiClient.get<DataQualitySummary>('/v2/data-quality/summary')).data,
  });
}

export function useProcessingJob(id?: string) {
  return useQuery({
    queryKey: ['v2', 'jobs', id],
    enabled: Boolean(id),
    queryFn: async () => (await apiClient.get<ProcessingJob>(`/v2/jobs/${id}`)).data,
    refetchInterval: query => {
      const status = query.state.data?.status;
      return status === 'QUEUED' || status === 'RUNNING' ? 1500 : false;
    },
  });
}

export function useCreateImportJob() {
  return useMutation({
    mutationFn: async (mode: 'RECENT' | 'FULL') =>
      (await apiClient.post<ProcessingJob>('/v2/import-jobs', { mode })).data,
  });
}

export function useCreateRecalculationJob() {
  return useMutation({
    mutationFn: async () => (await apiClient.post<ProcessingJob>('/v2/recalculation-jobs')).data,
  });
}

export function useRetryJob() {
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.post<ProcessingJob>(`/v2/jobs/${id}/retry`)).data,
  });
}

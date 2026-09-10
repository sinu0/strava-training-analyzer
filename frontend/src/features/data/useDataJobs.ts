import { useMutation, useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';

export interface DataQualitySummary {
  totalActivities: number;
  assessedActivities: number;
  available: number;
  partial: number;
  unknown: number;
  unassessed: number;
  measuredPowerActivities: number;
  estimatedPowerActivities: number;
  unknownPowerProvenanceActivities: number;
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
  retryAt?: string | null;
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
    refetchInterval: query => jobRefetchInterval(query.state.data),
  });
}

export function useLatestProcessingJob() {
  return useQuery({
    queryKey: ['v2', 'jobs', 'latest'],
    queryFn: async () => {
      const response = await apiClient.get<ProcessingJob>('/v2/jobs/latest');
      return response.status === 204 ? null : response.data;
    },
    refetchInterval: query => jobRefetchInterval(query.state.data),
  });
}

function jobRefetchInterval(job?: ProcessingJob | null) {
  if (job?.status === 'QUEUED' || job?.status === 'RUNNING') return 1500;
  if (job?.status === 'RETRYABLE' && job.retryAt) {
    const untilRetry = Date.parse(job.retryAt) - Date.now();
    return Math.max(1500, Math.min(untilRetry + 1000, 60_000));
  }
  return false;
}

export function useCreateImportJob() {
  return useMutation({
    mutationFn: async (mode: 'RECENT' | 'FULL' | 'POWER_PROVENANCE') =>
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

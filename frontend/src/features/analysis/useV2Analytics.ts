import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';

import type { LoadAnalytics, PeriodComparison, PowerAnalytics } from './types';

export function usePeriodComparison(params: Record<string, string>, enabled: boolean) {
  return useQuery({
    queryKey: ['v2', 'analytics', 'compare', params],
    enabled,
    queryFn: async () => (await apiClient.get<PeriodComparison>('/v2/analytics/compare', { params })).data,
  });
}

export function useLoadAnalytics(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ['v2', 'analytics', 'load', from, to],
    enabled,
    queryFn: async () => (await apiClient.get<LoadAnalytics>('/v2/analytics/load', { params: { from, to } })).data,
  });
}

export function usePowerAnalytics(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ['v2', 'analytics', 'power', from, to],
    enabled,
    queryFn: async () => (await apiClient.get<PowerAnalytics>('/v2/analytics/power', { params: { from, to } })).data,
  });
}

import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';
import type { ActivityLap } from '@/types/activity';

import type { ActivityStreams, ActivityV2Detail, HistoryPageResponse } from './types';

export interface HistoryFilters {
  sportType?: string;
  from?: string;
  to?: string;
  page: number;
  size: number;
}

export function useHistoryActivities(filters: HistoryFilters, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'activities', filters],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get<HistoryPageResponse>('/v2/activities', { params: filters });
      return response.data;
    },
    placeholderData: previous => previous,
  });
}

export function useV2Activity(id?: string) {
  return useQuery({
    queryKey: ['v2', 'activity', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await apiClient.get<ActivityV2Detail>(`/v2/activities/${id}`);
      return response.data;
    },
  });
}

export function useActivityStreams(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['v2', 'activity', id, 'streams', 'analysis', 1000],
    enabled: Boolean(id) && enabled,
    queryFn: async () => {
      const response = await apiClient.get<ActivityStreams>(`/v2/activities/${id}/streams`, {
        params: { series: 'power,heartrate,cadence,altitude,distance,velocity', resolution: 1000 },
      });
      return response.data;
    },
  });
}

export function useActivityLaps(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['v2', 'activity', id, 'laps'],
    enabled: Boolean(id) && enabled,
    queryFn: async () => {
      const response = await apiClient.get<ActivityLap[]>(`/v2/activities/${id}/laps`);
      return response.data;
    },
  });
}

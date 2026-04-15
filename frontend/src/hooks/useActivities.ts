import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import { POLL_FAST } from '@/constants/queryConfig';
import { invalidateActivityQueries } from '@/hooks/queryInvalidation';
import type {
  ActivityDetail,
  ActivityHeatmapData,
  GeoJsonFeature,
  ActivitySummaryPage,
  ActivityTimelineEntry,
} from '@/types/activity';
import type { ActivityFilters, InfiniteActivityFilters } from '@/types/query';

function buildActivityParams(filters: ActivityFilters | InfiniteActivityFilters | undefined, page: number, size: number): URLSearchParams {
  const params = new URLSearchParams();
  if (filters?.sportType) params.set('sportType', filters.sportType);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.minDistanceKm != null) params.set('minDistanceKm', String(filters.minDistanceKm));
  if (filters?.maxDistanceKm != null) params.set('maxDistanceKm', String(filters.maxDistanceKm));
  if (filters?.minDurationMin != null) params.set('minDurationMin', String(filters.minDurationMin));
  if (filters?.maxDurationMin != null) params.set('maxDurationMin', String(filters.maxDurationMin));
  if (filters?.minAvgPowerW != null) params.set('minAvgPowerW', String(filters.minAvgPowerW));
  if (filters?.maxAvgPowerW != null) params.set('maxAvgPowerW', String(filters.maxAvgPowerW));
  if (filters?.minAvgHr != null) params.set('minAvgHr', String(filters.minAvgHr));
  if (filters?.maxAvgHr != null) params.set('maxAvgHr', String(filters.maxAvgHr));
  params.set('page', String(page));
  params.set('size', String(size));
  return params;
}

export function useActivities(filters?: ActivityFilters) {
  return useQuery<ActivitySummaryPage>({
    queryKey: ['activities', filters],
    queryFn: async () => {
      const params = buildActivityParams(filters, filters?.page ?? 0, filters?.size ?? 20);
      const { data } = await apiClient.get<ActivitySummaryPage>('/activities', { params });
      return data;
    },
  });
}

export function useInfiniteActivities(filters?: InfiniteActivityFilters) {
  return useInfiniteQuery<ActivitySummaryPage>({
    queryKey: ['activities-infinite', filters],
    queryFn: async ({ pageParam }) => {
      const params = buildActivityParams(filters, pageParam as number, 20);
      const { data } = await apiClient.get<ActivitySummaryPage>('/activities', { params });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

export function useActivitiesTimeline() {
  return useQuery<ActivityTimelineEntry[]>({
    queryKey: ['activitiesTimeline'],
    queryFn: async () => {
      const { data } = await apiClient.get<ActivityTimelineEntry[]>('/activities/timeline');
      return data;
    },
  });
}

export function useActivity(id: string | undefined) {
  return useQuery<ActivityDetail>({
    queryKey: ['activity', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ActivityDetail>(`/activities/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useActivityMap(id: string | undefined) {
  return useQuery<GeoJsonFeature>({
    queryKey: ['activityMap', id],
    queryFn: async () => {
      const { data } = await apiClient.get<GeoJsonFeature>(`/activities/${id}/map`);
      return data;
    },
    enabled: !!id,
  });
}

export function useRouteHeatmap() {
  return useQuery<ActivityHeatmapData>({
    queryKey: ['activityRouteHeatmap'],
    queryFn: async () => {
      const { data } = await apiClient.get<ActivityHeatmapData>('/activities/heatmap');
      return data;
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'rebuilding' ? POLL_FAST : false,
  });
}

export function useRecalculateActivityMetrics(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post(`/activities/${id}/recalculate-metrics`);
    },
    onSuccess: () => {
      invalidateActivityQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['activity', id] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import type { BackfillStatus } from '@/types/matchedRides';
import type {
  ActivitySegments,
  SegmentComparison,
  SegmentDetail,
  SegmentPage,
  SegmentSummary,
} from '@/types/segments';

export interface SegmentFilters {
  q?: string;
  favorite?: boolean;
  minDistanceM?: number;
  maxDistanceM?: number;
  minAverageGrade?: number;
  sort?: string;
  page?: number;
  size?: number;
}

export function useSegments(filters: SegmentFilters) {
  return useQuery({
    queryKey: ['v2', 'segments', filters],
    queryFn: async () => (await apiClient.get<SegmentPage>('/v2/segments', { params: filters })).data,
    placeholderData: previous => previous,
  });
}

export function useSegment(id?: string) {
  return useQuery({
    queryKey: ['v2', 'segment', id],
    enabled: Boolean(id),
    queryFn: async () => (await apiClient.get<SegmentDetail>(`/v2/segments/${id}`)).data,
  });
}

export function useActivitySegments(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'activity', id, 'segments'],
    enabled: Boolean(id) && enabled,
    queryFn: async () => (await apiClient.get<ActivitySegments>(`/v2/activities/${id}/segments`)).data,
  });
}

export function useSegmentComparison(segmentId: string | undefined, effortIds: string[], referenceId?: string) {
  return useQuery({
    queryKey: ['v2', 'segment', segmentId, 'comparison', effortIds, referenceId],
    enabled: Boolean(segmentId) && effortIds.length > 0,
    queryFn: async () => {
      const params = new URLSearchParams();
      effortIds.forEach(id => params.append('effortIds', id));
      if (referenceId) params.set('referenceEffortId', referenceId);
      return (await apiClient.get<SegmentComparison>(`/v2/segments/${segmentId}/comparison?${params}`)).data;
    },
  });
}

export function useSetSegmentFavorite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, favorite }: { id: number; favorite: boolean }) =>
      (await apiClient.patch<SegmentSummary>(`/v2/segments/${id}/favorite`, { favorite })).data,
    onSuccess: async (_, variables) => {
      await client.invalidateQueries({ queryKey: ['v2', 'segments'] });
      await client.invalidateQueries({ queryKey: ['v2', 'segment', String(variables.id)] });
    },
  });
}

export function useBackfillStatus(type: 'segments' | 'routes') {
  return useQuery({
    queryKey: ['v2', 'analysis-backfill', type],
    queryFn: async () => (await apiClient.get<BackfillStatus>(`/v2/analysis-data/backfill/${type}`)).data,
    refetchInterval: query => ['RUNNING', 'RATE_LIMITED'].includes(query.state.data?.status ?? '') ? 5_000 : false,
  });
}

export function useStartBackfill() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (type: 'segments' | 'routes') =>
      (await apiClient.post<BackfillStatus>(`/v2/analysis-data/backfill/${type}`)).data,
    onSuccess: async (_, type) => client.invalidateQueries({ queryKey: ['v2', 'analysis-backfill', type] }),
  });
}

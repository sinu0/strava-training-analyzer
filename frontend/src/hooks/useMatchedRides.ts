import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';
import type { MatchedRideSummary, RouteGroupDetail } from '@/types/matchedRides';

export function useMatchedRide(activityId?: string, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'matched-ride', 'activity', activityId],
    enabled: Boolean(activityId) && enabled,
    queryFn: async () => {
      const response = await apiClient.get<MatchedRideSummary | ''>(`/v2/matched-rides/activity/${activityId}`);
      return response.status === 204 || response.data === '' ? null : response.data;
    },
  });
}

export function useMatchedRideGroup(groupId?: string) {
  return useQuery({
    queryKey: ['v2', 'matched-ride', 'group', groupId],
    enabled: Boolean(groupId),
    queryFn: async () => (await apiClient.get<RouteGroupDetail>(`/v2/matched-rides/${groupId}`)).data,
  });
}

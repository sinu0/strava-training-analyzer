import type { QueryClient } from '@tanstack/react-query';

const SYNC_QUERY_KEYS = [
  ['syncStatus'],
] as const;

const ACTIVITY_QUERY_KEYS = [
  ['activities'],
  ['activities-infinite'],
  ['activitiesTimeline'],
  ['activity'],
  ['activityMap'],
  ['recentActivities'],
  ['activityRouteHeatmap'],
] as const;

const ANALYTICS_QUERY_KEYS = [
  ['pmc'],
  ['powerCurve'],
  ['weeklySummaries'],
  ['zones'],
  ['summary'],
  ['trends'],
  ['compare'],
  ['ftpProgress'],
  ['readiness'],
  ['weeklyOptimalLoad'],
  ['dailyOptimalLoad'],
  ['todayAiTips'],
] as const;

const PROFILE_QUERY_KEYS = [
  ['profile'],
  ['achievements'],
] as const;

const WEIGHT_QUERY_KEYS = [
  ['weightOverview'],
  ['weightHistory'],
] as const;

function invalidateKeys(
  queryClient: QueryClient,
  queryKeys: readonly (readonly string[])[],
): void {
  queryKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey: [...queryKey] });
  });
}

export function invalidateActivityQueries(queryClient: QueryClient): void {
  invalidateKeys(queryClient, ACTIVITY_QUERY_KEYS);
}

export function invalidateAnalyticsQueries(queryClient: QueryClient): void {
  invalidateKeys(queryClient, ANALYTICS_QUERY_KEYS);
}

export function invalidateProfileQueries(queryClient: QueryClient): void {
  invalidateKeys(queryClient, PROFILE_QUERY_KEYS);
}

export function invalidateWeightQueries(queryClient: QueryClient): void {
  invalidateKeys(queryClient, WEIGHT_QUERY_KEYS);
}

export function invalidateAfterTrainingSync(queryClient: QueryClient): void {
  invalidateKeys(queryClient, SYNC_QUERY_KEYS);
  invalidateActivityQueries(queryClient);
  invalidateAnalyticsQueries(queryClient);
  invalidateProfileQueries(queryClient);
}

export function invalidateAfterPhotoSync(queryClient: QueryClient): void {
  invalidateKeys(queryClient, SYNC_QUERY_KEYS);
  invalidateKeys(queryClient, [
    ['activities'],
    ['activities-infinite'],
    ['activity'],
    ['recentActivities'],
    ['profile'],
  ]);
}

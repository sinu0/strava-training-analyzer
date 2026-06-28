import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import {
  POLL_FAST,
  STALE_REALTIME,
  STALE_SLOW,
  STALE_STATIC,
} from '@/constants/queryConfig';
import {
  invalidateActivityQueries,
  invalidateAfterPhotoSync,
  invalidateAfterTrainingSync,
} from '@/hooks/queryInvalidation';
import type { ActivitySummary, ActivitySummaryPage } from '@/types/activity';
import type {
  AutoSyncConfig,
  NewActivitiesCheck,
  StravaConfig,
  StravaConnectResponse,
  SyncStatus,
  WeatherJobStatus,
} from '@/types/admin';
import type {
  PmcData,
  PowerCurve,
  WeeklySummary,
  WeeklyOptimalLoad,
  DailyOptimalLoad,
  DurabilityInsight,
  BlockHealth,
  ProgressionLevel,
  SaveReadinessCheckInInput,
  ZoneDistribution,
  TrendPoint,
  PeriodSummary,
  WeatherData,
  WeatherForecast,
  WeatherGradient,
  WeatherLocation,
  FtpProgress,
  ReadinessData,
  WeeklyBudget,
} from '@/types/analytics';
import type { AthleteProfile } from '@/types/profile';
import type {
  ComparePeriodsResponse,
  DateRange,
  QueryToggleOptions,
} from '@/types/query';
import type { FatigueState, LoadFocus, TrainingStatus, WeeklyBrief } from '@/types/fatigue';
import type { TrainingEvent } from '@/types/event';
import type { EventProjection } from '@/types/event';

export function usePmc(range: DateRange) {
  return useQuery<PmcData[]>({
    queryKey: ['pmc', range],
    queryFn: async () => {
      const { data } = await apiClient.get<PmcData[]>('/analytics/pmc', { params: range });
      return data;
    },
  });
}

export function usePowerCurve(range: DateRange, options?: QueryToggleOptions) {
  return useQuery<PowerCurve>({
    queryKey: ['powerCurve', range],
    enabled: options?.enabled !== false,
    queryFn: async () => {
      const { data } = await apiClient.get<PowerCurve>('/analytics/power-curve', { params: range });
      return data;
    },
    staleTime: STALE_SLOW,
  });
}

export function useEvents() {
  return useQuery<TrainingEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingEvent[]>('/events');
      return data;
    },
    staleTime: STALE_SLOW,
  });
}

export function useActiveEvents() {
  return useQuery<TrainingEvent[]>({
    queryKey: ['events', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingEvent[]>('/events/active');
      return data;
    },
    staleTime: STALE_SLOW,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: { name: string; eventDate: string; type: string; priority: string }) => {
      const { data } = await apiClient.post<TrainingEvent>('/events', event);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useTrainingStatus() {
  return useQuery<TrainingStatus>({
    queryKey: ['trainingStatus'],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingStatus>('/analytics/training-status');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useWeeklyBrief() {
  return useQuery<WeeklyBrief>({
    queryKey: ['weeklyBrief'],
    queryFn: async () => {
      const { data } = await apiClient.get<WeeklyBrief>('/analytics/weekly-brief');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/events/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useWeeklySummaries(weeks = 8) {
  return useQuery<WeeklySummary[]>({
    queryKey: ['weeklySummaries', weeks],
    queryFn: async () => {
      const { data } = await apiClient.get<WeeklySummary[]>('/analytics/weekly', { params: { weeks } });
      return data;
    },
  });
}

export function useZoneDistribution(zoneType: string, range: DateRange) {
  return useQuery<ZoneDistribution>({
    queryKey: ['zones', zoneType, range],
    queryFn: async () => {
      const { data } = await apiClient.get<ZoneDistribution>('/analytics/zones', {
        params: { zoneType, ...range },
      });
      return data;
    },
  });
}

export function useSummary(period: string) {
  return useQuery<PeriodSummary>({
    queryKey: ['summary', period],
    queryFn: async () => {
      const { data } = await apiClient.get<PeriodSummary>('/analytics/summary', {
        params: { period },
      });
      return data;
    },
  });
}

export function useTrends(metric: string, range: DateRange) {
  return useQuery<TrendPoint[]>({
    queryKey: ['trends', metric, range],
    queryFn: async () => {
      const { data } = await apiClient.get<TrendPoint[]>('/analytics/trends', {
        params: { metric, ...range },
      });
      return data;
    },
  });
}

export function useRecentActivities(size = 5) {
  return useQuery<ActivitySummary[]>({
    queryKey: ['recentActivities', size],
    queryFn: async () => {
      const { data } = await apiClient.get<ActivitySummaryPage>('/activities', {
        params: { page: 0, size },
      });
      return data.items;
    },
  });
}

export function useBlockHealth() {
  return useQuery<BlockHealth>({
    queryKey: ['blockHealth'],
    queryFn: async () => {
      const { data } = await apiClient.get<BlockHealth>('/analytics/block-health');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useComparePeriods(period1: DateRange, period2: DateRange) {
  return useQuery<PeriodSummary[]>({
    queryKey: ['compare', period1, period2],
    queryFn: async () => {
        const { data } = await apiClient.get<ComparePeriodsResponse<PeriodSummary>>('/analytics/compare', {
        params: {
          period1From: period1.from,
          period1To: period1.to,
          period2From: period2.from,
          period2To: period2.to,
        },
      });
      return [data.period1, data.period2];
    },
  });
}

export function useWeather(lat = 50.06, lon = 19.94) {
  return useQuery<WeatherData>({
    queryKey: ['weather', lat, lon],
    queryFn: async () => {
      const { data } = await apiClient.get<WeatherData>('/weather/current', {
        params: { lat, lon },
      });
      return data;
    },
    staleTime: STALE_SLOW,
  });
}

export function useWeatherForecast(lat = 50.06, lon = 19.94) {
  return useQuery<WeatherForecast>({
    queryKey: ['weatherForecast', lat, lon],
    queryFn: async () => {
      const { data } = await apiClient.get<WeatherForecast>('/weather/forecast', {
        params: { lat, lon },
      });
      return data;
    },
    staleTime: STALE_SLOW,
  });
}

export function useWeatherLocations() {
  return useQuery<WeatherLocation[]>({
    queryKey: ['weatherLocations'],
    queryFn: async () => {
      const { data } = await apiClient.get<WeatherLocation[]>('/weather/locations');
      return data;
    },
  });
}

export function useWeatherGradient(location: string | undefined) {
  return useQuery<WeatherGradient>({
    queryKey: ['weatherGradient', location],
    queryFn: async () => {
      const { data } = await apiClient.get<WeatherGradient>('/weather/gradient', {
        params: { location },
      });
      return data;
    },
    enabled: !!location,
    staleTime: STALE_STATIC,
  });
}

export function useWeatherPointGradient(
  lat: number | undefined,
  lon: number | undefined,
  label?: string,
) {
  return useQuery<WeatherGradient>({
    queryKey: ['weatherPointGradient', lat, lon, label],
    queryFn: async () => {
      const { data } = await apiClient.get<WeatherGradient>('/weather/gradient/point', {
        params: { lat, lon, label },
      });
      return data;
    },
    enabled: lat != null && lon != null,
    staleTime: STALE_STATIC,
  });
}

export function useAddWeatherLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; lat: number; lon: number }) => {
      const { data } = await apiClient.post<WeatherLocation>('/weather/locations', null, {
        params,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weatherLocations'] });
      queryClient.invalidateQueries({ queryKey: ['weatherGradient'] });
    },
  });
}

export function useDeleteWeatherLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      await apiClient.delete(`/weather/locations/${encodeURIComponent(name)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weatherLocations'] });
      queryClient.invalidateQueries({ queryKey: ['weatherGradient'] });
    },
  });
}

export function useActivateWeatherLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.put<WeatherLocation>(
        `/weather/locations/${encodeURIComponent(name)}/activate`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weatherLocations'] });
      queryClient.invalidateQueries({ queryKey: ['weatherGradient'] });
    },
  });
}

export function useRefreshWeatherCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: string) => {
      await apiClient.post('/weather/gradient/refresh', null, {
        params: { location },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weatherGradient'] });
    },
  });
}

export function useFtpProgress(from?: string, to?: string) {
  return useQuery<FtpProgress>({
    queryKey: ['ftpProgress', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await apiClient.get<FtpProgress>(`/analytics/ftp-progress${query}`);
      return data;
    },
  });
}

export function useReadiness() {
  return useQuery<ReadinessData>({
    queryKey: ['readiness'],
    queryFn: async () => {
      const { data } = await apiClient.get<ReadinessData>('/analytics/readiness');
      return data;
    },
  });
}

export function useDurability() {
  return useQuery<DurabilityInsight>({
    queryKey: ['durability'],
    queryFn: async () => {
      const { data } = await apiClient.get<DurabilityInsight>('/analytics/durability');
      return data;
    },
  });
}

export function useProgressionLevels() {
  return useQuery<ProgressionLevel[]>({
    queryKey: ['progressionLevels'],
    queryFn: async () => {
      const { data } = await apiClient.get<ProgressionLevel[]>('/analytics/progression-levels');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useSaveReadinessCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveReadinessCheckInInput) => {
      const { data } = await apiClient.post<ReadinessData>('/analytics/readiness/check-in', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['readiness'], data);
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
    },
  });
}

// ─── Sync / Admin hooks ───

export function useWeeklyOptimalLoad(weeks = 12) {
  return useQuery<WeeklyOptimalLoad[]>({
    queryKey: ['weeklyOptimalLoad', weeks],
    queryFn: async () => {
      const { data } = await apiClient.get<WeeklyOptimalLoad[]>('/analytics/weekly-optimal-load', {
        params: { weeks },
      });
      return data;
    },
  });
}

export function useDailyOptimalLoad(pastDays = 60, futureDays = 21) {
  return useQuery<DailyOptimalLoad[]>({
    queryKey: ['dailyOptimalLoad', pastDays, futureDays],
    queryFn: async () => {
      const { data } = await apiClient.get<DailyOptimalLoad[]>('/analytics/daily-optimal-load', {
        params: { pastDays, futureDays },
      });
      return data;
    },
  });
}

export function useWeeklyBudget(ctl = 0, eventDate?: string) {
  return useQuery<WeeklyBudget>({
    queryKey: ['weeklyBudget', ctl, eventDate],
    queryFn: async () => {
      const params: Record<string, string | number> = { ctl };
      if (eventDate) params.eventDate = eventDate;
      const { data } = await apiClient.get<WeeklyBudget>('/analytics/weekly-budget', { params });
      return data;
    },
    enabled: ctl > 0,
  });
}

export function useSyncStatus() {
  return useQuery<SyncStatus>({
    queryKey: ['syncStatus'],
    queryFn: async () => {
      const { data } = await apiClient.get<SyncStatus>('/sync/status');
      return data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'in_progress') return POLL_FAST;
      if (status === 'rate_limited') return STALE_REALTIME;
      return false;
    },
  });
}

export function useSyncFull() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SyncStatus>('/sync/strava/full');
      return data;
    },
    onSuccess: () => {
      invalidateAfterTrainingSync(queryClient);
    },
  });
}

export function useSyncRecent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SyncStatus>('/sync/strava/recent');
      return data;
    },
    onSuccess: () => {
      invalidateAfterTrainingSync(queryClient);
    },
  });
}

export function useSyncActivityPhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SyncStatus>('/sync/strava/photos');
      return data;
    },
    onSuccess: () => {
      invalidateAfterPhotoSync(queryClient);
    },
  });
}

export function useResyncStreams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SyncStatus>('/sync/strava/resync-streams');
      return data;
    },
    onSuccess: () => {
      invalidateAfterTrainingSync(queryClient);
    },
  });
}

export function useClearSyncData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/sync/data');
    },
    onSuccess: () => {
      invalidateAfterTrainingSync(queryClient);
    },
  });
}

export function useCheckNewActivities() {
  return useQuery<NewActivitiesCheck>({
    queryKey: ['newActivitiesCheck'],
    queryFn: async () => {
      const { data } = await apiClient.get<NewActivitiesCheck>('/sync/strava/check');
      return data;
    },
    refetchInterval: 300000,
    enabled: true,
  });
}

export function useAutoSyncConfig() {
  return useQuery<AutoSyncConfig>({
    queryKey: ['autoSyncConfig'],
    queryFn: async () => {
      const { data } = await apiClient.get<AutoSyncConfig>('/sync/auto-sync-config');
      return data;
    },
  });
}

export function useUpdateAutoSyncConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (intervalMinutes: number) => {
      const { data } = await apiClient.put<AutoSyncConfig>('/sync/auto-sync-config', { intervalMinutes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoSyncConfig'] });
    },
  });
}

export function useRefreshAllWeatherCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/weather/gradient/refresh-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weatherGradient'] });
      queryClient.invalidateQueries({ queryKey: ['weatherJobStatus'] });
    },
  });
}

export function useRecalculateMetrics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/sync/recalculate-metrics');
    },
    onSuccess: () => {
      invalidateAfterTrainingSync(queryClient);
    },
  });
}

export function useRecalculateAllActivityMetrics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/sync/recalculate-activity-metrics');
    },
    onSuccess: () => {
      invalidateAfterTrainingSync(queryClient);
    },
  });
}

// ─── Strava Config hooks ───

export function useStravaConfig() {
  return useQuery<StravaConfig>({
    queryKey: ['stravaConfig'],
    queryFn: async () => {
      const { data } = await apiClient.get<StravaConfig>('/admin/strava-config');
      return data;
    },
  });
}

export function useStravaConnect() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get<StravaConnectResponse>('/auth/strava/connect');
      return data;
    },
  });
}

export function useProfile() {
  return useQuery<AthleteProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<AthleteProfile>('/profile');
      return data;
    },
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { ftpWatts?: number | null; weightKg?: number | null; lthrBpm?: number | null; maxHrBpm?: number | null }) => {
      const { data } = await apiClient.put<AthleteProfile>('/profile', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdateStravaConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { clientId?: string; clientSecret?: string; webhookToken?: string }) => {
      const { data } = await apiClient.put<StravaConfig>('/admin/strava-config', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stravaConfig'] });
    },
  });
}

export function useResetStravaConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete<StravaConfig>('/admin/strava-config');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stravaConfig'] });
    },
  });
}

// ─── Weather Job Status hooks ───

export function useWeatherJobStatus() {
  return useQuery<WeatherJobStatus>({
    queryKey: ['weatherJobStatus'],
    queryFn: async () => {
      const { data } = await apiClient.get<WeatherJobStatus>('/admin/weather-job-status');
      return data;
    },
    refetchInterval: (query) => {
      return query.state.data?.status === 'in_progress' ? POLL_FAST : false;
    },
  });
}

export function useRebuildHeatmap() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ status: string; message: string }>('/admin/heatmap/rebuild');
      return data;
    },
  });
}

export function useRebuildFtpHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ status: string; message: string }>('/admin/ftp-history/rebuild');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ftpProgress'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });
}

export function useRecalculateAllTrainingEffects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ status: string; total: number; success: number; failed: number }>(
        '/admin/recalculate-all-training-effects');
      return data;
    },
    onSuccess: () => {
      invalidateActivityQueries(queryClient);
    },
  });
}

// ─── Fatigue & Energy hooks ───

export function useFatigueState() {
  return useQuery<FatigueState>({
    queryKey: ['fatigueState'],
    queryFn: async () => {
      const { data } = await apiClient.get<FatigueState>('/fatigue-energy/state');
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function useLoadFocus(weeks: number = 4) {
  return useQuery<LoadFocus>({
    queryKey: ['loadFocus', weeks],
    queryFn: async () => {
      const { data } = await apiClient.get<LoadFocus>('/fatigue-energy/load-focus', {
        params: { weeks },
      });
      return data;
    },
    staleTime: STALE_SLOW,
  });
}

export function useEventProjection() {
  return useQuery<EventProjection | null>({
    queryKey: ['eventProjection'],
    queryFn: async () => {
      const { data, status } = await apiClient.get<EventProjection>('/events/active/projection');
      return status === 204 ? null : data;
    },
    staleTime: STALE_REALTIME,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import {
  POLL_FAST,
  STALE_REALTIME,
  STALE_SLOW,
  STALE_STATIC,
} from '@/constants/queryConfig';
import {
  invalidateAfterPhotoSync,
  invalidateAfterTrainingSync,
} from '@/hooks/queryInvalidation';
import type { ActivitySummary, ActivitySummaryPage } from '@/types/activity';
import type {
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
  ZoneDistribution,
  TrendPoint,
  PeriodSummary,
  WeatherData,
  WeatherForecast,
  WeatherGradient,
  WeatherLocation,
  FtpProgress,
  ReadinessData,
} from '@/types/analytics';
import type { AthleteProfile } from '@/types/profile';
import type {
  ComparePeriodsResponse,
  DateRange,
  QueryToggleOptions,
} from '@/types/query';

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
    queryFn: async () => {
      const { data } = await apiClient.get<PowerCurve>('/analytics/power-curve', { params: range });
      return data;
    },
    enabled: options?.enabled ?? true,
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

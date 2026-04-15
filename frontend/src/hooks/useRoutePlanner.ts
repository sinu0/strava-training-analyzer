import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
  type UseQueryResult,
} from '@tanstack/react-query';

import apiClient from '@/api/client';
import { lookupElevation } from '@/api/externalApis';
import { STALE_SLOW } from '@/constants/queryConfig';
import { invalidateActivityQueries } from '@/hooks/queryInvalidation';
import type { WeatherData } from '@/types/analytics';
import type {
  PlannedRoute,
  CreateRouteRequest,
  GeneratedRouteRequest,
  GeneratedRouteSuggestion,
  RoutePlanningPreferences,
  RoutePreview,
} from '@/types/route';
import type { RouteWeatherStop } from '@/utils/routePlannerMap';

export function useRoutes() {
  return useQuery<PlannedRoute[]>({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data } = await apiClient.get<PlannedRoute[]>('/routes');
      return data;
    },
  });
}

export function useRoute(id: string | null) {
  return useQuery<PlannedRoute>({
    queryKey: ['route', id],
    queryFn: async () => {
      const { data } = await apiClient.get<PlannedRoute>(`/routes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation<PlannedRoute, Error, CreateRouteRequest>({
    mutationFn: async (request) => {
      const { data } = await apiClient.post<PlannedRoute>('/routes', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}

export function useExportGpx() {
  return useMutation<Blob, Error, string>({
    mutationFn: async (id) => {
      const { data } = await apiClient.get(`/routes/${id}/gpx`, {
        responseType: 'blob',
      });
      return data;
    },
  });
}

export function useRouteWeather(
  stops: RouteWeatherStop[],
  enabled: boolean,
): UseQueryResult<WeatherData>[] {
  return useQueries({
    queries: stops.map((stop) => ({
      queryKey: ['routeWeather', stop.id, stop.position[0], stop.position[1]],
      queryFn: async () => {
        const { data } = await apiClient.get<WeatherData>('/weather/current', {
          params: {
            lat: stop.position[0],
            lon: stop.position[1],
          },
        });
        return data;
      },
      enabled,
      staleTime: STALE_SLOW,
    })),
  }) as UseQueryResult<WeatherData>[];
}

export async function fetchElevation(points: [number, number][]): Promise<number[]> {
  if (points.length === 0) return [];
  const mapped = points.map(([lat, lng]) => ({ lat, lng }));
  return lookupElevation(mapped);
}

export async function fetchRoute(
  waypoints: [number, number][],
  preferences: RoutePlanningPreferences,
): Promise<RoutePreview> {
  if (waypoints.length < 2) {
    return {
      polyline: waypoints,
      distanceM: 0,
      elevationGainM: 0,
      estimatedTimeSec: 0,
      estimatedTss: 0,
      provider: 'MANUAL',
      profile: 'manual',
      pavedDistanceM: 0,
      unpavedDistanceM: 0,
      cyclewayDistanceM: 0,
      quietDistanceM: 0,
      notices: [],
    };
  }
  try {
    const { data } = await apiClient.post<RoutePreview>('/routes/preview', {
      waypoints,
      preferences,
    });
    return data;
  } catch {
    return {
      polyline: waypoints,
      distanceM: 0,
      elevationGainM: 0,
      estimatedTimeSec: 0,
      estimatedTss: 0,
      provider: 'MANUAL',
      profile: 'manual',
      pavedDistanceM: null,
      unpavedDistanceM: null,
      cyclewayDistanceM: null,
      quietDistanceM: null,
      notices: ['Nie udało się pobrać routingu — pokazano prostą linię między punktami.'],
    };
  }
}

export async function generateRouteFromHistory(
  request: GeneratedRouteRequest,
): Promise<GeneratedRouteSuggestion> {
  const { data } = await apiClient.post<GeneratedRouteSuggestion>('/routes/generate', request);
  return data;
}

export async function generateRouteAlternativesFromHistory(
  request: GeneratedRouteRequest,
): Promise<GeneratedRouteSuggestion[]> {
  const { data } = await apiClient.post<GeneratedRouteSuggestion[]>('/routes/generate/alternatives', request);
  return data;
}

export async function generateAndPersistFromHistory(
  request: GeneratedRouteRequest,
): Promise<PlannedRoute> {
  const { data } = await apiClient.post<PlannedRoute>('/routes/generate/persist', request);
  return data;
}

export function useGenerateAndPersistRoute() {
  const queryClient = useQueryClient();
  return useMutation<PlannedRoute, Error, GeneratedRouteRequest>({
    mutationFn: generateAndPersistFromHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      invalidateActivityQueries(queryClient);
    },
  });
}

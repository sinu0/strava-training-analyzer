import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { STALE_REALTIME } from '@/constants/queryConfig';
import type {
  PerformancePredictionRequest,
  PerformancePredictionResponse,
  CurrentPerformanceState,
} from '@/types/performancePrediction';

export function useCurrentPerformanceState() {
  return useQuery<CurrentPerformanceState>({
    queryKey: ['current-performance-state'],
    queryFn: async () => {
      const { data } = await apiClient.get<CurrentPerformanceState>(
        '/performance/current-state',
      );
      return data;
    },
    staleTime: STALE_REALTIME,
  });
}

export function usePerformancePrediction() {
  return useMutation({
    mutationFn: async (request: PerformancePredictionRequest) => {
      const { data } = await apiClient.post<PerformancePredictionResponse>(
        '/performance/predict',
        request,
      );
      return data;
    },
  });
}

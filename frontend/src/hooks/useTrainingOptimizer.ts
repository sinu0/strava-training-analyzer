import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type {
  OptimizePlanRequest,
  OptimizePlanResponse,
  ApplyOptimizedPlanRequest,
} from '@/types/trainingOptimizer';

export function useOptimizePlan() {
  return useMutation({
    mutationFn: async (request: OptimizePlanRequest) => {
      const { data } = await apiClient.post<OptimizePlanResponse>(
        '/training/optimize',
        request,
      );
      return data;
    },
  });
}

export function useApplyOptimizedPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: ApplyOptimizedPlanRequest) => {
      const { data } = await apiClient.post('/training/optimize/apply', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      queryClient.invalidateQueries({ queryKey: ['training-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });
}


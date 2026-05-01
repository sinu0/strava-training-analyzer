import { useMutation } from '@tanstack/react-query';

import apiClient from '@/api/client';
import type { WorkoutEvaluationRequest, WorkoutEvaluationResponse } from '@/types/evaluation';

export function useWorkoutEvaluation() {
  return useMutation<WorkoutEvaluationResponse, Error, WorkoutEvaluationRequest>({
    mutationFn: async (request) => {
      const { data } = await apiClient.post<WorkoutEvaluationResponse>(
        '/evaluation/workout',
        request,
      );
      return data;
    },
  });
}

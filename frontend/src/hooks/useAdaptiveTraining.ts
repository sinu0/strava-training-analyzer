import { useMutation } from '@tanstack/react-query';

import apiClient from '../api/client';

import type { AdaptiveTrainingRequest, AdaptiveTrainingResponse } from '../types/adaptiveTraining';

export function useAdaptiveTraining() {
  return useMutation({
    mutationFn: async (request: AdaptiveTrainingRequest) => {
      const { data } = await apiClient.post<AdaptiveTrainingResponse>(
        '/training/adapt',
        request,
      );
      return data;
    },
  });
}

import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';

import type { TrainingPhaseAnalysis, RaceReadinessProjection } from '../types/training';

export function useTrainingPhases(from: string, to: string) {
  return useQuery<TrainingPhaseAnalysis>({
    queryKey: ['trainingPhases', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingPhaseAnalysis>('/analytics/training-phases', {
        params: { from, to },
      });
      return data;
    },
    enabled: !!from && !!to,
  });
}

export function useRaceReadiness(raceDate: string | null) {
  return useQuery<RaceReadinessProjection>({
    queryKey: ['raceReadiness', raceDate],
    queryFn: async () => {
      const { data } = await apiClient.get<RaceReadinessProjection>('/analytics/race-readiness', {
        params: { raceDate },
      });
      return data;
    },
    enabled: !!raceDate,
  });
}

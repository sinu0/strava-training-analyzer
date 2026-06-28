import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';

export interface SeasonWrappedData {
  year: number;
  totalKm: number;
  totalElevation: number;
  totalHours: number;
  totalRides: number;
  bestMonth: string;
  favoriteTime: string;
  favoriteDay: string;
  longestStreak: number;
  totalActiveDays: number;
  averageKmPerRide: number;
  distanceFun: string;
  elevationFun: string;
  longestRideKm?: number;
  longestRideName?: string;
  mostElevationM?: number;
  mostElevationName?: string;
}

export function useSeasonWrapped(year: number) {
  return useQuery<SeasonWrappedData>({
    queryKey: ['season-wrapped', year],
    queryFn: async () => {
      const { data } = await apiClient.get<SeasonWrappedData>(`/season-wrapped?year=${year}`);
      return data;
    },
    enabled: !!year,
  });
}

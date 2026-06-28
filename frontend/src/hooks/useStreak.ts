import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';

export interface StreakDay {
  date: string;
  level: number;
}

export interface StreakWeek {
  days: StreakDay[];
}

export interface StreakCalendar {
  year: number;
  weeks: StreakWeek[];
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
}

export function useStreakCalendar(year: number) {
  return useQuery<StreakCalendar>({
    queryKey: ['streak-calendar', year],
    queryFn: async () => {
      const { data } = await apiClient.get<StreakCalendar>(`/streak/calendar?year=${year}`);
      return data;
    },
  });
}

export function useStreakStats() {
  return useQuery<StreakStats>({
    queryKey: ['streak-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<StreakStats>('/streak/stats');
      return data;
    },
  });
}

import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';

export interface PersonalRecord {
  id: string;
  recordType: string;
  recordValue: number;
  activityId?: string;
  achievedAt: string;
  previousValue?: number;
  improvementPercent?: number;
  label: string;
  unit: string;
}

export function usePersonalRecords() {
  return useQuery<PersonalRecord[]>({
    queryKey: ['personal-records'],
    queryFn: async () => {
      const { data } = await apiClient.get<PersonalRecord[]>('/personal-records');
      return data;
    },
  });
}

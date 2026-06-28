import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';

export interface TimelineEvent {
  date: string;
  type: 'ACTIVITY' | 'PR' | 'ACHIEVEMENT';
  title: string;
  subtitle: string;
  color: string;
  link?: string;
}

export function useTimeline(from?: string, to?: string, type?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (type) params.set('type', type);

  return useQuery<TimelineEvent[]>({
    queryKey: ['timeline', from, to, type],
    queryFn: async () => {
      const { data } = await apiClient.get<TimelineEvent[]>(`/timeline?${params.toString()}`);
      return data;
    },
  });
}

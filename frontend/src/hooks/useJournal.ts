import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '../api/client';

import type { JournalEntry, MoodCorrelation, SaveJournalEntryRequest } from '../types/journal';

export function useJournalEntries(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  return useQuery<JournalEntry[]>({
    queryKey: ['journal-entries', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<JournalEntry[]>(`/journal?${params.toString()}`);
      return data;
    },
  });
}

export function useJournalForActivity(activityId: string | undefined) {
  return useQuery<JournalEntry>({
    queryKey: ['journal-activity', activityId],
    queryFn: async () => {
      const { data } = await apiClient.get<JournalEntry>(`/journal/activity/${activityId}`);
      return data;
    },
    enabled: !!activityId,
  });
}

export function useLatestJournalEntry() {
  return useQuery<JournalEntry | null>({
    queryKey: ['journal-latest'],
    queryFn: async () => {
      const { data } = await apiClient.get<JournalEntry | null>('/journal/latest');
      return data;
    },
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SaveJournalEntryRequest) => {
      const { data } = await apiClient.post<JournalEntry>('/journal', request);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal-activity', variables.activityId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-latest'] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-latest'] });
    },
  });
}

export function useMoodCorrelation() {
  return useQuery<MoodCorrelation>({
    queryKey: ['mood-correlation'],
    queryFn: async () => {
      const { data } = await apiClient.get<MoodCorrelation>('/journal/mood-correlation');
      return data;
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/api/client';
import type { UiPreferences } from '@/types/uiPreferences';
import { migrateUiPreferences } from '@/utils/uiPreferences';

const UI_PREFERENCES_KEY = ['v2', 'ui-preferences'] as const;

export function useUiPreferences() {
  return useQuery({
    queryKey: UI_PREFERENCES_KEY,
    queryFn: async () => {
      const response = await apiClient.get<UiPreferences>('/v2/ui-preferences');
      return migrateUiPreferences(response.data).preferences;
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useSaveUiPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: UiPreferences) => {
      const response = await apiClient.put<UiPreferences>('/v2/ui-preferences', preferences);
      return migrateUiPreferences(response.data).preferences;
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData(UI_PREFERENCES_KEY, preferences);
    },
  });
}

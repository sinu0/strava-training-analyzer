import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '../api/client';

import type {
  WorkoutTemplate,
  WorkoutCategory,
  WorkoutStep,
  CalendarDay,
  TrainingPlan,
  TrainingPlanProgram,
  GeneratePlanRequest,
  PlanStatus,
} from '../types/training';

export function useWorkoutTemplates(category?: WorkoutCategory) {
  return useQuery<WorkoutTemplate[]>({
    queryKey: ['workout-templates', category],
    queryFn: async () => {
      const params = category ? { category } : {};
      const { data } = await apiClient.get<WorkoutTemplate[]>('/training/templates', { params });
      return data;
    },
  });
}

export function useWorkoutTemplate(id: string) {
  return useQuery<WorkoutTemplate>({
    queryKey: ['workout-templates', id],
    queryFn: async () => {
      const { data } = await apiClient.get<WorkoutTemplate>(`/training/templates/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkoutTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'createdBy'>) => {
      const { data } = await apiClient.post<WorkoutTemplate>('/training/templates', template);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
    },
  });
}

export function useDeleteWorkoutTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/training/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
    },
  });
}

// --- Calendar & Plans ---

export function useCalendarView(from: string, to: string) {
  return useQuery<CalendarDay[]>({
    queryKey: ['training-calendar', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<CalendarDay[]>('/training/calendar', {
        params: { from, to },
      });
      return data;
    },
    enabled: !!from && !!to,
  });
}

export function useTrainingPlans(from: string, to: string) {
  return useQuery<TrainingPlan[]>({
    queryKey: ['training-plans', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingPlan[]>('/training/plans', {
        params: { from, to },
      });
      return data;
    },
    enabled: !!from && !!to,
  });
}

export function useCreateTrainingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Omit<TrainingPlan, 'id'>) => {
      const { data } = await apiClient.post<TrainingPlan>('/training/plans', plan);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });
}

export function useUpdatePlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PlanStatus }) => {
      await apiClient.put(`/training/plans/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });
}

export function useDeleteTrainingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/training/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });
}

// --- Programs ---

export interface WorkoutCalendarEntry {
  workoutTemplateId: string;
  date: string;
  durationMin: number;
  scaledSteps?: WorkoutStep[];
  notes?: string;
}

export function useCreateWorkoutEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: WorkoutCalendarEntry) => {
      // Backend expects CreateTrainingPlanRequest fields only
      const body = {
        date: entry.date,
        workoutTemplateId: entry.workoutTemplateId,
        plannedDurationMin: entry.durationMin,
        notes: entry.notes ?? null,
      };
      const { data } = await apiClient.post<TrainingPlan>('/training/plans', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });
}


export function usePrograms() {
  return useQuery<TrainingPlanProgram[]>({
    queryKey: ['training-programs'],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingPlanProgram[]>('/training/programs');
      return data;
    },
  });
}

export function useGenerateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: GeneratePlanRequest) => {
      const { data } = await apiClient.post<TrainingPlanProgram>(
        '/training/programs/generate',
        request,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      queryClient.invalidateQueries({ queryKey: ['training-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/training/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      queryClient.invalidateQueries({ queryKey: ['training-calendar'] });
    },
  });
}

export function useExportWorkout(templateId: string, format: 'zwo' | 'fit') {
  return useMutation({
    mutationFn: async () => {
      const { data, headers } = await apiClient.get(
        `/training/templates/${templateId}/export/${format}`,
        { responseType: 'blob' },
      );
      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'zwo' ? 'zwo' : 'fit';
      const filename =
        headers['content-disposition']?.match(/filename="?(.+?)"?$/)?.[1] ?? `workout.${ext}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '../api/client';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  replacementIntervalKm?: number;
  totalKm: number;
  usagePercent: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveEquipmentRequest {
  name: string;
  type: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  replacementIntervalKm?: number;
  totalKm?: number;
  notes?: string;
}

export function useEquipment() {
  return useQuery<Equipment[]>({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data } = await apiClient.get<Equipment[]>('/equipment');
      return data;
    },
  });
}

export function useEquipmentAlerts() {
  return useQuery<Equipment[]>({
    queryKey: ['equipment-alerts'],
    queryFn: async () => {
      const { data } = await apiClient.get<Equipment[]>('/equipment/alerts');
      return data;
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: SaveEquipmentRequest) => {
      const { data } = await apiClient.post<Equipment>('/equipment', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-alerts'] });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/equipment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-alerts'] });
    },
  });
}

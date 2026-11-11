import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EquipmentQueryParams,
  EquipmentReportQueryParams,
  EquipmentSpecs,
  UpdateEquipmentSpecsPayload,
} from '@sgia/types';
import {
  downloadEquipmentReports,
  fetchEquipo,
  fetchEquipmentReports,
  fetchEquipmentSpecs,
  fetchEquipmentTechnicalSheet,
  fetchEquipos,
  updateEquipmentSpecs,
} from '../services/equipments';

export const equipmentKeys = {
  all: ['equipment'] as const,
  list: (params?: EquipmentQueryParams) => ['equipment', 'list', params] as const,
  specs: (id: number) => ['equipment', 'specs', id] as const,
  detail: (id: number) => ['equipment', 'detail', id] as const,
  reports: (id: number, params?: EquipmentReportQueryParams) => ['equipment', 'reports', id, params] as const,
};

export function useEquipos(params?: EquipmentQueryParams) {
  return useQuery({
    queryKey: equipmentKeys.list(params),
    queryFn: () => fetchEquipos(params),
  });
}

export function useEquipo(id: number | undefined) {
  return useQuery({
    queryKey: equipmentKeys.detail(id!),
    queryFn: () => fetchEquipo(id!),
    enabled: id !== undefined,
  });
}

export function useEquipmentSpecs(id: number | undefined) {
  return useQuery({
    queryKey: equipmentKeys.specs(id!),
    queryFn: () => fetchEquipmentSpecs(id!),
    enabled: id !== undefined,
  });
}

export function useUpdateEquipmentSpecs() {
  const queryClient = useQueryClient();
  return useMutation<
    EquipmentSpecs,
    Error,
    { id: number; payload: UpdateEquipmentSpecsPayload | Partial<EquipmentSpecs> }
  >({
    mutationFn: ({ id, payload }) => updateEquipmentSpecs(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.specs(id) });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
  });
}

export function useEquipmentTechnicalSheet(id: number | undefined) {
  return useQuery({
    queryKey: ['equipment', 'technical-sheet', id],
    queryFn: () => fetchEquipmentTechnicalSheet(id!),
    enabled: id !== undefined,
  });
}

export function useEquipmentReports(id: number | undefined, params?: EquipmentReportQueryParams) {
  return useQuery({
    queryKey: equipmentKeys.reports(id!, params),
    queryFn: () => fetchEquipmentReports(id!, params),
    enabled: id !== undefined,
  });
}

export function useDownloadTechnicalSheet() {
  return useMutation<Blob, Error, number>({
    mutationFn: (id: number) => fetchEquipmentTechnicalSheet(id),
  });
}

export function useDownloadEquipmentReports() {
  return useMutation<Blob, Error, { id: number; params?: EquipmentReportQueryParams } | number>({
    mutationFn: (arg) => {
      if (typeof arg === 'number') {
        return downloadEquipmentReports(arg);
      }
      return downloadEquipmentReports(arg.id, arg.params);
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateIncidentReportPayload,
  CreateNovedadPayload,
  EquipmentSpecs,
  IncidentReport,
  IncidentSeverity,
  IncidentStatus,
  Novedad,
} from '@sgia/types';
import {
  createIncidentReport,
  fetchCareersDistribution,
  fetchDashboardStats,
  fetchEquipo,
  fetchEquipmentReports,
  fetchEquipmentSpecs,
  fetchEquipmentTechnicalSheet,
  fetchEquipos,
  fetchIncidentReports,
  fetchLeastDemanded,
  fetchLoansByTeacher,
  fetchTopProducts,
  fetchTopSupplies,
  fetchTopTeachers,
  updateEquipmentSpecs,
  updateIncidentReportStatus,
} from '../services/equipments';

export const equipmentKeys = {
  all: ['equipment'] as const,
  specs: (id: number) => ['equipment', 'specs', id] as const,
  detail: (id: number) => ['equipment', 'detail', id] as const,
};

export const incidentKeys = {
  all: ['incident-reports'] as const,
  list: (params?: any) => ['incident-reports', 'list', params] as const,
};

export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
  topProducts: ['dashboard', 'top-products'] as const,
  topSupplies: ['dashboard', 'top-supplies'] as const,
  careersDistribution: ['dashboard', 'careers-distribution'] as const,
  leastDemanded: ['dashboard', 'least-demanded'] as const,
  topTeachers: ['dashboard', 'top-teachers'] as const,
  loansByTeacher: ['dashboard', 'loans-by-teacher'] as const,
};

export function useEquipos() {
  return useQuery({
    queryKey: equipmentKeys.all,
    queryFn: fetchEquipos,
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
  return useMutation<EquipmentSpecs, Error, { id: number; payload: Partial<EquipmentSpecs> }>({
    mutationFn: ({ id, payload }) => updateEquipmentSpecs(id, payload),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: equipmentKeys.specs(id) }),
  });
}

export function useEquipmentTechnicalSheet(id: number | undefined) {
  return useQuery({
    queryKey: ['equipment', 'technical-sheet', id],
    queryFn: () => fetchEquipmentTechnicalSheet(id!),
    enabled: id !== undefined,
  });
}

export function useEquipmentReports(id: number | undefined) {
  return useQuery({
    queryKey: ['equipment', 'reports', id],
    queryFn: () => fetchEquipmentReports(id!),
    enabled: id !== undefined,
  });
}

export function useCreateNovedad() {
  const queryClient = useQueryClient();
  return useMutation<IncidentReport | Novedad, Error, CreateIncidentReportPayload | CreateNovedadPayload>({
    mutationFn: createIncidentReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.all });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
  });
}

export function useIncidentReports(params?: {
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: incidentKeys.list(params),
    queryFn: () => fetchIncidentReports(params),
  });
}

export function useUpdateIncidentReportStatus() {
  const queryClient = useQueryClient();
  return useMutation<IncidentReport, Error, { id: number; status: IncidentStatus }>({
    mutationFn: ({ id, status }) => updateIncidentReportStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentKeys.all }),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: fetchDashboardStats,
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: dashboardKeys.topProducts,
    queryFn: fetchTopProducts,
  });
}

export function useTopSupplies() {
  return useQuery({
    queryKey: dashboardKeys.topSupplies,
    queryFn: fetchTopSupplies,
  });
}

export function useCareersDistribution() {
  return useQuery({
    queryKey: dashboardKeys.careersDistribution,
    queryFn: fetchCareersDistribution,
  });
}

export function useLeastDemanded() {
  return useQuery({
    queryKey: dashboardKeys.leastDemanded,
    queryFn: fetchLeastDemanded,
  });
}

export function useTopTeachers() {
  return useQuery({
    queryKey: dashboardKeys.topTeachers,
    queryFn: fetchTopTeachers,
  });
}

export function useLoansByTeacher() {
  return useQuery({
    queryKey: dashboardKeys.loansByTeacher,
    queryFn: fetchLoansByTeacher,
  });
}

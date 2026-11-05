import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateIncidentReportPayload,
  IncidentReport,
  IncidentReportQueryParams,
  IncidentStatus,
  PaginatedResponse,
} from '@sgia/types';
import {
  createIncidentReport,
  fetchIncidentReport,
  fetchIncidentReports,
  fetchMyIncidentReports,
  updateIncidentReportStatus,
} from '../services/incident-reports';

export const incidentKeys = {
  all: ['incident-reports'] as const,
  list: (params?: IncidentReportQueryParams) => ['incident-reports', 'list', params] as const,
  mine: (params?: Pick<IncidentReportQueryParams, 'status' | 'per_page' | 'page'>) =>
    ['incident-reports', 'mine', params] as const,
  detail: (id: number) => ['incident-reports', 'detail', id] as const,
};

export function useIncidentReports(params?: IncidentReportQueryParams) {
  return useQuery<PaginatedResponse<IncidentReport>>({
    queryKey: incidentKeys.list(params),
    queryFn: () => fetchIncidentReports(params),
  });
}

export function useMyIncidentReports(
  params?: Pick<IncidentReportQueryParams, 'status' | 'per_page' | 'page'>,
) {
  return useQuery<PaginatedResponse<IncidentReport>>({
    queryKey: incidentKeys.mine(params),
    queryFn: () => fetchMyIncidentReports(params),
  });
}

export function useIncidentReport(id: number | undefined) {
  return useQuery<IncidentReport>({
    queryKey: incidentKeys.detail(id ?? 0),
    queryFn: () => fetchIncidentReport(id as number),
    enabled: id !== undefined,
  });
}

export function useCreateIncidentReport() {
  const queryClient = useQueryClient();
  return useMutation<IncidentReport, Error, CreateIncidentReportPayload>({
    mutationFn: createIncidentReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentKeys.all }),
  });
}

export function useUpdateIncidentReportStatus() {
  const queryClient = useQueryClient();
  return useMutation<IncidentReport, Error, { id: number; status: IncidentStatus }>({
    mutationFn: ({ id, status }) => updateIncidentReportStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentKeys.all }),
  });
}

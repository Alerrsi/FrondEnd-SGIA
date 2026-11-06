import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  CancelMaintenancePayload,
  CreateMaintenanceRecordPayload,
  FinishMaintenancePayload,
  MaintenanceDocument,
  MaintenanceDocumentQueryParams,
  MaintenanceRecord,
  MaintenanceRecordQueryParams,
  MaintenanceSummaryQueryParams,
  UpdateMaintenanceRecordPayload,
  UploadMaintenanceDocumentPayload,
} from '@sgia/types';
import {
  cancelMaintenanceRecord,
  createMaintenanceRecord,
  deleteMaintenanceDocument,
  downloadMaintenanceDocumentFile,
  fetchMaintenanceRecord,
  fetchMaintenanceRecords,
  fetchMaintenanceSummary,
  fetchUnitMaintenanceDocuments,
  fetchUnitMaintenanceRecords,
  finishMaintenanceRecord,
  updateMaintenanceRecord,
  uploadMaintenanceDocument,
} from '../services/maintenance';

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  list: (params?: MaintenanceRecordQueryParams) => ['maintenance', 'list', params] as const,
  detail: (id: number) => ['maintenance', 'detail', id] as const,
  byUnit: (unitId: number, params?: { per_page?: number; page?: number }) =>
    ['maintenance', 'unit', unitId, params] as const,
  /** Mantención `en_curso` de una unidad (una sola a la vez). */
  active: (unitId: number) => ['maintenance', 'active', unitId] as const,
  documents: (unitId: number, params?: MaintenanceDocumentQueryParams) =>
    ['maintenance', 'documents', unitId, params] as const,
};

/**
 * Abrir, cerrar o anular una mantención cambia el estado de la unidad, los contadores del producto
 * y el estado del informe asociado.
 */
function invalidateAfterMaintenanceChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['equipment-units'] }),
    queryClient.invalidateQueries({ queryKey: ['products'] }),
    queryClient.invalidateQueries({ queryKey: ['incident-reports'] }),
  ]);
}

export function useMaintenanceRecords(params?: MaintenanceRecordQueryParams) {
  return useQuery({
    queryKey: maintenanceKeys.list(params),
    queryFn: () => fetchMaintenanceRecords(params),
    placeholderData: keepPreviousData,
  });
}

export function useMaintenanceSummary(params?: MaintenanceSummaryQueryParams) {
  return useQuery({
    queryKey: ['maintenance', 'summary', params] as const,
    queryFn: () => fetchMaintenanceSummary(params),
  });
}

export function useMaintenanceRecord(id: number | undefined) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id ?? 0),
    queryFn: () => fetchMaintenanceRecord(id as number),
    enabled: id !== undefined,
  });
}

export function useUnitMaintenanceRecords(
  unitId: number | undefined,
  params?: { per_page?: number; page?: number },
) {
  return useQuery({
    queryKey: maintenanceKeys.byUnit(unitId ?? 0, params),
    queryFn: () => fetchUnitMaintenanceRecords(unitId as number, params),
    enabled: unitId !== undefined,
    placeholderData: keepPreviousData,
  });
}

/**
 * Mantención `en_curso` de la unidad, o `null`. Con una en curso, `PATCH /equipment-units/{id}/status`
 * responde 422: la interfaz debe ocultar el selector de estado. Solo consulta si `enabled` (una unidad
 * en mantención siempre está `en_reparacion`).
 */
export function useActiveMaintenance(unitId: number | undefined, enabled = true) {
  return useQuery<MaintenanceRecord | null>({
    queryKey: maintenanceKeys.active(unitId ?? 0),
    queryFn: async () => {
      const page = await fetchMaintenanceRecords({
        equipment_unit_id: unitId as number,
        status: 'en_curso',
        per_page: 1,
      });
      return page.data[0] ?? null;
    },
    enabled: unitId !== undefined && enabled,
  });
}

export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation<
    MaintenanceRecord,
    Error,
    { unitId: number; payload: CreateMaintenanceRecordPayload }
  >({
    mutationFn: ({ unitId, payload }) => createMaintenanceRecord(unitId, payload),
    onSuccess: () => invalidateAfterMaintenanceChange(queryClient),
  });
}

export function useUpdateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation<
    MaintenanceRecord,
    Error,
    { id: number; payload: UpdateMaintenanceRecordPayload }
  >({
    mutationFn: ({ id, payload }) => updateMaintenanceRecord(id, payload),
    onSuccess: (record) => {
      queryClient.setQueryData(maintenanceKeys.detail(record.id), record);
      return queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
    },
  });
}

export function useFinishMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation<MaintenanceRecord, Error, { id: number; payload: FinishMaintenancePayload }>({
    mutationFn: ({ id, payload }) => finishMaintenanceRecord(id, payload),
    onSuccess: () => invalidateAfterMaintenanceChange(queryClient),
  });
}

export function useCancelMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation<MaintenanceRecord, Error, { id: number; payload?: CancelMaintenancePayload }>({
    mutationFn: ({ id, payload }) => cancelMaintenanceRecord(id, payload),
    onSuccess: () => invalidateAfterMaintenanceChange(queryClient),
  });
}

export function useUnitMaintenanceDocuments(
  unitId: number | undefined,
  params?: MaintenanceDocumentQueryParams,
) {
  return useQuery({
    queryKey: maintenanceKeys.documents(unitId ?? 0, params),
    queryFn: () => fetchUnitMaintenanceDocuments(unitId as number, params),
    enabled: unitId !== undefined,
    placeholderData: keepPreviousData,
  });
}

export function useUploadMaintenanceDocument() {
  const queryClient = useQueryClient();
  return useMutation<
    MaintenanceDocument,
    Error,
    { unitId: number; payload: UploadMaintenanceDocumentPayload }
  >({
    mutationFn: ({ unitId, payload }) => uploadMaintenanceDocument(unitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
  });
}

export function useDeleteMaintenanceDocument() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteMaintenanceDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
  });
}

/** Descarga autenticada (Blob) de un documento: no se puede usar `file_url` en un enlace. */
export function useDownloadMaintenanceDocument() {
  return useMutation<Blob, Error, number>({
    mutationFn: downloadMaintenanceDocumentFile,
  });
}

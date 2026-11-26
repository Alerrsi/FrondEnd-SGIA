import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  exportReport,
  fetchMyReportDownloads,
  fetchReportPreview,
  reportUrl,
  type ExportedReport,
  type ExportReportOptions,
  type ReportParams,
} from '../services/reports';

export const reportKeys = {
  all: ['reports'] as const,
  /** Por ruta y filtros ya normalizados (sin vacíos), así `{ a: '' }` y `{}` comparten caché. */
  preview: (path: string, params?: ReportParams) => ['reports', 'preview', path, reportUrl(path, params)] as const,
  myDownloads: ['reports', 'my-downloads'] as const,
};

export interface ExportReportVariables {
  path: string;
  params?: ReportParams;
  options?: ExportReportOptions;
}

/**
 * Descarga de un reporte Excel (`GET /api/<recurso>/export`), docs/reportes-excel.md. Cada descarga queda
 * en «Mis descargas» (docs/centro-reportes.md, decisión 12), así que tras una exitosa se vuelve a pedir.
 */
export function useExportReport() {
  const qc = useQueryClient();
  return useMutation<ExportedReport, Error, ExportReportVariables>({
    mutationFn: ({ path, params, options }) => exportReport(path, params, options),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportKeys.myDownloads });
    },
  });
}

/**
 * Vista previa de un reporte (`preview=1`). Conserva la anterior del mismo reporte mientras llega la nueva
 * (`keepPreviousData`: no parpadea al cambiar filtros) y cachea por ruta y filtros. Al cambiar de reporte no
 * se muestran las hojas del anterior.
 */
export function useReportPreview(path: string, params?: ReportParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.preview(path, params),
    queryFn: () => fetchReportPreview(path, params),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === path ? keepPreviousData(previous) : undefined,
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    retry: false,
  });
}

/** Últimas descargas del usuario (`GET /api/me/report-downloads`). */
export function useMyReportDownloads(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.myDownloads,
    queryFn: fetchMyReportDownloads,
    enabled: options?.enabled ?? true,
  });
}

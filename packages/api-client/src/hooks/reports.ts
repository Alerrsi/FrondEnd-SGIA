import { useMutation } from '@tanstack/react-query';
import {
  exportReport,
  type ExportedReport,
  type ExportReportOptions,
  type ReportParams,
} from '../services/reports';

export interface ExportReportVariables {
  path: string;
  params?: ReportParams;
  options?: ExportReportOptions;
}

/** Descarga de un reporte Excel (`GET /api/<recurso>/export`), docs/reportes-excel.md. */
export function useExportReport() {
  return useMutation<ExportedReport, Error, ExportReportVariables>({
    mutationFn: ({ path, params, options }) => exportReport(path, params, options),
  });
}

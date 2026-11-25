import { FileSpreadsheet } from 'lucide-react';
import { hasReportFilters, useExportReport, type ReportParams } from '@sgia/api-client';

import { Button } from '@/components/ui/button';
import { downloadBlob } from '@/features/equipos/utils/download';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

export interface ExportExcelButtonProps {
  /** Ruta del export (`/products/export`); puede traer parámetros fijos (`/loans/export?format=excel`). */
  path: string;
  /** Filtros activos de la pantalla con los nombres del backend. Vacíos → reporte completo. */
  params?: ReportParams;
  /** Prefijo del archivo si el backend no envía `Content-Disposition`. */
  filenamePrefix?: string;
  className?: string;
}

/**
 * Botón «Exportar Excel» de cada listado (BackEnd-SGIA/docs/reportes-excel.md): descarga el `.xlsx`
 * que arma el backend con los filtros de la pantalla y avisa si salió filtrado, completo o cortado.
 */
export function ExportExcelButton({ path, params, filenamePrefix, className }: ExportExcelButtonProps) {
  const exportMutation = useExportReport();
  const isPending = exportMutation.isPending;

  const handleExport = async () => {
    const filtered = hasReportFilters(params);
    try {
      const report = await exportMutation.mutateAsync({
        path,
        params,
        options: filenamePrefix ? { fallbackName: filenamePrefix } : undefined,
      });
      downloadBlob(report.blob, report.filename);
      toast.success(`Excel descargado (${filtered ? 'con filtros' : 'completo'})`);
      if (report.truncated) {
        toast.warning('El reporte se cortó en 10.000 filas: acota los filtros');
      }
    } catch (error) {
      toast.error({ title: 'No se pudo exportar el Excel', description: apiErrorToMessage(error) });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isPending}
      aria-busy={isPending || undefined}
      className={cn('text-xs gap-1.5', className)}
    >
      <FileSpreadsheet aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
      <span>{isPending ? 'Generando…' : 'Exportar Excel'}</span>
    </Button>
  );
}

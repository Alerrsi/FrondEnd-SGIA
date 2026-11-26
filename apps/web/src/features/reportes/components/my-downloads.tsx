import { useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import {
  reportDownloadRequest,
  useExportReport,
  useMyReportDownloads,
  type ReportDownload,
} from '@sgia/api-client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { downloadBlob } from '@/features/equipos/utils/download';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

import { formatReportCell, groupThousands } from '../lib/format-cell';

export interface MyDownloadsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** «Desde: 01-01-2026 · Hasta: 30-06-2026»; sin filtros, «Reporte completo». */
function filtersText(filters: Record<string, string>): string {
  const parts = Object.entries(filters)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([label, value]) => `${label}: ${value}`);
  return parts.length > 0 ? parts.join(' · ') : 'Reporte completo';
}

/**
 * «Mis descargas» (docs/centro-reportes.md, decisión 13): las últimas descargas del usuario con sus filtros
 * legibles y «Repetir», que vuelve a pedir la misma ruta con los mismos parámetros.
 */
export function MyDownloads({ open, onOpenChange }: MyDownloadsProps) {
  const { data, isLoading, isError, refetch } = useMyReportDownloads({ enabled: open });
  const exportMutation = useExportReport();
  const [repeatingId, setRepeatingId] = useState<number | null>(null);

  const repeat = async (download: ReportDownload) => {
    const { path, params } = reportDownloadRequest(download);
    setRepeatingId(download.id);
    try {
      const report = await exportMutation.mutateAsync({ path, params });
      downloadBlob(report.blob, report.filename);
      toast.success(`Excel descargado: ${download.title}`);
      if (report.truncated) toast.warning('El reporte se cortó en 10.000 filas: acota los filtros');
    } catch (error) {
      toast.error({ title: 'No se pudo repetir la descarga', description: apiErrorToMessage(error) });
    } finally {
      setRepeatingId(null);
    }
  };

  const downloads = data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>
            <History aria-hidden="true" className="h-4 w-4 text-zinc-500" />
            Mis descargas
          </SheetTitle>
          <SheetDescription>Tus últimas 20 descargas de reportes. «Repetir» las pide de nuevo con los mismos filtros.</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <SkeletonList label="Cargando tus descargas…" rows={5} columns={2} />
        ) : isError ? (
          <ErrorState
            action={
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          >
            No se pudieron cargar tus descargas.
          </ErrorState>
        ) : downloads.length === 0 ? (
          <EmptyState icon={History} title="Aún no descargas reportes" description="Cada Excel que descargues aparecerá aquí." />
        ) : (
          <ul className="flex flex-col">
            {downloads.map((d) => (
              <li
                key={d.id}
                className="flex items-start justify-between gap-3 border-b border-zinc-200 py-2.5 last:border-b-0 dark:border-zinc-800"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{d.title}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{filtersText(d.filters)}</span>
                  <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {formatReportCell(d.created_at, 'datetime')}
                    {d.rows !== null && ` · ${groupThousands(d.rows)} ${d.rows === 1 ? 'fila' : 'filas'}`}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void repeat(d)}
                  disabled={repeatingId !== null}
                  aria-label={`Repetir ${d.title}`}
                >
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                  {repeatingId === d.id ? 'Generando…' : 'Repetir'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}

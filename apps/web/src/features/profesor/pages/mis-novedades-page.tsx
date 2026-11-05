import { useState } from 'react';
import { useMyIncidentReports } from '@sgia/api-client';
import { AlertCircle, ChevronLeft, ChevronRight, FileWarning, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IncidentDetailSheet } from '@/features/novedades/components/incident-detail-sheet';
import { IncidentStatusBadge } from '@/features/novedades/components/incident-status-badge';
import { NewIncidentDialog } from '@/features/profesor/components/new-incident-dialog';
import { formatDateOnly } from '@/features/compras/lib/format';
import { toast } from '@/lib/toast';

export default function MisNovedadesPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, isLoading, isError } = useMyIncidentReports({ page, per_page: 15 });
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            <FileWarning className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            Novedades
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Informes de fallas y faltantes que has reportado.
          </p>
        </div>
        <Button className="text-xs" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo informe
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-zinc-500">Cargando informes…</div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            No se pudieron cargar tus informes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  {['Código', 'Asignatura', 'Laboratorio', 'Problemas', 'Fecha', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {(data?.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                      Aún no has enviado informes.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((report) => (
                    <tr
                      key={report.id}
                      tabIndex={0}
                      onClick={() => setOpenId(report.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setOpenId(report.id)}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-2.5 font-mono">{report.code ?? `#${report.id}`}</td>
                      <td className="px-4 py-2.5">{report.subject ?? report.title ?? '—'}</td>
                      <td className="px-4 py-2.5">{report.location?.nombre ?? '—'}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">
                        {report.problems?.length ?? 0}
                      </td>
                      <td className="px-4 py-2.5 font-mono">
                        {formatDateOnly(report.report_date ?? report.created_at)}
                      </td>
                      <td className="px-4 py-2.5">
                        <IncidentStatusBadge status={report.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs">
            <span className="font-mono text-zinc-500">
              Página {meta.currentPage} de {meta.lastPage}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Página siguiente"
              disabled={page >= meta.lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <NewIncidentDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(code) => toast.success(code ? `Informe ${code} registrado.` : 'Informe registrado.')}
      />
      <IncidentDetailSheet reportId={openId} onClose={() => setOpenId(null)} readOnly />
    </div>
  );
}

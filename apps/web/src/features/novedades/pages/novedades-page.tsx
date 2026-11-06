import { useState } from 'react';
import { useIncidentReports } from '@sgia/api-client';
import type { IncidentReport, IncidentStatus } from '@sgia/types';
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardCheck, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/features/compras/lib/format';
import { IncidentDetailSheet } from '@/features/novedades/components/incident-detail-sheet';
import { IncidentStatusBadge } from '@/features/novedades/components/incident-status-badge';
import { INCIDENT_STATUS_FILTERS } from '@/features/novedades/lib/incident-labels';

const controlClasses =
  'h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-info';

/** Resumen de una fila: los informes anteriores muestran su título; los nuevos, sus problemas. */
function summary(report: IncidentReport): string {
  if (report.is_legacy) return report.title ?? report.description ?? '—';
  return (report.problems ?? []).map((p) => p.label ?? p.type).join(' · ') || '—';
}

/** Bandeja de informes de novedades para `PAN-01`, `AD-01` y `DIR-01`. */
export default function NovedadesPage() {
  const [status, setStatus] = useState<IncidentStatus | ''>('reportado');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, isLoading, isError } = useIncidentReports({
    status: status || undefined,
    search: search.trim() || undefined,
    page,
    per_page: 20,
  });
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-text" />
          Informes de novedades
        </h1>
        <p className="text-xs text-text-muted">
          Fallas y faltantes reportados por los docentes. Abre un informe para revisarlo y cambiar
          su estado.
        </p>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
          <div className="flex gap-1" role="group" aria-label="Filtrar por estado">
            {INCIDENT_STATUS_FILTERS.map((f) => (
              <Button
                key={f.value || 'all'}
                size="sm"
                variant={status === f.value ? 'primary' : 'outline'}
                aria-pressed={status === f.value}
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Código, docente, asignatura…"
              aria-label="Buscar informes"
              className={`${controlClasses} w-64 pl-7`}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-text-muted">
            Cargando informes…
          </div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            No se pudieron cargar los informes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-background font-mono text-xs uppercase tracking-wider text-text-muted">
                  {['Código', 'Docente', 'Asignatura', 'Laboratorio', 'Problemas', 'Fecha', 'Estado'].map(
                    (h) => (
                      <th key={h} className="px-4 py-2.5 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(data?.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                      No hay informes para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((report) => (
                    <tr
                      key={report.id}
                      tabIndex={0}
                      onClick={() => setOpenId(report.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setOpenId(report.id)}
                      className="cursor-pointer hover:bg-surface-raised focus:outline-none focus:bg-surface-raised"
                    >
                      <td className="px-4 py-2.5 font-mono">
                        {report.code ?? `#${report.id}`}
                        {report.is_legacy && (
                          <Badge tone="retired" mono className="ml-1.5">
                            anterior
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5">{report.teacher_name ?? '—'}</td>
                      <td className="px-4 py-2.5">{report.subject ?? '—'}</td>
                      <td className="px-4 py-2.5">{report.location?.nombre ?? '—'}</td>
                      <td className="px-4 py-2.5 max-w-64 truncate text-text-muted" title={summary(report)}>
                        {summary(report)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-text-muted">
                        {formatDate(report.report_date ?? report.created_at)}
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
          <div className="flex items-center justify-end gap-2 border-t border-border p-2 text-xs text-text-muted">
            <span className="font-mono">
              {meta.currentPage} / {meta.lastPage} · {meta.total}
            </span>
            <Button size="icon" variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Página siguiente" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <IncidentDetailSheet reportId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

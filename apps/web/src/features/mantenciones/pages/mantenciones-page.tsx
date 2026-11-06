import { useState } from 'react';
import { useEquipmentUnits, useMaintenanceRecords } from '@sgia/api-client';
import type { MaintenanceRecord, MaintenanceStatus, MaintenanceType } from '@sgia/types';
import { AlertCircle, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/features/compras/lib/format';
import { MaintenanceCareerSummary } from '@/features/mantenciones/components/maintenance-career-summary';
import { MaintenanceChecklistSheet } from '@/features/mantenciones/components/maintenance-checklist-sheet';
import { MaintenanceStatusBadge } from '@/features/mantenciones/components/maintenance-status-badge';
import {
  EXECUTION_MODE_LABELS,
  MAINTENANCE_TYPE_LABELS,
  PRIORITY_TONE,
} from '@/features/mantenciones/lib/maintenance-labels';

const controlClasses =
  'h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-info';

const STATUS_FILTERS: Array<{ value: MaintenanceStatus | ''; label: string }> = [
  { value: 'en_curso', label: 'En curso' },
  { value: 'finalizada', label: 'Finalizadas' },
  { value: 'anulada', label: 'Anuladas' },
  { value: '', label: 'Todas' },
];

/** Bandeja de mantenciones: vienen ordenadas por prioridad A→C; abajo, unidades con mantención vencida. */
export default function MantencionesPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<MaintenanceStatus | ''>('en_curso');
  const [type, setType] = useState<MaintenanceType | ''>('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const showDue = params.get('vencidas') === '1';

  const { data, isLoading, isError } = useMaintenanceRecords({
    status: status || undefined,
    maintenance_type: type || undefined,
    page,
    per_page: 20,
  });
  const due = useEquipmentUnits({ maintenance_due: true, per_page: 10 });
  const meta = data?.meta;

  const row = (r: MaintenanceRecord) => {
    const priority = r.equipment_unit?.product?.maintenance_priority;
    return (
      <tr
        key={r.id}
        tabIndex={0}
        onClick={() => setOpenId(r.id)}
        onKeyDown={(e) => e.key === 'Enter' && setOpenId(r.id)}
        className="cursor-pointer hover:bg-surface-raised focus:outline-none focus:bg-surface-raised"
      >
        <td className="px-4 py-2.5">
          {priority ? <Badge tone={PRIORITY_TONE[priority]} mono>{priority}</Badge> : '—'}
        </td>
        <td className="px-4 py-2.5">
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-raised border border-border">
            {r.equipment_unit?.code ?? `#${r.equipment_unit_id}`}
          </span>
          <p className="text-xs text-text-muted">{r.equipment_unit?.product?.name}</p>
        </td>
        <td className="px-4 py-2.5">{MAINTENANCE_TYPE_LABELS[r.maintenance_type]}</td>
        <td className="px-4 py-2.5 text-text-muted">
          {EXECUTION_MODE_LABELS[r.execution_mode]}
          {r.external_supplier ? ` · ${r.external_supplier.name}` : ''}
        </td>
        <td className="px-4 py-2.5 text-text-muted">{r.responsible?.name ?? r.responsible?.nombre ?? '—'}</td>
        <td className="px-4 py-2.5 font-mono text-text-muted">{formatDate(r.started_at)}</td>
        <td className="px-4 py-2.5">
          <MaintenanceStatusBadge status={r.status} />
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
          <Wrench aria-hidden="true" className="h-5 w-5 text-text" />
          Mantenciones
        </h1>
        <p className="text-xs text-text-muted">
          Bandeja por prioridad (A primero). Abre una fila para ver el checklist y cerrarla (REQ-18).
        </p>
      </div>

      <MaintenanceCareerSummary />

      {(showDue || (due.data?.meta.total ?? 0) > 0) && (
        <section
          aria-label="Unidades con mantención vencida"
          className="rounded-md border border-warn/30 bg-warn-bg p-3 text-xs"
        >
          <p className="font-semibold text-warn">
            {due.data?.meta.total ?? 0} unidades con mantención vencida
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {(due.data?.data ?? []).map((u) => (
              <span key={u.id} className="font-mono rounded border border-amber-300/60 px-1.5 py-0.5">
                {u.code}
              </span>
            ))}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Envíalas a mantención desde Inventario → unidades del producto.
          </p>
        </section>
      )}

      <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
          <div className="flex gap-1" role="group" aria-label="Filtrar por estado">
            {STATUS_FILTERS.map((f) => (
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
          <select
            aria-label="Filtrar por tipo"
            value={type}
            onChange={(e) => {
              setType(e.target.value as MaintenanceType | '');
              setPage(1);
            }}
            className={controlClasses}
          >
            <option value="">Todos los tipos</option>
            {Object.entries(MAINTENANCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-text-muted">Cargando mantenciones…</div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            No se pudieron cargar las mantenciones.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-background font-mono text-xs uppercase tracking-wider text-text-muted">
                  {['Prior.', 'Unidad', 'Tipo', 'Ejecución', 'Responsable', 'Inicio', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(data?.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                      No hay mantenciones para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  data?.data.map(row)
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
              <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Página siguiente" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <MaintenanceChecklistSheet recordId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

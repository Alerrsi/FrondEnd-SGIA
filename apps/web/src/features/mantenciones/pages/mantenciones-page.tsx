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
import { PageHeading } from '@/components/ui/page-heading';
import { CODE_CHIP_CLASS, STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';

const controlClasses =
  FILTER_CONTROL_CLASS;

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
        className="cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 focus:outline-none focus:bg-zinc-50"
      >
        <td className="px-4 py-2.5">
          {priority ? <Badge tone={PRIORITY_TONE[priority]} mono>{priority}</Badge> : '—'}
        </td>
        <td className="px-4 py-2.5">
          <span className={CODE_CHIP_CLASS}>
            {r.equipment_unit?.code ?? `#${r.equipment_unit_id}`}
          </span>
          <p className="text-[11px] text-zinc-500">{r.equipment_unit?.product?.name}</p>
        </td>
        <td className="px-4 py-2.5">{MAINTENANCE_TYPE_LABELS[r.maintenance_type]}</td>
        <td className="px-4 py-2.5 text-zinc-600">
          {EXECUTION_MODE_LABELS[r.execution_mode]}
          {r.external_supplier ? ` · ${r.external_supplier.name}` : ''}
        </td>
        <td className="px-4 py-2.5 text-zinc-600">{r.responsible?.name ?? r.responsible?.nombre ?? '—'}</td>
        <td className="px-4 py-2.5 font-mono text-zinc-500">{formatDate(r.started_at)}</td>
        <td className="px-4 py-2.5">
          <MaintenanceStatusBadge status={r.status} />
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeading icon={Wrench} title="Mantenciones">
        Bandeja por prioridad (A primero). Abre una fila para ver el checklist y cerrarla.
      </PageHeading>

      <MaintenanceCareerSummary />

      {(showDue || (due.data?.meta.total ?? 0) > 0) && (
        <section
          aria-label="Unidades con mantención vencida"
          className="rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs"
        >
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            {due.data?.meta.total ?? 0} unidades con mantención vencida
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {(due.data?.data ?? []).map((u) => (
              <span key={u.id} className="font-mono rounded border border-amber-300/60 px-1.5 py-0.5">
                {u.code}
              </span>
            ))}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Envíalas a mantención desde Inventario → unidades del producto.
          </p>
        </section>
      )}

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 p-2.5">
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
          <div className={`py-12 ${STATE_TEXT_CLASS}`}>Cargando mantenciones…</div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            No se pudieron cargar las mantenciones.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className={TABLE_HEAD_CLASS}>
                <tr>
                  {['Prior.', 'Unidad', 'Tipo', 'Ejecución', 'Responsable', 'Inicio', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {(data?.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`px-4 py-10 ${STATE_TEXT_CLASS}`}>
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
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 p-2 text-xs text-zinc-500">
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

      <MaintenanceChecklistSheet recordId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

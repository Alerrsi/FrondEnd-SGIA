import { useEffect, useState } from 'react';
import { useMaintenanceRecords } from '@sgia/api-client';
import type { MaintenanceCareerSummary, MaintenanceRecord, MaintenanceStatus, MaintenanceType } from '@sgia/types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { MobileRow } from '@/components/ui/mobile-row';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { TableFrame } from '@/components/ui/table-frame';
import { ROW_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { CODE_CHIP_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { formatDate } from '@/features/compras/lib/format';
import {
  careerFilterFromValue,
  careerFilterOf,
  careerFilterParams,
  careerFilterToValue,
  careerLabel,
  type CareerFilter,
} from '../lib/career-filter';
import { EXECUTION_MODE_LABELS, MAINTENANCE_TYPE_LABELS, PRIORITY_TONE } from '../lib/maintenance-labels';
import { MaintenanceStatusBadge } from './maintenance-status-badge';

const STATUS_FILTERS: Array<{ value: MaintenanceStatus | ''; label: string }> = [
  { value: 'en_curso', label: 'En curso' },
  { value: 'finalizada', label: 'Finalizadas' },
  { value: 'anulada', label: 'Anuladas' },
  { value: '', label: 'Todas' },
];

const SEGMENT_CLASS =
  'h-7 rounded-[4px] px-2.5 text-[13px] text-zinc-600 transition-colors duration-150 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-accent dark:text-zinc-300 dark:hover:text-zinc-100 aria-pressed:bg-white aria-pressed:font-medium aria-pressed:text-zinc-900 aria-pressed:shadow-[0_0_0_1px_var(--line)] dark:aria-pressed:bg-zinc-900 dark:aria-pressed:text-zinc-100 pointer-coarse:h-10 pointer-coarse:flex-1';

export interface MaintenanceInboxProps {
  careers: MaintenanceCareerSummary[];
  career: CareerFilter;
  onCareerChange: (filter: CareerFilter) => void;
  onOpen: (recordId: number) => void;
}

function unitCode(r: MaintenanceRecord): string {
  return r.equipment_unit?.code ?? `#${r.equipment_unit_id}`;
}

/**
 * Bandeja de mantenciones (docs/mantenciones-por-carrera.md, decisión 6): ordenada por prioridad (A primero),
 * filtrable por estado, tipo y carrera. En teléfonos, filas apiladas sin desplazamiento lateral.
 */
export function MaintenanceInbox({ careers, career, onCareerChange, onOpen }: MaintenanceInboxProps) {
  const [status, setStatus] = useState<MaintenanceStatus | ''>('en_curso');
  const [type, setType] = useState<MaintenanceType | ''>('');
  const [page, setPage] = useState(1);

  // Al cambiar de carrera (desde la grilla o el selector) se vuelve a la primera página.
  useEffect(() => setPage(1), [career]);

  const { data, isLoading, isError, refetch } = useMaintenanceRecords({
    status: status || undefined,
    maintenance_type: type || undefined,
    ...careerFilterParams(career),
    page,
    per_page: 20,
  });
  const records = data?.data ?? [];
  const meta = data?.meta;
  const selectedCareer = career === null ? null : careers.find((c) => careerFilterOf(c) === career);

  const toolbar = (
    <TableToolbar>
      <div role="group" aria-label="Filtrar por estado" className="flex rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            aria-pressed={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={SEGMENT_CLASS}
          >
            {f.label}
          </button>
        ))}
      </div>
      <select
        aria-label="Filtrar por tipo"
        value={type}
        onChange={(e) => {
          setType(e.target.value as MaintenanceType | '');
          setPage(1);
        }}
        className={FILTER_CONTROL_CLASS}
      >
        <option value="">Todos los tipos</option>
        {Object.entries(MAINTENANCE_TYPE_LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrar por carrera"
        value={careerFilterToValue(career)}
        onChange={(e) => onCareerChange(careerFilterFromValue(e.target.value))}
        className={FILTER_CONTROL_CLASS}
      >
        <option value="">Todas las carreras</option>
        {careers.map((c) => (
          <option key={c.career_id ?? 'none'} value={careerFilterToValue(careerFilterOf(c))}>
            {careerLabel(c)}
          </option>
        ))}
      </select>
    </TableToolbar>
  );

  const priorityBadge = (r: MaintenanceRecord) => {
    const priority = r.equipment_unit?.product?.maintenance_priority;
    return priority ? (
      <Badge tone={PRIORITY_TONE[priority]} mono aria-label={`Prioridad ${priority}`}>
        {priority}
      </Badge>
    ) : (
      <span className="text-zinc-400">—</span>
    );
  };

  const footer =
    meta && meta.lastPage > 1 ? (
      <div className="flex items-center justify-end gap-2 px-3 py-2 text-[13px] text-zinc-500 dark:text-zinc-400">
        <span>
          Página <span className="font-mono">{meta.currentPage}</span> de <span className="font-mono">{meta.lastPage}</span> ·{' '}
          <span className="font-mono">{meta.total}</span> mantenciones
        </span>
        <Button size="icon" variant="secondary" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" aria-label="Página siguiente" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    ) : undefined;

  const emptyTitle = selectedCareer
    ? `No hay mantenciones de ${selectedCareer.code ?? selectedCareer.name} para este filtro.`
    : 'No hay mantenciones para el filtro seleccionado.';

  const body = isLoading ? (
    <SkeletonList label="Cargando mantenciones…" columns={5} />
  ) : isError ? (
    <div className="p-3">
      <ErrorState action={<Button size="sm" variant="secondary" onClick={() => void refetch()}>Reintentar</Button>}>
        No se pudieron cargar las mantenciones.
      </ErrorState>
    </div>
  ) : records.length === 0 ? (
    <EmptyState title={emptyTitle} />
  ) : null;

  return (
    <section aria-labelledby="bandeja-mantenciones" className="flex scroll-mt-4 flex-col gap-3" id="bandeja">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 id="bandeja-mantenciones" className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
            Bandeja{selectedCareer ? ` · ${careerLabel(selectedCareer)}` : ''}
          </h2>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Por prioridad (A primero). Abre una fila para ver el checklist y cerrarla.</p>
        </div>
        {selectedCareer && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onCareerChange(null)}>
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Ver todas las carreras
          </Button>
        )}
      </div>

      <TableFrame
        toolbar={toolbar}
        footer={footer}
        mobile={
          body ?? (
            <ul aria-label="Mantenciones" className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {records.map((r) => (
                <MobileRow
                  key={r.id}
                  onClick={() => onOpen(r.id)}
                  title={
                    <span className="flex items-center gap-2">
                      {priorityBadge(r)}
                      <span className="font-code">{unitCode(r)}</span>
                    </span>
                  }
                  meta={[r.equipment_unit?.product?.name, MAINTENANCE_TYPE_LABELS[r.maintenance_type], formatDate(r.started_at)]
                    .filter(Boolean)
                    .join(' · ')}
                  trailing={<MaintenanceStatusBadge status={r.status} />}
                />
              ))}
            </ul>
          )
        }
      >
        {body ?? (
          <table className="w-full border-collapse text-left">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                {['Prioridad', 'Unidad', 'Tipo', 'Ejecución', 'Responsable', 'Inicio', 'Estado'].map((h) => (
                  <th key={h} className={TH_CLASS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  tabIndex={0}
                  onClick={() => onOpen(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpen(r.id);
                    }
                  }}
                  aria-label={`Abrir mantención de ${unitCode(r)}`}
                  className={cn(ROW_CLASS, 'cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent')}
                >
                  <td className={TD_CLASS}>{priorityBadge(r)}</td>
                  <td className={TD_CLASS}>
                    <span className={CODE_CHIP_CLASS}>{unitCode(r)}</span>
                    <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{r.equipment_unit?.product?.name}</p>
                  </td>
                  <td className={TD_CLASS}>{MAINTENANCE_TYPE_LABELS[r.maintenance_type]}</td>
                  <td className={TD_CLASS}>
                    {EXECUTION_MODE_LABELS[r.execution_mode]}
                    {r.external_supplier ? <span className="text-zinc-500 dark:text-zinc-400"> · {r.external_supplier.name}</span> : null}
                  </td>
                  <td className={TD_CLASS}>{r.responsible?.name ?? r.responsible?.nombre ?? '—'}</td>
                  <td className={cn(TD_CLASS, 'font-mono whitespace-nowrap')}>{formatDate(r.started_at)}</td>
                  <td className={TD_CLASS}>
                    <MaintenanceStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableFrame>
    </section>
  );
}

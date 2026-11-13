import { useMaintenanceSummary } from '@sgia/api-client';
import type { MaintenanceStatus } from '@sgia/types';
import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/cn';
import { MAINTENANCE_STATUS_META } from '@/features/mantenciones/lib/maintenance-labels';
import { SectionTitle } from '@/components/ui/section-title';
import { STATE_TEXT_CLASS } from '@/components/ui/typography';

const nf = new Intl.NumberFormat('es-CL');
const STATUSES = Object.keys(MAINTENANCE_STATUS_META) as MaintenanceStatus[];

const SEGMENT_CLASS: Record<MaintenanceStatus, string> = {
  en_curso: 'bg-amber-500',
  finalizada: 'bg-emerald-500',
  anulada: 'bg-zinc-400 dark:bg-zinc-600',
};

const CARD_CLASS =
  'rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shadow-xs';

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={CARD_CLASS}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={cn('mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100', accent)}>
        {nf.format(value)}
      </p>
    </div>
  );
}

/** Totales por estado (tarjetas) y carga por carrera (barras apiladas por estado). */
export function MaintenanceCareerSummary() {
  const { data, isLoading, isError } = useMaintenanceSummary();

  if (isLoading) return <p className={`py-6 ${STATE_TEXT_CLASS}`}>Cargando resumen…</p>;
  if (isError) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        No se pudo cargar el resumen por carrera.
      </p>
    );
  }
  if (!data || data.total.total === 0) {
    return <p className={`py-6 ${STATE_TEXT_CLASS}`}>Aún no hay mantenciones registradas.</p>;
  }

  const withRecords = data.careers.filter((c) => c.total > 0);
  const empty = data.careers.filter((c) => c.total === 0);
  const max = Math.max(...withRecords.map((c) => c.total));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={data.total.total} />
        <StatCard label="En curso" value={data.total.by_status.en_curso} accent="text-amber-600 dark:text-amber-400" />
        <StatCard label="Finalizadas" value={data.total.by_status.finalizada} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Unidades distintas" value={data.total.units} />
      </div>

      <section aria-label="Mantenciones por carrera" className={cn(CARD_CLASS, 'p-0')}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5">
          <SectionTitle>Mantenciones por carrera</SectionTitle>
          <ul className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            {STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', SEGMENT_CLASS[s])} />
                {MAINTENANCE_STATUS_META[s].label}
              </li>
            ))}
          </ul>
        </div>

        <ul className="flex flex-col gap-3 px-4 py-3">
          {withRecords.map((c) => {
            const detail = STATUSES.map((s) => `${MAINTENANCE_STATUS_META[s].label}: ${nf.format(c.by_status[s])}`).join(' · ');
            return (
              <li key={c.career_id ?? 'none'} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-xs">
                <span className="truncate" title={c.name}>
                  {c.code && <span className="mr-1.5 font-mono text-zinc-500">{c.code}</span>}
                  {c.name}
                </span>
                <div
                  role="img"
                  aria-label={`${c.name}: ${detail}`}
                  title={detail}
                  className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                  style={{ width: `${Math.max((c.total / max) * 100, 4)}%` }}
                >
                  {STATUSES.filter((s) => c.by_status[s] > 0).map((s) => (
                    <div key={s} className={SEGMENT_CLASS[s]} style={{ width: `${(c.by_status[s] / c.total) * 100}%` }} />
                  ))}
                </div>
                <span className="text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                  {nf.format(c.total)}
                  <span className="ml-2 text-zinc-400">{nf.format(c.units)} u.</span>
                </span>
              </li>
            );
          })}
        </ul>

        {empty.length > 0 && (
          <p className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 text-[11px] text-zinc-400">
            Sin registros: {empty.map((c) => c.code ?? c.name).join(', ')}
          </p>
        )}
      </section>
    </div>
  );
}

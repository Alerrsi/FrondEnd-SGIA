import { useMaintenanceSummary } from '@sgia/api-client';
import type { MaintenanceStatus } from '@sgia/types';
import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/cn';
import { MAINTENANCE_STATUS_META } from '@/features/mantenciones/lib/maintenance-labels';
import { SectionTitle } from '@/components/ui/section-title';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';

const nf = new Intl.NumberFormat('es-CL');
const STATUSES = Object.keys(MAINTENANCE_STATUS_META) as MaintenanceStatus[];

const STATUS_TEXT_CLASS: Record<MaintenanceStatus, string> = {
  en_curso: 'text-amber-600 dark:text-amber-400',
  finalizada: 'text-emerald-600 dark:text-emerald-400',
  anulada: 'text-zinc-500',
};

const CARD_CLASS =
  'rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shadow-xs';

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={CARD_CLASS}>
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={cn('mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100', accent)}>
        {nf.format(value)}
      </p>
    </div>
  );
}

/** Totales por estado (tarjetas) y carga por carrera (tabla con desglose por estado). */
export function MaintenanceCareerSummary() {
  const { data, isLoading, isError } = useMaintenanceSummary();

  if (isLoading) return <Skeleton label="Cargando resumen…" className="h-40 w-full" />;
  if (isError) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
        <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
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
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5">
          <SectionTitle>Mantenciones por carrera</SectionTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-2 font-medium">Carrera</th>
                {STATUSES.map((s) => (
                  <th key={s} className="px-3 py-2 text-right font-medium">
                    {MAINTENANCE_STATUS_META[s].label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">Unidades</th>
                <th className="w-2/5 px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {withRecords.map((c) => (
                <tr key={c.career_id ?? 'none'}>
                  <td className="max-w-48 truncate px-4 py-2" title={c.name}>
                    {c.code && <span className="mr-1.5 font-mono text-zinc-500">{c.code}</span>}
                    {c.name}
                  </td>
                  {STATUSES.map((s) => (
                    <td
                      key={s}
                      className={cn(
                        'px-3 py-2 text-right font-mono tabular-nums',
                        c.by_status[s] === 0 ? 'text-zinc-300 dark:text-zinc-600' : STATUS_TEXT_CLASS[s],
                      )}
                    >
                      {nf.format(c.by_status[s])}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-500">{nf.format(c.units)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-500 dark:bg-zinc-400"
                          style={{ width: `${(c.total / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {nf.format(c.total)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {empty.length > 0 && (
          <p className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs text-zinc-400">
            Sin registros: {empty.map((c) => c.code ?? c.name).join(', ')}
          </p>
        )}
      </section>
    </div>
  );
}

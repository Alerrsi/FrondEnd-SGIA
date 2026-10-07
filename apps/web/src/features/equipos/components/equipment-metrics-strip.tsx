import { AlertTriangle, CheckCircle2, Cpu, Wrench } from 'lucide-react';
import type { Equipo } from '@sgia/types';
import { calculateEquipmentLifeCycle } from '../utils/lifecycle';

interface EquipmentMetricsStripProps {
  equipos: Equipo[];
}

export function EquipmentMetricsStrip({ equipos }: EquipmentMetricsStripProps) {
  const total = equipos.length;

  const operativos = equipos.filter(
    (e) => (e.estado ?? e.status ?? 'operativo') === 'operativo',
  ).length;

  const enMantencion = equipos.filter(
    (e) =>
      (e.estado ?? e.status) === 'en_mantencion' ||
      (e.estado ?? e.status) === 'critico',
  ).length;

  const obsolescenciaProxima = equipos.filter((e) => {
    const pDate = e.purchase_date ?? e.specs?.purchase_date;
    const lYears = e.lifespan_years ?? e.specs?.lifespan_years;
    const { isCritical } = calculateEquipmentLifeCycle(pDate, lYears);
    return isCritical;
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
      {/* Total Activos Críticos */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          <Cpu className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Equipos
          </p>
          <p className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
            {total}
          </p>
        </div>
      </div>

      {/* Operativos */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            En Operación
          </p>
          <p className="font-mono text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {operativos}
          </p>
        </div>
      </div>

      {/* En Mantención / Calibración */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-200/60 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <Wrench className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            En Mantención / Taller
          </p>
          <p className="font-mono text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {enMantencion}
          </p>
        </div>
      </div>

      {/* Próximos a Obsolescencia */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-rose-200/60 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Obsolescencia Próxima
          </p>
          <p className="font-mono text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {obsolescenciaProxima}
          </p>
        </div>
      </div>
    </div>
  );
}

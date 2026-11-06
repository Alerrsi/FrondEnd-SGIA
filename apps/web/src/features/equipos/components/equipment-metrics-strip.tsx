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
    <div className="grid grid-cols-2 md:grid-cols-4 rounded-lg border border-border bg-surface shadow-xs divide-y md:divide-y-0 md:divide-x divide-border">
      {/* Total Activos Críticos */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-raised text-text">
          <Cpu className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Total Equipos
          </p>
          <p className="font-mono text-xl font-bold tracking-tight text-text tabular-nums">
            {total}
          </p>
        </div>
      </div>

      {/* Operativos */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ok/30 bg-ok-bg text-ok">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            En Operación
          </p>
          <p className="font-mono text-xl font-bold tracking-tight text-ok tabular-nums">
            {operativos}
          </p>
        </div>
      </div>

      {/* En Mantención / Calibración */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-warn/30 bg-warn-bg text-warn">
          <Wrench className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            En Mantención / Taller
          </p>
          <p className="font-mono text-xl font-bold tracking-tight text-warn tabular-nums">
            {enMantencion}
          </p>
        </div>
      </div>

      {/* Próximos a Obsolescencia */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-danger/30 bg-danger-bg text-danger">
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Obsolescencia Próxima
          </p>
          <p className="font-mono text-xl font-bold tracking-tight text-danger tabular-nums">
            {obsolescenciaProxima}
          </p>
        </div>
      </div>
    </div>
  );
}

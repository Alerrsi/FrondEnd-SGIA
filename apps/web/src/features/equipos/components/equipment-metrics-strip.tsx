import type { Equipo } from '@sgia/types';

import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { Metric } from '@/components/ui/metric';
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
    <CellGrid columns={4} aria-label="Resumen de equipos">
      <Cell>
        <Metric label="Total equipos" value={total} />
      </Cell>
      <Cell>
        <Metric label="En operación" value={operativos} tone={operativos > 0 ? 'success' : 'neutral'} />
      </Cell>
      <Cell>
        <Metric label="En mantención / taller" value={enMantencion} tone={enMantencion > 0 ? 'warning' : 'neutral'} />
      </Cell>
      <Cell>
        <Metric
          label="Obsolescencia próxima"
          value={obsolescenciaProxima}
          tone={obsolescenciaProxima > 0 ? 'danger' : 'neutral'}
        />
      </Cell>
    </CellGrid>
  );
}

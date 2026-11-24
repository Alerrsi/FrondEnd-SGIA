import type { MaintenanceSummary } from '@sgia/types';

import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { Metric } from '@/components/ui/metric';

const nf = new Intl.NumberFormat('es-CL');

export interface MaintenanceMetricsProps {
  total: MaintenanceSummary['total'];
  /** Unidades con la mantención vencida que aún no se envían (`undefined` mientras carga). */
  due: number | undefined;
}

/** Franja de cifras (docs/mantenciones-por-carrera.md, decisión 11): neutras, sin pistas; 2 × 2 en el teléfono. */
export function MaintenanceMetrics({ total, due }: MaintenanceMetricsProps) {
  return (
    <CellGrid columns={4} aria-label="Resumen de mantenciones" className="max-sm:grid-cols-2">
      <Cell className="py-3">
        <Metric label="En curso" value={nf.format(total.by_status.en_curso)} />
      </Cell>
      <Cell className="py-3">
        <Metric label="Vencidas sin enviar" value={due === undefined ? '—' : nf.format(due)} />
      </Cell>
      <Cell className="py-3">
        <Metric label="Finalizadas" value={nf.format(total.by_status.finalizada)} />
      </Cell>
      <Cell className="py-3">
        <Metric label="Unidades atendidas" value={nf.format(total.units)} />
      </Cell>
    </CellGrid>
  );
}

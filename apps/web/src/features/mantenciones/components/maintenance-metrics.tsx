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

/** Cifras de mantenciones (docs/mantenciones-por-carrera.md, decisión 2). */
export function MaintenanceMetrics({ total, due }: MaintenanceMetricsProps) {
  const enCurso = total.by_status.en_curso;
  return (
    <CellGrid columns={4} aria-label="Resumen de mantenciones" className="max-sm:grid-cols-2">
      <Cell>
        <Metric label="En curso" value={nf.format(enCurso)} tone={enCurso > 0 ? 'warning' : 'neutral'} hint="Equipos en revisión ahora" />
      </Cell>
      <Cell>
        <Metric
          label="Vencidas sin enviar"
          value={due === undefined ? '—' : nf.format(due)}
          tone={due ? 'warning' : 'neutral'}
          hint={due ? 'Unidades con la mantención atrasada' : 'Ninguna atrasada'}
        />
      </Cell>
      <Cell>
        <Metric label="Finalizadas" value={nf.format(total.by_status.finalizada)} tone="success" hint={`${nf.format(total.total)} mantenciones en total`} />
      </Cell>
      <Cell>
        <Metric label="Unidades atendidas" value={nf.format(total.units)} hint="Equipos distintos con alguna mantención" />
      </Cell>
    </CellGrid>
  );
}

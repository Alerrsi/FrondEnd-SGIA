import { useApiClientExecutiveKpis as useExecutiveKpis } from '@sgia/api-client';

import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { Metric } from '@/components/ui/metric';

const pct = (value: number) => `${value.toLocaleString('es-CL', { maximumFractionDigits: 1 })} %`;

/** Cifras del pañol en los últimos 30 días para el director. Por GraphQL (`POST /api/metrics`, REQ-14). */
export function ExecutiveKpis() {
  const { data, isLoading, isError } = useExecutiveKpis('LAST_30_DAYS');
  const value = (n: number | undefined, format: (v: number) => string = String) =>
    isLoading ? '…' : isError || n === undefined ? '—' : format(n);

  return (
    <CellGrid columns={4} aria-label="Cifras de los últimos 30 días">
      <Cell to="/analitica">
        <Metric label="Préstamos activos hoy" value={value(data?.prestamosActivosHoy)} />
      </Cell>
      <Cell to="/analitica">
        <Metric
          label="Tasa de atrasos"
          value={value(data?.tasaAtrasosPct, pct)}
          tone={data && data.tasaAtrasosPct >= 10 ? 'warning' : 'neutral'}
          hint="Últimos 30 días"
        />
      </Cell>
      <Cell to="/alertas">
        <Metric
          label="Alertas críticas"
          value={value(data?.alertasCriticasNoResueltas)}
          tone={data && data.alertasCriticasNoResueltas > 0 ? 'danger' : 'neutral'}
          hint="Sin resolver"
        />
      </Cell>
      <Cell to="/inventario">
        <Metric label="Activos disponibles" value={value(data?.activosDisponibles)} hint={data ? `${data.activosEnPrestamo} en préstamo` : undefined} />
      </Cell>
    </CellGrid>
  );
}

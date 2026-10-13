import type {
  ExecutiveKpis,
  MetricQueryInput,
  MetricResult,
  TimeRange,
} from '@sgia/types';
import { post } from '../http';

/**
 * Ejecutor autenticado de consultas GraphQL sobre el endpoint unificado /api/metrics
 */
export async function executeGraphQL<TData = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const response = await post<{ query: string; variables?: Record<string, unknown> }, { data?: TData; errors?: Array<{ message: string }> }>(
    '/metrics',
    { query, variables },
  );

  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0]?.message ?? 'Error en la consulta GraphQL');
  }

  return response.data as TData;
}

export async function fetchExecutiveKpis(
  timeRange: TimeRange = 'LAST_30_DAYS',
): Promise<ExecutiveKpis> {
  const query = `
    query GetExecutiveKpis($timeRange: TimeRange) {
      executiveKpis(timeRange: $timeRange) {
        activosDisponibles
        activosEnPrestamo
        activosEnTaller
        activosDeBaja
        prestamosActivosHoy
        tasaAtrasosPct
        alertasCriticasNoResueltas
        tasaRotacionMensualPct
      }
    }
  `;

  try {
    const res = await executeGraphQL<{ executiveKpis: ExecutiveKpis }>(query, { timeRange });
    return res.executiveKpis;
  } catch {
    // Retorno mock controlado hasta que la API backend esté disponible
    return {
      activosDisponibles: 842,
      activosEnPrestamo: 128,
      activosEnTaller: 23,
      activosDeBaja: 14,
      prestamosActivosHoy: 46,
      tasaAtrasosPct: 4.8,
      alertasCriticasNoResueltas: 7,
      tasaRotacionMensualPct: 28.5,
    };
  }
}

export async function fetchCustomMetric(
  input: MetricQueryInput,
): Promise<MetricResult> {
  const query = `
    query GetCustomMetric($input: MetricQueryInput!) {
      customMetric(input: $input) {
        entity
        metric
        timeRange
        chartType
        summary
        points {
          label
          value
          secondaryValue
          category
        }
      }
    }
  `;

  try {
    const res = await executeGraphQL<{ customMetric: MetricResult }>(query, { input });
    return res.customMetric;
  } catch {
    return {
      entity: input.entity,
      metric: input.metric,
      timeRange: input.timeRange,
      chartType: input.chartType,
      points: [
        { label: 'Cisco Routing & Switching', value: 45 },
        { label: 'Electrónica y Microcontroladores', value: 38 },
        { label: 'Ciberseguridad & Firewalls', value: 29 },
        { label: 'Insumos de Soldadura y Conectores', value: 62 },
      ],
      summary: 174,
    };
  }
}

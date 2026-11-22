import type { ExecutiveKpis, KpiTimeRange, MetricQueryInput, MetricResult } from '@sgia/types';
import { post } from '../http';

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{ message: string; path?: unknown[] }>;
}

const EXECUTIVE_KPIS_QUERY = `
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

const CUSTOM_METRIC_QUERY = `
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

/**
 * Texto visible de un error de GraphQL. Solo los de un resolver (`path`, los `UserError` en español del
 * backend) llegan al usuario; los de sintaxis o validación del motor ("Cannot query field…", en inglés) y el
 * "Internal server error" se reemplazan (auditoría de seguridad, F1).
 */
export function graphQLErrorMessage(error: { message?: string; path?: unknown[] } | undefined): string {
  const message = error?.message?.trim();
  if (message && Array.isArray(error?.path) && error.path.length > 0 && message !== 'Internal server error') {
    return message;
  }
  return 'No se pudieron cargar las métricas. Intenta nuevamente.';
}

/**
 * Ejecutor autenticado de consultas GraphQL sobre el endpoint unificado /api/metrics.
 * Los errores de consulta llegan con HTTP 200 en `errors`; 401 y 403 los lanza `post`.
 */
export async function executeGraphQL<TData = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const response = await post<
    { query: string; variables?: Record<string, unknown> },
    GraphQLResponse<TData>
  >('/metrics', { query, variables });

  if (response.errors && response.errors.length > 0) {
    throw new Error(graphQLErrorMessage(response.errors[0]));
  }

  if (!response.data) {
    throw new Error('La API de métricas respondió sin datos');
  }

  return response.data;
}

/** Solo envía al backend los campos que entiende (`title` se ignora y las fechas solo aplican con CUSTOM). */
export function buildMetricInput(input: MetricQueryInput): Record<string, unknown> {
  const isCustom = input.timeRange === 'CUSTOM';
  return {
    entity: input.entity,
    metric: input.metric,
    timeRange: input.timeRange,
    chartType: input.chartType,
    ...(input.groupBy ? { groupBy: input.groupBy } : {}),
    ...(isCustom && input.dateFrom ? { dateFrom: input.dateFrom } : {}),
    ...(isCustom && input.dateTo ? { dateTo: input.dateTo } : {}),
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
  };
}

export async function fetchExecutiveKpis(
  timeRange: KpiTimeRange = 'LAST_30_DAYS',
): Promise<ExecutiveKpis> {
  const res = await executeGraphQL<{ executiveKpis: ExecutiveKpis }>(EXECUTIVE_KPIS_QUERY, {
    timeRange,
  });
  return res.executiveKpis;
}

export async function fetchCustomMetric(input: MetricQueryInput): Promise<MetricResult> {
  const res = await executeGraphQL<{ customMetric: MetricResult }>(CUSTOM_METRIC_QUERY, {
    input: buildMetricInput(input),
  });
  return res.customMetric;
}

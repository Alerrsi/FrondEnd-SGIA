import { useQuery } from '@tanstack/react-query';
import mockData from '../data/mock-metrics.json';
import type {
  ExecutiveKpis,
  MetricQueryInput,
  MetricResult,
  TimeRange,
} from '../types/metrics';

/**
 * Cliente de transporte para consultas GraphQL hacia /api/metrics.
 * Preparado para cuando el backend Laravel exponga el endpoint unificado.
 */
export async function executeMetricsGraphQL<TData = unknown>(
  _query: string,
  _variables?: Record<string, unknown>,
): Promise<TData> {
  // Mientras la API GraphQL de Laravel no esté programada,
  // la capa de datos consume la fuente mock en contexto de Pañol TI.
  return Promise.resolve({} as TData);
}

/**
 * Resuelve una métrica mock context-aware respetando entidad, métrica, rango temporal y agrupación
 */
export function resolveMockMetric(input: MetricQueryInput): MetricResult {
  const metricsMap = mockData.metrics as Record<string, any>;

  // 1. Búsqueda por entidad, métrica y agrupación si existe
  if (input.groupBy) {
    const keyWithGroup = `${input.entity}_${input.metric}_${input.groupBy}`;
    if (metricsMap[keyWithGroup]) {
      const found = metricsMap[keyWithGroup];
      return {
        ...found,
        chartType: input.chartType || found.chartType,
      } as MetricResult;
    }
  }

  // 2. Búsqueda estándar por entidad, métrica y rango temporal
  const keyWithRange = `${input.entity}_${input.metric}_${input.timeRange}`;
  if (metricsMap[keyWithRange]) {
    const found = metricsMap[keyWithRange];
    return {
      ...found,
      chartType: input.chartType || found.chartType,
    } as MetricResult;
  }

  // 3. Fallback dinámico context-aware con datos de Pañol TI
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

/**
 * Hook para obtener la cinta métrica de KPIs ejecutivos
 */
export function useExecutiveKpis(timeRange: TimeRange = 'LAST_30_DAYS') {
  return useQuery<ExecutiveKpis>({
    queryKey: ['metrics', 'executiveKpis', timeRange],
    queryFn: async () => {
      // Mock data mientras la API GraphQL de Laravel no esté programada
      return mockData.executiveKpis as ExecutiveKpis;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para consultar una métrica analítica individual
 */
export function useCustomMetric(input: MetricQueryInput) {
  return useQuery<MetricResult>({
    queryKey: ['metrics', 'custom', input],
    queryFn: async () => {
      return resolveMockMetric(input);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para consulta en batch de múltiples métricas para plantillas completas
 */
export function useBatchMetrics(inputs: MetricQueryInput[]) {
  return useQuery<MetricResult[]>({
    queryKey: ['metrics', 'batch', inputs],
    queryFn: async () => {
      return inputs.map((input) => resolveMockMetric(input));
    },
    staleTime: 1000 * 60 * 5,
    enabled: inputs.length > 0,
  });
}

import { useQuery } from '@tanstack/react-query';
import mockData from '../data/mock-metrics.json';
import type {
  ExecutiveKpis,
  MetricQueryInput,
  MetricResult,
  TimeRange,
} from '../types/metrics';

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
      const key = `${input.entity}_${input.metric}_${input.timeRange}`;
      const found = (mockData.metrics as Record<string, any>)[key];

      if (found) {
        return {
          ...found,
          chartType: input.chartType || found.chartType,
        } as MetricResult;
      }

      // Fallback dinámico mock context-aware
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
    },
    staleTime: 1000 * 60 * 5,
  });
}

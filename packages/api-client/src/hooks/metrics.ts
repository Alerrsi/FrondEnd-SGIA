import { useQuery } from '@tanstack/react-query';
import type {
  ExecutiveKpis,
  KpiTimeRange,
  MetricQueryInput,
  MetricResult,
} from '@sgia/types';
import { buildMetricInput, fetchCustomMetric, fetchExecutiveKpis } from '../services/metrics';

/** Cada consulta pega a `/api/metrics` (120 req/min): sin reintentos ni refetch agresivo. */
const METRIC_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5,
  retry: false,
  refetchOnWindowFocus: false,
} as const;

export const metricKeys = {
  all: ['metrics'] as const,
  kpis: (timeRange?: KpiTimeRange) => [...metricKeys.all, 'kpis', timeRange] as const,
  custom: (input: MetricQueryInput) =>
    [...metricKeys.all, 'custom', buildMetricInput(input)] as const,
};

export function useExecutiveKpis(timeRange: KpiTimeRange = 'LAST_30_DAYS') {
  return useQuery<ExecutiveKpis>({
    queryKey: metricKeys.kpis(timeRange),
    queryFn: () => fetchExecutiveKpis(timeRange),
    ...METRIC_QUERY_OPTIONS,
  });
}

export function useCustomMetric(input: MetricQueryInput, enabled = true) {
  return useQuery<MetricResult>({
    queryKey: metricKeys.custom(input),
    queryFn: () => fetchCustomMetric(input),
    ...METRIC_QUERY_OPTIONS,
    enabled,
  });
}

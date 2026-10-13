import { useQuery } from '@tanstack/react-query';
import type {
  ExecutiveKpis,
  MetricQueryInput,
  MetricResult,
  TimeRange,
} from '@sgia/types';
import { fetchCustomMetric, fetchExecutiveKpis } from '../services/metrics';

export const metricKeys = {
  all: ['metrics'] as const,
  kpis: (timeRange?: TimeRange) => [...metricKeys.all, 'kpis', timeRange] as const,
  custom: (input: MetricQueryInput) => [...metricKeys.all, 'custom', input] as const,
  batch: (inputs: MetricQueryInput[]) => [...metricKeys.all, 'batch', inputs] as const,
};

export function useExecutiveKpis(timeRange: TimeRange = 'LAST_30_DAYS') {
  return useQuery<ExecutiveKpis>({
    queryKey: metricKeys.kpis(timeRange),
    queryFn: () => fetchExecutiveKpis(timeRange),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomMetric(input: MetricQueryInput) {
  return useQuery<MetricResult>({
    queryKey: metricKeys.custom(input),
    queryFn: () => fetchCustomMetric(input),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBatchMetrics(inputs: MetricQueryInput[]) {
  return useQuery<MetricResult[]>({
    queryKey: metricKeys.batch(inputs),
    queryFn: async () => {
      return Promise.all(inputs.map((input) => fetchCustomMetric(input)));
    },
    staleTime: 1000 * 60 * 5,
    enabled: inputs.length > 0,
  });
}

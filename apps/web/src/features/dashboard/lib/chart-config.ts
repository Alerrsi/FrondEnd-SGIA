import {
  AGGREGATIONS_BY_ENTITY,
  GROUP_BY_OPTIONS_BY_ENTITY,
  type MetricQueryInput,
} from '../types/metrics';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Deja un gráfico guardado en localStorage compatible con el contrato actual:
 * descarta `groupBy` o métricas que la entidad ya no admite y fechas fuera de CUSTOM.
 */
export function sanitizeChart(chart: MetricQueryInput): MetricQueryInput {
  const validGroups = GROUP_BY_OPTIONS_BY_ENTITY[chart.entity]?.map((o) => o.value) ?? [];
  const { groupBy, dateFrom, dateTo, limit, ...rest } = chart;
  const metric = AGGREGATIONS_BY_ENTITY[chart.entity]?.includes(chart.metric)
    ? chart.metric
    : 'COUNT';
  const isCustom = chart.timeRange === 'CUSTOM' && !!dateFrom && ISO_DATE.test(dateFrom);

  return {
    ...rest,
    metric,
    ...(groupBy && validGroups.includes(groupBy) ? { groupBy } : {}),
    ...(isCustom ? { dateFrom } : {}),
    ...(isCustom && dateTo && ISO_DATE.test(dateTo) ? { dateTo } : {}),
    ...(limit !== undefined && limit >= 1 && limit <= 50 ? { limit } : {}),
    ...(chart.timeRange === 'CUSTOM' && !isCustom ? { timeRange: 'LAST_30_DAYS' as const } : {}),
  };
}

export function sanitizeCharts(charts: MetricQueryInput[]): MetricQueryInput[] {
  return charts.map(sanitizeChart);
}

/** Dos gráficos son duplicados si piden exactamente la misma consulta. */
export function isSameChart(a: MetricQueryInput, b: MetricQueryInput): boolean {
  return (
    a.entity === b.entity &&
    a.metric === b.metric &&
    a.chartType === b.chartType &&
    a.timeRange === b.timeRange &&
    (a.groupBy ?? '') === (b.groupBy ?? '') &&
    (a.dateFrom ?? '') === (b.dateFrom ?? '') &&
    (a.dateTo ?? '') === (b.dateTo ?? '') &&
    (a.limit ?? 0) === (b.limit ?? 0)
  );
}

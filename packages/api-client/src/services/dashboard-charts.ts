import type {
  ChartTemplate,
  ChartType,
  CreateUserChartPayload,
  MetricAggregation,
  MetricEntity,
  MetricQueryInput,
  TimeRange,
  UpdateUserChartPayload,
  UserChart,
  UserChartPosition,
  UserChartQueryParams,
} from '@sgia/types';
import { del, get, patch, post, put } from '../http';
import { buildQuery, unwrap } from './shared';

// Dashboard personalizado (FU-06 / REQ-15). Roles: DIR-01 y AD-01; cada usuario solo ve sus gráficos.

export interface RawChartTemplate {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  visualization_type?: string | null;
  chart_type?: string | null;
  entity?: string | null;
  metric?: string | null;
  group_by?: string | null;
  period?: string | null;
}

export interface RawMetricInput {
  entity?: string | null;
  metric?: string | null;
  timeRange?: string | null;
  time_range?: string | null;
  chartType?: string | null;
  chart_type?: string | null;
  groupBy?: string | null;
  group_by?: string | null;
  dateFrom?: string | null;
  date_from?: string | null;
  dateTo?: string | null;
  date_to?: string | null;
  limit?: number | null;
}

export interface RawUserChart {
  id: number;
  chart_template_id: number;
  template?: RawChartTemplate | null;
  custom_title?: string | null;
  type?: string | null;
  position: number;
  entity?: string | null;
  metric?: string | null;
  group_by?: string | null;
  period?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  is_active?: boolean | number | null;
  metric_input?: RawMetricInput | null;
  created_at?: string;
  updated_at?: string;
}

/** Los enums de `customMetric` van en mayúsculas; se normaliza por si llegaran en minúsculas. */
const upper = <T extends string>(value: string | null | undefined): T | null =>
  value ? (value.toUpperCase() as T) : null;

export function normalizeChartTemplate(raw: RawChartTemplate): ChartTemplate {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    description: raw.description ?? null,
    visualization_type: (raw.visualization_type ?? raw.code ?? 'bar').toLowerCase(),
    chart_type: upper<ChartType>(raw.chart_type),
    entity: upper<MetricEntity>(raw.entity),
    metric: upper<MetricAggregation>(raw.metric),
    group_by: raw.group_by || null,
    period: upper<TimeRange>(raw.period),
  };
}

/**
 * `metric_input` viene listo para `customMetric(input:)`. Si falta algún campo obligatorio
 * (plantilla genérica sin completar) se devuelve `null` y el gráfico no se dibuja.
 */
export function normalizeMetricInput(
  raw: RawMetricInput | null | undefined,
  title?: string | null,
): MetricQueryInput | null {
  if (!raw) return null;
  const entity = upper<MetricEntity>(raw.entity);
  const metric = upper<MetricAggregation>(raw.metric);
  const timeRange = upper<TimeRange>(raw.timeRange ?? raw.time_range);
  const chartType = upper<ChartType>(raw.chartType ?? raw.chart_type);
  if (!entity || !metric || !timeRange || !chartType) return null;

  const groupBy = raw.groupBy ?? raw.group_by;
  const dateFrom = raw.dateFrom ?? raw.date_from;
  const dateTo = raw.dateTo ?? raw.date_to;
  return {
    entity,
    metric,
    timeRange,
    chartType,
    ...(title ? { title } : {}),
    ...(groupBy ? { groupBy } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(typeof raw.limit === 'number' ? { limit: raw.limit } : {}),
  };
}

export function normalizeUserChart(raw: RawUserChart): UserChart {
  const template = raw.template ? normalizeChartTemplate(raw.template) : null;
  const title = raw.custom_title ?? template?.name ?? null;
  return {
    id: raw.id,
    chart_template_id: raw.chart_template_id,
    template,
    custom_title: raw.custom_title ?? null,
    type: upper<ChartType>(raw.type),
    position: Number(raw.position),
    entity: upper<MetricEntity>(raw.entity),
    metric: upper<MetricAggregation>(raw.metric),
    group_by: raw.group_by || null,
    period: upper<TimeRange>(raw.period),
    date_from: raw.date_from ?? null,
    date_to: raw.date_to ?? null,
    is_active:
      raw.is_active === undefined || raw.is_active === null ? true : Boolean(raw.is_active),
    metric_input: normalizeMetricInput(raw.metric_input, title),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

type ChartResponse = { data?: RawUserChart } | RawUserChart;
type ChartListResponse = { data?: RawUserChart[] } | RawUserChart[];

function unwrapList<T>(res: { data?: T[] } | T[]): T[] {
  if (Array.isArray(res)) return res;
  return res?.data ?? [];
}

/** Plantillas sembradas, sin paginar. */
export async function fetchChartTemplates(): Promise<ChartTemplate[]> {
  const res = await get<{ data?: RawChartTemplate[] } | RawChartTemplate[]>('/chart-templates');
  return unwrapList(res).map(normalizeChartTemplate);
}

/** Gráficos propios ordenados por `position`. `active: true` solo trae los visibles. */
export async function fetchMyCharts(params?: UserChartQueryParams): Promise<UserChart[]> {
  const res = await get<ChartListResponse>(`/me/charts${buildQuery(params)}`);
  return unwrapList(res)
    .map(normalizeUserChart)
    .sort((a, b) => a.position - b.position);
}

export async function fetchMyChart(id: number): Promise<UserChart> {
  return normalizeUserChart(unwrap(await get<ChartResponse>(`/me/charts/${id}`)));
}

/**
 * Lo no enviado se hereda de la plantilla; `position` por defecto es la primera libre.
 * `422` si la posición está ocupada, ya tiene 5 gráficos o la combinación no es válida.
 */
export async function createMyChart(payload: CreateUserChartPayload): Promise<UserChart> {
  return normalizeUserChart(
    unwrap(await post<CreateUserChartPayload, ChartResponse>('/me/charts', payload)),
  );
}

/** `is_active: false` lo oculta sin borrarlo. Una posición ocupada → `422`. */
export async function updateMyChart(
  id: number,
  payload: UpdateUserChartPayload,
): Promise<UserChart> {
  return normalizeUserChart(
    unwrap(await patch<UpdateUserChartPayload, ChartResponse>(`/me/charts/${id}`, payload)),
  );
}

/** Reordena en bloque en una transacción (permite intercambiar). Responde la lista ordenada. */
export async function updateMyChartPositions(positions: UserChartPosition[]): Promise<UserChart[]> {
  const res = await put<{ positions: UserChartPosition[] }, ChartListResponse>(
    '/me/charts/positions',
    { positions },
  );
  return unwrapList(res)
    .map(normalizeUserChart)
    .sort((a, b) => a.position - b.position);
}

export async function deleteMyChart(id: number): Promise<void> {
  await del<void>(`/me/charts/${id}`);
}

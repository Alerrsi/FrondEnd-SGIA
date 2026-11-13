import type {
  ChartType,
  MetricAggregation,
  MetricEntity,
  MetricQueryInput,
  TimeRange,
} from './metric';

// Dashboard personalizado (FU-06 / REQ-15): hasta 9 gráficos por plantilla, persistidos en el servidor.

/** Máximo de gráficos por plantilla de dashboard y en el panel principal (`position` 1–9). */
export const MAX_USER_CHARTS = 9;

/** Plantilla de dashboard con nombre del usuario (`/api/me/dashboard-templates`): agrupa gráficos. */
export interface DashboardTemplate {
  id: number;
  name: string;
  description: string | null;
  charts_count: number;
  max_charts: number;
}

export interface CreateDashboardTemplatePayload {
  name: string;
  description?: string | null;
}

export type UpdateDashboardTemplatePayload = Partial<CreateDashboardTemplatePayload>;

/**
 * Plantilla sembrada (`GET /api/chart-templates`).
 * Las genéricas (`bar`, `line`, `pie`, `kpi`) traen la consulta por defecto en `null`.
 */
export interface ChartTemplate {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  /** `bar` | `line` | `pie` | `kpi`… */
  visualization_type: string;
  chart_type: ChartType | null;
  entity: MetricEntity | null;
  metric: MetricAggregation | null;
  group_by: string | null;
  period: TimeRange | null;
}

/** Gráfico propio del usuario (`/api/me/charts`). */
export interface UserChart {
  id: number;
  chart_template_id: number;
  /** Plantilla de dashboard propia; `null` = panel principal. */
  dashboard_template_id: number | null;
  template?: ChartTemplate | null;
  custom_title: string | null;
  type: ChartType | null;
  /** 1–5. */
  position: number;
  entity: MetricEntity | null;
  metric: MetricAggregation | null;
  group_by: string | null;
  period: TimeRange | null;
  /** Solo con `period: 'CUSTOM'`. */
  date_from: string | null;
  date_to: string | null;
  is_active: boolean;
  /** Listo para usarse como `input` de `customMetric`. `null` si la plantilla genérica no se completó. */
  metric_input: MetricQueryInput | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserChartQueryParams {
  /** `true` = solo los visibles. */
  active?: boolean;
  /** Plantilla de dashboard; sin ella, el panel principal. */
  dashboard_template_id?: number | null;
}

export interface CreateUserChartPayload {
  chart_template_id: number;
  /** Plantilla propia donde va el gráfico; sin ella entra al panel principal. */
  dashboard_template_id?: number | null;
  custom_title?: string | null;
  type?: ChartType;
  position?: number;
  entity?: MetricEntity;
  metric?: MetricAggregation;
  group_by?: string | null;
  period?: TimeRange;
  date_from?: string | null;
  date_to?: string | null;
  is_active?: boolean;
}

/** Edita cualquier campo salvo `user_id`. Cambiar `chart_template_id` toma la consulta de la nueva plantilla. */
export type UpdateUserChartPayload = Partial<Omit<CreateUserChartPayload, 'dashboard_template_id'>>;

export interface UserChartPosition {
  id: number;
  position: number;
}

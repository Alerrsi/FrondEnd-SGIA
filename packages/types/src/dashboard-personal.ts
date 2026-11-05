import type {
  ChartType,
  MetricAggregation,
  MetricEntity,
  MetricQueryInput,
  TimeRange,
} from './metric';

// Dashboard personalizado (FU-06 / REQ-15): hasta 5 gráficos por usuario, persistidos en el servidor.

/** Máximo de gráficos por usuario (`position` 1–5, una por gráfico). */
export const MAX_USER_CHARTS = 5;

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
}

export interface CreateUserChartPayload {
  chart_template_id: number;
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
export type UpdateUserChartPayload = Partial<CreateUserChartPayload>;

export interface UserChartPosition {
  id: number;
  position: number;
}

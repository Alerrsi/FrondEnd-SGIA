export type MetricEntity =
  | 'EQUIPMENT'
  | 'SUPPLIES'
  | 'LOANS'
  | 'ALERTS'
  | 'MAINTENANCE'
  | 'CAREERS'
  | 'TEACHERS';

export type MetricAggregation = 'TOTAL' | 'AVERAGE' | 'COUNT' | 'RATE';

export type TimeRange =
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'SEMESTER_CURRENT'
  | 'SEMESTER_PREVIOUS'
  | 'YEAR_TO_DATE'
  | 'CUSTOM';

export type ChartType = 'BAR' | 'LINE' | 'DOUGHNUT' | 'POLAR_AREA';

export interface MetricQueryInput {
  entity: MetricEntity;
  metric: MetricAggregation;
  timeRange: TimeRange;
  chartType: ChartType;
  title?: string;
  groupBy?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface MetricDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}

export interface MetricResult {
  entity: MetricEntity;
  metric: MetricAggregation;
  timeRange: TimeRange;
  chartType: ChartType;
  points: MetricDataPoint[];
  summary?: number;
}

export interface ExecutiveKpis {
  activosDisponibles: number;
  activosEnPrestamo: number;
  activosEnTaller: number;
  activosDeBaja: number;
  prestamosActivosHoy: number;
  tasaAtrasosPct: number;
  alertasCriticasNoResueltas: number;
  tasaRotacionMensualPct: number;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  charts: MetricQueryInput[];
}

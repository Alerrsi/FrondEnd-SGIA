import type {
  ChartType,
  DashboardTemplate,
  ExecutiveKpis,
  KpiTimeRange,
  MetricAggregation,
  MetricDataPoint,
  MetricEntity,
  MetricQueryInput,
  MetricResult,
  TimeRange,
} from '@sgia/types';

export type {
  ChartType,
  DashboardTemplate,
  ExecutiveKpis,
  KpiTimeRange,
  MetricAggregation,
  MetricDataPoint,
  MetricEntity,
  MetricQueryInput,
  MetricResult,
  TimeRange,
};

export interface GroupByOption {
  value: string;
  label: string;
}

/** Máximo de gráficos simultáneos por plantilla. */
export const MAX_CHARTS = 5;

/** `groupBy` válidos por entidad (metrics.md §4). `''` = sin agrupar. */
export const GROUP_BY_OPTIONS_BY_ENTITY: Record<MetricEntity, GroupByOption[]> = {
  LOANS: [
    { value: 'status', label: 'Estado de préstamo' },
    { value: 'teacher', label: 'Docente solicitante' },
    { value: 'subject', label: 'Asignatura' },
    { value: 'item_type', label: 'Tipo de ítem' },
  ],
  SUPPLIES: [
    { value: 'career', label: 'Carrera' },
    { value: 'category', label: 'Categoría' },
    { value: 'turnover', label: 'Rotación' },
  ],
  EQUIPMENT: [
    { value: 'hardware_category', label: 'Categoría de hardware' },
    { value: 'location', label: 'Sala / ubicación' },
    { value: 'physical_condition', label: 'Estado físico' },
  ],
  ALERTS: [
    { value: 'criticality', label: 'Criticidad' },
    { value: 'specialty_area', label: 'Especialidad / área' },
  ],
  MAINTENANCE: [
    { value: 'equipment', label: 'Equipo' },
    { value: 'failure_type', label: 'Gravedad de la falla' },
    { value: 'workshop', label: 'Taller' },
  ],
  CAREERS: [{ value: 'specialty', label: 'Especialidad' }],
  TEACHERS: [
    { value: 'subject', label: 'Asignatura' },
    { value: 'department', label: 'Departamento' },
  ],
};

/** Entidades cuyo resultado sin `groupBy` es una serie cronológica (metrics.md §4). */
const TIME_SERIES_ENTITIES: ReadonlySet<MetricEntity> = new Set([
  'LOANS',
  'ALERTS',
  'MAINTENANCE',
]);

/** `LOANS` + `RATE` sin agrupar es la dona de puntualidad, no una serie (§5). */
export function isTimeSeries(
  entity: MetricEntity,
  groupBy?: string,
  metric?: MetricAggregation,
): boolean {
  if (groupBy || !TIME_SERIES_ENTITIES.has(entity)) return false;
  return !(entity === 'LOANS' && metric === 'RATE');
}

/** `ALERTS` y `MAINTENANCE` no manejan unidades: TOTAL y AVERAGE solo repiten el conteo (§5). */
export const AGGREGATIONS_BY_ENTITY: Record<MetricEntity, MetricAggregation[]> = {
  EQUIPMENT: ['COUNT', 'TOTAL', 'AVERAGE', 'RATE'],
  SUPPLIES: ['COUNT', 'TOTAL', 'AVERAGE', 'RATE'],
  LOANS: ['COUNT', 'TOTAL', 'AVERAGE', 'RATE'],
  ALERTS: ['COUNT', 'RATE'],
  MAINTENANCE: ['COUNT', 'RATE'],
  CAREERS: ['COUNT', 'TOTAL', 'AVERAGE', 'RATE'],
  TEACHERS: ['COUNT', 'TOTAL', 'AVERAGE', 'RATE'],
};

export const ENTITY_LABELS: Record<MetricEntity, string> = {
  EQUIPMENT: 'Equipos y activos',
  SUPPLIES: 'Insumos y fungibles',
  LOANS: 'Préstamos de pañol',
  ALERTS: 'Alertas de stock',
  MAINTENANCE: 'Mantención y fallas',
  CAREERS: 'Carreras',
  TEACHERS: 'Docentes y asignaturas',
};

export const AGGREGATION_LABELS: Record<MetricAggregation, string> = {
  COUNT: 'Conteo de registros',
  TOTAL: 'Unidades totales',
  AVERAGE: 'Unidades por registro',
  RATE: 'Porcentaje del total',
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  BAR: 'Barras',
  LINE: 'Línea',
  DOUGHNUT: 'Dona',
  POLAR_AREA: 'Área polar',
};

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  LAST_7_DAYS: 'Últimos 7 días',
  LAST_30_DAYS: 'Últimos 30 días',
  SEMESTER_CURRENT: 'Semestre actual',
  SEMESTER_PREVIOUS: 'Semestre anterior',
  YEAR_TO_DATE: 'Año en curso',
  CUSTOM: 'Rango personalizado',
};

export const TIME_RANGES: TimeRange[] = [
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'SEMESTER_CURRENT',
  'SEMESTER_PREVIOUS',
  'YEAR_TO_DATE',
  'CUSTOM',
];

/** Dona y área polar solo tienen sentido con pocas categorías (§6). */
export const PIE_LIKE_DEFAULT_LIMIT = 8;

export function isPieLike(chartType: ChartType): boolean {
  return chartType === 'DOUGHNUT' || chartType === 'POLAR_AREA';
}

export function generateDefaultChartTitle(
  entity: MetricEntity,
  metric: MetricAggregation,
  groupBy?: string,
): string {
  const entityLabel = ENTITY_LABELS[entity];
  if (!groupBy) {
    return `${entityLabel} · ${AGGREGATION_LABELS[metric]}`;
  }
  const found = GROUP_BY_OPTIONS_BY_ENTITY[entity].find((o) => o.value === groupBy);
  return `${entityLabel} por ${(found?.label ?? groupBy).toLowerCase()}`;
}

export type DragItemPayload =
  | {
      type: 'NEW_WIDGET';
      chartType: ChartType;
    }
  | {
      type: 'REORDER';
      sourceIndex: number;
    };

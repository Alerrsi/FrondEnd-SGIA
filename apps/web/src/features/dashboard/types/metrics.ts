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

export interface GroupByOption {
  value: string;
  label: string;
}

export const GROUP_BY_OPTIONS_BY_ENTITY: Record<MetricEntity, GroupByOption[]> = {
  LOANS: [
    { value: 'status', label: 'Estado de Préstamo' },
    { value: 'teacher', label: 'Docente Solicitante' },
    { value: 'subject', label: 'Asignatura' },
    { value: 'item_type', label: 'Tipo de Insumo' },
  ],
  SUPPLIES: [
    { value: 'career', label: 'Especialidad / Carrera' },
    { value: 'category', label: 'Categoría Técnica' },
    { value: 'turnover', label: 'Rotación' },
  ],
  EQUIPMENT: [
    { value: 'hardware_category', label: 'Categoría de Hardware' },
    { value: 'location', label: 'Sala / Ubicación' },
    { value: 'physical_condition', label: 'Estado Físico' },
  ],
  ALERTS: [
    { value: 'criticality', label: 'Criticidad' },
    { value: 'specialty_area', label: 'Especialidad / Área' },
  ],
  MAINTENANCE: [
    { value: 'equipment', label: 'Equipo' },
    { value: 'failure_type', label: 'Tipo de Falla' },
    { value: 'workshop', label: 'Taller' },
  ],
  CAREERS: [
    { value: 'specialty', label: 'Especialidad' },
    { value: 'level', label: 'Nivel Semestral' },
  ],
  TEACHERS: [
    { value: 'subject', label: 'Asignatura' },
    { value: 'department', label: 'Departamento' },
  ],
};

export const ENTITY_LABELS: Record<MetricEntity, string> = {
  EQUIPMENT: 'Equipos y Activos',
  SUPPLIES: 'Insumos y Fungibles',
  LOANS: 'Préstamos de Pañol',
  ALERTS: 'Alertas de Stock',
  MAINTENANCE: 'Mantención y Fallas',
  CAREERS: 'Carreras / Especialidades',
  TEACHERS: 'Docentes / Asignaturas',
};

export const AGGREGATION_LABELS: Record<MetricAggregation, string> = {
  COUNT: 'Conteo / Frecuencia',
  TOTAL: 'Volumen Total',
  AVERAGE: 'Promedio',
  RATE: 'Tasa Porcentual',
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  BAR: 'Barras (BAR)',
  LINE: 'Línea Temporal (LINE)',
  DOUGHNUT: 'Torta / Dona (DOUGHNUT)',
  POLAR_AREA: 'Área Polar (POLAR_AREA)',
};

export function generateDefaultChartTitle(
  entity: MetricEntity,
  metric: MetricAggregation,
  groupBy?: string,
): string {
  const entityLabel = ENTITY_LABELS[entity] || entity;
  if (!groupBy) {
    return `${entityLabel} (${AGGREGATION_LABELS[metric] || metric})`;
  }

  const options = GROUP_BY_OPTIONS_BY_ENTITY[entity] || [];
  const found = options.find((o) => o.value === groupBy);
  const groupLabel = found ? found.label : groupBy;

  return `${entityLabel} por ${groupLabel}`;
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

import type { ChartType, DashboardTemplate, MetricQueryInput } from '../types/metrics';

/** Plantillas predeterminadas del sistema. Todas usan `groupBy` válidos según metrics.md §4. */
export const DEFAULT_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'template-operaciones',
    name: 'Operaciones y Movimiento de Pañol',
    description: 'Flujo de préstamos, tasas de devolución y alertas críticas de stock.',
    charts: [
      {
        title: 'Préstamos Diarios por Semana',
        entity: 'LOANS',
        metric: 'COUNT',
        timeRange: 'LAST_30_DAYS',
        chartType: 'LINE',
      },
      {
        title: 'Estado y Atrasos de Préstamos',
        entity: 'LOANS',
        metric: 'RATE',
        timeRange: 'LAST_30_DAYS',
        chartType: 'DOUGHNUT',
      },
      {
        title: 'Alertas Críticas por Especialidad',
        entity: 'ALERTS',
        metric: 'COUNT',
        timeRange: 'LAST_30_DAYS',
        chartType: 'BAR',
        groupBy: 'specialty_area',
      },
    ],
  },
  {
    id: 'template-demanda',
    name: 'Demanda y Desgaste por Carrera',
    description: 'Consumo de insumos por área y ranking de equipamiento solicitado.',
    charts: [
      {
        title: 'Insumos Consumidos por Especialidad',
        entity: 'SUPPLIES',
        metric: 'TOTAL',
        timeRange: 'SEMESTER_CURRENT',
        chartType: 'BAR',
        groupBy: 'career',
      },
      {
        title: 'Ranking de Equipos Más Solicitados',
        entity: 'EQUIPMENT',
        metric: 'COUNT',
        timeRange: 'SEMESTER_CURRENT',
        chartType: 'BAR',
      },
      {
        title: 'Préstamos por Asignatura Clave',
        entity: 'TEACHERS',
        metric: 'COUNT',
        timeRange: 'SEMESTER_CURRENT',
        chartType: 'POLAR_AREA',
        groupBy: 'subject',
        limit: 8,
      },
    ],
  },
  {
    id: 'template-salud',
    name: 'Salud del Inventario y Ciclo de Vida',
    description: 'Equipos ociosos, incidencias en taller y rotación semestral.',
    charts: [
      {
        title: 'Insumos por Nivel de Rotación',
        entity: 'SUPPLIES',
        metric: 'COUNT',
        timeRange: 'YEAR_TO_DATE',
        chartType: 'BAR',
        groupBy: 'turnover',
      },
      {
        title: 'Incidencias y Reparaciones en Taller',
        entity: 'MAINTENANCE',
        metric: 'COUNT',
        timeRange: 'LAST_30_DAYS',
        chartType: 'LINE',
      },
      {
        title: 'Tasa de Rotación Semestral de Insumos (%)',
        entity: 'SUPPLIES',
        metric: 'RATE',
        timeRange: 'SEMESTER_CURRENT',
        chartType: 'BAR',
        groupBy: 'turnover',
      },
    ],
  },
];

/** Sugerencias rápidas del menú de configuración, por tipo de gráfico. */
export const CHART_PRESETS: Record<ChartType, MetricQueryInput[]> = {
  BAR: [
    {
      title: 'Equipos por Categoría de Hardware',
      entity: 'EQUIPMENT',
      metric: 'COUNT',
      timeRange: 'LAST_30_DAYS',
      chartType: 'BAR',
      groupBy: 'hardware_category',
    },
    {
      title: 'Insumos Consumidos por Carrera',
      entity: 'SUPPLIES',
      metric: 'TOTAL',
      timeRange: 'SEMESTER_CURRENT',
      chartType: 'BAR',
      groupBy: 'career',
    },
    {
      title: 'Docentes con Más Préstamos',
      entity: 'TEACHERS',
      metric: 'COUNT',
      timeRange: 'SEMESTER_CURRENT',
      chartType: 'BAR',
    },
  ],
  LINE: [
    {
      title: 'Tendencia de Préstamos Semanales',
      entity: 'LOANS',
      metric: 'COUNT',
      timeRange: 'LAST_30_DAYS',
      chartType: 'LINE',
    },
    {
      title: 'Evolución de Alertas de Stock',
      entity: 'ALERTS',
      metric: 'COUNT',
      timeRange: 'SEMESTER_CURRENT',
      chartType: 'LINE',
    },
    {
      title: 'Incidencias en Taller en el Tiempo',
      entity: 'MAINTENANCE',
      metric: 'COUNT',
      timeRange: 'YEAR_TO_DATE',
      chartType: 'LINE',
    },
  ],
  DOUGHNUT: [
    {
      title: 'Distribución de Alertas por Criticidad',
      entity: 'ALERTS',
      metric: 'RATE',
      timeRange: 'LAST_30_DAYS',
      chartType: 'DOUGHNUT',
      groupBy: 'criticality',
    },
    {
      title: 'Estado de Préstamos',
      entity: 'LOANS',
      metric: 'COUNT',
      timeRange: 'LAST_30_DAYS',
      chartType: 'DOUGHNUT',
      groupBy: 'status',
    },
    {
      title: 'Estado Físico del Equipamiento',
      entity: 'EQUIPMENT',
      metric: 'RATE',
      timeRange: 'SEMESTER_CURRENT',
      chartType: 'DOUGHNUT',
      groupBy: 'physical_condition',
    },
  ],
  POLAR_AREA: [
    {
      title: 'Demanda de Insumos por Carrera',
      entity: 'SUPPLIES',
      metric: 'TOTAL',
      timeRange: 'SEMESTER_CURRENT',
      chartType: 'POLAR_AREA',
      groupBy: 'career',
      limit: 8,
    },
    {
      title: 'Préstamos por Asignatura',
      entity: 'TEACHERS',
      metric: 'COUNT',
      timeRange: 'SEMESTER_CURRENT',
      chartType: 'POLAR_AREA',
      groupBy: 'subject',
      limit: 8,
    },
    {
      title: 'Equipos por Sala',
      entity: 'EQUIPMENT',
      metric: 'COUNT',
      timeRange: 'SEMESTER_CURRENT',
      chartType: 'POLAR_AREA',
      groupBy: 'location',
      limit: 8,
    },
  ],
};

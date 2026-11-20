import type { ChartData, ChartOptions } from 'chart.js';

import {
  categoricalColor,
  categoryAxis,
  chartAnimation,
  chartTokens,
  foldOthers,
  legendStyle,
  tooltipStyle,
  valueAxis,
  type ChartTokens,
} from '@/lib/chart-theme';
import type { ChartType, MetricDataPoint, MetricResult } from '../types/metrics';
import { isPieLike } from '../types/metrics';

/** Etiquetas con significado fijo en el contrato (metrics.md §4 y §5): usan los colores de estado. */
const SEMANTIC: Record<string, keyof ChartTokens['status']> = {
  crítica: 'critical',
  advertencia: 'warning',
  atrasado: 'critical',
  activo: 'info',
  'devuelto a tiempo': 'good',
  disponible: 'good',
  'en taller': 'warning',
  'dado de baja': 'inactive',
};

/** Nombre de la porción que agrupa lo que no cabe en la paleta categórica. */
export const OTHERS_LABEL = 'Otros';

const MAX_TICK_LABEL = 16;

export interface ChartLegendItem {
  label: string;
  color: string;
}

function colorForLabel(label: string, fallbackIndex: number, isDark: boolean): string {
  const status = SEMANTIC[label.trim().toLowerCase()];
  if (status) return chartTokens(isDark).status[status];
  if (label === OTHERS_LABEL) return chartTokens(isDark).status.inactive;
  return categoricalColor(fallbackIndex, isDark);
}

/** Puntos a dibujar: en torta, dona y área polar, más de seis porciones se agrupan en «Otros». */
export function displayPoints(result: MetricResult, chartType: ChartType): MetricDataPoint[] {
  if (!isPieLike(chartType)) return result.points;
  return foldOthers(result.points, (value) => ({ label: OTHERS_LABEL, value, secondaryValue: null, category: null }));
}

export function truncateLabel(label: string, max = MAX_TICK_LABEL): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function formatValue(value: number, isPercent: boolean): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  const text = rounded.toLocaleString('es-CL', { maximumFractionDigits: 1 });
  return isPercent ? `${text}%` : text;
}

/** Segunda medida del punto: el stock restante en SUPPLIES y EQUIPMENT (§6). */
export function secondaryLabel(entity: MetricResult['entity']): string {
  return entity === 'SUPPLIES' || entity === 'EQUIPMENT' ? 'Stock restante' : 'Valor secundario';
}

function hasSecondary(points: MetricDataPoint[]): boolean {
  return points.some((p) => p.secondaryValue != null);
}

/** Categorías distintas de los puntos, para colorear y armar la leyenda (§6). */
function categoryColors(points: MetricDataPoint[], isDark: boolean): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of points) {
    if (p.category && !map.has(p.category)) {
      map.set(p.category, colorForLabel(p.category, map.size, isDark));
    }
  }
  return map;
}

export function buildLegend(result: MetricResult, isDark = false): ChartLegendItem[] {
  if (isPieLike(result.chartType)) return [];
  return [...categoryColors(result.points, isDark)].map(([label, color]) => ({ label, color }));
}

export function buildChartData(
  result: MetricResult,
  chartType: ChartType,
  title: string,
  isDark: boolean,
): ChartData {
  const points = displayPoints(result, chartType);
  const labels = points.map((p) => p.label);
  const values = points.map((p) => p.value);
  const t = chartTokens(isDark);
  const surface = t.surface;

  if (isPieLike(chartType)) {
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: points.map((p, i) => colorForLabel(p.label, i, isDark)),
          borderColor: surface,
          borderWidth: 2,
        },
      ],
    };
  }

  const primary = t.primary;
  const secondary = t.secondary;
  const byCategory = categoryColors(points, isDark);
  const pointColors = points.map((p) =>
    p.category ? (byCategory.get(p.category) ?? primary) : primary,
  );

  if (chartType === 'LINE') {
    return {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          borderColor: primary,
          backgroundColor: t.primaryFill,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: pointColors,
          pointBorderColor: surface,
          pointRadius: points.length > 24 ? 0 : 3,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
        },
        ...(hasSecondary(points)
          ? [
              {
                label: secondaryLabel(result.entity),
                data: points.map((p) => p.secondaryValue ?? null),
                borderColor: secondary,
                borderDash: [4, 4],
                backgroundColor: 'transparent',
                tension: 0.3,
                pointRadius: 2,
              },
            ]
          : []),
      ],
    } as ChartData;
  }

  return {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        backgroundColor: pointColors,
        borderRadius: 4,
        maxBarThickness: 48,
      },
      ...(hasSecondary(points)
        ? [
            {
              label: secondaryLabel(result.entity),
              data: points.map((p) => p.secondaryValue ?? null),
              backgroundColor: secondary,
              borderRadius: 4,
              maxBarThickness: 48,
            },
          ]
        : []),
    ],
  } as ChartData;
}

export function buildChartOptions(
  result: MetricResult,
  chartType: ChartType,
  isDark: boolean,
): ChartOptions {
  const isPercent = result.metric === 'RATE';
  const t = chartTokens(isDark);
  const gridColor = t.grid;
  const pieLike = isPieLike(chartType);
  const points = displayPoints(result, chartType);
  const showLegend = pieLike || hasSecondary(result.points);

  const labelOf = (items: { dataIndex: number }[]): string =>
    points[items[0]?.dataIndex ?? 0]?.label ?? '';

  const base: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: chartAnimation(),
    interaction: pieLike ? undefined : { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: showLegend,
        ...legendStyle(isDark),
        labels: {
          ...legendStyle(isDark).labels,
          generateLabels: pieLike
            ? (chart) =>
                (chart.data.labels ?? []).map((label, i) => {
                  const dataset = chart.data.datasets[0];
                  const colors = dataset?.backgroundColor as string[] | undefined;
                  return {
                    text: truncateLabel(String(label), 22),
                    fontColor: t.muted,
                    fillStyle: colors?.[i],
                    strokeStyle: colors?.[i],
                    hidden: !chart.getDataVisibility(i),
                    index: i,
                  };
                })
            : undefined,
        },
      },
      tooltip: {
        ...tooltipStyle(isDark),
        callbacks: {
          title: labelOf,
          label: (item) => {
            const raw = typeof item.raw === 'number' ? item.raw : Number(item.raw);
            const name = item.dataset.label ? `${item.dataset.label}: ` : '';
            return `${name}${formatValue(raw, isPercent && item.datasetIndex === 0)}`;
          },
          afterLabel: (item) => {
            const category = points[item.dataIndex]?.category;
            return category && item.datasetIndex === 0 ? `Categoría: ${category}` : '';
          },
        },
      },
    },
  };

  if (pieLike) {
    if (chartType === 'POLAR_AREA') {
      return {
        ...base,
        scales: {
          r: {
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            // Sin cifras en los anillos: se encimaban; el valor exacto está en el tooltip.
            ticks: { display: false },
          },
        },
      };
    }
    return { ...base, cutout: '62%' } as ChartOptions;
  }

  return {
    ...base,
    scales: {
      x: {
        ...categoryAxis(isDark),
        ticks: {
          ...categoryAxis(isDark).ticks,
          maxRotation: 45,
          autoSkip: true,
          callback(value) {
            return truncateLabel(String(this.getLabelForValue(Number(value))));
          },
        },
      },
      y: {
        ...valueAxis(isDark),
        ticks: {
          ...valueAxis(isDark).ticks,
          callback: (v) => formatValue(Number(v), isPercent),
        },
      },
    },
  };
}

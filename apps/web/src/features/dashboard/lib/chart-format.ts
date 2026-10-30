import type { ChartData, ChartOptions } from 'chart.js';
import type { ChartType, MetricDataPoint, MetricResult } from '../types/metrics';
import { isPieLike } from '../types/metrics';

/** Paleta categórica sin rojo: el rojo institucional se reserva para alertas críticas. */
const CATEGORICAL = [
  '#3b82f6',
  '#06b6d4',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#64748b',
  '#84cc16',
];

/** Etiquetas con significado fijo en el contrato (metrics.md §4 y §5). */
const SEMANTIC: Record<string, string> = {
  crítica: '#e11d48',
  advertencia: '#f59e0b',
  atrasado: '#e11d48',
  activo: '#3b82f6',
  'devuelto a tiempo': '#10b981',
  disponible: '#10b981',
  'en taller': '#f59e0b',
  'dado de baja': '#71717a',
};

const MAX_TICK_LABEL = 16;

export interface ChartLegendItem {
  label: string;
  color: string;
}

export function colorAt(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length]!;
}

function colorForLabel(label: string, fallbackIndex: number): string {
  return SEMANTIC[label.trim().toLowerCase()] ?? colorAt(fallbackIndex);
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
function categoryColors(points: MetricDataPoint[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of points) {
    if (p.category && !map.has(p.category)) {
      map.set(p.category, colorForLabel(p.category, map.size));
    }
  }
  return map;
}

export function buildLegend(result: MetricResult): ChartLegendItem[] {
  if (isPieLike(result.chartType)) return [];
  return [...categoryColors(result.points)].map(([label, color]) => ({ label, color }));
}

export function buildChartData(
  result: MetricResult,
  chartType: ChartType,
  title: string,
  isDark: boolean,
): ChartData {
  const { points } = result;
  const labels = points.map((p) => p.label);
  const values = points.map((p) => p.value);
  const surface = isDark ? '#18181b' : '#ffffff';

  if (isPieLike(chartType)) {
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: points.map((p, i) => colorForLabel(p.label, i)),
          borderColor: surface,
          borderWidth: 2,
        },
      ],
    };
  }

  const primary = isDark ? '#60a5fa' : '#3b82f6';
  const secondary = isDark ? '#71717a' : '#a1a1aa';
  const byCategory = categoryColors(points);
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
          backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.10)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: pointColors,
          pointBorderColor: surface,
          pointRadius: points.length > 24 ? 2 : 4,
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
  const textColor = isDark ? '#a1a1aa' : '#52525b';
  const gridColor = isDark ? 'rgba(63, 63, 70, 0.45)' : 'rgba(228, 228, 231, 0.9)';
  const mono = { family: 'ui-monospace, monospace', size: 10 };
  const pieLike = isPieLike(chartType);
  const showLegend = pieLike || hasSecondary(result.points);

  const labelOf = (items: { dataIndex: number }[]): string =>
    result.points[items[0]?.dataIndex ?? 0]?.label ?? '';

  const base: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          color: textColor,
          font: mono,
          boxWidth: 10,
          generateLabels: pieLike
            ? (chart) =>
                (chart.data.labels ?? []).map((label, i) => {
                  const dataset = chart.data.datasets[0];
                  const colors = dataset?.backgroundColor as string[] | undefined;
                  return {
                    text: truncateLabel(String(label), 22),
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
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        titleColor: isDark ? '#fafafa' : '#18181b',
        bodyColor: isDark ? '#d4d4d8' : '#27272a',
        borderColor: isDark ? '#3f3f46' : '#e4e4e7',
        borderWidth: 1,
        padding: 8,
        bodyFont: mono,
        titleFont: { ...mono, weight: 'bold' },
        callbacks: {
          title: labelOf,
          label: (item) => {
            const raw = typeof item.raw === 'number' ? item.raw : Number(item.raw);
            const name = item.dataset.label ? `${item.dataset.label}: ` : '';
            return `${name}${formatValue(raw, isPercent && item.datasetIndex === 0)}`;
          },
          afterLabel: (item) => {
            const category = result.points[item.dataIndex]?.category;
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
            ticks: {
              color: textColor,
              backdropColor: 'transparent',
              font: mono,
              callback: (v) => formatValue(Number(v), isPercent),
            },
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
        grid: { display: false },
        ticks: {
          color: textColor,
          font: mono,
          maxRotation: 45,
          autoSkip: true,
          callback(value) {
            return truncateLabel(String(this.getLabelForValue(Number(value))));
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: mono,
          callback: (v) => formatValue(Number(v), isPercent),
        },
      },
    },
  };
}

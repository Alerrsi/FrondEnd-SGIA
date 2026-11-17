import type { ChartData, ChartOptions } from 'chart.js';
import type { ChartType, MetricDataPoint, MetricResult } from '../types/metrics';
import { isPieLike } from '../types/metrics';

/** Paleta categórica del sistema «Pañol» (derivada de burdeo, navy, slate y crema; legible en claro y oscuro). */
const CATEGORICAL = [
  '#798DA6',
  '#B0415A',
  '#D9A45B',
  '#4F8A7B',
  '#3D5F8C',
  '#C98B9B',
  '#8A6E52',
  '#A9BBD3',
];

/** Etiquetas con significado fijo en el contrato (metrics.md §4 y §5). */
const SEMANTIC: Record<string, string> = {
  crítica: '#C2414F',
  advertencia: '#D9A45B',
  atrasado: '#C2414F',
  activo: '#3D5F8C',
  'devuelto a tiempo': '#4F8A7B',
  disponible: '#4F8A7B',
  'en taller': '#D9A45B',
  'dado de baja': '#8E9BAE',
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
  const surface = isDark ? '#142841' : '#ffffff';

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

  const primary = isDark ? '#E8A3B1' : '#490B1A';
  const secondary = isDark ? '#55677E' : '#B9C4D2';
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
          backgroundColor: isDark ? 'rgba(232, 163, 177, 0.14)' : 'rgba(73, 11, 26, 0.08)',
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
  const textColor = isDark ? '#8E9BAE' : '#55677E';
  const gridColor = isDark ? 'rgba(185, 196, 210, 0.12)' : '#E6EBF1';
  const font = { family: "'Schibsted Grotesk', system-ui, sans-serif", size: 11 };
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
          font,
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
        backgroundColor: isDark ? '#142841' : '#ffffff',
        titleColor: isDark ? '#EFEADF' : '#142841',
        bodyColor: isDark ? '#B9C4D2' : '#2F4058',
        borderColor: isDark ? '#1E3350' : '#D8DFE8',
        borderWidth: 1,
        padding: 8,
        bodyFont: font,
        titleFont: { ...font, weight: 'bold' },
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
              font,
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
          font,
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
          font,
          callback: (v) => formatValue(Number(v), isPercent),
        },
      },
    },
  };
}

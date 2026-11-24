import { barY, defineChart, group, lineY, type ChartPoint, type ChartTooltipContent } from '@tanstack/charts';
import { areaY } from '@tanstack/charts/area';
import { d3Curve } from '@tanstack/charts/d3/shape';
import { dot } from '@tanstack/charts/dot';
import { pie, polar, radialArc, radialBarRadius } from '@tanstack/charts/polar';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip } from '@tanstack/charts/tooltip';
import { curveMonotoneX } from 'd3-shape';

import { categoryAxis, chartAnimation, chartTheme, chartTokens, valueAxis, valueGrid } from '@/lib/chart-theme';
import { formatValue, truncateLabel, type MetricChartRow } from './chart-format';

/** Sobre 24 puntos, la línea va sin marcadores (igual que antes con Chart.js). */
const MAX_LINE_MARKERS = 24;

interface DefinitionInput {
  rows: MetricChartRow[];
  isPercent: boolean;
  isDark: boolean;
}

/**
 * Tooltip común: título con la etiqueta del punto y una fila por medida (sin repetir el mismo punto cuando
 * lo aportan varias capas, como el área y la línea), más la categoría si la tiene.
 */
function tooltipContent(isPercent: boolean) {
  return (points: readonly ChartPoint<MetricChartRow>[]): ChartTooltipContent => {
    const seen = new Set<string>();
    const unique = points.filter((p) => !seen.has(p.datum.key) && Boolean(seen.add(p.datum.key)));
    const first = unique.find((p) => p.datum.primary)?.datum ?? unique[0]?.datum;
    return {
      title: first?.label ?? '',
      rows: [
        ...unique.map((p) => ({
          label: p.datum.series,
          value: formatValue(p.datum.value, isPercent && p.datum.primary),
          color: p.datum.color,
        })),
        ...(first?.category ? [{ label: 'Categoría', value: first.category }] : []),
      ],
    };
  };
}

function xLabelFormatter(rows: MetricChartRow[]) {
  const labels = new Map(rows.map((r) => [r.x, r.label]));
  return (x: string) => truncateLabel(labels.get(x) ?? x);
}

/** Barras: una por punto con su color; con segunda medida, agrupadas lado a lado. */
export function barDefinition({ rows, isPercent, isDark }: DefinitionInput) {
  const grouped = rows.some((r) => !r.primary);
  return defineChart({
    marks: [
      barY(rows, {
        x: 'x',
        y: 'value',
        z: 'series',
        key: 'key',
        fill: (r) => r.color,
        radius: 4,
        maxThickness: 48,
        ...(grouped ? { layout: group({ padding: 0.12 }) } : {}),
      }),
    ],
    scales: {
      x: { scale: () => scaleBand<string>().padding(0.24), axis: categoryAxis(xLabelFormatter(rows)) },
      y: { scale: scaleLinear, nice: true, grid: valueGrid(isDark), axis: valueAxis((v) => formatValue(v, isPercent)) },
    },
    theme: chartTheme(isDark),
    focus: 'group-x',
    svgAnimation: chartAnimation(),
    tooltip: { use: tooltip, content: tooltipContent(isPercent) },
  });
}

/** Línea con relleno suave en el acento; marcadores del color de su categoría; segunda medida punteada. */
export function lineDefinition({ rows, isPercent, isDark }: DefinitionInput) {
  const t = chartTokens(isDark);
  const primary = rows.filter((r) => r.primary);
  const secondary = rows.filter((r) => !r.primary);
  const curve = d3Curve(curveMonotoneX);
  const markerColors = primary.length > MAX_LINE_MARKERS ? [] : [...new Set(primary.map((r) => r.color))];

  return defineChart({
    marks: [
      areaY(primary, { id: 'area', x: 'x', y: 'value', key: 'key', fill: t.primaryFill, curve }),
      lineY(primary, { id: 'line', x: 'x', y: 'value', key: 'key', stroke: t.primary, strokeWidth: 2, curve }),
      ...(secondary.length > 0
        ? [lineY(secondary, { id: 'secondary', x: 'x', y: 'value', key: 'key', stroke: t.secondary, strokeWidth: 1.5, strokeDasharray: '4 4', curve })]
        : []),
      ...markerColors.map((color) =>
        dot(
          primary.filter((r) => r.color === color),
          { id: `markers-${color}`, x: 'x', y: 'value', key: 'key', r: 3, fill: color, stroke: t.surface, strokeWidth: 2 },
        ),
      ),
    ],
    scales: {
      x: { scale: () => scalePoint<string>().padding(0.3), axis: categoryAxis(xLabelFormatter(rows)) },
      y: { scale: scaleLinear, nice: true, grid: valueGrid(isDark), axis: valueAxis((v) => formatValue(v, isPercent)) },
    },
    theme: chartTheme(isDark),
    focus: 'group-x',
    svgAnimation: chartAnimation(),
    tooltip: { use: tooltip, content: tooltipContent(isPercent) },
  });
}

/** Dona: porciones en orden, con 2px del color de la superficie entre ellas y hueco del 62%. */
export function doughnutDefinition({ rows, isPercent, isDark }: DefinitionInput) {
  const t = chartTokens(isDark);
  const slices = pie(rows, { value: 'value' });
  return defineChart({
    marks: [
      polar({
        inset: 8,
        radiusRatio: 0.92,
        marks: [
          radialArc(slices, {
            innerRadius: ({ radius }) => radius * 0.62,
            fill: (r) => r.color,
            stroke: t.surface,
            strokeWidth: 2,
            key: 'key',
          }),
        ],
        scales: { angle: null, radius: null },
      }),
    ],
    scales: { x: null, y: null },
    theme: chartTheme(isDark),
    svgAnimation: chartAnimation(),
    tooltip: { use: tooltip, content: tooltipContent(isPercent) },
  });
}

/** Área polar (rosa): un sector por porción con el mismo ángulo y radio según el valor. */
export function polarAreaDefinition({ rows, isPercent, isDark }: DefinitionInput) {
  const t = chartTokens(isDark);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return defineChart({
    marks: [
      polar({
        inset: 8,
        radiusRatio: 0.92,
        marks: [
          radialBarRadius(rows, {
            angle: 'x',
            radius: 'value',
            fill: (r) => r.color,
            stroke: t.surface,
            strokeWidth: 2,
            key: 'key',
          }),
        ],
        scales: {
          angle: { scale: () => scaleBand<string>().padding(0) },
          radius: { scale: scaleLinear().domain([0, max]) },
        },
      }),
    ],
    scales: { x: null, y: null },
    theme: chartTheme(isDark),
    svgAnimation: chartAnimation(),
    tooltip: { use: tooltip, content: tooltipContent(isPercent) },
  });
}

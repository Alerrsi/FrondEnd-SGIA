import type { ChartLegendItem } from '@/components/ui/chart-legend';
import { categoricalColor, chartTokens, foldOthers, type ChartTokens } from '@/lib/chart-theme';
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

/**
 * Una fila por barra, punto o porción, con la serie y el color ya resueltos. `x` es la posición del punto
 * (no su etiqueta) para que dos puntos con la misma etiqueta no se apilen; la etiqueta sale de `label`.
 */
export interface MetricChartRow {
  key: string;
  x: string;
  label: string;
  series: string;
  value: number;
  color: string;
  category: string | null;
  /** `true` en la medida principal; `false` en la segunda (stock restante). */
  primary: boolean;
}

export function buildChartRows(
  result: MetricResult,
  chartType: ChartType,
  title: string,
  isDark: boolean,
): MetricChartRow[] {
  const points = displayPoints(result, chartType);

  if (isPieLike(chartType)) {
    return points.map((p, i) => ({
      key: `p${i}`,
      x: String(i),
      label: p.label,
      series: title,
      value: p.value,
      color: colorForLabel(p.label, i, isDark),
      category: p.category ?? null,
      primary: true,
    }));
  }

  const t = chartTokens(isDark);
  const byCategory = categoryColors(points, isDark);
  const primary: MetricChartRow[] = points.map((p, i) => ({
    key: `p${i}`,
    x: String(i),
    label: p.label,
    series: title,
    value: p.value,
    color: p.category ? (byCategory.get(p.category) ?? t.primary) : t.primary,
    category: p.category ?? null,
    primary: true,
  }));
  if (!hasSecondary(points)) return primary;

  const name = secondaryLabel(result.entity);
  const secondary: MetricChartRow[] = points.flatMap((p, i) =>
    p.secondaryValue == null
      ? []
      : [{ key: `s${i}`, x: String(i), label: p.label, series: name, value: p.secondaryValue, color: t.secondary, category: null, primary: false }],
  );
  return [...primary, ...secondary];
}

/**
 * Leyenda del gráfico: porciones en torta/dona/polar; las dos medidas si hay segunda; y las categorías que
 * colorean las barras o puntos.
 */
export function buildLegend(
  result: MetricResult,
  chartType: ChartType,
  title: string,
  isDark: boolean,
): ChartLegendItem[] {
  const t = chartTokens(isDark);
  if (isPieLike(chartType)) {
    return displayPoints(result, chartType).map((p, i) => ({ label: p.label, color: colorForLabel(p.label, i, isDark) }));
  }
  const measures = hasSecondary(result.points)
    ? [
        { label: title, color: t.primary },
        { label: secondaryLabel(result.entity), color: t.secondary },
      ]
    : [];
  const categories = [...categoryColors(result.points, isDark)].map(([label, color]) => ({ label, color }));
  return [...measures, ...categories];
}

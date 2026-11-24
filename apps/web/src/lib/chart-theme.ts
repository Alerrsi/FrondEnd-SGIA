import type { ChartAxisPresentationOptions, ChartGuideLineStyle, ChartTheme, ChartValue } from '@tanstack/charts';

/*
 * Tema único de gráficos (rediseño «Trazo», docs/rediseno-interfaz.md §8). Todo gráfico (TanStack Charts, docs/graficos-tanstack-charts.md)
 * toma de aquí sus colores, rejilla, ejes y animación; el tooltip se estila con variables CSS en `index.css`, para que analítica, presupuestos y monitoreo se lean
 * como un solo sistema en claro y en oscuro.
 *
 * Paleta categórica: la de referencia del skill `dataviz` sin violeta (prohibido en el sistema) ni rojo
 * (reservado al estado crítico). Validada con `validate_palette.js` sobre las superficies de la app:
 *   claro  (#FFFFFF)  CVD ΔE 9,1 · visión normal ΔE 19,6 · contraste < 3:1 en aqua, amarillo y magenta
 *   oscuro (#1B1A17)  CVD ΔE 8,4 · visión normal ΔE 19,3 · contraste ≥ 3:1 en los seis
 * Por el contraste en claro, un gráfico de categorías lleva siempre leyenda y tooltip. Los colores se asignan
 * en orden fijo y nunca se reciclan: más de seis categorías se agrupan en «Otros» (`foldOthers`).
 */

export const CATEGORICAL = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c'],
} as const;

export const MAX_CATEGORIES = CATEGORICAL.light.length;

export interface ChartTokens {
  surface: string;
  text: string;
  muted: string;
  grid: string;
  /** Serie única o principal: el acento (burdeo; rosa en oscuro). */
  primary: string;
  primaryFill: string;
  /** Segunda medida o referencia: neutro. */
  secondary: string;
  /** Estados con significado fijo (nunca reutilizados como «serie 4»). */
  status: { good: string; warning: string; critical: string; info: string; inactive: string };
  categorical: readonly string[];
  tooltip: { background: string; title: string; body: string; border: string };
}

const LIGHT: ChartTokens = {
  surface: '#FFFFFF',
  text: '#1B1A17',
  muted: '#5F5B53',
  grid: '#EFEDE8',
  primary: '#6B1729',
  primaryFill: 'rgba(107, 23, 41, 0.08)',
  secondary: '#CBC7BE',
  status: { good: '#1E6B47', warning: '#B87A00', critical: '#A3202E', info: '#2F5C8A', inactive: '#A19C92' },
  categorical: CATEGORICAL.light,
  tooltip: { background: '#FFFFFF', title: '#1B1A17', body: '#4A463F', border: '#E2DFD8' },
};

const DARK: ChartTokens = {
  surface: '#1B1A17',
  text: '#F2F0EB',
  muted: '#A19C92',
  grid: '#2E2C28',
  primary: '#E8A3B1',
  primaryFill: 'rgba(232, 163, 177, 0.14)',
  secondary: '#5F5B53',
  status: { good: '#7FCBA2', warning: '#E6B565', critical: '#F09A9F', info: '#9DBEE0', inactive: '#5F5B53' },
  categorical: CATEGORICAL.dark,
  tooltip: { background: '#22211E', title: '#F2F0EB', body: '#CBC7BE', border: '#3D3A35' },
};

export function chartTokens(isDark: boolean): ChartTokens {
  return isDark ? DARK : LIGHT;
}

/** Color de la categoría `index` en orden fijo; fuera de rango, el neutro de «Otros». */
export function categoricalColor(index: number, isDark: boolean): string {
  const t = chartTokens(isDark);
  return t.categorical[index] ?? t.status.inactive;
}

/** Tema de escena de TanStack Charts: tinta, texto secundario y rejilla del sistema; paleta categórica en orden fijo. */
export function chartTheme(isDark: boolean): ChartTheme {
  const t = chartTokens(isDark);
  return {
    foreground: t.text,
    muted: t.muted,
    grid: t.grid,
    background: 'transparent',
    palette: t.categorical,
    focusRing: { stroke: t.primary, strokeWidth: 2 },
  };
}

/** 200 ms al entrar o cambiar; nada con movimiento reducido. */
export function chartAnimation(): boolean {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return !reduced;
}

/** Rejilla de 1px del eje de valores (el único con rejilla). */
export function valueGrid(isDark: boolean): ChartGuideLineStyle {
  return { stroke: chartTokens(isDark).grid, strokeOpacity: 1, strokeWidth: 1 };
}

/** Eje de categorías (x): sin línea ni marcas, etiquetas que se ralean solas si no caben. */
export function categoryAxis<T extends ChartValue = string>(format?: (value: T) => string): ChartAxisPresentationOptions<T> {
  return { line: false, ticks: { line: false, size: 0, padding: 8, ...(format ? { format } : {}) }, tickLabels: { thin: true } };
}

/** Eje de valores (y): sin línea ni marcas, hasta `count` cifras formateadas (o las `values` exactas). */
export function valueAxis(
  format: (value: number) => string,
  count = 6,
  values?: readonly number[],
): ChartAxisPresentationOptions<number> {
  return { line: false, ticks: { line: false, size: 0, padding: 8, format, ...(values ? { values } : { count }) } };
}

/** Marcas enteras para conteos (0, 1, 2… o de a 2, 5…), sin cifras repetidas al redondear fracciones. */
export function integerTicks(max: number, target = 5): number[] {
  const top = Math.max(1, Math.ceil(max));
  const raw = top / target;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, raw)));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? 10 * magnitude;
  const last = Math.ceil(top / step) * step;
  return Array.from({ length: last / step + 1 }, (_, i) => i * step);
}

/** Agrupa en «Otros» todo lo que pase de `MAX_CATEGORIES` (los colores no se reciclan). */
export function foldOthers<T extends { label: string; value: number }>(
  items: T[],
  makeOther: (value: number) => T,
  max = MAX_CATEGORIES,
): T[] {
  if (items.length <= max) return items;
  const kept = items.slice(0, max - 1);
  const rest = items.slice(max - 1).reduce((sum, i) => sum + i.value, 0);
  return [...kept, makeOther(rest)];
}

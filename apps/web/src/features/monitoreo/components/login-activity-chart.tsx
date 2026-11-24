import { useMemo } from 'react';
import { barY, defineChart, type ChartPoint } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import type { LoginActivityHour } from '@sgia/types';

import { ChartLegend } from '@/components/ui/chart-legend';
import { useTheme } from '@/contexts/theme-context';
import { categoricalColor, categoryAxis, chartAnimation, chartTheme, integerTicks, valueAxis, valueGrid } from '@/lib/chart-theme';

// Slots 1 y 2 de la paleta del tema (`lib/chart-theme.ts`), los mismos del gráfico mensual de presupuestos.

const hourLabel = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' });
const dayHourLabel = new Intl.DateTimeFormat('es-CL', { weekday: 'short', hour: '2-digit' });
const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

interface LoginBarRow {
  key: string;
  hour: string;
  label: string;
  series: string;
  value: number;
  color: string;
}

/** Inicios de sesión correctos y rechazados por hora, apilados. */
export function LoginActivityChart({ hours }: { hours: LoginActivityHour[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const format = hours.length > 24 ? dayHourLabel : hourLabel;
  const legend = useMemo(
    () => [
      { label: 'Correctos', color: categoricalColor(0, isDark) },
      { label: 'Rechazados', color: categoricalColor(1, isDark) },
    ],
    [isDark],
  );

  const definition = useMemo(() => {
    const labels = new Map(hours.map((h) => [h.hour, format.format(new Date(h.hour))]));
    const bars: LoginBarRow[] = hours.flatMap((h) => {
      const label = labels.get(h.hour) ?? h.hour;
      return [
        { key: `${h.hour}-ok`, hour: h.hour, label, series: 'Correctos', value: h.successful, color: categoricalColor(0, isDark) },
        { key: `${h.hour}-ko`, hour: h.hour, label, series: 'Rechazados', value: h.failed, color: categoricalColor(1, isDark) },
      ];
    });
    const ticks = integerTicks(Math.max(0, ...hours.map((h) => h.successful + h.failed)));
    return defineChart({
      marks: [barY(bars, { x: 'hour', y: 'value', z: 'series', key: 'key', fill: (b) => b.color, radius: 3, maxThickness: 14 })],
      scales: {
        x: { scale: () => scaleBand<string>().padding(0.2), axis: categoryAxis((hour: string) => labels.get(hour) ?? hour) },
        y: {
          scale: scaleLinear().domain([0, ticks.at(-1) ?? 1]),
          grid: valueGrid(isDark),
          axis: valueAxis((v) => integer.format(v), 5, ticks),
        },
      },
      theme: chartTheme(isDark),
      focus: 'group-x',
      svgAnimation: chartAnimation(),
      tooltip: {
        use: tooltip,
        content: (points: readonly ChartPoint<LoginBarRow>[]) => ({
          title: points[0]?.datum.label ?? '',
          rows: points.map((p) => ({ label: p.datum.series, value: integer.format(p.datum.value), color: p.datum.color })),
        }),
      },
    });
  }, [hours, format, isDark]);

  const total = hours.reduce((sum, h) => sum + h.successful + h.failed, 0);

  return (
    <div className="flex flex-col gap-2">
      <ChartLegend items={legend} />
      <div className="h-56">
        <Chart definition={definition} ariaLabel={`Inicios de sesión por hora: ${total} en total`} style={{ height: '100%' }} />
      </div>
    </div>
  );
}

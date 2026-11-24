import { useMemo } from 'react';
import { barY, defineChart, group, type ChartPoint } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { useBudgetMonthly } from '@sgia/api-client';

import { ChartExpandButton } from '@/components/ui/chart-expand-button';
import { ChartLegend } from '@/components/ui/chart-legend';
import { useTheme } from '@/contexts/theme-context';
import {
  categoricalColor,
  categoryAxis,
  chartAnimation,
  chartTheme,
  valueAxis,
  valueGrid,
} from '@/lib/chart-theme';
import { formatCLP } from '@/features/compras/lib/format';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const SERIES = [
  { key: 'reserved', label: 'Reservado' },
  { key: 'consumed', label: 'Consumido' },
  { key: 'restored', label: 'Repuesto' },
] as const;

interface BudgetBarRow {
  key: string;
  month: string;
  series: string;
  value: number;
  color: string;
}

// Slots 1 a 3 de la paleta del tema (validados también contra todos los pares). En claro el aqua queda
// bajo 3:1, por eso la tabla con los mismos valores va siempre debajo del gráfico.
/** Reservado, consumido y repuesto por mes del año (desde el ledger). */
export function BudgetMonthlyChart({ budgetId, year }: { budgetId: number; year: number }) {
  const { resolvedTheme } = useTheme();
  const { data, isLoading } = useBudgetMonthly(budgetId, year);
  const isDark = resolvedTheme === 'dark';
  const rows = useMemo(() => data?.data ?? [], [data]);
  const legend = useMemo(() => SERIES.map((s, i) => ({ label: s.label, color: categoricalColor(i, isDark) })), [isDark]);

  const definition = useMemo(() => {
    const bars: BudgetBarRow[] = rows.flatMap((r) =>
      SERIES.map((s, i) => ({
        key: `${r.month}-${s.key}`,
        month: MONTHS[r.month - 1] ?? String(r.month),
        series: s.label,
        value: r[s.key],
        color: categoricalColor(i, isDark),
      })),
    );
    return defineChart({
      marks: [
        barY(bars, {
          x: 'month',
          y: 'value',
          z: 'series',
          key: 'key',
          fill: (b) => b.color,
          radius: 3,
          maxThickness: 14,
          layout: group({ padding: 0.15 }),
        }),
      ],
      scales: {
        x: { scale: () => scaleBand<string>().padding(0.12), axis: categoryAxis() },
        y: { scale: scaleLinear, nice: true, grid: valueGrid(isDark), axis: valueAxis((v) => formatCLP(v), 5) },
      },
      theme: chartTheme(isDark),
      focus: 'group-x',
      svgAnimation: chartAnimation(),
      tooltip: {
        use: tooltip,
        content: (points: readonly ChartPoint<BudgetBarRow>[]) => ({
          title: points[0]?.datum.month ?? '',
          rows: points.map((p) => ({ label: p.datum.series, value: formatCLP(p.datum.value), color: p.datum.color })),
        }),
      },
    });
  }, [rows, isDark]);

  const ariaLabel = `Reservado, consumido y repuesto por mes en ${year}`;
  const chart = <Chart definition={definition} ariaLabel={ariaLabel} style={{ height: '100%' }} />;

  if (isLoading)
    return (
      <div className={`py-10 ${STATE_TEXT_CLASS}`}>Cargando evolución mensual…</div>
    );

  const hasData = rows.some((r) => r.reserved || r.consumed || r.restored);

  return (
    <div className="flex flex-col gap-3">
      {hasData ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <ChartLegend items={legend} />
            <ChartExpandButton title={`Evolución mensual ${year}`}>
              <div className="flex h-full flex-col gap-2">
                <ChartLegend items={legend} />
                <div className="min-h-0 flex-1">{chart}</div>
              </div>
            </ChartExpandButton>
          </div>
          <div className="h-56">{chart}</div>
        </div>
      ) : (
        <p className={`py-6 ${STATE_TEXT_CLASS}`}>
          Sin movimientos de reserva o consumo en {year}.
        </p>
      )}

      <div className="relative overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-xs">
          <caption className="sr-only">Detalle mensual del presupuesto {year}</caption>
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-3 py-2 text-left font-medium">Mes</th>
              <th className="px-3 py-2 text-right font-medium">Reservado</th>
              <th className="px-3 py-2 text-right font-medium">Consumido</th>
              <th className="px-3 py-2 text-right font-medium">Repuesto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {rows.map((r) => (
              <tr key={r.month}>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {MONTHS[r.month - 1]}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatCLP(r.reserved)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatCLP(r.consumed)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatCLP(r.restored)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

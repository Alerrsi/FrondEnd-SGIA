import { useMemo } from 'react';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useBudgetMonthly } from '@sgia/api-client';

import { ChartExpandButton } from '@/components/ui/chart-expand-button';
import { useTheme } from '@/contexts/theme-context';
import { formatCLP } from '@/features/compras/lib/format';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Paleta categórica validada (skill dataviz, slots 1-3) para cada modo; el aqua claro queda bajo 3:1,
// por eso la tabla con los mismos valores va siempre debajo del gráfico.
const SERIES = {
  light: {
    reserved: '#2a78d6',
    consumed: '#eb6834',
    restored: '#1baf7a',
    grid: '#e4e4e7',
    text: '#71717a',
    surface: '#ffffff',
  },
  dark: {
    reserved: '#3987e5',
    consumed: '#d95926',
    restored: '#199e70',
    grid: '#27272a',
    text: '#a1a1aa',
    surface: '#18181b',
  },
} as const;

/** Reservado, consumido y repuesto por mes del año (desde el ledger). */
export function BudgetMonthlyChart({ budgetId, year }: { budgetId: number; year: number }) {
  const { resolvedTheme } = useTheme();
  const { data, isLoading } = useBudgetMonthly(budgetId, year);
  const colors = SERIES[resolvedTheme === 'dark' ? 'dark' : 'light'];
  const rows = useMemo(() => data?.data ?? [], [data]);

  const chartData = useMemo<ChartData<'bar'>>(() => {
    const series = (label: string, key: 'reserved' | 'consumed' | 'restored') => ({
      label,
      data: rows.map((r) => r[key]),
      backgroundColor: colors[key],
      borderColor: colors.surface,
      borderWidth: 2,
      borderSkipped: false as const,
      borderRadius: 4,
      maxBarThickness: 14,
    });
    return {
      labels: rows.map((r) => MONTHS[r.month - 1] ?? String(r.month)),
      datasets: [
        series('Reservado', 'reserved'),
        series('Consumido', 'consumed'),
        series('Repuesto', 'restored'),
      ],
    };
  }, [rows, colors]);

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: colors.text,
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCLP(Number(ctx.parsed.y))}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.text, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: colors.grid },
          border: { display: false },
          ticks: {
            color: colors.text,
            font: { size: 11 },
            callback: (value) => formatCLP(Number(value)),
            maxTicksLimit: 5,
          },
        },
      },
    }),
    [colors],
  );

  if (isLoading)
    return (
      <div className={`py-10 ${STATE_TEXT_CLASS}`}>Cargando evolución mensual…</div>
    );

  const hasData = rows.some((r) => r.reserved || r.consumed || r.restored);

  return (
    <div className="flex flex-col gap-3">
      {hasData ? (
        <div className="relative">
          <div className="absolute left-0 -top-1 z-10">
            <ChartExpandButton title={`Evolución mensual ${year}`}>
              <Bar data={chartData} options={options} />
            </ChartExpandButton>
          </div>
          <div
            className="h-56"
            role="img"
            aria-label={`Reservado, consumido y repuesto por mes en ${year}`}
          >
            <Bar data={chartData} options={options} />
          </div>
        </div>
      ) : (
        <p className={`py-6 ${STATE_TEXT_CLASS}`}>
          Sin movimientos de reserva o consumo en {year}.
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
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

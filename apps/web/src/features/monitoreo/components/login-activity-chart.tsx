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
import type { LoginActivityHour } from '@sgia/types';

import { useTheme } from '@/contexts/theme-context';
import {
  categoricalColor,
  categoryAxis,
  chartAnimation,
  legendStyle,
  tooltipStyle,
  valueAxis,
} from '@/lib/chart-theme';

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

// Slots 1 y 2 de la paleta del tema (`lib/chart-theme.ts`), los mismos del gráfico mensual de presupuestos.

const hourLabel = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' });
const dayHourLabel = new Intl.DateTimeFormat('es-CL', { weekday: 'short', hour: '2-digit' });

/** Inicios de sesión correctos y rechazados por hora. */
export function LoginActivityChart({ hours }: { hours: LoginActivityHour[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const colors = useMemo(() => ({ successful: categoricalColor(0, isDark), failed: categoricalColor(1, isDark) }), [isDark]);
  const format = hours.length > 24 ? dayHourLabel : hourLabel;

  const data = useMemo<ChartData<'bar'>>(
    () => ({
      labels: hours.map((h) => format.format(new Date(h.hour))),
      datasets: [
        { label: 'Correctos', data: hours.map((h) => h.successful), backgroundColor: colors.successful, borderRadius: 3, maxBarThickness: 14 },
        { label: 'Rechazados', data: hours.map((h) => h.failed), backgroundColor: colors.failed, borderRadius: 3, maxBarThickness: 14 },
      ],
    }),
    [hours, colors, format],
  );

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: chartAnimation(),
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: legendStyle(isDark), tooltip: tooltipStyle(isDark) },
      scales: {
        x: { ...categoryAxis(isDark), stacked: true, ticks: { ...categoryAxis(isDark).ticks, maxTicksLimit: 12 } },
        y: { ...valueAxis(isDark), stacked: true, ticks: { ...valueAxis(isDark).ticks, precision: 0, maxTicksLimit: 5 } },
      },
    }),
    [isDark],
  );

  const total = hours.reduce((sum, h) => sum + h.successful + h.failed, 0);

  return (
    <div className="h-56" role="img" aria-label={`Inicios de sesión por hora: ${total} en total`}>
      <Bar data={data} options={options} />
    </div>
  );
}

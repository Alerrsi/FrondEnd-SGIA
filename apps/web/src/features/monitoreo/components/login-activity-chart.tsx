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

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

// Paleta categórica validada (skill dataviz, slots 1 y 2), la misma del gráfico mensual de presupuestos.
const SERIES = {
  light: { successful: '#2a78d6', failed: '#eb6834', grid: '#e4e4e7', text: '#71717a' },
  dark: { successful: '#3987e5', failed: '#d95926', grid: '#27272a', text: '#a1a1aa' },
} as const;

const hourLabel = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' });
const dayHourLabel = new Intl.DateTimeFormat('es-CL', { weekday: 'short', hour: '2-digit' });

/** Inicios de sesión correctos y rechazados por hora. */
export function LoginActivityChart({ hours }: { hours: LoginActivityHour[] }) {
  const { resolvedTheme } = useTheme();
  const colors = SERIES[resolvedTheme === 'dark' ? 'dark' : 'light'];
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
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: colors.text, boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11 } },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: colors.text, font: { size: 11 }, maxTicksLimit: 12 } },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: colors.grid },
          border: { display: false },
          ticks: { color: colors.text, font: { size: 11 }, precision: 0, maxTicksLimit: 5 },
        },
      },
    }),
    [colors],
  );

  const total = hours.reduce((sum, h) => sum + h.successful + h.failed, 0);

  return (
    <div className="h-56" role="img" aria-label={`Inicios de sesión por hora: ${total} en total`}>
      <Bar data={data} options={options} />
    </div>
  );
}

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, PolarArea } from 'react-chartjs-2';
import { Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCustomMetric } from '../hooks/use-metrics';
import type { MetricQueryInput } from '../types/metrics';
import { useTheme } from '@/contexts/theme-context';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface DynamicChartCardProps {
  input: MetricQueryInput;
  onDelete?: () => void;
}

export function DynamicChartCard({ input, onDelete }: DynamicChartCardProps) {
  const { data, isLoading } = useCustomMetric(input);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const chartData = useMemo(() => {
    if (!data?.points) {
      return { labels: [], datasets: [] };
    }

    const labels = data.points.map((p) => p.label);
    const values = data.points.map((p) => p.value);

    // Paleta zed.dev dual-theme
    const colors = [
      '#ef4444', // Red INACAP
      '#06b6d4', // Cyan
      '#8b5cf6', // Violet
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#3b82f6', // Blue
      '#ec4899', // Pink
    ];

    if (input.chartType === 'LINE') {
      return {
        labels,
        datasets: [
          {
            label: input.title || input.entity,
            data: values,
            borderColor: '#ef4444',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: isDark ? '#18181b' : '#ffffff',
            pointRadius: 4,
          },
        ],
      };
    }

    if (input.chartType === 'DOUGHNUT' || input.chartType === 'POLAR_AREA') {
      return {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors.slice(0, values.length),
            borderColor: isDark ? '#18181b' : '#ffffff',
            borderWidth: 2,
          },
        ],
      };
    }

    // Default: BAR
    return {
      labels,
      datasets: [
        {
          label: input.title || input.entity,
          data: values,
          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.85)',
          borderRadius: 4,
          hoverBackgroundColor: '#dc2626',
        },
      ],
    };
  }, [data, input, isDark]);

  const options = useMemo(() => {
    const textColor = isDark ? '#a1a1aa' : '#71717a';
    const gridColor = isDark ? 'rgba(63, 63, 70, 0.25)' : 'rgba(228, 228, 231, 0.7)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: input.chartType === 'DOUGHNUT' || input.chartType === 'POLAR_AREA',
          position: 'bottom' as const,
          labels: {
            color: textColor,
            font: { family: 'monospace', size: 10 },
            boxWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#18181b',
          bodyColor: isDark ? '#d4d4d8' : '#27272a',
          borderColor: isDark ? '#3f3f46' : '#e4e4e7',
          borderWidth: 1,
          padding: 8,
          bodyFont: { family: 'monospace', size: 11 },
          titleFont: { family: 'monospace', size: 11, weight: 'bold' as const },
        },
      },
      scales:
        input.chartType === 'DOUGHNUT' || input.chartType === 'POLAR_AREA'
          ? {}
          : {
              x: {
                grid: { display: false },
                ticks: { color: textColor, font: { family: 'monospace', size: 10 } },
              },
              y: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: 'monospace', size: 10 } },
              },
            },
    };
  }, [isDark, input.chartType]);

  return (
    <Card className="flex flex-col p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {input.title || `${input.entity} (${input.metric})`}
          </span>
          <span className="font-mono text-[10px] text-zinc-400">
            {input.timeRange} · {input.chartType}
          </span>
        </div>

        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-6 w-6 text-zinc-400 hover:text-rose-600"
            title="Eliminar gráfico"
            aria-label="Eliminar gráfico"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="relative h-60 w-full">
        {isLoading ? (
          <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-400">
            Cargando datos analíticos…
          </div>
        ) : input.chartType === 'LINE' ? (
          <Line data={chartData} options={options} />
        ) : input.chartType === 'DOUGHNUT' ? (
          <Doughnut data={chartData} options={options} />
        ) : input.chartType === 'POLAR_AREA' ? (
          <PolarArea data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </Card>
  );
}

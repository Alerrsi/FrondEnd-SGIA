import { useMemo } from 'react';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  PolarAreaController,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line, PolarArea } from 'react-chartjs-2';
import { buildChartData, buildChartOptions } from '../lib/chart-format';
import type { ChartType, MetricResult } from '../types/metrics';

ChartJS.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  PolarAreaController,
  RadialLinearScale,
  Tooltip,
);

interface MetricChartProps {
  result: MetricResult;
  chartType: ChartType;
  title: string;
  isDark: boolean;
}

export function MetricChart({ result, chartType, title, isDark }: MetricChartProps) {
  const data = useMemo(
    () => buildChartData(result, chartType, title, isDark),
    [result, chartType, title, isDark],
  );
  const options = useMemo(
    () => buildChartOptions(result, chartType, isDark),
    [result, chartType, isDark],
  );

  switch (chartType) {
    case 'LINE':
      return <Line data={data as ChartData<'line'>} options={options as ChartOptions<'line'>} />;
    case 'DOUGHNUT':
      return <Doughnut data={data as ChartData<'doughnut'>} options={options as ChartOptions<'doughnut'>} />;
    case 'POLAR_AREA':
      return <PolarArea data={data as ChartData<'polarArea'>} options={options as ChartOptions<'polarArea'>} />;
    default:
      return <Bar data={data as ChartData<'bar'>} options={options as ChartOptions<'bar'>} />;
  }
}

import { useMemo } from 'react';
import { Chart } from '@tanstack/charts/react';

import { ChartLegend } from '@/components/ui/chart-legend';
import { buildChartRows, buildLegend } from '../lib/chart-format';
import { barDefinition, doughnutDefinition, lineDefinition, polarAreaDefinition } from '../lib/metric-chart-definition';
import { CHART_TYPE_LABELS, type ChartType, type MetricResult } from '../types/metrics';

interface MetricChartProps {
  result: MetricResult;
  chartType: ChartType;
  title: string;
  isDark: boolean;
}

/** Gráfico de una métrica (TanStack Charts, SVG): leyenda arriba y el gráfico ocupa el alto restante. */
export function MetricChart({ result, chartType, title, isDark }: MetricChartProps) {
  const isPercent = result.metric === 'RATE';
  const rows = useMemo(() => buildChartRows(result, chartType, title, isDark), [result, chartType, title, isDark]);
  const legend = useMemo(() => buildLegend(result, chartType, title, isDark), [result, chartType, title, isDark]);
  const ariaLabel = `${title}: gráfico de ${CHART_TYPE_LABELS[chartType].toLowerCase()} con ${result.points.length} ${
    result.points.length === 1 ? 'punto' : 'puntos'
  }`;

  const chart = useMemo(() => {
    const input = { rows, isPercent, isDark };
    const common = { ariaLabel, style: { height: '100%' } } as const;
    switch (chartType) {
      case 'LINE':
        return <Chart definition={lineDefinition(input)} {...common} />;
      case 'DOUGHNUT':
        return <Chart definition={doughnutDefinition(input)} {...common} />;
      case 'POLAR_AREA':
        return <Chart definition={polarAreaDefinition(input)} {...common} />;
      default:
        return <Chart definition={barDefinition(input)} {...common} />;
    }
  }, [rows, isPercent, isDark, chartType, ariaLabel]);

  return (
    <div className="flex h-full w-full flex-col gap-2" data-chart-type={chartType}>
      <ChartLegend items={legend} />
      <div className="min-h-0 flex-1">{chart}</div>
    </div>
  );
}

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { chartTokens } from '@/lib/chart-theme';
import { MetricChart } from './components/metric-chart';
import type { ChartType, MetricResult } from './types/metrics';

const RESULT: MetricResult = {
  entity: 'SUPPLIES',
  metric: 'COUNT',
  timeRange: 'LAST_30_DAYS',
  chartType: 'BAR',
  summary: null,
  points: [
    { label: 'Cable', value: 3, secondaryValue: 10, category: null },
    { label: 'Placa', value: 2, secondaryValue: 4, category: null },
    { label: 'Sensor', value: 5, secondaryValue: 1, category: null },
  ],
};

function renderChart(chartType: ChartType, result: MetricResult = RESULT) {
  return render(
    <div style={{ height: 300, width: 600 }}>
      <MetricChart result={{ ...result, chartType }} chartType={chartType} title="Insumos" isDark={false} />
    </div>,
  );
}

describe('MetricChart (TanStack Charts)', () => {
  it('barras: una por punto y medida, agrupadas, con el acento y el neutro', () => {
    const { container } = renderChart('BAR');
    const svg = screen.getByRole('img', { name: 'Insumos: gráfico de barras con 3 puntos' });
    const bars = [...svg.querySelectorAll('.ts-chart__bar rect')];
    expect(bars).toHaveLength(6);
    const fills = bars.map((b) => b.getAttribute('fill'));
    const t = chartTokens(false);
    expect(fills.filter((f) => f === t.primary)).toHaveLength(3);
    expect(fills.filter((f) => f === t.secondary)).toHaveLength(3);
    // Leyenda HTML con las dos medidas.
    expect(container.querySelector('ul[aria-label="Leyenda"]')?.textContent).toContain('Stock restante');
  });

  it('línea: trazo en el acento, segunda medida punteada y marcadores', () => {
    renderChart('LINE');
    const svg = screen.getByRole('img', { name: /gráfico de línea/ });
    const t = chartTokens(false);
    const strokes = [...svg.querySelectorAll('path')].map((p) => p.getAttribute('stroke'));
    expect(strokes).toContain(t.primary);
    expect(svg.querySelector('path[stroke-dasharray="4 4"]')).not.toBeNull();
    expect(svg.querySelectorAll('circle').length).toBeGreaterThanOrEqual(3);
  });

  it('dona y área polar: un sector por porción con colores de categoría distintos', () => {
    for (const type of ['DOUGHNUT', 'POLAR_AREA'] as const) {
      const { unmount } = renderChart(type);
      const svg = screen.getByRole('img', { name: /Insumos: gráfico de/ });
      const fills = [...svg.querySelectorAll('.ts-chart__marks path')].map((p) => p.getAttribute('fill'));
      expect(new Set(fills).size).toBe(3);
      unmount();
    }
  });
});

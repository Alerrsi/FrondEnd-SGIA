import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiRequestError, buildMetricInput, fetchCustomMetric, fetchExecutiveKpis } from '@sgia/api-client';
import { DynamicChartCard } from './components/dynamic-chart-card';
import { ChartConfigModal } from './components/chart-config-modal';
import { sanitizeChart } from './lib/chart-config';
import { buildChartData, formatValue, truncateLabel } from './lib/chart-format';
import { mockMetricsApi, type MetricsRequest } from './metrics-api-mock';
import type { MetricQueryInput, MetricResult } from './types/metrics';

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar" />,
  Line: () => <div data-testid="chart-line" />,
  Doughnut: () => <div data-testid="chart-doughnut" />,
  PolarArea: () => <div data-testid="chart-polar" />,
}));

vi.mock('@/contexts/theme-context', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light' }),
}));

const LOANS_INPUT: MetricQueryInput = {
  title: 'Préstamos',
  entity: 'LOANS',
  metric: 'COUNT',
  timeRange: 'LAST_30_DAYS',
  chartType: 'BAR',
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('REQ-14: cliente GraphQL de /api/metrics', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('envía solo los campos del contrato: sin title ni fechas fuera de CUSTOM', () => {
    const body = buildMetricInput({
      ...LOANS_INPUT,
      groupBy: '',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-30',
    });
    expect(body).toEqual({
      entity: 'LOANS',
      metric: 'COUNT',
      timeRange: 'LAST_30_DAYS',
      chartType: 'BAR',
    });

    const custom = buildMetricInput({
      ...LOANS_INPUT,
      timeRange: 'CUSTOM',
      dateFrom: '2026-10-01',
      groupBy: 'status',
      limit: 8,
    });
    expect(custom).toMatchObject({ dateFrom: '2026-10-01', groupBy: 'status', limit: 8 });
    expect(custom).not.toHaveProperty('dateTo');
  });

  it('lanza el mensaje de errors[0] en vez de devolver datos de respaldo', async () => {
    mockMetricsApi({ graphqlError: 'groupBy "x" no es válido para LOANS.' });
    await expect(fetchCustomMetric(LOANS_INPUT)).rejects.toThrow('groupBy "x" no es válido para LOANS.');
    await expect(fetchExecutiveKpis('LAST_7_DAYS')).rejects.toThrow('groupBy "x" no es válido');
  });

  it('propaga el 403 como ApiRequestError', async () => {
    mockMetricsApi({ status: 403 });
    await expect(fetchCustomMetric(LOANS_INPUT)).rejects.toBeInstanceOf(ApiRequestError);
  });

  it('pide executiveKpis con el timeRange indicado', async () => {
    const fetchMock = mockMetricsApi();
    const kpis = await fetchExecutiveKpis('SEMESTER_CURRENT');
    expect(kpis.activosDisponibles).toBe(842);
    const sent = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as MetricsRequest;
    expect(sent.variables?.timeRange).toBe('SEMESTER_CURRENT');
  });
});

describe('REQ-14: estados de la tarjeta de gráfico', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('dibuja el gráfico con los puntos de la API y el summary como pie', async () => {
    mockMetricsApi();
    renderWithClient(<DynamicChartCard input={LOANS_INPUT} />);
    expect(await screen.findByTestId('chart-bar')).toBeDefined();
    expect(screen.getByText(/Resumen de prueba/)).toBeDefined();
  });

  it('muestra "Sin datos para el período" cuando points viene vacío', async () => {
    mockMetricsApi({ points: [] });
    renderWithClient(<DynamicChartCard input={LOANS_INPUT} />);
    expect(await screen.findByText('Sin datos para el período')).toBeDefined();
    expect(screen.queryByTestId('chart-bar')).toBeNull();
  });

  it('muestra el mensaje del error GraphQL, sin cifras inventadas', async () => {
    mockMetricsApi({ graphqlError: 'CUSTOM requiere dateFrom' });
    renderWithClient(<DynamicChartCard input={LOANS_INPUT} />);
    expect(await screen.findByText('CUSTOM requiere dateFrom')).toBeDefined();
    expect(screen.queryByTestId('chart-bar')).toBeNull();
  });

  it('en 403 avisa de permisos', async () => {
    mockMetricsApi({ status: 403 });
    renderWithClient(<DynamicChartCard input={LOANS_INPUT} />);
    expect(await screen.findByText(/no tiene permisos/i)).toBeDefined();
  });

  it('pinta una leyenda cuando los puntos traen category', async () => {
    mockMetricsApi({
      points: [
        { label: 'Cable', value: 3, secondaryValue: 10, category: 'Redes' },
        { label: 'Placa', value: 2, secondaryValue: 4, category: 'Electrónica' },
      ],
    });
    renderWithClient(<DynamicChartCard input={{ ...LOANS_INPUT, entity: 'SUPPLIES' }} />);
    expect(await screen.findByText('Redes')).toBeDefined();
    expect(screen.getByText('Electrónica')).toBeDefined();
  });
});

describe('REQ-14: menú de configuración de gráficos', () => {
  function renderModal(onConfirm = vi.fn(), currentCharts: MetricQueryInput[] = []) {
    renderWithClient(
      <ChartConfigModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        chartType="BAR"
        currentCharts={currentCharts}
      />,
    );
    return onConfirm;
  }

  it('no ofrece TOTAL ni AVERAGE en ALERTS y MAINTENANCE', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.selectOptions(screen.getByLabelText(/¿Qué quieres medir\?/i), 'ALERTS');
    const metric = screen.getByLabelText('Cálculo');
    expect(Array.from((metric as HTMLSelectElement).options).map((o) => o.value)).toEqual(['COUNT', 'RATE']);
  });

  it('no ofrece "level" en CAREERS', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.selectOptions(screen.getByLabelText(/¿Qué quieres medir\?/i), 'CAREERS');
    const groupBy = screen.getByLabelText('Agrupar por') as HTMLSelectElement;
    expect(Array.from(groupBy.options).map((o) => o.value)).toEqual(['', 'specialty']);
  });

  it('bloquea "Añadir" con CUSTOM sin dateFrom y lo habilita al elegir fecha', async () => {
    const user = userEvent.setup();
    const onConfirm = renderModal();
    await user.selectOptions(screen.getByLabelText('Período'), 'CUSTOM');

    const add = screen.getByRole('button', { name: /Añadir al panel/i });
    expect((add as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('alert').textContent).toContain('fecha de inicio');

    await user.type(screen.getByLabelText(/Desde/), '2026-10-01');
    expect((add as HTMLButtonElement).disabled).toBe(false);
    await user.click(add);

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ timeRange: 'CUSTOM', dateFrom: '2026-10-01' }),
      undefined,
    );
  });

  it('rechaza un gráfico idéntico a uno existente', async () => {
    const user = userEvent.setup();
    const existing: MetricQueryInput = {
      entity: 'LOANS',
      metric: 'COUNT',
      timeRange: 'LAST_30_DAYS',
      chartType: 'BAR',
    };
    const onConfirm = renderModal(vi.fn(), [existing]);
    await user.click(screen.getByRole('button', { name: /Añadir al panel/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('REQ-14: utilidades de gráficos', () => {
  const result: MetricResult = {
    entity: 'SUPPLIES',
    metric: 'COUNT',
    timeRange: 'LAST_30_DAYS',
    chartType: 'BAR',
    summary: null,
    points: [
      { label: 'Cable', value: 3, secondaryValue: 10, category: null },
      { label: 'Placa', value: 2, secondaryValue: null, category: null },
    ],
  };

  it('agrega un segundo dataset cuando hay secondaryValue', () => {
    const data = buildChartData(result, 'BAR', 'Insumos', false);
    expect(data.datasets).toHaveLength(2);
    expect(data.datasets[1]?.label).toBe('Stock restante');
  });

  it('cicla colores en dona con más categorías que colores', () => {
    const many: MetricResult = {
      ...result,
      chartType: 'DOUGHNUT',
      points: Array.from({ length: 12 }, (_, i) => ({ label: `Cat ${i}`, value: i + 1 })),
    };
    const colors = buildChartData(many, 'DOUGHNUT', 't', false).datasets[0]?.backgroundColor as string[];
    expect(colors).toHaveLength(12);
    expect(colors.every(Boolean)).toBe(true);
  });

  it('formatea porcentajes y trunca etiquetas largas', () => {
    expect(formatValue(33.333, true)).toBe('33,3%');
    expect(formatValue(12, false)).toBe('12');
    expect(truncateLabel('Electrónica y Microcontroladores')).toHaveLength(16);
  });

  it('sanitiza gráficos guardados con groupBy o métricas que ya no existen', () => {
    const cleaned = sanitizeChart({
      entity: 'CAREERS',
      metric: 'COUNT',
      timeRange: 'LAST_30_DAYS',
      chartType: 'BAR',
      groupBy: 'level',
    });
    expect(cleaned.groupBy).toBeUndefined();

    const alerts = sanitizeChart({
      entity: 'ALERTS',
      metric: 'TOTAL',
      timeRange: 'CUSTOM',
      chartType: 'LINE',
    });
    expect(alerts.metric).toBe('COUNT');
    expect(alerts.timeRange).toBe('LAST_30_DAYS');
  });
});

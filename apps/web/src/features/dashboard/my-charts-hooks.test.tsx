import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  normalizeMetricInput,
  useChartTemplates,
  useCreateMyChart,
  useMyCharts,
  useUpdateMyChartPositions,
} from '@sgia/api-client';

import { buildPositionUpdates, moveItem } from './lib/panel-positions';
import { GROUP_BY_OPTIONS_BY_ENTITY } from './types/metrics';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

const rawChart = (id: number, position: number) => ({
  id,
  chart_template_id: 1,
  custom_title: `Gráfico ${id}`,
  type: 'BAR',
  position,
  entity: 'LOANS',
  metric: 'COUNT',
  group_by: null,
  period: 'LAST_30_DAYS',
  date_from: null,
  date_to: null,
  is_active: 1,
  template: { id: 1, code: 'bar', name: 'Barras', visualization_type: 'bar' },
  metric_input: { entity: 'LOANS', metric: 'COUNT', timeRange: 'LAST_30_DAYS', chartType: 'BAR' },
});

describe('Dashboard personalizado (REQ-15): cliente API', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('useChartTemplates normaliza enums y deja nulas las genéricas', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: [
          { id: 1, code: 'bar', name: 'Barras', visualization_type: 'bar', chart_type: null, entity: null },
          { id: 10, code: 'x', name: 'Préstamos', visualization_type: 'PIE', chart_type: 'doughnut', entity: 'loans', metric: 'count', group_by: 'status', period: 'last_30_days' },
        ],
      }),
    );
    const { result } = renderHook(() => useChartTemplates(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [generic, seeded] = result.current.data ?? [];
    expect(generic?.entity).toBeNull();
    expect(seeded).toMatchObject({
      visualization_type: 'pie',
      chart_type: 'DOUGHNUT',
      entity: 'LOANS',
      metric: 'COUNT',
      period: 'LAST_30_DAYS',
      group_by: 'status',
    });
  });

  it('useMyCharts ordena por posición, pide solo los activos y arma metric_input con el título', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: [rawChart(2, 2), rawChart(1, 1)] }));
    const { result } = renderHook(() => useMyCharts({ active: true }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(String(spy.mock.calls[0]?.[0])).toContain('/me/charts?active=1');
    expect(result.current.data?.map((c) => c.id)).toEqual([1, 2]);
    expect(result.current.data?.[0]?.is_active).toBe(true);
    expect(result.current.data?.[0]?.metric_input).toMatchObject({
      entity: 'LOANS',
      timeRange: 'LAST_30_DAYS',
      title: 'Gráfico 1',
    });
  });

  it('normalizeMetricInput devuelve null si falta un campo obligatorio', () => {
    expect(normalizeMetricInput({ entity: 'LOANS', metric: 'COUNT' })).toBeNull();
    expect(
      normalizeMetricInput({ entity: 'LOANS', metric: 'COUNT', time_range: 'CUSTOM', chart_type: 'LINE', date_from: '2026-10-01' }),
    ).toMatchObject({ timeRange: 'CUSTOM', chartType: 'LINE', dateFrom: '2026-10-01' });
  });

  it('useCreateMyChart envía la plantilla y los campos elegidos', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ data: rawChart(7, 3) }, 201));
    const { result } = renderHook(() => useCreateMyChart(), { wrapper });
    await result.current.mutateAsync({ chart_template_id: 1, entity: 'LOANS', type: 'BAR', period: 'LAST_30_DAYS' });
    expect(spy.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toMatchObject({ chart_template_id: 1, entity: 'LOANS' });
  });

  it('useUpdateMyChartPositions reordena de forma optimista y revierte si el backend responde 422', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ data: [rawChart(1, 1), rawChart(2, 2)] }));
    const charts = renderHook(() => useMyCharts(), { wrapper });
    await waitFor(() => expect(charts.result.current.isSuccess).toBe(true));

    const gate = { release: () => {} };
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          gate.release = () =>
            resolve(jsonResponse({ message: 'Posiciones duplicadas.', errors: { positions: ['x'] } }, 422));
        }),
    );
    // La invalidación posterior vuelve a pedir el listado original.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: [rawChart(1, 1), rawChart(2, 2)] }));

    const mutation = renderHook(() => useUpdateMyChartPositions(), { wrapper });
    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = mutation.result.current
        .mutateAsync({ positions: [{ id: 1, position: 2 }, { id: 2, position: 1 }] })
        .catch(() => undefined);
    });
    await waitFor(() => expect(charts.result.current.data?.map((c) => c.id)).toEqual([2, 1]));

    gate.release();
    await act(async () => {
      await pending;
    });
    await waitFor(() => expect(charts.result.current.data?.map((c) => c.id)).toEqual([1, 2]));
  });
});

describe('Posiciones del panel', () => {
  const chart = (id: number, position: number) => ({ id, position });

  it('moveItem desplaza un elemento a otra posición', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('buildPositionUpdates reutiliza las posiciones y envía solo las que cambian', () => {
    const prev = [chart(1, 1), chart(2, 2), chart(3, 3)];
    const next = [chart(3, 3), chart(1, 1), chart(2, 2)];
    expect(buildPositionUpdates(prev, next)).toEqual([
      { id: 3, position: 1 },
      { id: 1, position: 2 },
      { id: 2, position: 3 },
    ]);
    expect(buildPositionUpdates(prev, prev)).toEqual([]);
  });

  it('respeta las posiciones de los gráficos ocultos (no se tocan)', () => {
    // El gráfico oculto ocupa la posición 2; los visibles usan 1 y 3.
    const prev = [chart(1, 1), chart(3, 3)];
    expect(buildPositionUpdates(prev, [chart(3, 3), chart(1, 1)])).toEqual([
      { id: 3, position: 1 },
      { id: 1, position: 3 },
    ]);
  });

  it('un gráfico nuevo insertado al inicio desplaza al resto', () => {
    const prev = [chart(1, 1), chart(2, 2)];
    const created = chart(9, 3);
    expect(buildPositionUpdates(prev, [created, ...prev])).toEqual([
      { id: 9, position: 1 },
      { id: 1, position: 2 },
      { id: 2, position: 3 },
    ]);
  });
});

describe('Métricas de mantención', () => {
  it('MAINTENANCE admite agrupar por tipo de mantención', () => {
    expect(GROUP_BY_OPTIONS_BY_ENTITY.MAINTENANCE.map((o) => o.value)).toContain('maintenance_type');
  });
});

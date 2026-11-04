import { vi } from 'vitest';

interface MetricsApiMockOptions {
  /** Puntos que devuelve `customMetric`; `[]` simula un período sin datos. */
  points?: Array<{ label: string; value: number; secondaryValue?: number | null; category?: string | null }>;
  /** Mensaje de error GraphQL (HTTP 200 con `errors`). */
  graphqlError?: string;
  /** Código HTTP distinto de 200 para toda la respuesta (p. ej. 403). */
  status?: number;
  /** Gráficos iniciales del panel personal (`/api/me/charts`); por defecto, tres. */
  charts?: FakeChart[];
}

const KPIS = {
  activosDisponibles: 842,
  activosEnPrestamo: 128,
  activosEnTaller: 23,
  activosDeBaja: 14,
  prestamosActivosHoy: 46,
  tasaAtrasosPct: 4.8,
  alertasCriticasNoResueltas: 7,
  tasaRotacionMensualPct: 28.5,
};

const DEFAULT_POINTS = [
  { label: 'Semana 1', value: 12, secondaryValue: null, category: null },
  { label: 'Semana 2', value: 18, secondaryValue: null, category: null },
];

interface FakeChart {
  id: number;
  chart_template_id: number;
  custom_title: string | null;
  type: string;
  position: number;
  entity: string;
  metric: string;
  group_by: string | null;
  period: string;
  date_from: string | null;
  date_to: string | null;
  is_active: boolean;
  template: Record<string, unknown>;
  metric_input: Record<string, unknown>;
}

const TEMPLATES = [
  { id: 1, code: 'bar', name: 'Barras', visualization_type: 'bar', chart_type: null, entity: null, metric: null, group_by: null, period: null },
  { id: 2, code: 'line', name: 'Línea', visualization_type: 'line', chart_type: null, entity: null, metric: null, group_by: null, period: null },
  { id: 3, code: 'pie', name: 'Torta', visualization_type: 'pie', chart_type: null, entity: null, metric: null, group_by: null, period: null },
  { id: 4, code: 'kpi', name: 'Indicador', visualization_type: 'kpi', chart_type: null, entity: null, metric: null, group_by: null, period: null },
  { id: 10, code: 'loans-by-status', name: 'Préstamos por estado', visualization_type: 'pie', chart_type: 'DOUGHNUT', entity: 'LOANS', metric: 'COUNT', group_by: 'status', period: 'LAST_30_DAYS' },
];

function fakeChart(id: number, position: number, title: string, q: Record<string, string>): FakeChart {
  return {
    id,
    chart_template_id: 1,
    custom_title: title,
    type: q.chartType!,
    position,
    entity: q.entity!,
    metric: q.metric!,
    group_by: q.groupBy ?? null,
    period: q.timeRange!,
    date_from: null,
    date_to: null,
    is_active: true,
    template: TEMPLATES[0]!,
    metric_input: { ...q },
  };
}

/** Panel personal sembrado: los mismos tres gráficos que traía el panel antes de REQ-15. */
export function seedCharts(): FakeChart[] {
  return [
    fakeChart(1, 1, 'Préstamos Diarios por Semana', { entity: 'LOANS', metric: 'COUNT', timeRange: 'LAST_30_DAYS', chartType: 'LINE' }),
    fakeChart(2, 2, 'Estado y Atrasos de Préstamos', { entity: 'LOANS', metric: 'RATE', timeRange: 'LAST_30_DAYS', chartType: 'DOUGHNUT' }),
    fakeChart(3, 3, 'Alertas Críticas por Especialidad', { entity: 'ALERTS', metric: 'COUNT', timeRange: 'LAST_30_DAYS', chartType: 'BAR', groupBy: 'specialty_area' }),
  ];
}

export interface MetricsRequest {
  query: string;
  variables?: { timeRange?: string; input?: Record<string, unknown> };
}

/** Simula `POST /api/metrics` y devuelve el espía para inspeccionar las consultas enviadas. */
export function mockMetricsApi(options: MetricsApiMockOptions = {}) {
  let charts = options.charts ?? seedCharts();
  let nextId = 100;

  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const json = (payload: unknown, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    const path = String(url);
    const method = init?.method ?? 'GET';
    const sorted = () => [...charts].sort((a, b) => a.position - b.position);

    // --- Panel personal (REQ-15): servidor en memoria ---
    if (path.includes('/chart-templates')) return json({ data: TEMPLATES });
    if (path.includes('/me/charts/positions')) {
      const { positions } = JSON.parse(String(init?.body)) as { positions: Array<{ id: number; position: number }> };
      charts = charts.map((c) => ({ ...c, position: positions.find((p) => p.id === c.id)?.position ?? c.position }));
      return json({ data: sorted() });
    }
    const chartId = /\/me\/charts\/(\d+)/.exec(path)?.[1];
    if (path.includes('/me/charts')) {
      if (method === 'GET') return json({ data: sorted() });
      if (method === 'POST') {
        if (charts.length >= 5) return json({ message: 'Ya tienes 5 gráficos.', errors: { position: ['Ya tienes 5 gráficos.'] } }, 422);
        const payload = JSON.parse(String(init?.body)) as Record<string, string>;
        const used = new Set(charts.map((c) => c.position));
        const position = [1, 2, 3, 4, 5].find((n) => !used.has(n)) as number;
        const created = fakeChart(nextId++, position, payload.custom_title ?? 'Gráfico', {
          entity: payload.entity ?? 'LOANS',
          metric: payload.metric ?? 'COUNT',
          timeRange: payload.period ?? 'LAST_30_DAYS',
          chartType: payload.type ?? 'BAR',
          ...(payload.group_by ? { groupBy: payload.group_by } : {}),
        });
        created.chart_template_id = Number(payload.chart_template_id);
        charts = [...charts, created];
        return json({ data: created }, 201);
      }
      if (method === 'PATCH' && chartId) {
        const patch = JSON.parse(String(init?.body)) as Partial<FakeChart>;
        charts = charts.map((c) => (c.id === Number(chartId) ? { ...c, ...patch } : c));
        return json({ data: charts.find((c) => c.id === Number(chartId)) });
      }
      if (method === 'DELETE' && chartId) {
        charts = charts.filter((c) => c.id !== Number(chartId));
        return json(null, 204);
      }
    }

    const body = JSON.parse(String(init?.body ?? '{}')) as MetricsRequest;

    if (options.status && options.status !== 200) {
      return json({ message: 'Sin permisos' }, options.status);
    }
    if (options.graphqlError) {
      return json({ errors: [{ message: options.graphqlError }] });
    }
    if (body.query.includes('executiveKpis')) {
      return json({ data: { executiveKpis: KPIS } });
    }
    const input = body.variables?.input ?? {};
    return json({
      data: {
        customMetric: {
          entity: input.entity,
          metric: input.metric,
          timeRange: input.timeRange,
          chartType: input.chartType,
          summary: 'Resumen de prueba · 2026-10-01 a 2026-10-30',
          points: options.points ?? DEFAULT_POINTS,
        },
      },
    });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

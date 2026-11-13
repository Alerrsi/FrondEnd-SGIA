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
  /** Plantillas de dashboard con nombre iniciales (`/api/me/dashboard-templates`); por defecto, ninguna. */
  dashboardTemplates?: Array<{ id: number; name: string }>;
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

export interface FakeChart {
  id: number;
  chart_template_id: number;
  dashboard_template_id: number | null;
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
  { id: 11, code: 'top-teachers', name: 'Ranking de docentes', visualization_type: 'bar', chart_type: 'BAR', entity: 'TEACHERS', metric: 'COUNT', group_by: null, period: 'SEMESTER_CURRENT' },
];

export function fakeChart(id: number, position: number, title: string, q: Record<string, string>): FakeChart {
  return {
    id,
    chart_template_id: 1,
    dashboard_template_id: null,
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
  let dashTemplates = [...(options.dashboardTemplates ?? [])];
  let nextTemplateId = 500;
  const MAX = 9;
  const inScope = (c: FakeChart, templateId: number | null) => c.dashboard_template_id === templateId;

  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const json = (payload: unknown, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    const path = String(url);
    const method = init?.method ?? 'GET';
    const sorted = (templateId: number | null = null) =>
      charts.filter((c) => inScope(c, templateId)).sort((a, b) => a.position - b.position);
    const templateOut = (t: { id: number; name: string }) => ({
      id: t.id,
      name: t.name,
      description: null,
      charts_count: charts.filter((c) => c.dashboard_template_id === t.id).length,
      max_charts: MAX,
    });

    // --- Panel personal (REQ-15): servidor en memoria ---
    if (path.includes('/chart-templates')) return json({ data: TEMPLATES });
    // Plantillas de dashboard con nombre del usuario.
    const dashId = /\/me\/dashboard-templates\/(\d+)/.exec(path)?.[1];
    if (path.includes('/me/dashboard-templates')) {
      if (method === 'GET') return json({ data: dashTemplates.map(templateOut) });
      if (method === 'POST') {
        const { name } = JSON.parse(String(init?.body)) as { name: string };
        if (dashTemplates.some((t) => t.name === name)) {
          return json({ message: 'Ya tienes una plantilla con ese nombre.', errors: { name: ['Ya tienes una plantilla con ese nombre.'] } }, 422);
        }
        const created = { id: nextTemplateId++, name };
        dashTemplates = [...dashTemplates, created];
        return json({ data: templateOut(created) }, 201);
      }
      if (method === 'PATCH' && dashId) {
        const { name } = JSON.parse(String(init?.body)) as { name: string };
        dashTemplates = dashTemplates.map((t) => (t.id === Number(dashId) ? { ...t, name } : t));
        return json({ data: templateOut(dashTemplates.find((t) => t.id === Number(dashId))!) });
      }
      if (method === 'DELETE' && dashId) {
        dashTemplates = dashTemplates.filter((t) => t.id !== Number(dashId));
        charts = charts.filter((c) => c.dashboard_template_id !== Number(dashId));
        return json(null, 204);
      }
    }
    if (path.includes('/me/charts/positions')) {
      const { positions, dashboard_template_id: scope = null } = JSON.parse(String(init?.body)) as {
        positions: Array<{ id: number; position: number }>;
        dashboard_template_id?: number | null;
      };
      charts = charts.map((c) =>
        inScope(c, scope) ? { ...c, position: positions.find((p) => p.id === c.id)?.position ?? c.position } : c,
      );
      return json({ data: sorted(scope) });
    }
    const chartId = /\/me\/charts\/(\d+)/.exec(path)?.[1];
    if (path.includes('/me/charts')) {
      if (method === 'GET') {
        const scope = /dashboard_template_id=(\d+)/.exec(path)?.[1];
        return json({ data: sorted(scope ? Number(scope) : null) });
      }
      if (method === 'POST') {
        const payload = JSON.parse(String(init?.body)) as Record<string, string>;
        const scope = payload.dashboard_template_id ? Number(payload.dashboard_template_id) : null;
        if (charts.filter((c) => inScope(c, scope)).length >= MAX) {
          const message = `Esta plantilla ya tiene ${MAX} gráficos.`;
          return json({ message, errors: { position: [message] } }, 422);
        }
        // Como el backend: lo no enviado se hereda de la plantilla y no se admiten repetidos.
        const template = TEMPLATES.find((t) => t.id === Number(payload.chart_template_id)) ?? TEMPLATES[0]!;
        const groupBy = payload.group_by ?? template.group_by;
        const query = {
          entity: payload.entity ?? template.entity ?? 'LOANS',
          metric: payload.metric ?? template.metric ?? 'COUNT',
          timeRange: payload.period ?? template.period ?? 'LAST_30_DAYS',
          chartType: payload.type ?? template.chart_type ?? 'BAR',
          ...(groupBy ? { groupBy } : {}),
        };
        const same = (c: FakeChart) =>
          c.entity === query.entity &&
          c.metric === query.metric &&
          c.period === query.timeRange &&
          c.type === query.chartType &&
          (c.group_by ?? null) === (groupBy ?? null);
        if (charts.some((c) => inScope(c, scope) && same(c))) {
          const message = 'Ya tienes este gráfico en tu panel.';
          return json({ message, errors: { chart: [message] } }, 422);
        }
        const used = new Set(charts.filter((c) => inScope(c, scope)).map((c) => c.position));
        const position = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((n) => !used.has(n)) as number;
        const created = fakeChart(nextId++, position, payload.custom_title ?? template.name, query);
        created.template = template;
        created.chart_template_id = Number(payload.chart_template_id);
        created.dashboard_template_id = scope;
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

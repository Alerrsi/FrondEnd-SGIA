import { vi } from 'vitest';

interface MetricsApiMockOptions {
  /** Puntos que devuelve `customMetric`; `[]` simula un período sin datos. */
  points?: Array<{ label: string; value: number; secondaryValue?: number | null; category?: string | null }>;
  /** Mensaje de error GraphQL (HTTP 200 con `errors`). */
  graphqlError?: string;
  /** Código HTTP distinto de 200 para toda la respuesta (p. ej. 403). */
  status?: number;
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

export interface MetricsRequest {
  query: string;
  variables?: { timeRange?: string; input?: Record<string, unknown> };
}

/** Simula `POST /api/metrics` y devuelve el espía para inspeccionar las consultas enviadas. */
export function mockMetricsApi(options: MetricsApiMockOptions = {}) {
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as MetricsRequest;
    const json = (payload: unknown, status = 200) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });

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

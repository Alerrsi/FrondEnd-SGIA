import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLoanRequest, exportLoans, fetchLoans, fetchPendingLoans } from '@sgia/api-client';

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

const empty = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
};

function calledUrl(spy: ReturnType<typeof vi.spyOn>): string {
  return String(spy.mock.calls[0]?.[0]);
}

describe('Préstamos: filtros de pañol, laboratorio y fecha (cliente API)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('la cola envía storeroom_id solo cuando se indica', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(empty));
    await fetchPendingLoans({ storeroom_id: 2 });
    expect(calledUrl(spy)).toContain('/loans/pending?storeroom_id=2');

    spy.mockClear();
    await fetchPendingLoans();
    expect(calledUrl(spy)).toMatch(/\/loans\/pending$/);
  });

  it('el historial filtra por carrera, pañol, laboratorio y fecha de actividad', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(empty));
    await fetchLoans({
      career_id: 3,
      storeroom_id: 1,
      location_id: 12,
      loan_date: '2026-11-12',
    });
    const url = new URL(calledUrl(spy), 'http://x');
    expect(url.searchParams.get('career_id')).toBe('3');
    expect(url.searchParams.get('storeroom_id')).toBe('1');
    expect(url.searchParams.get('location_id')).toBe('12');
    expect(url.searchParams.get('loan_date')).toBe('2026-11-12');
  });

  it('traduce activo, devuelto, atrasado y los alias a los filtros del backend', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(empty));
    const params = async (estado: string) => {
      spy.mockClear();
      await fetchLoans({ estado } as never);
      return Object.fromEntries(new URL(calledUrl(spy), 'http://x').searchParams);
    };
    expect(await params('activo')).toEqual({ status: 'procesado', devuelto: '0' });
    expect(await params('devuelto')).toEqual({ devuelto: '1' });
    expect(await params('atrasado')).toEqual({ atrasado: '1' });
    expect(await params('preparado')).toEqual({ status: 'en_proceso' });
    expect(await params('rechazada')).toEqual({ status: 'rechazado' });
    expect(await params('pendiente')).toEqual({ status: 'pendiente' });
    expect(await params('todos')).toEqual({});
  });

  it('la exportación lleva los mismos filtros y lee el archivo como Blob (docs/exportaciones-y-campana.md)', async () => {
    const pdf = new Response(new Blob(['%PDF-1.7 prueba'], { type: 'application/pdf' }), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(pdf);
    const blob = await exportLoans({
      format: 'pdf',
      start_date: '2026-03-01',
      end_date: '2026-03-31',
      storeroom_id: 1,
      location_id: 12,
      loan_date: '2026-11-12',
    });
    expect(blob.type).toBe('application/pdf');
    expect(await blob.text()).toBe('%PDF-1.7 prueba');
    const url = new URL(calledUrl(spy), 'http://x');
    expect(url.pathname).toBe('/api/loans/export');
    expect(url.searchParams.get('format')).toBe('pdf');
    // El export filtra con `from`/`to` (antes se enviaba `from_date`/`to_date` y se ignoraba).
    expect(url.searchParams.get('from')).toBe('2026-03-01');
    expect(url.searchParams.get('to')).toBe('2026-03-31');
    expect(url.searchParams.has('from_date')).toBe(false);
    expect(url.searchParams.get('storeroom_id')).toBe('1');
    expect(url.searchParams.get('location_id')).toBe('12');
    expect(url.searchParams.get('loan_date')).toBe('2026-11-12');
  });

  it('un error del export llega como ApiRequestError con su estado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'El formato no es válido.' }), { status: 422 }),
    );
    await expect(exportLoans({ format: 'excel' })).rejects.toMatchObject({ status: 422 });
  });

  it('la solicitud envía due_date solo si se indica', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: { id: 1, items: [] } }, 201));
    const base = {
      items: [{ product_id: 45, quantity: 1 }],
      subject: 'Redes',
      career_id: 3,
      loan_date: '2026-11-12',
      start_time: '08:30',
      end_time: '10:00',
      storeroom_id: 1,
      location_id: 12,
    };
    await createLoanRequest({ ...base, due_date: '2026-11-13' });
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body)).due_date).toBe('2026-11-13');

    spy.mockClear();
    await createLoanRequest(base);
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).not.toHaveProperty('due_date');
  });
});

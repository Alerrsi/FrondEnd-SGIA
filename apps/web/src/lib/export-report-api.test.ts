import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiRequestError,
  exportReport,
  fallbackReportFilename,
  fetchMyReportDownloads,
  fetchReportPreview,
  reportDownloadRequest,
  filenameFromDisposition,
  hasReportFilters,
  loanExportFilters,
} from '@sgia/api-client';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function xlsxResponse(headers: Record<string, string> = {}) {
  return new Response(new Blob(['PK prueba'], { type: XLSX }), {
    status: 200,
    headers: { 'Content-Type': XLSX, ...headers },
  });
}

function calledUrl(spy: ReturnType<typeof vi.spyOn>): URL {
  return new URL(String(spy.mock.calls[0]?.[0]), 'http://x');
}

describe('exportReport (BackEnd-SGIA/docs/reportes-excel.md)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('omite los vacíos, manda booleanos como 1/0 y lee nombre y corte de las cabeceras', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      xlsxResponse({
        'Content-Disposition': 'attachment; filename="inventario-20261125-101500.xlsx"',
        'X-Report-Truncated': '1',
      }),
    );
    const report = await exportReport('/products/export', {
      search: 'osciloscopio',
      area: '',
      type: undefined,
      sala: null,
      critical_only: true,
      is_active: false,
      supplier_id: 4,
    });

    const url = calledUrl(spy);
    expect(url.pathname).toBe('/api/products/export');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      search: 'osciloscopio',
      critical_only: '1',
      is_active: '0',
      supplier_id: '4',
    });
    expect(report.filename).toBe('inventario-20261125-101500.xlsx');
    expect(report.truncated).toBe(true);
    expect(await report.blob.text()).toBe('PK prueba');
  });

  it('sin filtros pide la ruta limpia; sin cabeceras usa el nombre de respaldo y no marca corte', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(xlsxResponse());
    const report = await exportReport('/audit-logs/export', { action: '' }, { fallbackName: 'auditoria' });
    expect(String(spy.mock.calls[0]?.[0])).toMatch(/\/audit-logs\/export$/);
    expect(report.filename).toMatch(/^auditoria-\d{8}-\d{6}\.xlsx$/);
    expect(report.truncated).toBe(false);
  });

  it('agrega los filtros detrás de los parámetros fijos de la ruta', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(xlsxResponse());
    const report = await exportReport('/loans/export?format=excel', { career_id: 3 });
    const url = calledUrl(spy);
    expect(url.searchParams.get('format')).toBe('excel');
    expect(url.searchParams.get('career_id')).toBe('3');
    expect(report.filename).toMatch(/^loans-\d{8}-\d{6}\.xlsx$/);
  });

  it('un 422 llega como ApiRequestError con su estado', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify({ message: 'El año no es válido.' }), { status: 422 }),
    );
    const error = await exportReport('/budgets/export', { year: 'x' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 422 });
  });

  it('interpreta las variantes de Content-Disposition', () => {
    expect(filenameFromDisposition('attachment; filename=usuarios.xlsx')).toBe('usuarios.xlsx');
    expect(filenameFromDisposition("attachment; filename=\"a.xlsx\"; filename*=UTF-8''pr%C3%A9stamos.xlsx")).toBe(
      'préstamos.xlsx',
    );
    expect(filenameFromDisposition('attachment')).toBeNull();
    expect(filenameFromDisposition(null)).toBeNull();
    expect(fallbackReportFilename('equipos', new Date(2026, 10, 5, 9, 4, 3))).toBe('equipos-20261105-090403.xlsx');
  });

  it('hasReportFilters solo cuenta los parámetros con valor', () => {
    expect(hasReportFilters()).toBe(false);
    expect(hasReportFilters({ search: '', status: undefined, area: null })).toBe(false);
    expect(hasReportFilters({ is_active: false })).toBe(true);
  });

  it('loanExportFilters traduce el estado y las fechas como el historial', () => {
    expect(loanExportFilters({ status: 'activo', start_date: '2026-03-01', end_date: '2026-03-31', search: 'PRE' })).toEqual({
      status: 'procesado',
      devuelto: '0',
      from: '2026-03-01',
      to: '2026-03-31',
      search: 'PRE',
    });
    expect(loanExportFilters({ status: 'todos' })).toEqual({});
  });
});

describe('centro de reportes: vista previa y mis descargas (BackEnd-SGIA/docs/centro-reportes.md)', () => {
  beforeEach(() => vi.restoreAllMocks());

  function jsonResponse(body: unknown) {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  it('fetchReportPreview agrega preview=1 tras los parámetros fijos y los filtros, y completa campos ausentes', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        title: 'Historial de préstamos',
        filename: 'prestamos.xlsx',
        sheets: [{ name: 'Préstamos', headers: ['Código'], types: ['text'], rows: [['REM-1']], total_rows: 165 }],
        info: [['Alcance', 'Todo lo visible para el rol']],
      }),
    );
    const preview = await fetchReportPreview('/loans/export?format=excel', { from: '2026-01-01', to: '', career_id: 3 });

    const url = calledUrl(spy);
    expect(url.pathname).toBe('/api/loans/export');
    expect(url.search).toBe('?format=excel&from=2026-01-01&career_id=3&preview=1');
    expect((spy.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({ Accept: 'application/json' });
    expect(preview.truncated).toBe(false);
    expect(preview.sheets[0]).toMatchObject({ name: 'Préstamos', total_rows: 165, totals: null, truncated: false });
    expect(preview.info).toEqual([['Alcance', 'Todo lo visible para el rol']]);
  });

  it('fetchReportPreview sin filtros pide solo preview=1; un 422 llega como ApiRequestError', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ sheets: [] }));
    await fetchReportPreview('/products/export');
    expect(calledUrl(spy).search).toBe('?preview=1');

    spy.mockResolvedValue(new Response(JSON.stringify({ message: 'Falta from.' }), { status: 422 }));
    await expect(fetchReportPreview('/reports/period')).rejects.toMatchObject({ status: 422 });
  });

  it('fetchMyReportDownloads lee `{ data }` de /me/report-downloads', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: 1,
            report: 'loans',
            title: 'Historial de préstamos',
            filters: [],
            path: '/api/loans/export',
            query: { format: 'excel' },
            rows: 83,
            created_at: '2026-11-20T10:15:00-03:00',
          },
        ],
      }),
    );
    const downloads = await fetchMyReportDownloads();
    expect(calledUrl(spy).pathname).toBe('/api/me/report-downloads');
    // Laravel serializa un arreglo vacío como `[]`: se lleva a objeto.
    expect(downloads[0]).toMatchObject({ id: 1, filters: {}, rows: 83 });
  });

  it('reportDownloadRequest quita /api, preview y los parámetros que ya trae la ruta', () => {
    expect(
      reportDownloadRequest({
        path: '/api/loans/export?format=excel',
        query: { format: 'excel', preview: 1, from: '2026-01-01', career_id: 3 },
      }),
    ).toEqual({ path: '/loans/export?format=excel', params: { from: '2026-01-01', career_id: 3 } });
    expect(reportDownloadRequest({ path: 'api/products/export', query: {} })).toEqual({
      path: '/products/export',
      params: {},
    });
    expect(reportDownloadRequest({ path: '/suppliers/export', query: { search: 'tech' } })).toEqual({
      path: '/suppliers/export',
      params: { search: 'tech' },
    });
  });
});

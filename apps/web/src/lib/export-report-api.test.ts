import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiRequestError,
  exportReport,
  fallbackReportFilename,
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

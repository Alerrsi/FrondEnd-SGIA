import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { ExportExcelButton } from './export-excel-button';
import { downloadBlob } from '@/features/equipos/utils/download';
import { toast } from '@/lib/toast';

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));
vi.mock('@/features/equipos/utils/download', () => ({ downloadBlob: vi.fn() }));

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function xlsx(truncated = '0') {
  return new Response(new Blob(['PK'], { type: XLSX }), {
    status: 200,
    headers: {
      'Content-Type': XLSX,
      'Content-Disposition': 'attachment; filename="inventario-20261125-101500.xlsx"',
      'X-Report-Truncated': truncated,
    },
  });
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function calledUrl(spy: ReturnType<typeof vi.spyOn>): URL {
  return new URL(String(spy.mock.calls[0]?.[0]), 'http://x');
}

describe('ExportExcelButton (BackEnd-SGIA/docs/reportes-excel.md)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.warning).mockClear();
    vi.mocked(downloadBlob).mockClear();
  });

  it('envía los filtros activos, descarga con el nombre del backend y avisa «con filtros»', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(xlsx());
    render(
      <ExportExcelButton path="/products/export" params={{ search: 'cable', area: '', critical_only: true }} />,
      { wrapper },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Excel descargado (con filtros)'));
    const url = calledUrl(spy);
    expect(url.pathname).toBe('/api/products/export');
    expect(Object.fromEntries(url.searchParams)).toEqual({ search: 'cable', critical_only: '1' });
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'inventario-20261125-101500.xlsx');
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('sin filtros pide el reporte completo', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(xlsx());
    render(<ExportExcelButton path="/suppliers/export" params={{ search: '', is_active: undefined }} />, { wrapper });

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Excel descargado (completo)'));
    expect(String(spy.mock.calls[0]?.[0])).toMatch(/\/suppliers\/export$/);
  });

  it('muestra «Generando…» deshabilitado mientras descarga', async () => {
    let resolve: (r: Response) => void = () => undefined;
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    render(<ExportExcelButton path="/alerts/export" />, { wrapper });

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    const busy = await screen.findByRole('button', { name: 'Generando…' });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    resolve(xlsx());
    await waitFor(() => expect((screen.getByRole('button', { name: 'Exportar Excel' }) as HTMLButtonElement).disabled).toBe(false));
  });

  it('avisa cuando el backend cortó el reporte', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(xlsx('1'));
    render(<ExportExcelButton path="/audit-logs/export" />, { wrapper });

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith('El reporte se cortó en 10.000 filas: acota los filtros'),
    );
    expect(downloadBlob).toHaveBeenCalledOnce();
  });

  it('un error muestra el mensaje normalizado y no descarga', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Filtro inválido', errors: { year: ['El año debe ser un número.'] } }), {
        status: 422,
      }),
    );
    render(<ExportExcelButton path="/budgets/export" params={{ year: 'x' }} />, { wrapper });

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith({
        title: 'No se pudo exportar el Excel',
        description: 'El año debe ser un número.',
      }),
    );
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

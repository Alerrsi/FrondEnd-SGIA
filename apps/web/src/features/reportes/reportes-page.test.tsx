import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReportDownload, ReportPreview } from '@sgia/api-client';

import ReportesPage from './pages/reportes-page';
import { downloadBlob } from '@/features/equipos/utils/download';
import { toast } from '@/lib/toast';

let mockRole = 'DIR-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Usuaria', rol: mockRole } }),
}));
vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));
vi.mock('@/features/equipos/utils/download', () => ({ downloadBlob: vi.fn() }));

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const PREVIEW: ReportPreview = {
  title: 'Historial de préstamos',
  filename: 'prestamos-20261125-101500.xlsx',
  truncated: false,
  sheets: [
    {
      name: 'Préstamos',
      headers: ['Código', 'Fecha', 'Año', 'Monto', 'Unidades', 'Devuelto'],
      types: ['text', 'date', 'year', 'money', 'integer', 'text'],
      rows: [
        ['REM-2026-AB12CD', '2026-03-10', 2026, 1990000, 1234, 'sí'],
        ['PRE-2026-ZZ99', '2026-04-02', 2026, 15000, 2, 'no'],
      ],
      total_rows: 165,
      totals: [null, null, null, 2005000, 1236, 'Total'],
      truncated: false,
    },
    { name: 'Detalle', headers: ['Código', 'Ítem'], types: ['text', 'text'], rows: [['REM-2026-AB12CD', 'Multímetro']], total_rows: 1, totals: null, truncated: false },
  ],
  info: [
    ['Reporte', 'Historial de préstamos'],
    ['Alcance', 'Todo lo visible para el rol'],
  ],
};

const DOWNLOADS: ReportDownload[] = [
  {
    id: 9,
    report: 'loans',
    title: 'Historial de préstamos',
    filters: { Desde: '01-01-2026', Hasta: '30-06-2026' },
    path: '/api/loans/export',
    query: { format: 'excel', from: '2026-01-01', to: '2026-06-30', career_id: 3 },
    rows: 83,
    created_at: '2026-11-20T10:15:00-03:00',
  },
];

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

let fetchSpy: ReturnType<typeof vi.spyOn>;

function urls(): URL[] {
  return fetchSpy.mock.calls.map((call: unknown[]) => new URL(String(call[0]), 'http://x'));
}
const previewCalls = () => urls().filter((u) => u.searchParams.get('preview') === '1');
const downloadCalls = () =>
  urls().filter((u) => u.pathname.endsWith('/export') && u.searchParams.get('preview') !== '1');

function renderPage(entry = '/reportes?reporte=prestamos') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <ReportesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ReportesPage (BackEnd-SGIA/docs/centro-reportes.md)', () => {
  beforeEach(() => {
    mockRole = 'DIR-01';
    vi.mocked(downloadBlob).mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    // Solo `Date` es falso: 25-11-2026 (segundo semestre); los temporizadores siguen reales.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 25, 12, 0));
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input), 'http://x');
      if (url.pathname.endsWith('/me/report-downloads')) return json({ data: DOWNLOADS });
      if (url.searchParams.get('preview') === '1') return json(PREVIEW);
      if (url.pathname.endsWith('/export')) {
        return new Response(new Blob(['PK'], { type: XLSX }), {
          status: 200,
          headers: { 'Content-Type': XLSX, 'Content-Disposition': 'attachment; filename="prestamos-20261125-101500.xlsx"' },
        });
      }
      return json({ data: [] }); // carreras, pañoles
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('PAN-01 no ve compras ni administración en el catálogo; AD-01 ve administración y ubicaciones', async () => {
    mockRole = 'PAN-01';
    const { unmount } = renderPage('/reportes');
    const nav = screen.getByRole('navigation', { name: 'Catálogo de reportes' });
    expect(within(nav).queryByRole('heading', { name: 'Compras' })).toBeNull();
    expect(within(nav).queryByRole('button', { name: /Órdenes de compra/ })).toBeNull();
    expect(within(nav).getByRole('button', { name: /Estudiantes/ })).toBeDefined();
    expect(within(nav).getByRole('button', { name: /Informe del período/ })).toBeDefined();
    unmount();

    mockRole = 'AD-01';
    renderPage('/reportes');
    const adNav = screen.getByRole('navigation', { name: 'Catálogo de reportes' });
    expect(within(adNav).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Ubicacionesfoto',
      'Auditoríaperíodo',
      'Usuariosfoto',
      'Monitoreo de accesosperíodo',
    ]);
  });

  it('la vista previa pide preview=1 con el semestre en curso y muestra pestañas, formato de Excel y totales', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('REM-2026-AB12CD')).toBeDefined();
    const [first] = previewCalls();
    expect(first?.pathname).toBe('/api/loans/export');
    expect(Object.fromEntries(first!.searchParams)).toEqual({
      format: 'excel',
      from: '2026-07-01',
      to: '2026-12-31',
      preview: '1',
    });

    // Pestañas por hoja, más «Info».
    const tabs = screen.getByRole('tablist', { name: 'Hojas del reporte' });
    expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Préstamos', 'Detalle', 'Info']);

    // Formato: fecha, año sin separador, monto CLP, entero con miles.
    expect(screen.getByText('10-03-2026')).toBeDefined();
    expect(screen.getAllByText('2026').length).toBeGreaterThan(0);
    expect(screen.getByText('$ 1.990.000')).toBeDefined();
    expect(screen.getByText('1.234')).toBeDefined();
    const totals = screen.getByTestId('report-totals');
    expect(within(totals).getByText('$ 2.005.000')).toBeDefined();
    expect(screen.getByText('Mostrando 2 de 165 filas')).toBeDefined();
    expect(screen.getByText('Todo lo visible para el rol')).toBeDefined();

    await user.click(within(tabs).getByRole('tab', { name: 'Info' }));
    expect(within(screen.getByRole('tabpanel')).getByText('Alcance')).toBeDefined();
  });

  it('al cambiar un filtro vuelve a pedir la vista (tras 400 ms) y «Descargar Excel» envía los mismos parámetros', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('REM-2026-AB12CD');

    await user.selectOptions(screen.getByLabelText('Estado'), 'atrasado');
    await waitFor(() => expect(previewCalls()).toHaveLength(2));
    const last = previewCalls()[1]!;
    expect(last.searchParams.get('atrasado')).toBe('1');

    const button = screen.getByRole('button', { name: 'Descargar Excel' });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    await user.click(button);

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'prestamos-20261125-101500.xlsx'));
    const download = downloadCalls().at(-1)!;
    const withoutPreview = new URLSearchParams(last.search);
    withoutPreview.delete('preview');
    expect(download.pathname).toBe(last.pathname);
    expect(download.search.slice(1)).toBe(withoutPreview.toString());
    expect(toast.success).toHaveBeenCalledWith('Excel descargado (con filtros)');
  });

  it('el informe del período sin fechas no pide la vista previa ni deja descargar', async () => {
    const user = userEvent.setup();
    renderPage('/reportes?reporte=informe-periodo');
    await waitFor(() => expect(previewCalls().at(-1)?.pathname).toBe('/api/reports/period'));

    await user.click(screen.getByRole('button', { name: 'Rango' }));
    await user.clear(screen.getByLabelText('Desde'));
    expect(await screen.findByText('Falta el período')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Descargar Excel' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('«Mis descargas» lista las últimas con filtros legibles y «Repetir» pide la misma ruta y parámetros', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Mis descargas' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Desde: 01-01-2026 · Hasta: 30-06-2026')).toBeDefined();
    expect(within(dialog).getByText(/20-11-2026 10:15 · 83 filas/)).toBeDefined();

    await user.click(within(dialog).getByRole('button', { name: 'Repetir Historial de préstamos' }));

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledOnce());
    const repeated = downloadCalls().at(-1)!;
    expect(repeated.pathname).toBe('/api/loans/export');
    expect(Object.fromEntries(repeated.searchParams)).toEqual({
      format: 'excel',
      from: '2026-01-01',
      to: '2026-06-30',
      career_id: '3',
    });
    // La descarga invalida «mis descargas»: se vuelve a pedir la lista.
    await waitFor(() =>
      expect(urls().filter((u) => u.pathname.endsWith('/me/report-downloads')).length).toBeGreaterThan(1),
    );
  });
});

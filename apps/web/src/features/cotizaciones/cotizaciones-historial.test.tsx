import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import CotizacionesPage from './pages/cotizaciones-page';

const rawQuotation = {
  id: 4,
  status: 'aceptada',
  items: [{ product_id: 1, name: 'Cable UTP', quantity: 3 }],
  suppliers: [{ supplier_id: 2, supplier: { name: 'Proveedor A', email: 'a@test.cl' }, status: 'aceptada' }],
  created_at: '2026-10-01T10:00:00Z',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CotizacionesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Historial de cotizaciones (Fase 7, solo lectura)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('solo consulta el listado y avisa que las compras nuevas van por solicitudes', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [rawQuotation] }),
    } as Response);

    renderPage();

    expect(await screen.findByText('Historial de cotizaciones')).toBeDefined();
    const link = screen.getByRole('link', { name: /Ir a solicitudes de compra/ });
    expect(link.getAttribute('href')).toBe('/solicitudes-compra');
    expect(screen.queryByRole('button', { name: /Nueva cotización/ })).toBeNull();
    expect(mockFetch.mock.calls.every(([, init]) => (init?.method ?? 'GET') === 'GET')).toBe(true);
  });

  it('el detalle no ofrece aceptar, rechazar, responder ni generar compra', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [rawQuotation] }),
    } as Response);

    renderPage();
    await user.click(await screen.findByText('#4'));

    expect(await screen.findByText('Cotización #4')).toBeDefined();
    expect(screen.getByText('Proveedor A')).toBeDefined();
    for (const name of [/Aceptar/, /Rechazar/, /Registrar respuesta/, /Generar Orden/]) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
  });
});

describe('Historial de cotizaciones: código y buscador', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('muestra el código de la cotización y de su OC, y busca en el servidor', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ ...rawQuotation, code: 'COT-2026-0004', purchase_code: 'OC-2026-0007' }],
      }),
    } as Response);

    renderPage();

    expect(await screen.findByText('COT-2026-0004')).toBeDefined();
    expect(screen.getByText(/OC-2026-0007/)).toBeDefined();

    await user.type(screen.getByLabelText('Buscar cotizaciones'), 'OC-2026');
    await vi.waitFor(() => {
      const urls = mockFetch.mock.calls.map(([url]) => String(url));
      expect(urls.some((u) => u.includes('search=OC-2026'))).toBe(true);
    });
  });
});

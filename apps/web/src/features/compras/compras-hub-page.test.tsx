import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ComprasHubPage from './pages/compras-hub-page';

let mockRole = 'DIR-01';

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Ana', rol: mockRole } }),
}));

// Total por estado, como lo devolvería `meta.total` de `GET /purchase-requests?status=…&per_page=1`.
const TOTALS: Record<string, number> = { borrador: 2, aprobada: 1, enviada: 3, cotizada: 0, con_oc: 4 };

vi.mock('@sgia/api-client', () => ({
  usePurchaseRequests: ({ status }: { status: string }) => ({
    data: { data: [], meta: { total: TOTALS[status] } },
    isLoading: false,
    isError: false,
  }),
}));

function renderHub() {
  return render(
    <MemoryRouter>
      <ComprasHubPage />
    </MemoryRouter>,
  );
}

describe('ComprasHubPage', () => {
  it('muestra las 5 etapas en orden con su contador y enlace a la lista filtrada', () => {
    mockRole = 'DIR-01';
    renderHub();

    const steps = within(screen.getByRole('region', { name: 'Etapas del flujo de compras' }))
      .getAllByRole('link')
      .map((a) => [a.getAttribute('aria-label'), a.getAttribute('href')]);

    expect(steps).toEqual([
      ['Paso 1, Solicitud: 2 por aprobar', '/compras/solicitudes?status=borrador'],
      ['Paso 2, Envío por áreas: 1 por enviar', '/compras/solicitudes?status=aprobada'],
      ['Paso 3, Cotizaciones: 3 esperando cotizaciones', '/compras/solicitudes?status=enviada'],
      // Sin pendientes la etapa se marca «al día» en vez de «0 por subir OC».
      ['Paso 4, Orden de compra: al día', '/compras/solicitudes?status=cotizada'],
      ['Paso 5, Factura: 4 esperando factura', '/compras/solicitudes?status=con_oc'],
    ]);
  });

  it('lista los módulos según el rol', () => {
    mockRole = 'PAN-01';
    renderHub();

    expect(screen.getByRole('link', { name: /Solicitudes de compra/ })).toBeDefined();
    expect(screen.getByRole('link', { name: /Órdenes de compra/ })).toBeDefined();
    expect(screen.queryByRole('link', { name: /Facturas/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Presupuestos/ })).toBeNull();
  });
});

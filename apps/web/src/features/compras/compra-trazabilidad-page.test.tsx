import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import CompraTrazabilidadPage from './pages/compra-trazabilidad-page';

let mockState: { data?: unknown; isLoading: boolean; isError: boolean } = {
  isLoading: true,
  isError: false,
};

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  usePurchaseTrace: () => mockState,
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/compras/4/trazabilidad']}>
      <Routes>
        <Route path="/compras/:id/trazabilidad" element={<CompraTrazabilidadPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CompraTrazabilidadPage', () => {
  it('muestra carga y error', () => {
    mockState = { isLoading: true, isError: false };
    const { unmount } = renderPage();
    expect(screen.getByRole('status').textContent).toMatch(/Cargando/);
    unmount();
    mockState = { isLoading: false, isError: true };
    renderPage();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('muestra la cadena y estados vacíos', () => {
    mockState = {
      isLoading: false,
      isError: false,
      data: {
        purchase: { id: 4, code: 'OC-4', status: 'pendiente', total_amount: 1000, supplier: { name: 'Zenner' }, created_at: '2026-01-02T00:00:00Z' },
        quotations: [],
        invoices: [],
        stock_entries: [],
        budget_movements: [
          { id: 1, type: 'reserva', amount: 1000, created_at: '2026-01-02T00:00:00Z', notes: null },
        ],
      },
    };
    renderPage();
    expect(screen.getByText('OC-4')).toBeDefined();
    expect(screen.getByText('Reserva')).toBeDefined();
    expect(screen.getByText('Sin cotizaciones asociadas.')).toBeDefined();
    expect(screen.getByText('Aún no hay facturas asociadas.')).toBeDefined();
  });
});

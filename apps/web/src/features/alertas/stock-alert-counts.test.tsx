import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CriticalStockAlert } from '@sgia/types';

import { NotificationBell } from './components/notification-bell';
import AlertasStockPage from './pages/alertas-stock-page';

const alert = (id: number, type: 'critical' | 'warning'): CriticalStockAlert =>
  ({
    id,
    product_id: id,
    product_name: `Producto ${id}`,
    alert_type: type,
    current_stock: 1,
    stock_minimo: 5,
    message: 'Stock crítico',
    is_resolved: false,
    created_at: '2026-11-11T10:00:00Z',
  }) as CriticalStockAlert;

// El servidor pagina (aquí llegan 2 filas) pero informa los totales reales del inventario.
vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCriticalStockAlerts: () => ({
    data: {
      data: [alert(1, 'warning'), alert(2, 'warning')],
      meta: { currentPage: 1, lastPage: 6, perPage: 2, total: 12 },
      counts: { active: 12, critical: 7, warning: 5, resolved: 3 },
    },
    isLoading: false,
    isFetching: false,
  }),
  useResolveStockAlert: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLocations: () => ({ data: { data: [] }, isLoading: false }),
  useCajones: () => ({ data: { data: [] }, isLoading: false }),
}));

describe('REQ-06: totales de alertas según el stock real', () => {
  it('la campana cuenta todas las alertas activas y críticas, no solo las 5 que lista', () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('notification-badge').textContent).toBe('9+');
    expect(
      screen.getByRole('button', { name: 'Centro de notificaciones: 12 alertas no resueltas' }),
    ).toBeDefined();
  });

  it('la cinta de la bandeja usa los totales del servidor, no los de la página cargada', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AlertasStockPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const strip = screen.getByText('Alertas activas:').parentElement?.parentElement;
    const figures = Array.from(strip?.querySelectorAll('strong') ?? []).map((n) => n.textContent);
    expect(figures).toEqual(['12', '7', '5', '3']);
  });
});

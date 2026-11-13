import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { CriticalStockAlert } from '@sgia/types';

import AlertasStockPage from './pages/alertas-stock-page';

const alert = (id: number, name: string, stock: number, extra: Partial<CriticalStockAlert> = {}): CriticalStockAlert => ({
  id,
  product_id: id * 10,
  product_name: name,
  alert_type: 'critical',
  is_resolved: false,
  current_stock: stock,
  stock_minimo: 5,
  ...extra,
});

const alerts = [
  alert(1, 'Cable UTP', 2),
  alert(2, 'Patch Cord', 4),
  alert(3, 'Fuente ATX', 1, { open_purchase_request: { id: 9, code: 'SC-2026-0009', status: 'enviada' } }),
];

let role = 'DIR-01';
const dialogProps = vi.fn();

vi.mock('@/features/auth/context/auth-context', async (importOriginal) => {
  const auth = () => ({ user: { id: 1, nombre: 'Usuario', rol: role } });
  return { ...(await importOriginal<typeof import('@/features/auth/context/auth-context')>()), useAuth: auth, useOptionalAuth: auth };
});

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCriticalStockAlerts: () => ({
    data: { data: alerts, meta: { currentPage: 1, lastPage: 1, perPage: 10, total: alerts.length } },
    isLoading: false,
    isFetching: false,
  }),
  useResolveStockAlert: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLocations: () => ({ data: { data: [] }, isLoading: false }),
  useCajones: () => ({ data: { data: [] }, isLoading: false }),
  useProductBarcode: () => ({ data: { svg: '<svg></svg>' }, isLoading: false }),
}));

vi.mock('@/features/solicitudes-compra/components/purchase-request-form-dialog', () => ({
  PurchaseRequestFormDialog: (props: { open: boolean; initialItems?: unknown }) => {
    dialogProps(props);
    return props.open ? <div role="dialog">formulario de solicitud</div> : null;
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AlertasStockPage />
    </MemoryRouter>,
  );

describe('Alertas de stock → solicitud de compra', () => {
  it('el director elige alertas y abre el formulario con cantidades sugeridas', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByRole('button', { name: /Crear solicitud de compra \(/ })).toBeNull();
    await user.click(screen.getByLabelText('Seleccionar Cable UTP'));
    await user.click(screen.getByLabelText('Seleccionar Patch Cord'));
    await user.click(screen.getByRole('button', { name: 'Crear solicitud de compra (2)' }));

    expect(screen.getByRole('dialog')).toBeDefined();
    const last = dialogProps.mock.calls.at(-1)?.[0] as { initialItems: unknown };
    expect(last.initialItems).toEqual([
      { product_id: 10, product_name: 'Cable UTP', quantity: 3 },
      { product_id: 20, product_name: 'Patch Cord', quantity: 1 },
    ]);
  });

  it('un producto con solicitud abierta muestra su código y no se puede elegir', () => {
    renderPage();

    const row = screen.getByText('Fuente ATX').closest('tr')!;
    expect(within(row).getByRole('link', { name: 'SC-2026-0009' }).getAttribute('href')).toBe('/solicitudes-compra/9');
    expect((within(row).getByLabelText('Seleccionar Fuente ATX') as HTMLInputElement).disabled).toBe(true);
  });

  it('"seleccionar todo" omite las alertas ya solicitadas', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Seleccionar todas las alertas de la página'));
    expect(screen.getByRole('button', { name: 'Crear solicitud de compra (2)' })).toBeDefined();
  });

  it('quien no puede crear solicitudes no ve casillas ni el botón', () => {
    role = 'PAN-01';
    renderPage();

    expect(screen.queryByLabelText('Seleccionar Cable UTP')).toBeNull();
    expect(screen.queryByRole('button', { name: /Crear solicitud de compra/ })).toBeNull();
    role = 'DIR-01';
  });
});

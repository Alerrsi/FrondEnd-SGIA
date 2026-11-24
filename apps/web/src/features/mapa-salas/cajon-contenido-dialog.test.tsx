import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Producto } from '@sgia/types';

import { CajonContenidoDialog, type CajonContenidoTarget } from './components/cajon-contenido-dialog';
import { CONTENIDO } from './test-fixtures';

const state = vi.hoisted(() => ({
  estanteIds: [] as Array<number | undefined>,
  productParams: [] as Array<{ params: unknown; enabled?: boolean }>,
  products: [] as Producto[],
}));

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useEstanteContenido: (id?: number) => {
    state.estanteIds.push(id);
    return { data: id ? CONTENIDO : undefined, isLoading: false, isError: false, refetch: vi.fn() };
  },
  useProducts: (params: unknown, options?: { enabled?: boolean }) => {
    state.productParams.push({ params, enabled: options?.enabled });
    return { data: options?.enabled ? { data: state.products } : undefined, isLoading: false, isError: false, refetch: vi.fn() };
  },
  useUpdateCajon: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderDialog(cajon: CajonContenidoTarget | null, onClose = vi.fn()) {
  render(
    <MemoryRouter>
      <CajonContenidoDialog cajon={cajon} onClose={onClose} canSeeInventory />
    </MemoryRouter>,
  );
  return onClose;
}

describe('CajonContenidoDialog (docs/ubicaciones-distribucion.md, decisión 13)', () => {
  beforeEach(() => {
    state.estanteIds = [];
    state.productParams = [];
    state.products = [];
  });

  it('con estante lista solo los elementos de ese cajón, con su total y el enlace a inventario', () => {
    renderDialog({ id: 11, codigo: 'R1', code: 'L206-R1', estanteId: 1, estanteCodigo: 'EST-A1', descripcion: 'Insumos' });

    const dialog = screen.getByRole('dialog', { name: 'Cajón L206-R1' });
    expect(within(dialog).getByText('Insumos · Estante EST-A1')).toBeDefined();
    expect(within(dialog).getByText('2 elementos')).toBeDefined();
    expect(within(dialog).getByText('Guantes de nitrilo')).toBeDefined();
    expect(within(dialog).getByText('Bajo el mínimo')).toBeDefined();
    expect(within(dialog).queryByText('Multímetro')).toBeNull();
    expect(within(dialog).getByRole('link', { name: 'Ver en inventario' }).getAttribute('href')).toBe('/inventario?cajon_id=11');
    expect(state.estanteIds).toContain(1);
    expect(state.productParams.every((call) => call.enabled === false)).toBe(true);
  });

  it('cuenta las unidades de equipo una a una', () => {
    renderDialog({ id: 12, codigo: 'R2', code: 'L206-R2', estanteId: 1, estanteCodigo: 'EST-A1', lleno: true });

    const dialog = screen.getByRole('dialog', { name: 'Cajón L206-R2' });
    expect(within(dialog).getByText('3 elementos')).toBeDefined();
    expect(within(dialog).getByText('Multímetro')).toBeDefined();
    expect(within(dialog).getByText('2 disponibles')).toBeDefined();
    expect(within(dialog).getByText('Lleno')).toBeDefined();
  });

  it('sin estante usa los productos del cajón', () => {
    state.products = [{ id: 70, nombre: 'Cinta aislante', stock: 4, stockCritico: 5 } as Producto];
    renderDialog({ id: 30, codigo: 'X1', code: 'L206-X1', estanteId: null });

    const dialog = screen.getByRole('dialog', { name: 'Cajón L206-X1' });
    expect(within(dialog).getByText('Sin estante')).toBeDefined();
    expect(within(dialog).getByText('Cinta aislante')).toBeDefined();
    expect(within(dialog).getByText('4 u.')).toBeDefined();
    expect(within(dialog).getByText('Bajo el mínimo')).toBeDefined();
    expect(state.productParams.at(-1)).toEqual({ params: { cajon_id: 30, per_page: 100 }, enabled: true });
    expect(state.estanteIds.every((id) => id === undefined)).toBe(true);
  });

  it('cerrado no pide nada y «Cerrar» avisa', async () => {
    const user = userEvent.setup();
    renderDialog(null);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(state.productParams.every((call) => call.enabled === false)).toBe(true);

    const onClose = renderDialog({ id: 11, codigo: 'R1', code: 'L206-R1', estanteId: 1 });
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalled();
  });
});

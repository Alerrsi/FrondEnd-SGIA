import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiRequestError } from '@sgia/api-client';
import type { EstanteContenido } from '@sgia/types';

import { EstanteContenidoDialog } from './components/estante-contenido-dialog';
import { CONTENIDO } from './test-fixtures';

const state = vi.hoisted(() => ({
  result: {} as { data?: EstanteContenido; isLoading: boolean; isError: boolean; error?: unknown },
  refetch: vi.fn(),
  updateCajon: vi.fn(),
}));

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useEstanteContenido: () => ({ ...state.result, refetch: state.refetch }),
  useUpdateCajon: () => ({ mutateAsync: state.updateCajon, isPending: false }),
}));

function renderDialog(canSeeInventory = true, canMarkFull = false) {
  return render(
    <MemoryRouter>
      <EstanteContenidoDialog
        estanteId={1}
        codigo="EST-A1"
        onClose={vi.fn()}
        canSeeInventory={canSeeInventory}
        canMarkFull={canMarkFull}
      />
    </MemoryRouter>,
  );
}

describe('Pop-up del estante (REQ-22)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.result = { data: CONTENIDO, isLoading: false, isError: false };
  });

  it('lista los productos y unidades de cada cajón por nombre', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Estante EST-A1' });
    expect(within(dialog).getByText('Zona A · Laboratorio 206')).toBeDefined();
    expect(within(dialog).getByText('2 cajones · 5 elementos · 1 lleno')).toBeDefined();
    expect(within(dialog).getByText('Guantes de nitrilo')).toBeDefined();
    expect(within(dialog).getByText('Bajo el mínimo')).toBeDefined();
    expect(within(dialog).getByText('Alcohol isopropílico')).toBeDefined();
    expect(within(dialog).getByText('Multímetro')).toBeDefined();
    expect(within(dialog).getByText('2 disponibles')).toBeDefined();
    expect(within(dialog).getByText('1 prestado')).toBeDefined();
    expect(within(dialog).getByText('L206-R1').className).toContain('font-code');
  });

  it('enlaza cada cajón a inventario solo para quien entra a inventario', () => {
    const { unmount } = renderDialog(true);
    expect(screen.getAllByRole('link', { name: 'Ver en inventario' })[0]?.getAttribute('href')).toBe('/inventario?cajon_id=11');
    unmount();

    renderDialog(false);
    expect(screen.queryByRole('link', { name: 'Ver en inventario' })).toBeNull();
  });

  it('avisa cuando el estante no tiene cajones', () => {
    state.result = { data: { ...CONTENIDO, cajones: [] }, isLoading: false, isError: false };
    renderDialog();
    expect(screen.getByText('Este estante no tiene cajones')).toBeDefined();
  });

  it('muestra el error y permite reintentar', async () => {
    state.result = {
      isLoading: false,
      isError: true,
      error: new ApiRequestError(500, { message: 'Error del servidor.' }),
    };
    renderDialog();

    expect(screen.getByRole('alert').textContent).toContain('Ocurrió un error en el servidor.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(state.refetch).toHaveBeenCalled();
  });

  it('marca los cajones llenos y deja marcar o quitar «lleno» solo a los editores (docs/cajones-llenos.md)', async () => {
    const user = userEvent.setup();
    state.updateCajon.mockResolvedValue({});
    const { unmount } = renderDialog(true, false);
    const r2 = screen.getByRole('region', { name: 'Cajón L206-R2' });
    expect(within(r2).getByText('Lleno')).toBeDefined();
    expect(within(screen.getByRole('region', { name: 'Cajón L206-R1' })).queryByText('Lleno')).toBeNull();
    expect(screen.queryByRole('button', { name: /lleno/ })).toBeNull();
    unmount();

    renderDialog(true, true);
    await user.click(screen.getByRole('button', { name: 'Marcar lleno el cajón L206-R1' }));
    expect(state.updateCajon).toHaveBeenCalledWith({ id: 11, payload: { lleno: true } });
    await user.click(screen.getByRole('button', { name: 'Quitar lleno del cajón L206-R2' }));
    expect(state.updateCajon).toHaveBeenLastCalledWith({ id: 12, payload: { lleno: false } });
  });
});

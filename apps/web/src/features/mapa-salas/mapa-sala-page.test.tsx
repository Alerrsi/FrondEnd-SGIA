import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { LocationEntity, SalaMapa } from '@sgia/types';

import MapaSalaPage from './pages/mapa-sala-page';
import { CONTENIDO, makeMapa } from './test-fixtures';

const state = vi.hoisted(() => ({
  role: 'AD-01',
  mapa: undefined as SalaMapa | undefined,
  prefetch: vi.fn(),
}));

const SALAS: LocationEntity[] = [
  { id: 7, code: 'L206', nombre: 'Laboratorio 206', tipo: 'sala' },
  { id: 8, code: 'PCENTRAL', nombre: 'Pañol Central', tipo: 'panol' },
];

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useLocations: () => ({ data: { data: SALAS }, isLoading: false }),
  useSalaMapa: (id?: number) => ({
    data: id === 7 ? state.mapa : undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePrefetchEstanteContenido: () => state.prefetch,
  useEstanteContenido: (id?: number) => ({
    data: id ? CONTENIDO : undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Usuario', role: state.role } }),
}));

function renderPage(path = '/mapa-salas/7') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/mapa-salas/:locationId" element={<MapaSalaPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MapaSalaPage · modo vista (REQ-22)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.role = 'AD-01';
    state.mapa = makeMapa();
    try {
      window.localStorage.clear();
    } catch {
      // sin almacenamiento
    }
  });

  it('dibuja la sala elegida y la recuerda para la próxima visita', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Mapa de salas' })).toBeDefined();
    expect(screen.getByText(/pulsa un estante para ver lo que guarda/).textContent).toContain('L206 · Laboratorio 206');
    expect(screen.getByRole('group', { name: 'Plano de Laboratorio 206' })).toBeDefined();
    expect(screen.getAllByRole('button', { name: /^Estante EST-/ })).toHaveLength(3);
    expect(window.localStorage.getItem('sgia-mapa-sala')).toBe('7');
  });

  it('AD-01 abre el pop-up al pulsar un estante', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /^Estante EST-A1,/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Estante EST-A1' });
    expect(within(dialog).getByText('Guantes de nitrilo')).toBeDefined();
    // AD-01 no entra a inventario.
    expect(within(dialog).queryByRole('link', { name: 'Ver en inventario' })).toBeNull();
  });

  it('Enter sobre un estante enfocado también abre el pop-up y precarga al enfocar', async () => {
    renderPage();
    const estante = screen.getByRole('button', { name: /^Estante EST-B1,/ });

    estante.focus();
    expect(state.prefetch).toHaveBeenCalledWith(3);
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('dialog', { name: 'Estante EST-A1' })).toBeDefined();
  });

  it('la lista «Estantes de la sala» abre el mismo pop-up', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Estantes de la sala (3)'));
    const list = screen.getByText('Estantes de la sala (3)').closest('details') as HTMLElement;
    await userEvent.click(within(list).getByRole('button', { name: /EST-A2/ }));

    expect(await screen.findByRole('dialog')).toBeDefined();
  });

  it('el selector cambia de sala', async () => {
    renderPage();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sala' }), '8');

    expect(screen.queryByRole('group', { name: 'Plano de Laboratorio 206' })).toBeNull();
  });
});

import { Profiler } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import MapaSalaPage from './pages/mapa-sala-page';
import { apiState, resetApiState } from './test-api-mock';
import { makeEstante, makeMapa } from './test-fixtures';

vi.mock('@sgia/api-client', async (importOriginal) => {
  const { buildApiMock } = await import('./test-api-mock');
  return { ...(await importOriginal<typeof import('@sgia/api-client')>()), ...buildApiMock() };
});

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Pañolero', role: 'PAN-01' } }),
}));

describe('Fluidez del arrastre con 200 estantes (REQ-22)', () => {
  beforeEach(() => {
    resetApiState();
    // Sala de 40 × 20 m con una rejilla de 20 × 10 estantes de 100 × 40 cm.
    const estantes = Array.from({ length: 200 }, (_, i) =>
      makeEstante({ id: i + 1, codigo: `E${i + 1}`, zona_id: null, rotation: 0, width: 100, depth: 40, x: (i % 20) * 200, y: Math.floor(i / 20) * 200, cajones: [] }),
    );
    apiState.mapa = makeMapa({
      location: { ...makeMapa().location, map_width_cm: 4000, map_height_cm: 2000 },
      zonas: [],
      estantes,
    });
  });

  it('mover el puntero no provoca renders de React; solo el soltar', async () => {
    let commits = 0;
    render(
      <Profiler id="mapa" onRender={() => (commits += 1)}>
        <MemoryRouter initialEntries={['/mapa-salas/7']}>
          <Routes>
            <Route path="/mapa-salas/:locationId" element={<MapaSalaPage />} />
          </Routes>
        </MemoryRouter>
      </Profiler>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Editar distribución' }));
    expect(screen.getAllByRole('button', { name: /^Estante E\d+,/ })).toHaveLength(200);

    const element = screen.getByRole('button', { name: /^Estante E1,/ });
    fireEvent.pointerDown(element, { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    const afterSelect = commits;

    for (let i = 1; i <= 60; i += 1) {
      fireEvent.pointerMove(window, { pointerId: 1, clientX: i * 2, clientY: i });
    }
    expect(commits).toBe(afterSelect);

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 120, clientY: 60 });
    expect(apiState.updateEstante).toHaveBeenCalledTimes(1);
  });
});

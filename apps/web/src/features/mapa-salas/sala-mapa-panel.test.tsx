import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SalaMapaPanel } from './components/sala-mapa-panel';
import { apiState, resetApiState } from './test-api-mock';

const state = vi.hoisted(() => ({ loading: true }));

vi.mock('@sgia/api-client', async (importOriginal) => {
  const { buildApiMock } = await import('./test-api-mock');
  const mock = buildApiMock();
  return {
    ...(await importOriginal<typeof import('@sgia/api-client')>()),
    ...mock,
    useSalaMapa: (id?: number) => (state.loading ? { data: undefined, isLoading: true, isError: false, refetch: vi.fn() } : mock.useSalaMapa(id)),
  };
});

describe('SalaMapaPanel (REQ-22)', () => {
  const original = SVGElement.prototype.getBoundingClientRect;

  beforeEach(() => {
    resetApiState();
    state.loading = true;
    // El plano mide 530 px de ancho: viewBox de 1060 cm → 0,5 px por cm.
    SVGElement.prototype.getBoundingClientRect = function () {
      return { width: 530, height: 330, x: 0, y: 0, top: 0, left: 0, right: 530, bottom: 330, toJSON: () => ({}) } as DOMRect;
    };
  });

  afterEach(() => {
    SVGElement.prototype.getBoundingClientRect = original;
  });

  it('mide el plano aunque aparezca después del esqueleto de carga (textos de 12 px)', () => {
    const view = render(
      <MemoryRouter>
        <SalaMapaPanel locationId={7} variant="embedded" canEdit canSeeInventory />
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toBeDefined();

    state.loading = false;
    act(() => {
      view.rerender(
        <MemoryRouter>
          <SalaMapaPanel locationId={7} variant="embedded" canEdit canSeeInventory />
        </MemoryRouter>,
      );
    });

    // 12 px en pantalla / 0,5 px por cm = 24 cm del plano.
    const code = screen.getAllByText('EST-B1').find((el) => el.tagName.toLowerCase() === 'text');
    if (!code) throw new Error('El código no se dibujó en el plano');
    expect(Number(code.getAttribute('font-size'))).toBeCloseTo(24);
    expect(apiState.mapa?.location.code).toBe('L206');
  });

  it('en Ubicaciones lleva su título y «Editar distribución» para quien edita', () => {
    state.loading = false;
    render(
      <MemoryRouter>
        <SalaMapaPanel locationId={7} variant="embedded" canEdit={false} canSeeInventory={false} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Mapa de «Laboratorio 206»')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Editar distribución' })).toBeNull();
  });
});

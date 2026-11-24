import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('con `fit` el plano toma el mayor tamaño que cabe en su caja, con la proporción de la sala', () => {
    state.loading = false;
    const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 900 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 300 });
    try {
      render(
        <MemoryRouter>
          <SalaMapaPanel locationId={7} variant="embedded" canEdit canSeeInventory fit="fill" />
        </MemoryRouter>,
      );
      const svg = screen.getByRole('group', { name: 'Plano de Laboratorio 206' }) as unknown as SVGSVGElement;
      const [, , w, h] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
      // La caja de 900 × 300 es más ancha que la sala: manda el alto.
      expect(parseFloat(svg.style.height)).toBeCloseTo(300);
      expect(parseFloat(svg.style.width)).toBeCloseTo(300 * (w! / h!));
    } finally {
      if (width) Object.defineProperty(HTMLElement.prototype, 'clientWidth', width);
      if (height) Object.defineProperty(HTMLElement.prototype, 'clientHeight', height);
    }
  });

  it('en Ubicaciones: tocar un estante avisa en vez de abrir el pop-up, resalta los pedidos y suma acciones', async () => {
    state.loading = false;
    const user = userEvent.setup();
    const onEstanteClick = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <SalaMapaPanel
          locationId={7}
          variant="embedded"
          canEdit
          canSeeInventory
          onEstanteClick={onEstanteClick}
          highlightEstanteIds={[2]}
          showEstantesList={false}
          toolbarActions={<button type="button">Cajones (14)</button>}
        />
      </MemoryRouter>,
    );

    await user.click(container.querySelector('g[data-estante-id="1"]')!);
    expect(onEstanteClick).toHaveBeenCalledWith(expect.objectContaining({ id: 1, codigo: 'EST-A1' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    expect(container.querySelector('g[data-estante-id="2"] rect')?.getAttribute('stroke-width')).toBe('2');
    expect(container.querySelector('g[data-estante-id="1"] rect')?.getAttribute('stroke-width')).toBe('1');
    expect(screen.queryByText(/Estantes de la sala/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Cajones (14)' })).toBeDefined();
  });

  it('el pop-up de contenido se puede abrir y cerrar desde fuera', async () => {
    state.loading = false;
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <SalaMapaPanel locationId={7} variant="embedded" canEdit canSeeInventory contentEstanteId={1} onContentEstanteChange={onChange} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('dialog', { name: /Estante EST-A1/ })).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

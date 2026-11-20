import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import MapaSalaPage from './pages/mapa-sala-page';
import { apiState, resetApiState } from './test-api-mock';
import { makeMapa } from './test-fixtures';

const state = vi.hoisted(() => ({ role: 'AD-01' }));

vi.mock('@sgia/api-client', async (importOriginal) => {
  const { buildApiMock } = await import('./test-api-mock');
  return { ...(await importOriginal<typeof import('@sgia/api-client')>()), ...buildApiMock() };
});

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
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
    resetApiState();
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
    expect(apiState.prefetch).toHaveBeenCalledWith(3);
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

describe('MapaSalaPage · edición y roles (REQ-22)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetApiState();
  });

  it('AD-01 no ve los controles de edición; PAN-01 y DIR-01 sí', () => {
    state.role = 'AD-01';
    const { unmount } = renderPage();
    expect(screen.queryByRole('button', { name: 'Editar distribución' })).toBeNull();
    unmount();

    for (const role of ['PAN-01', 'DIR-01']) {
      state.role = role;
      const view = renderPage();
      expect(screen.getByRole('button', { name: 'Editar distribución' })).toBeDefined();
      view.unmount();
    }
  });

  it('una sala sin medidas lo avisa; solo el editor puede definirlas', async () => {
    apiState.mapa = makeMapa({ location: { ...makeMapa().location, has_dimensions: false } });
    state.role = 'AD-01';
    const { unmount } = renderPage();
    expect(screen.getByText(/aún no tiene medidas/)).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Definir medidas' })).toBeNull();
    unmount();

    state.role = 'PAN-01';
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Definir medidas' }));
    const dialog = await screen.findByRole('dialog', { name: 'Medidas de la sala' });
    const ancho = within(dialog).getByLabelText('Ancho (m) *');
    await userEvent.clear(ancho);
    await userEvent.type(ancho, '12.5');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar medidas' }));

    expect(apiState.updateLocation).toHaveBeenCalledWith({ id: 7, payload: { map_width_cm: 1250, map_height_cm: 600 } });
  });

  it('PAN-01 crea un estante en la sala del mapa', async () => {
    state.role = 'PAN-01';
    apiState.createEstante.mockResolvedValue({ ...makeMapa().estantes[0]!, id: 9, codigo: 'EST-C1' });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Editar distribución' }));
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo estante' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo estante' });
    await userEvent.type(within(dialog).getByLabelText('Código *'), 'est c1');
    await userEvent.selectOptions(within(dialog).getByLabelText('Zona (opcional)'), '2');
    await userEvent.click(within(dialog).getByLabelText('Vertical'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear estante' }));

    expect(apiState.createEstante).toHaveBeenCalledWith({
      location_id: 7,
      codigo: 'est c1',
      nombre: null,
      zona_id: 2,
      width: 200,
      depth: 60,
      rotation: 90,
    });
  });

  it('el editor asigna cajones sueltos a un estante desde el pop-up', async () => {
    state.role = 'DIR-01';
    apiState.cajones = [
      { id: 21, codigo: 'R9', barcode: 'L206-R9', location_id: 7, estante_id: null },
      { id: 11, codigo: 'R1', barcode: 'L206-R1', location_id: 7, estante_id: 1 },
      // Suelto, pero de otra sala: no se ofrece.
      { id: 31, codigo: 'R1', barcode: 'PCENTRAL-R1', location_id: 8, estante_id: null },
    ];
    apiState.updateCajon.mockResolvedValue({});
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /^Estante EST-A1,/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Asignar cajones' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cajones del estante EST-A1' });
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(2);
    expect(within(dialog).queryByText('PCENTRAL-R1')).toBeNull();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /L206-R9/ }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /L206-R1/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(apiState.updateCajon).toHaveBeenCalledWith({ id: 11, payload: { estante_id: null } });
    expect(apiState.updateCajon).toHaveBeenCalledWith({ id: 21, payload: { estante_id: 1 } });
  });
});

describe('MapaSalaPage · zoom y búsqueda (REQ-22)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetApiState();
    state.role = 'AD-01';
  });

  it('acerca, aleja y ajusta cambiando el viewBox', async () => {
    renderPage();
    const svg = screen.getByRole('group', { name: 'Plano de Laboratorio 206' });
    const initial = svg.getAttribute('viewBox');

    expect((screen.getByRole('button', { name: 'Alejar' }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Acercar' }));
    expect(svg.getAttribute('viewBox')).not.toBe(initial);
    expect(screen.getByText('150 %')).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: 'Ajustar' }));
    expect(svg.getAttribute('viewBox')).toBe(initial);
  });

  it('marca los estantes por código, cajón o producto que guardan', async () => {
    const { container } = renderPage();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar en la sala' }), 'est-b');
    await screen.findByText('1 estante con coincidencias');
    expect(container.querySelector('[data-estante-id="3"] rect.fill-accent-soft')).not.toBeNull();
    expect(screen.getByRole('button', { name: /^Estante EST-B1,.*coincide con la búsqueda$/ })).toBeDefined();

    // Un producto en el cajón 12 (EST-A1 y EST-A2 comparten la fixture de cajones) marca esos estantes.
    apiState.products = [{ id: 40, cajon_id: 12 }];
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Buscar en la sala' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar en la sala' }), 'guantes');
    await screen.findByText('2 estantes con coincidencias');
    expect(container.querySelectorAll('rect.fill-accent-soft')).toHaveLength(2);
  });
});

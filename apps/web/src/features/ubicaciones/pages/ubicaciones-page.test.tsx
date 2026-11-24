import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiRequestError } from '@sgia/api-client';
import type { CajonEntity, Estante, LocationEntity } from '@sgia/types';
import type { ReactNode } from 'react';
import UbicacionesPage from './ubicaciones-page';

const mocks = vi.hoisted(() => ({
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
  createCajon: vi.fn(),
  updateCajon: vi.fn(),
  downloadLabel: vi.fn(),
  printBlob: vi.fn(),
}));

const LOCATIONS: LocationEntity[] = [
  { id: 1, code: 'PCENTRAL', nombre: 'Pañol Central', tipo: 'panol', descripcion: 'Piso 1' },
  { id: 2, code: 'L201', nombre: 'Laboratorio 201', tipo: 'sala', descripcion: 'Piso 2' },
];

const CAJONES: CajonEntity[] = [
  {
    id: 10,
    codigo: 'Gaveta A-1',
    barcode: 'PCENTRAL-GAVETA-A-1',
    descripcion: 'Cables',
    location_id: 1,
  },
  {
    id: 12,
    codigo: 'Gaveta A-2',
    barcode: 'PCENTRAL-GAVETA-A-2',
    descripcion: null,
    location_id: 1,
    estante_id: 3,
    estante: { id: 3, codigo: 'EST-A1' },
    lleno: true,
  },
];

const ESTANTES = [
  { id: 3, codigo: 'EST-A1', nombre: 'Rack', zona_id: 1, cajones: [{ id: 12 }], items_count: 4 },
  { id: 4, codigo: 'EST-B1', nombre: null, zona_id: null, cajones: [], items_count: 0 },
] as unknown as Estante[];

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useLocations: () => ({ data: { data: LOCATIONS }, isLoading: false, refetch: vi.fn() }),
  useCajones: (params?: { location_id?: number }) => ({
    data: { data: params?.location_id === 1 ? CAJONES : [] },
    isLoading: false,
  }),
  useCreateLocation: () => ({ mutateAsync: mocks.createLocation, isPending: false }),
  useUpdateLocation: () => ({ mutateAsync: mocks.updateLocation, isPending: false }),
  useDeleteLocation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateCajon: () => ({ mutateAsync: mocks.createCajon, isPending: false }),
  useUpdateCajon: () => ({ mutateAsync: mocks.updateCajon, isPending: false }),
  useEstantes: () => ({ data: { data: [{ id: 3, codigo: 'EST-A1', nombre: 'Rack' }] }, isLoading: false }),
  useSalaMapa: (id?: number) => ({
    data: id === 1 ? { estantes: ESTANTES, zonas: [{ id: 1, nombre: 'Zona A' }] } : undefined,
    isLoading: false,
  }),
  useDeleteCajon: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDownloadCajonLabel: () => ({
    mutateAsync: mocks.downloadLabel,
    isPending: false,
    variables: undefined,
  }),
}));

vi.mock('@/features/equipos/utils/download', () => ({
  printBlob: mocks.printBlob,
  downloadBlob: vi.fn(),
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 2, name: 'Pañolero', role: 'PAN-01' } }),
}));

// El plano tiene sus propias pruebas (features/mapa-salas); aquí importa qué sala recibe, con qué permisos, qué
// estantes resalta y qué pasa al tocar uno.
interface MapaMockProps {
  locationId: number;
  canEdit: boolean;
  canSeeInventory: boolean;
  variant?: string;
  fit?: string;
  toolbarActions?: ReactNode;
  onEstanteClick?: (estante: Estante) => void;
  highlightEstanteIds?: readonly number[];
  contentEstanteId?: number | null;
}
vi.mock('@/features/mapa-salas/components/sala-mapa-panel', () => ({
  SalaMapaPanel: (props: MapaMockProps) => (
    <div>
      <div data-testid="sala-mapa-panel">
        {`mapa sala=${props.locationId} editar=${props.canEdit} inventario=${props.canSeeInventory} variante=${props.variant}`}
      </div>
      <div data-testid="mapa-estado">{`fit=${props.fit} resaltados=${(props.highlightEstanteIds ?? []).join(',')} contenido=${props.contentEstanteId ?? ''}`}</div>
      {props.toolbarActions}
      <button type="button" onClick={() => props.onEstanteClick?.(ESTANTES[0]!)}>
        Tocar EST-A1 en el plano
      </button>
    </div>
  ),
}));

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

function codeInput(): HTMLInputElement {
  return screen.getByLabelText('Código de sala') as HTMLInputElement;
}

describe('UbicacionesPage (REQ-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra las salas y cajones con sus códigos', () => {
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    expect(screen.getByText(/Gestión de Ubicaciones Físicas y Cajones/i)).toBeDefined();
    expect(screen.getByText('Pañol Central')).toBeDefined();
    expect(screen.getByText('PCENTRAL')).toBeDefined();
    expect(screen.getByText('L201')).toBeDefined();
    expect(screen.getByText('Gaveta A-1')).toBeDefined();
    expect(screen.getByText('PCENTRAL-GAVETA-A-1').className).toContain('font-code');
  });

  it('sugiere el código de sala desde el nombre hasta que se edita a mano', async () => {
    const user = userEvent.setup();
    mocks.createLocation.mockResolvedValue({ id: 3 });
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: /Nueva sala/i }));
    const nombre = screen.getByLabelText(/Nombre de la sala/i);

    await user.type(nombre, 'Laboratorio de Ciberseguridad L-206');
    expect(codeInput().value).toBe('L206');

    await user.clear(nombre);
    await user.type(nombre, 'Pañol de Redes');
    expect(codeInput().value).toBe('PREDES');

    await user.clear(codeInput());
    await user.type(codeInput(), 'red-es 1');
    expect(codeInput().value).toBe('REDES1');

    await user.type(nombre, ' Norte');
    expect(codeInput().value).toBe('REDES1');

    await user.click(screen.getByRole('button', { name: 'Guardar ubicación' }));
    expect(mocks.createLocation).toHaveBeenCalledTimes(1);
    expect(mocks.createLocation.mock.calls[0]?.[0]).toEqual({
      nombre: 'Pañol de Redes Norte',
      code: 'REDES1',
      tipo: 'sala',
      descripcion: undefined,
    });
  });

  it('muestra en el campo el error 422 del código', async () => {
    const user = userEvent.setup();
    mocks.createLocation.mockRejectedValue(
      new ApiRequestError(422, {
        message: 'Datos inválidos',
        errors: { code: ['El código PCENTRAL ya está en uso.'] },
      }),
    );
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: /Nueva sala/i }));
    await user.type(screen.getByLabelText(/Nombre de la sala/i), 'Pañol Central');
    await user.click(screen.getByRole('button', { name: 'Guardar ubicación' }));

    expect(await screen.findByText('El código PCENTRAL ya está en uso.')).toBeDefined();
  });

  it('al editar una sala el código queda en solo lectura y no se envía', async () => {
    const user = userEvent.setup();
    mocks.updateLocation.mockResolvedValue({ id: 1 });
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getAllByTitle('Editar ubicación')[0]!);

    expect(codeInput().value).toBe('PCENTRAL');
    expect(codeInput().readOnly).toBe(true);
    expect(screen.getByText(/No se puede cambiar/)).toBeDefined();

    await user.type(screen.getByLabelText(/Nombre de la sala/i), ' Sur');
    expect(codeInput().value).toBe('PCENTRAL');

    await user.click(screen.getByRole('button', { name: 'Guardar ubicación' }));
    expect(mocks.updateLocation).toHaveBeenCalledTimes(1);
    const { payload } = mocks.updateLocation.mock.calls[0]?.[0] as { payload: Record<string, unknown> };
    expect(payload.nombre).toBe('Pañol Central Sur');
    expect('code' in payload).toBe(false);
  });

  it('muestra la vista previa del código del cajón y bloquea uno de más de 12 caracteres', async () => {
    const user = userEvent.setup();
    mocks.createCajon.mockResolvedValue({ id: 11 });
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: /Nuevo cajón/i }));
    const codigo = screen.getByLabelText(/Código \/ identificador del cajón/i);
    const guardar = screen.getByRole('button', { name: 'Guardar cajón' }) as HTMLButtonElement;

    await user.type(codigo, 'Rack R1');
    expect(screen.getByTestId('cajon-code-preview').textContent).toBe('PCENTRAL-RACK-R1');
    expect(guardar.disabled).toBe(false);

    await user.clear(codigo);
    await user.type(codigo, 'Estante principal');
    expect(screen.getByRole('alert').textContent).toContain('17 caracteres');
    expect(guardar.disabled).toBe(true);

    await user.clear(codigo);
    await user.type(codigo, 'Mesa 1 Cajón');
    expect(screen.getByTestId('cajon-code-preview').textContent).toBe('PCENTRAL-MESA-1-CAJON');
    await user.click(guardar);
    expect(mocks.createCajon).toHaveBeenCalledTimes(1);
    expect(mocks.createCajon.mock.calls[0]?.[0]).toEqual({
      location_id: 1,
      codigo: 'Mesa 1 Cajón',
      descripcion: undefined,
    });
  });

  it('imprime la etiqueta del cajón', async () => {
    const user = userEvent.setup();
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    mocks.downloadLabel.mockResolvedValue(blob);
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: 'Imprimir etiqueta de PCENTRAL-GAVETA-A-1' }));

    expect(mocks.downloadLabel).toHaveBeenCalledWith(10);
    expect(mocks.printBlob).toHaveBeenCalledWith(blob);
  });
});

describe('UbicacionesPage · mapa de la sala (REQ-22)', () => {
  it('muestra el mapa de la sala elegida junto a la lista, editable por el pañolero', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    expect(screen.getByTestId('sala-mapa-panel').textContent).toBe('mapa sala=1 editar=true inventario=true variante=embedded');
    expect(screen.queryByRole('link', { name: /Ver mapa/ })).toBeNull();

    await user.click(screen.getByText('Laboratorio 201'));
    expect(screen.getByTestId('sala-mapa-panel').textContent).toContain('mapa sala=2');
  });

  it('cada cajón dice en qué estante está', () => {
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    expect(screen.getByText('Sin estante')).toBeDefined();
  });
});

describe('UbicacionesPage · cajón en un estante del mapa (REQ-22)', () => {
  it('el cajón nuevo puede quedar en un estante de la sala', async () => {
    const user = userEvent.setup();
    mocks.createCajon.mockResolvedValue({ id: 11 });
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: /Nuevo cajón/i }));
    await user.type(screen.getByLabelText(/Código \/ identificador del cajón/i), 'R5');
    await user.selectOptions(screen.getByLabelText('Estante del mapa (opcional)'), '3');
    await user.click(screen.getByRole('button', { name: 'Guardar cajón' }));

    expect(mocks.createCajon.mock.calls[0]?.[0]).toEqual({ location_id: 1, codigo: 'R5', descripcion: undefined, estante_id: 3 });
  });
});

describe('UbicacionesPage · cajones llenos (docs/cajones-llenos.md)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marca el cajón lleno con un badge y permite marcar o quitar «lleno» desde la lista', async () => {
    const user = userEvent.setup();
    mocks.updateCajon.mockResolvedValue({});
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    // Solo el cajón lleno lleva el badge.
    expect(screen.getAllByText('Lleno')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Marcar lleno el cajón PCENTRAL-GAVETA-A-1' }));
    expect(mocks.updateCajon).toHaveBeenCalledWith({ id: 10, payload: { lleno: true } });

    const quitar = screen.getByRole('button', { name: 'Quitar lleno del cajón PCENTRAL-GAVETA-A-2' });
    expect(quitar.getAttribute('aria-pressed')).toBe('true');
    await user.click(quitar);
    expect(mocks.updateCajon).toHaveBeenLastCalledWith({ id: 12, payload: { lleno: false } });
  });
});

describe('UbicacionesPage · todo de un vistazo (docs/ubicaciones-distribucion.md)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('en pantallas anchas muestra salas, plano y panel acoplado; el botón lo cierra y se recuerda', async () => {
    const user = userEvent.setup();
    const view = render(<UbicacionesPage />, { wrapper: MemoryRouter });

    expect(screen.getByTestId('mapa-estado').textContent).toContain('fit=fill');
    expect(screen.getByRole('complementary', { name: 'Cajones y estantes de la sala' })).toBeDefined();
    const toggle = screen.getByRole('button', { name: /^Cajones \(2\)/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe('ubicaciones-panel');

    await user.click(toggle);
    expect(screen.queryByRole('complementary', { name: 'Cajones y estantes de la sala' })).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(localStorage.getItem('sgia-ubicaciones-panel')).toBe('closed');

    view.unmount();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    expect(screen.queryByRole('complementary', { name: 'Cajones y estantes de la sala' })).toBeNull();
  });

  it('cada sala ocupa una línea y su tipo y descripción van en el title', () => {
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const fila = screen.getByText('Laboratorio 201').closest('li')!;
    expect(fila.getAttribute('title')).toBe('Sala · Piso 2');
  });

  it('tocar un estante filtra el panel a sus cajones y lo resalta; «Ver productos» abre su contenido', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', { name: 'Cajones y estantes de la sala' });
    expect(within(panel).getByText('Gaveta A-1')).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Tocar EST-A1 en el plano' }));
    expect(within(panel).queryByText('Gaveta A-1')).toBeNull();
    expect(within(panel).getByText('Gaveta A-2')).toBeDefined();
    expect(within(panel).getByText('Zona A · 1 cajón · 4 elementos')).toBeDefined();
    expect(screen.getByTestId('mapa-estado').textContent).toContain('resaltados=3');

    await user.click(within(panel).getByRole('button', { name: 'Ver productos' }));
    expect(screen.getByTestId('mapa-estado').textContent).toContain('contenido=3');

    await user.click(within(panel).getByRole('button', { name: 'Quitar filtro de estante' }));
    expect(within(panel).getByText('Gaveta A-1')).toBeDefined();
    expect(screen.getByTestId('mapa-estado').textContent).toContain('resaltados= ');
  });

  it('pasar por un cajón resalta su estante en el plano', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', { name: 'Cajones y estantes de la sala' });

    await user.hover(within(panel).getByText('Gaveta A-2'));
    expect(screen.getByTestId('mapa-estado').textContent).toContain('resaltados=3');
    await user.unhover(within(panel).getByText('Gaveta A-2'));
    expect(screen.getByTestId('mapa-estado').textContent).toContain('resaltados= ');
  });

  it('la pestaña Estantes lista los de la sala y elegir uno filtra los cajones', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', { name: 'Cajones y estantes de la sala' });

    await user.click(within(panel).getByRole('tab', { name: /Estantes/ }));
    await user.click(within(panel).getByRole('button', { name: /EST-B1/ }));

    expect(within(panel).getByRole('tab', { name: /Cajones/ }).getAttribute('aria-selected')).toBe('true');
    expect(within(panel).getByText('Este estante no tiene cajones.')).toBeDefined();
  });

  it('filtra los cajones por texto', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', { name: 'Cajones y estantes de la sala' });

    await user.type(within(panel).getByLabelText('Filtrar cajones por código, estante o descripción'), 'cables');
    expect(within(panel).getByText('Gaveta A-1')).toBeDefined();
    expect(within(panel).queryByText('Gaveta A-2')).toBeNull();
  });
});

describe('UbicacionesPage · pantallas angostas (docs/ubicaciones-distribucion.md)', () => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 390 });
  });

  afterEach(() => {
    if (original) Object.defineProperty(HTMLElement.prototype, 'clientWidth', original);
  });

  it('elige la sala en un selector, el plano usa su proporción y el panel se abre como hoja', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    expect(screen.queryByRole('region', { name: 'Salas y recintos' })).toBeNull();
    expect(screen.getByTestId('mapa-estado').textContent).toContain('fit=aspect');
    expect(screen.queryByRole('complementary', { name: 'Cajones y estantes de la sala' })).toBeNull();

    await user.selectOptions(screen.getByLabelText('Sala o recinto'), '2');
    expect(screen.getByTestId('sala-mapa-panel').textContent).toContain('mapa sala=2');
    await user.selectOptions(screen.getByLabelText('Sala o recinto'), '1');

    await user.click(screen.getByRole('button', { name: /^Cajones \(2\)/ }));
    const hoja = await screen.findByRole('dialog', { name: 'Cajones y estantes de «Pañol Central»' });
    expect(within(hoja).getByText('Gaveta A-1')).toBeDefined();
  });

  it('tocar un estante abre la hoja ya filtrada', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: 'Tocar EST-A1 en el plano' }));
    const hoja = await screen.findByRole('dialog', { name: 'Cajones y estantes de «Pañol Central»' });
    expect(within(hoja).getByText('Gaveta A-2')).toBeDefined();
    expect(within(hoja).queryByText('Gaveta A-1')).toBeNull();
  });

  it('editar la sala sigue a mano junto al selector', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole('button', { name: 'Editar Pañol Central' }));
    expect(codeInput().value).toBe('PCENTRAL');
  });
});


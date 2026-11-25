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
  exportReport: vi.fn(),
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
    products_count: 5,
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
  {
    id: 3,
    codigo: 'EST-A1',
    nombre: 'Rack',
    zona_id: 1,
    cajones: [{ id: 12, codigo: 'Gaveta A-2', barcode: 'PCENTRAL-GAVETA-A-2', products_count: 1, units_count: 2, lleno: true }],
    items_count: 3,
  },
  { id: 4, codigo: 'EST-B1', nombre: null, zona_id: null, cajones: [], items_count: 0 },
] as unknown as Estante[];

const CONTENIDO_EST_A1 = {
  estante: ESTANTES[0],
  zona: { id: 1, nombre: 'Zona A' },
  location: { id: 1, code: 'PCENTRAL', nombre: 'Pañol Central' },
  cajones: [
    {
      id: 12,
      codigo: 'Gaveta A-2',
      barcode: 'PCENTRAL-GAVETA-A-2',
      descripcion: null,
      lleno: true,
      productos: [{ id: 40, name: 'Guantes de nitrilo', type: 'insumo', barcode: null, quantity: 3, stock_minimo: 5, is_critical: true }],
      unidades: [{ product_id: 50, product_name: 'Multímetro', type: 'equipo', total: 2, by_status: { disponible: 2, prestado: 0, en_reparacion: 0 } }],
    },
  ],
};

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
  useEstanteContenido: (id?: number) => ({
    data: id === 3 ? CONTENIDO_EST_A1 : undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useProducts: (_params: unknown, options?: { enabled?: boolean }) => ({
    data: options?.enabled ? { data: [{ id: 70, nombre: 'Cinta aislante', stock: 9, stockCritico: 2 }] } : undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useSalaMapa: (id?: number) => ({
    data: id === 1 ? { estantes: ESTANTES, zonas: [{ id: 1, nombre: 'Zona A' }] } : undefined,
    isLoading: false,
  }),
  useDeleteCajon: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useExportReport: () => ({ mutateAsync: mocks.exportReport, isPending: false }),
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

/** Con texto en el buscador del panel se despliegan todos los estantes con coincidencias. */
async function expandAll(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Buscar estante o cajón por código o descripción'), 'PCENTRAL');
}

describe('UbicacionesPage (REQ-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra las salas y cajones con sus códigos', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    await expandAll(user);

    expect(screen.getByText(/Gestión de Ubicaciones Físicas y Cajones/i)).toBeDefined();
    expect(screen.getByText('Pañol Central')).toBeDefined();
    expect(screen.getByText('PCENTRAL')).toBeDefined();
    expect(screen.getByText('L201')).toBeDefined();
    expect(screen.getByText('PCENTRAL-GAVETA-A-1').className).toContain('font-code');
  });

  it('exporta las ubicaciones a Excel con los filtros de la lista', async () => {
    const user = userEvent.setup();
    mocks.exportReport.mockResolvedValue({ blob: new Blob(['x']), filename: 'ubicaciones.xlsx', truncated: false });
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    expect(mocks.exportReport).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/locations/export', params: { search: undefined, tipo: undefined } }),
    );
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
    await expandAll(user);

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

  it('los cajones sin estante van en su propio grupo al final', () => {
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const grupos = within(screen.getByRole('list', { name: 'Estantes' })).getAllByRole('button', { expanded: false });
    expect(grupos.map((b) => b.textContent)).toEqual([
      'EST-A1RackZona A · 1 cajón · 3 elementos',
      'EST-B1Sin zona · 0 cajones · 0 elementos',
      'Sin estante1 cajón · 5 elementos',
    ]);
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
    await expandAll(user);

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

  const ASIDE = { name: 'Estantes y cajones de la sala' };

  it('en pantallas anchas muestra salas, plano y panel acoplado; el botón lo cierra y se recuerda', async () => {
    const user = userEvent.setup();
    const view = render(<UbicacionesPage />, { wrapper: MemoryRouter });

    expect(screen.getByTestId('mapa-estado').textContent).toContain('fit=fill');
    expect(screen.getByRole('complementary', ASIDE)).toBeDefined();
    const toggle = screen.getByRole('button', { name: /^Estantes \(2\)/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe('ubicaciones-panel');

    await user.click(toggle);
    expect(screen.queryByRole('complementary', ASIDE)).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(localStorage.getItem('sgia-ubicaciones-panel')).toBe('closed');

    view.unmount();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    expect(screen.queryByRole('complementary', ASIDE)).toBeNull();
  });

  it('cada sala ocupa una línea y su tipo y descripción van en el title', () => {
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const fila = screen.getByText('Laboratorio 201').closest('li')!;
    expect(fila.getAttribute('title')).toBe('Sala · Piso 2');
  });

  it('el panel muestra solo estantes, sin pestañas; al hacer clic en uno se despliegan sus cajones (uno a la vez)', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', ASIDE);

    expect(within(panel).queryByRole('tab')).toBeNull();
    expect(within(panel).queryByText('PCENTRAL-GAVETA-A-2')).toBeNull();

    const estA1 = within(panel).getByRole('button', { name: /EST-A1/ });
    await user.click(estA1);
    expect(estA1.getAttribute('aria-expanded')).toBe('true');
    const region = within(panel).getByRole('region', { name: 'Cajones de EST-A1' });
    expect(estA1.getAttribute('aria-controls')).toBe(region.id);
    expect(within(region).getByText('PCENTRAL-GAVETA-A-2')).toBeDefined();
    expect(within(region).getByText('elementos', { exact: false }).textContent).toBe('3 elementos');
    expect(screen.getByTestId('mapa-estado').textContent).toContain('resaltados=3');

    // Abrir otro estante cierra el anterior.
    await user.click(within(panel).getByRole('button', { name: /Sin estante/ }));
    expect(estA1.getAttribute('aria-expanded')).toBe('false');
    expect(within(panel).getByRole('region', { name: 'Cajones de Sin estante' })).toBeDefined();
    expect(within(panel).getByText('PCENTRAL-GAVETA-A-1')).toBeDefined();

    // Volver a tocarlo lo pliega.
    await user.click(within(panel).getByRole('button', { name: /Sin estante/ }));
    expect(within(panel).queryByRole('region')).toBeNull();
  });

  it('clic en un cajón abre un pop-up con la lista de sus elementos', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', ASIDE);

    await user.click(within(panel).getByRole('button', { name: /EST-A1/ }));
    await user.click(within(panel).getByRole('button', { name: /^PCENTRAL-GAVETA-A-2/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Cajón PCENTRAL-GAVETA-A-2' });
    expect(within(dialog).getByText('3 elementos')).toBeDefined();
    expect(within(dialog).getByText('Guantes de nitrilo')).toBeDefined();
    expect(within(dialog).getByText('Multímetro')).toBeDefined();
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('un cajón sin estante muestra los productos guardados en él', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', ASIDE);

    await user.click(within(panel).getByRole('button', { name: /Sin estante/ }));
    await user.click(within(panel).getByRole('button', { name: /^PCENTRAL-GAVETA-A-1/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Cajón PCENTRAL-GAVETA-A-1' });
    expect(within(dialog).getByText('Cinta aislante')).toBeDefined();
  });

  it('tocar un estante en el plano lo despliega en el panel; «Ver todo el estante» abre su contenido', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', ASIDE);

    await user.click(screen.getByRole('button', { name: 'Tocar EST-A1 en el plano' }));
    expect(within(panel).getByRole('button', { name: /EST-A1/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('mapa-estado').textContent).toContain('resaltados=3');

    await user.click(within(panel).getByRole('button', { name: 'Ver todo el estante' }));
    expect(screen.getByTestId('mapa-estado').textContent).toContain('contenido=3');
  });

  it('pasar el mouse por un estante de la lista lo resalta en el plano', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', ASIDE);

    await user.hover(within(panel).getByRole('button', { name: /EST-B1/ }));
    expect(screen.getByTestId('mapa-estado').textContent).toContain('resaltados=4');
    await user.unhover(within(panel).getByRole('button', { name: /EST-B1/ }));
    expect(screen.getByTestId('mapa-estado').textContent).toContain('resaltados= ');
  });

  it('el buscador del panel muestra los estantes con coincidencias, ya desplegados', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    const panel = screen.getByRole('complementary', ASIDE);

    await user.type(within(panel).getByLabelText('Buscar estante o cajón por código o descripción'), 'cables');
    expect(within(panel).getByText('PCENTRAL-GAVETA-A-1')).toBeDefined();
    expect(within(panel).queryByRole('button', { name: /EST-A1/ })).toBeNull();

    await user.clear(within(panel).getByLabelText('Buscar estante o cajón por código o descripción'));
    await user.type(within(panel).getByLabelText('Buscar estante o cajón por código o descripción'), 'zzz');
    expect(within(panel).getByText('Ningún estante o cajón coincide con «zzz».')).toBeDefined();
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
    expect(screen.queryByRole('complementary', { name: 'Estantes y cajones de la sala' })).toBeNull();

    await user.selectOptions(screen.getByLabelText('Sala o recinto'), '2');
    expect(screen.getByTestId('sala-mapa-panel').textContent).toContain('mapa sala=2');
    await user.selectOptions(screen.getByLabelText('Sala o recinto'), '1');

    await user.click(screen.getByRole('button', { name: /^Estantes \(2\)/ }));
    const hoja = await screen.findByRole('dialog', { name: 'Estantes y cajones de «Pañol Central»' });
    expect(within(hoja).getByRole('button', { name: /EST-A1/ })).toBeDefined();
  });

  it('tocar un estante en el plano abre la hoja con ese estante desplegado y el cajón abre su pop-up encima', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: 'Tocar EST-A1 en el plano' }));
    const hoja = await screen.findByRole('dialog', { name: 'Estantes y cajones de «Pañol Central»' });
    expect(within(hoja).getByRole('region', { name: 'Cajones de EST-A1' })).toBeDefined();

    await user.click(within(hoja).getByRole('button', { name: /^PCENTRAL-GAVETA-A-2/ }));
    expect(await screen.findByRole('dialog', { name: 'Cajón PCENTRAL-GAVETA-A-2' })).toBeDefined();
  });

  it('editar la sala sigue a mano junto al selector', async () => {
    const user = userEvent.setup();
    render(<UbicacionesPage />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole('button', { name: 'Editar Pañol Central' }));
    expect(codeInput().value).toBe('PCENTRAL');
  });
});

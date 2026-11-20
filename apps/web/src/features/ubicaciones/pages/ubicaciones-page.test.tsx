import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiRequestError } from '@sgia/api-client';
import type { CajonEntity, LocationEntity } from '@sgia/types';
import UbicacionesPage from './ubicaciones-page';

const mocks = vi.hoisted(() => ({
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
  createCajon: vi.fn(),
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
];

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

describe('UbicacionesPage · acceso al mapa (REQ-22)', () => {
  it('cada sala enlaza a su mapa', () => {
    render(<UbicacionesPage />, { wrapper: MemoryRouter });

    expect(screen.getByRole('link', { name: 'Ver mapa de Laboratorio 201' }).getAttribute('href')).toBe('/mapa-salas/2');
  });
});

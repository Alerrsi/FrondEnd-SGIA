import { vi } from 'vitest';
import type { CajonEntity, LocationEntity, Producto, SalaMapa } from '@sgia/types';

import { CONTENIDO, makeMapa } from './test-fixtures';

// Estado y dobles de `@sgia/api-client` para las pruebas de la página del mapa (REQ-22).

export const apiState = {
  mapa: makeMapa() as SalaMapa | undefined,
  cajones: [] as CajonEntity[],
  products: [] as Pick<Producto, 'id' | 'cajon_id'>[],
  updateEstante: vi.fn(),
  updateZona: vi.fn(),
  createEstante: vi.fn(),
  createZona: vi.fn(),
  updateLocation: vi.fn(),
  updateCajon: vi.fn(),
  prefetch: vi.fn(),
};

export function resetApiState() {
  apiState.mapa = makeMapa();
  apiState.cajones = [];
  apiState.products = [];
  for (const key of ['updateEstante', 'updateZona', 'createEstante', 'createZona', 'updateLocation', 'updateCajon', 'prefetch'] as const) {
    apiState[key].mockReset();
  }
}

export const SALAS: LocationEntity[] = [
  { id: 7, code: 'L206', nombre: 'Laboratorio 206', tipo: 'sala' },
  { id: 8, code: 'PCENTRAL', nombre: 'Pañol Central', tipo: 'panol' },
];

const mutation = (fn: ReturnType<typeof vi.fn>) => ({ mutate: fn, mutateAsync: fn, isPending: false });

export function buildApiMock() {
  return {
    useLocations: () => ({ data: { data: SALAS }, isLoading: false }),
    useSalaMapa: (id?: number) => ({
      data: id === 7 ? apiState.mapa : undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    usePrefetchEstanteContenido: () => apiState.prefetch,
    useEstanteContenido: (id?: number) => ({ data: id ? CONTENIDO : undefined, isLoading: false, isError: false, refetch: vi.fn() }),
    useUpdateEstante: () => mutation(apiState.updateEstante),
    useUpdateZona: () => mutation(apiState.updateZona),
    useCreateEstante: () => mutation(apiState.createEstante),
    useDeleteEstante: () => mutation(vi.fn()),
    useCreateZona: () => mutation(apiState.createZona),
    useDeleteZona: () => mutation(vi.fn()),
    useUpdateLocation: () => mutation(apiState.updateLocation),
    useUpdateCajon: () => mutation(apiState.updateCajon),
    useProducts: (_params?: unknown, options?: { enabled?: boolean }) => ({
      data: options?.enabled === false ? undefined : { data: apiState.products },
      isFetching: false,
    }),
    useCajones: (params?: { location_id?: number; estante_id?: number; sin_estante?: boolean }) => ({
      data: {
        data: apiState.cajones.filter(
          (cajon) =>
            (params?.location_id === undefined || cajon.location_id === params.location_id) &&
            (params?.sin_estante ? !cajon.estante_id : cajon.estante_id === params?.estante_id),
        ),
      },
      isLoading: false,
    }),
  };
}

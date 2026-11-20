import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  CreateEstantePayload,
  CreateZonaPayload,
  Estante,
  EstanteContenido,
  EstanteQueryParams,
  PaginatedResponse,
  SalaMapa,
  UpdateEstantePayload,
  UpdateZonaPayload,
  Zona,
} from '@sgia/types';
import {
  createEstante,
  createZona,
  deleteEstante,
  deleteZona,
  fetchEstanteContenido,
  fetchEstantes,
  fetchSalaMapa,
  updateEstante,
  updateZona,
} from '../services/room-map';
import { cajonKeys } from './locations';

/** Bajo `['locations']`: cualquier cambio de salas o cajones (que invalida `locationKeys.all`) refresca el mapa. */
export const salaMapaKeys = {
  all: ['locations', 'map'] as const,
  detail: (locationId: number) => ['locations', 'map', locationId] as const,
};

export const estanteKeys = {
  all: ['estantes'] as const,
  list: (params?: EstanteQueryParams) => ['estantes', 'list', params] as const,
  contents: (id: number) => ['estantes', 'contents', id] as const,
};

const CONTENTS_STALE_MS = 30_000;

export function useSalaMapa(locationId: number | undefined) {
  return useQuery<SalaMapa>({
    queryKey: salaMapaKeys.detail(locationId ?? 0),
    queryFn: () => fetchSalaMapa(locationId!),
    enabled: locationId !== undefined && locationId > 0,
  });
}

export function useEstantes(params?: EstanteQueryParams, enabled = true) {
  return useQuery<PaginatedResponse<Estante>>({
    queryKey: estanteKeys.list(params),
    queryFn: () => fetchEstantes(params),
    enabled,
  });
}

export function useEstanteContenido(id: number | undefined) {
  return useQuery<EstanteContenido>({
    queryKey: estanteKeys.contents(id ?? 0),
    queryFn: () => fetchEstanteContenido(id!),
    enabled: id !== undefined,
    staleTime: CONTENTS_STALE_MS,
  });
}

/** Prefetch del pop-up al pasar el puntero o enfocar un estante. */
export function usePrefetchEstanteContenido() {
  const queryClient = useQueryClient();
  return (id: number) =>
    queryClient.prefetchQuery({
      queryKey: estanteKeys.contents(id),
      queryFn: () => fetchEstanteContenido(id),
      staleTime: CONTENTS_STALE_MS,
    });
}

function invalidateMap(queryClient: QueryClient, locationId: number) {
  void queryClient.invalidateQueries({ queryKey: salaMapaKeys.detail(locationId) });
  void queryClient.invalidateQueries({ queryKey: estanteKeys.all });
}

interface MapSnapshot {
  previous: SalaMapa | undefined;
}

/** Aplica `change` al mapa en caché antes de la respuesta; devuelve la foto anterior para volver atrás. */
async function patchCachedMap(
  queryClient: QueryClient,
  locationId: number,
  change: (map: SalaMapa) => SalaMapa,
): Promise<MapSnapshot> {
  const key = salaMapaKeys.detail(locationId);
  await queryClient.cancelQueries({ queryKey: key });
  const previous = queryClient.getQueryData<SalaMapa>(key);
  if (previous) queryClient.setQueryData<SalaMapa>(key, change(previous));
  return { previous };
}

function restoreMap(queryClient: QueryClient, locationId: number, snapshot: MapSnapshot | undefined) {
  if (snapshot?.previous) queryClient.setQueryData(salaMapaKeys.detail(locationId), snapshot.previous);
}

export function useCreateEstante() {
  const queryClient = useQueryClient();
  return useMutation<Estante, Error, CreateEstantePayload>({
    mutationFn: createEstante,
    onSuccess: (estante) => {
      queryClient.setQueryData<SalaMapa>(salaMapaKeys.detail(estante.location_id), (map) =>
        map ? { ...map, estantes: [...map.estantes, estante] } : map,
      );
      invalidateMap(queryClient, estante.location_id);
    },
  });
}

export interface UpdateEstanteVariables {
  id: number;
  locationId: number;
  payload: UpdateEstantePayload;
}

/** Optimista: el estante queda donde se soltó y vuelve atrás si la API responde error (p. ej. `422`). */
export function useUpdateEstante() {
  const queryClient = useQueryClient();
  return useMutation<Estante, Error, UpdateEstanteVariables, MapSnapshot>({
    mutationFn: ({ id, payload }) => updateEstante(id, payload),
    onMutate: ({ id, locationId, payload }) =>
      patchCachedMap(queryClient, locationId, (map) => ({
        ...map,
        estantes: map.estantes.map((estante) =>
          estante.id === id
            ? { ...estante, ...payload, codigo: payload.codigo?.toUpperCase() ?? estante.codigo }
            : estante,
        ),
      })),
    onError: (_error, { locationId }, snapshot) => restoreMap(queryClient, locationId, snapshot),
    onSettled: (_data, _error, { locationId }) => invalidateMap(queryClient, locationId),
  });
}

export function useDeleteEstante() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; locationId: number }>({
    mutationFn: ({ id }) => deleteEstante(id),
    onSuccess: (_data, { locationId }) => {
      invalidateMap(queryClient, locationId);
      void queryClient.invalidateQueries({ queryKey: cajonKeys.all });
    },
  });
}

export function useCreateZona() {
  const queryClient = useQueryClient();
  return useMutation<Zona, Error, CreateZonaPayload>({
    mutationFn: createZona,
    onSuccess: (zona) => invalidateMap(queryClient, zona.location_id),
  });
}

export interface UpdateZonaVariables {
  id: number;
  locationId: number;
  payload: UpdateZonaPayload;
}

/** Optimista, igual que el estante: mover o redimensionar una zona no espera a la API. */
export function useUpdateZona() {
  const queryClient = useQueryClient();
  return useMutation<Zona, Error, UpdateZonaVariables, MapSnapshot>({
    mutationFn: ({ id, payload }) => updateZona(id, payload),
    onMutate: ({ id, locationId, payload }) =>
      patchCachedMap(queryClient, locationId, (map) => ({
        ...map,
        zonas: map.zonas.map((zona) => (zona.id === id ? { ...zona, ...payload } : zona)),
      })),
    onError: (_error, { locationId }, snapshot) => restoreMap(queryClient, locationId, snapshot),
    onSettled: (_data, _error, { locationId }) => invalidateMap(queryClient, locationId),
  });
}

export function useDeleteZona() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; locationId: number }>({
    mutationFn: ({ id }) => deleteZona(id),
    onSuccess: (_data, { locationId }) => invalidateMap(queryClient, locationId),
  });
}

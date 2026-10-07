import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CajonEntity,
  CajonQueryParams,
  CreateCajonPayload,
  CreateLocationPayload,
  LocationEntity,
  LocationQueryParams,
  PaginatedResponse,
  UpdateCajonPayload,
  UpdateLocationPayload,
} from '@sgia/types';
import {
  createCajon,
  createLocation,
  deleteCajon,
  deleteLocation,
  fetchCajon,
  fetchCajones,
  fetchLocation,
  fetchLocations,
  updateCajon,
  updateLocation,
} from '../services/locations';

export const locationKeys = {
  all: ['locations'] as const,
  list: (params?: LocationQueryParams) => ['locations', 'list', params] as const,
  detail: (id: number) => ['locations', 'detail', id] as const,
};

export const cajonKeys = {
  all: ['cajones'] as const,
  list: (params?: CajonQueryParams) => ['cajones', 'list', params] as const,
  detail: (id: number) => ['cajones', 'detail', id] as const,
};

export function useLocations(params?: LocationQueryParams) {
  return useQuery<PaginatedResponse<LocationEntity>>({
    queryKey: locationKeys.list(params),
    queryFn: () => fetchLocations(params),
  });
}

export function useLocation(id: number | undefined) {
  return useQuery<LocationEntity>({
    queryKey: locationKeys.detail(id!),
    queryFn: () => fetchLocation(id!),
    enabled: id !== undefined,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation<LocationEntity, Error, CreateLocationPayload>({
    mutationFn: createLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation<LocationEntity, Error, { id: number; payload: UpdateLocationPayload }>({
    mutationFn: ({ id, payload }) => updateLocation(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteLocation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
  });
}

export function useCajones(params?: CajonQueryParams) {
  return useQuery<PaginatedResponse<CajonEntity>>({
    queryKey: cajonKeys.list(params),
    queryFn: () => fetchCajones(params),
  });
}

export function useCajon(id: number | undefined) {
  return useQuery<CajonEntity>({
    queryKey: cajonKeys.detail(id!),
    queryFn: () => fetchCajon(id!),
    enabled: id !== undefined,
  });
}

export function useCreateCajon() {
  const queryClient = useQueryClient();
  return useMutation<CajonEntity, Error, CreateCajonPayload>({
    mutationFn: createCajon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cajonKeys.all });
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

export function useUpdateCajon() {
  const queryClient = useQueryClient();
  return useMutation<CajonEntity, Error, { id: number; payload: UpdateCajonPayload }>({
    mutationFn: ({ id, payload }) => updateCajon(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cajonKeys.all });
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

export function useDeleteCajon() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteCajon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cajonKeys.all });
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

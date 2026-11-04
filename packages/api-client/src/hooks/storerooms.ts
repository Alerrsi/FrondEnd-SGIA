import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AuditLogQueryParams,
  CreateStoreroomPayload,
  RoleCatalogItem,
  Storeroom,
  StoreroomId,
  StoreroomQueryParams,
  UpdateStoreroomPayload,
} from '@sgia/types';
import {
  createStoreroom,
  deleteStoreroom,
  fetchAuditLogs,
  fetchRoles,
  fetchStoreroom,
  fetchStorerooms,
  updateStoreroom,
} from '../services/storerooms';

export const storeroomKeys = {
  all: ['storerooms'] as const,
  list: (params?: StoreroomQueryParams) => ['storerooms', 'list', params] as const,
  detail: (id: StoreroomId) => ['storerooms', 'detail', String(id)] as const,
};

export const roleKeys = {
  all: ['roles'] as const,
};

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (params?: AuditLogQueryParams) => ['audit-logs', 'list', params] as const,
};

export function useStorerooms(params?: StoreroomQueryParams) {
  return useQuery({
    queryKey: storeroomKeys.list(params),
    queryFn: () => fetchStorerooms(params),
    placeholderData: keepPreviousData,
  });
}

export function useStoreroom(id: StoreroomId | undefined) {
  return useQuery({
    queryKey: storeroomKeys.detail(id ?? ''),
    queryFn: () => fetchStoreroom(id as StoreroomId),
    enabled: id !== undefined && id !== '',
  });
}

export function useCreateStoreroom() {
  const queryClient = useQueryClient();
  return useMutation<Storeroom, Error, CreateStoreroomPayload>({
    mutationFn: createStoreroom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeroomKeys.all }),
  });
}

export function useUpdateStoreroom() {
  const queryClient = useQueryClient();
  return useMutation<Storeroom, Error, { id: StoreroomId; payload: UpdateStoreroomPayload }>({
    mutationFn: ({ id, payload }) => updateStoreroom(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeroomKeys.all }),
  });
}

export function useDeleteStoreroom() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, StoreroomId>({
    mutationFn: deleteStoreroom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeroomKeys.all }),
  });
}

/** Catálogo fijo de roles (AD-01): no cambia durante la sesión. */
export function useRoles(options?: { enabled?: boolean }) {
  return useQuery<RoleCatalogItem[]>({
    queryKey: roleKeys.all,
    queryFn: fetchRoles,
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
  });
}

export function useAuditLogs(params?: AuditLogQueryParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
  });
}

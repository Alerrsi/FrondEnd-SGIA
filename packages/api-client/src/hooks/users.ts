import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateUsuarioPayload,
  UpdateUsuarioPayload,
  UserQueryParams,
  UsuarioSinPassword,
} from '@sgia/types';
import {
  createUsuario,
  deleteUsuario,
  fetchUser,
  fetchUsers,
  setUsuarioActivo,
  updateUsuario,
} from '../services/users';

export const userKeys = {
  all: ['users'] as const,
  list: (params?: UserQueryParams) => ['users', 'list', params] as const,
  detail: (id: number) => ['users', 'detail', id] as const,
};

export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
  });
}

export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => fetchUser(id!),
    enabled: id !== undefined,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation<UsuarioSinPassword, Error, CreateUsuarioPayload>(
    {
      mutationFn: createUsuario,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
    },
  );
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation<
    UsuarioSinPassword,
    Error,
    { id: number; payload: UpdateUsuarioPayload }
  >({
    mutationFn: ({ id, payload }) => updateUsuario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useToggleUsuarioActivo() {
  const queryClient = useQueryClient();
  return useMutation<
    UsuarioSinPassword,
    Error,
    { id: number; activo: boolean }
  >({
    mutationFn: ({ id, activo }) => setUsuarioActivo(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id: number) => deleteUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateUsuarioPayload,
  UpdateUsuarioPayload,
  UsuarioSinPassword,
} from '@sgia/types';
import { createUsuario, fetchUser, fetchUsers, setUsuarioActivo, updateUsuario } from '../services/users';

export const userKeys = {
  all: ['usuarios'] as const,
  detail: (id: number) => ['usuarios', 'detail', id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: fetchUsers,
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
  return useMutation<UsuarioSinPassword, Error, CreateUsuarioPayload>({
    mutationFn: createUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Usuario } from '@sgia/types';
import type { TokenStorage } from '../http';
import { fetchCurrentUser, login, logout, type LoginPayload } from '../services/auth';

export const authKeys = {
  currentUser: ['auth', 'me'] as const,
};

export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: fetchCurrentUser,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useLogin(storage: TokenStorage) {
  const queryClient = useQueryClient();
  return useMutation<Usuario, Error, LoginPayload>({
    mutationFn: (payload) => login(payload, storage),
    onSuccess: (usuario) => {
      queryClient.setQueryData(authKeys.currentUser, usuario);
    },
  });
}

export function useLogout(storage: TokenStorage) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => logout(storage),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.currentUser, null);
      queryClient.clear();
    },
  });
}

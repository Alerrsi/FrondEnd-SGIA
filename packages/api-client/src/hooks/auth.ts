import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Usuario } from '@sgia/types';
import type { TokenStorage } from '../http';
import {
  changePassword,
  fetchCurrentUser,
  fetchTokens,
  login,
  logout,
  revokeOtherTokens,
  type ChangePasswordPayload,
  type LoginPayload,
} from '../services/auth';

export const authKeys = {
  currentUser: ['auth', 'me'] as const,
  tokens: ['auth', 'tokens'] as const,
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

export function useChangePassword() {
  return useMutation<{ message: string }, Error, ChangePasswordPayload>({
    mutationFn: changePassword,
  });
}

export function useTokens(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authKeys.tokens,
    queryFn: fetchTokens,
    enabled: options?.enabled ?? true,
  });
}

export function useRevokeOtherTokens() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: revokeOtherTokens,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.tokens }),
  });
}

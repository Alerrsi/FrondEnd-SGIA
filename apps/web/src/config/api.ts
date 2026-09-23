import { configureApiClient, createSgiaQueryClient } from '@sgia/api-client';
import type { TokenStorage } from '@sgia/api-client';

const TOKEN_KEY = 'sgia_token';

export const tokenStorage: TokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

const apiUrl = (import.meta.env.SGIA_API_URL as string | undefined) ?? '/api/v1';

configureApiClient({ baseUrl: apiUrl, tokenStorage });

export const queryClient = createSgiaQueryClient();

export function getStoredToken(): ReturnType<TokenStorage['getToken']> {
  return tokenStorage.getToken();
}
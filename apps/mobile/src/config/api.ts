import { configureApiClient, createSgiaQueryClient } from '@sgia/api-client';
import type { TokenStorage } from '@sgia/api-client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'sgia_token';

// SecureStore no existe en web: ahí se usa localStorage (solo para probar en navegador)
const webStorage: TokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

const nativeStorage: TokenStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clearToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export const tokenStorage = Platform.OS === 'web' ? webStorage : nativeStorage;

configureApiClient({
  baseUrl: process.env.EXPO_PUBLIC_SGIA_API_URL ?? 'http://localhost:8000/api',
  tokenStorage,
});

export const queryClient = createSgiaQueryClient();

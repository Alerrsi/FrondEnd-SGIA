import type { AuthResponse, Usuario } from '@sgia/types';
import { get, post, type TokenStorage } from '../http';

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload, storage: TokenStorage): Promise<Usuario> {
  const response = await post<LoginPayload, AuthResponse>('/auth/login', payload);
  await storage.setToken(response.token);
  return response.usuario;
}

export async function logout(storage: TokenStorage): Promise<void> {
  try {
    await post<void, void>('/auth/logout');
  } finally {
    await storage.clearToken();
  }
}

export async function fetchCurrentUser(): Promise<Usuario> {
  return get<Usuario>('/auth/me');
}
import type { RoleCode, Usuario } from '@sgia/types';
import { del, get, post, put, type TokenStorage } from '../http';

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: 'web' | 'mobile';
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ApiTokenInfo {
  id: number;
  name: string;
  device_name?: string;
  last_used_at?: string | null;
  created_at?: string;
  expires_at?: string | null;
}

const VALID_ROLE_CODES = new Set(['AD-01', 'DIR-01', 'PAN-01', 'PRO-01']);

export function normalizeRoleCode(raw: any): RoleCode {
  if (typeof raw?.role === 'string' && VALID_ROLE_CODES.has(raw.role.toUpperCase())) {
    return raw.role.toUpperCase() as RoleCode;
  }
  if (typeof raw?.rol === 'string' && VALID_ROLE_CODES.has(raw.rol.toUpperCase())) {
    return raw.rol.toUpperCase() as RoleCode;
  }
  if (typeof raw?.rol_id === 'number') {
    if (raw.rol_id === 1) return 'AD-01';
    if (raw.rol_id === 2) return 'DIR-01';
    if (raw.rol_id === 3) return 'PAN-01';
    if (raw.rol_id === 4 || raw.rol_id === 5) return 'PRO-01';
  }
  const text = String(raw?.rol ?? raw?.role ?? '').toLowerCase();
  if (text.includes('admin')) return 'AD-01';
  if (text.includes('director') || text.includes('coordinador')) return 'DIR-01';
  if (text.includes('pañol') || text.includes('panol')) return 'PAN-01';
  if (text.includes('docente') || text.includes('profesor')) return 'PRO-01';

  return 'PRO-01';
}

export function normalizeUser(raw: any): Usuario {
  if (!raw) return raw;
  const roleCode = normalizeRoleCode(raw);
  return {
    id: raw.id,
    run: raw.run ?? '',
    nombre: raw.nombre ?? raw.name ?? '',
    name: raw.name ?? raw.nombre ?? '',
    email: raw.email,
    rol: roleCode,
    role: roleCode,
    area: raw.area ?? null,
    activo: raw.activo ?? raw.is_active ?? true,
    is_active: raw.is_active ?? raw.activo ?? true,
    createdAt: raw.createdAt ?? raw.created_at ?? '',
    created_at: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? raw.updated_at ?? '',
    updated_at: raw.updated_at ?? raw.updatedAt ?? '',
    lastLoginAt: raw.lastLoginAt ?? raw.last_login_at ?? null,
    last_login_at: raw.last_login_at ?? raw.lastLoginAt ?? null,
  };
}

export async function login(payload: LoginPayload, storage: TokenStorage): Promise<Usuario> {
  const body: LoginPayload = {
    device_name: payload.device_name ?? 'web',
    ...payload,
  };
  const response = await post<LoginPayload, any>('/login', body);
  const token = response?.token ?? response?.access_token;
  if (token) {
    await storage.setToken(token);
  }
  const rawUser = response?.usuario ?? response?.user ?? response?.data;
  return normalizeUser(rawUser);
}

export async function logout(storage: TokenStorage): Promise<void> {
  try {
    await post<void, void>('/logout');
  } finally {
    await storage.clearToken();
  }
}

export async function logoutAll(storage: TokenStorage): Promise<void> {
  try {
    await post<void, void>('/logout-all');
  } finally {
    await storage.clearToken();
  }
}

export async function fetchCurrentUser(): Promise<Usuario> {
  const response = await get<any>('/me');
  const rawUser = response?.data ?? response;
  return normalizeUser(rawUser);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  return put<ChangePasswordPayload, { message: string }>('/password', payload);
}

export async function fetchTokens(): Promise<ApiTokenInfo[]> {
  const response = await get<any>('/tokens');
  return response?.tokens ?? response?.data ?? response;
}

export async function revokeToken(tokenId: number | string): Promise<void> {
  return del<void>(`/tokens/${tokenId}`);
}

export async function revokeOtherTokens(): Promise<void> {
  return post<void, void>('/tokens/revoke-others');
}

export async function revokeAllTokens(): Promise<void> {
  return post<void, void>('/tokens/revoke-all');
}

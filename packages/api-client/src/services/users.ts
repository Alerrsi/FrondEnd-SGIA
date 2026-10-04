import type {
  CreateUsuarioPayload,
  PaginatedResponse,
  UpdateUsuarioPayload,
  UserQueryParams,
  UsuarioSinPassword,
} from '@sgia/types';
import { del, get, patch, post } from '../http';
import { normalizeUser } from './auth';

function normalizePaginatedUsers(
  res: any,
): PaginatedResponse<UsuarioSinPassword> {
  const rawList = Array.isArray(res) ? res : res?.data ?? [];
  const data = rawList.map(normalizeUser);
  const meta = res?.meta ?? {
    currentPage: res?.current_page ?? 1,
    lastPage: res?.last_page ?? 1,
    perPage: res?.per_page ?? data.length,
    total: res?.total ?? data.length,
  };
  return { data, meta };
}

export async function fetchUsers(
  params?: UserQueryParams,
): Promise<PaginatedResponse<UsuarioSinPassword>> {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.area) query.set('area', params.area);
  if (params?.is_active !== undefined) query.set('is_active', String(params.is_active));
  if (params?.search) query.set('search', params.search);
  if (params?.per_page) query.set('per_page', String(params.per_page));
  if (params?.page) query.set('page', String(params.page));

  const qs = query.toString();
  const response = await get<any>(`/users${qs ? `?${qs}` : ''}`);
  return normalizePaginatedUsers(response);
}

export async function fetchUser(id: number): Promise<UsuarioSinPassword> {
  const response = await get<any>(`/users/${id}`);
  return normalizeUser(response?.data ?? response);
}

export async function createUsuario(payload: CreateUsuarioPayload): Promise<UsuarioSinPassword> {
  const body = {
    name: payload.nombre ?? payload.name,
    email: payload.email,
    role: payload.rol ?? payload.role,
    area: payload.area,
    password: payload.password,
    password_confirmation: payload.password_confirmation ?? payload.password,
    is_active: payload.activo ?? payload.is_active ?? true,
    run: payload.run,
  };
  const response = await post<any, any>('/users', body);
  return normalizeUser(response?.data ?? response);
}

export async function updateUsuario(
  id: number,
  payload: UpdateUsuarioPayload,
): Promise<UsuarioSinPassword> {
  const body: Record<string, any> = {};
  if (payload.nombre !== undefined || payload.name !== undefined) {
    body.name = payload.nombre ?? payload.name;
  }
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.rol !== undefined || payload.role !== undefined) {
    body.role = payload.rol ?? payload.role;
  }
  if (payload.area !== undefined) body.area = payload.area;
  if (payload.activo !== undefined || payload.is_active !== undefined) {
    body.is_active = payload.activo ?? payload.is_active;
  }
  if (payload.password) {
    body.password = payload.password;
    body.password_confirmation = payload.password_confirmation ?? payload.password;
  }

  const response = await patch<any, any>(`/users/${id}`, body);
  return normalizeUser(response?.data ?? response);
}

export async function deleteUsuario(id: number): Promise<void> {
  return del<void>(`/users/${id}`);
}

export async function setUsuarioActivo(id: number, activo: boolean): Promise<UsuarioSinPassword> {
  const response = await patch<{ is_active: boolean }, any>(`/users/${id}/status`, {
    is_active: activo,
  });
  return normalizeUser(response?.data ?? response);
}

import type {
  CreateUsuarioPayload,
  PaginatedResponse,
  UpdateUsuarioPayload,
  UsuarioSinPassword,
} from '@sgia/types';
import { get, patch, post } from '../http';

export async function fetchUsers(): Promise<PaginatedResponse<UsuarioSinPassword>> {
  return get<PaginatedResponse<UsuarioSinPassword>>('/usuarios');
}

export async function fetchUser(id: number): Promise<UsuarioSinPassword> {
  return get<UsuarioSinPassword>(`/usuarios/${id}`);
}

export async function createUsuario(payload: CreateUsuarioPayload): Promise<UsuarioSinPassword> {
  return post<CreateUsuarioPayload, UsuarioSinPassword>('/usuarios', payload);
}

export async function updateUsuario(
  id: number,
  payload: UpdateUsuarioPayload,
): Promise<UsuarioSinPassword> {
  return patch<UpdateUsuarioPayload, UsuarioSinPassword>(`/usuarios/${id}`, payload);
}

export async function setUsuarioActivo(id: number, activo: boolean): Promise<UsuarioSinPassword> {
  return patch<UpdateUsuarioPayload, UsuarioSinPassword>(`/usuarios/${id}`, { activo });
}
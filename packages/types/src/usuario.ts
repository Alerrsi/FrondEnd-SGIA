import type { Storeroom, StoreroomId } from './panol';
import type { Career } from './unidad';

export type RoleCode = 'AD-01' | 'DIR-01' | 'PAN-01' | 'PRO-01';

export const ROLES = ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01'] as const;

export const ROLE_LABELS: Record<RoleCode, string> = {
  'AD-01': 'Administrador',
  'DIR-01': 'Director / Coordinador',
  'PAN-01': 'Pañol',
  'PRO-01': 'Profesor',
};

export interface Usuario {
  id: number;
  run?: string;
  nombre: string;
  name?: string;
  email: string;
  rol_id?: number;
  rol: RoleCode;
  role?: RoleCode;
  /** Pañol por defecto del usuario (`null` = sin pañol). */
  storeroom_id?: StoreroomId | null;
  storeroom?: Storeroom | null;
  /** Carreras asignadas (listado, detalle, alta/edición y `GET /api/me`). */
  careers?: Career[];
  area?: string | null;
  activo: boolean;
  is_active?: boolean;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
  lastLoginAt?: string | null;
  last_login_at?: string | null;
}

export interface UsuarioSinPassword extends Usuario {
  lastLoginAt?: string | null;
}

export interface CreateUsuarioPayload {
  run?: string;
  nombre?: string;
  name?: string;
  email: string;
  rol?: RoleCode;
  role?: RoleCode | string;
  rol_id?: number;
  /** Pañol por defecto; `null` lo quita. */
  storeroom_id?: StoreroomId | null;
  /** Reemplaza las carreras del usuario; si no se envía, no se tocan. */
  career_ids?: number[];
  area?: string;
  password: string;
  password_confirmation?: string;
  activo?: boolean;
  is_active?: boolean;
}

export interface UpdateUsuarioPayload {
  nombre?: string;
  name?: string;
  email?: string;
  rol?: RoleCode;
  role?: RoleCode | string;
  rol_id?: number;
  /** Pañol por defecto; `null` lo quita. */
  storeroom_id?: StoreroomId | null;
  /** Reemplaza las carreras del usuario; si no se envía, no se tocan. */
  career_ids?: number[];
  area?: string | null;
  activo?: boolean;
  is_active?: boolean;
  password?: string;
  password_confirmation?: string;
}

export interface UserQueryParams {
  search?: string;
  role?: RoleCode | string;
  rol_id?: number;
  storeroom_id?: StoreroomId;
  career_id?: number;
  area?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}

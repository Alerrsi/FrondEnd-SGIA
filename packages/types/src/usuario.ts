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
  rol: RoleCode;
  role?: RoleCode;
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
  role?: RoleCode;
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
  role?: RoleCode;
  area?: string;
  activo?: boolean;
  is_active?: boolean;
  password?: string;
  password_confirmation?: string;
}

export interface UserQueryParams {
  role?: RoleCode;
  area?: string;
  is_active?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}

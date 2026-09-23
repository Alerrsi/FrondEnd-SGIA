export type RoleCode = 'AD-01' | 'DIR-01' | 'PAN-01' | 'PRO-01';

export const ROLES = ['AD-01', 'DIR-01', 'PAN-01', 'PRO-01'] as const;

export interface Usuario {
  id: number;
  run: string;
  nombre: string;
  email: string;
  rol: RoleCode;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioSinPassword extends Usuario {
  lastLoginAt?: string | null;
}

export interface CreateUsuarioPayload {
  run: string;
  nombre: string;
  email: string;
  rol: RoleCode;
  password: string;
}

export interface UpdateUsuarioPayload {
  nombre?: string;
  email?: string;
  rol?: RoleCode;
  activo?: boolean;
}
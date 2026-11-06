import type { Usuario } from './usuario';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  /** Código de negocio, p. ej. `over_budget` (422 al facturar sobre lo libre). */
  code?: string;
  over_by?: string | number;
  free_amount?: string | number;
  total?: string | number;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

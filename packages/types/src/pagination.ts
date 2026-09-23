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
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}
import type { RoleCode } from './usuario';

/**
 * Identificador de pañol. El backend lo usa tanto como código (`PAN-TEMUCO`) como id numérico
 * según el recurso: se trata como opaco y se reenvía tal cual.
 */
export type StoreroomId = string | number;

/** Pañol (§2.0a). Lectura: todos los roles; escritura: AD-01. */
export interface Storeroom {
  id: StoreroomId;
  name: string;
  /** Se guarda en mayúsculas; letras, números y guiones; único. */
  code: string;
  general_location?: string | null;
  locations_count?: number;
  users_count?: number;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface StoreroomQueryParams {
  /** Nombre o código. */
  search?: string;
  per_page?: number;
  page?: number;
}

export interface CreateStoreroomPayload {
  name: string;
  code: string;
  general_location?: string | null;
}

export type UpdateStoreroomPayload = Partial<CreateStoreroomPayload>;

/** Fila del catálogo fijo `GET /api/roles` (solo AD-01). */
export interface RoleCatalogItem {
  id: number;
  code: RoleCode;
  name: string;
}

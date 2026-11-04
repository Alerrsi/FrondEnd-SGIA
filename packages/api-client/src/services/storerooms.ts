import type {
  AuditLog,
  AuditLogQueryParams,
  CreateStoreroomPayload,
  PaginatedResponse,
  RoleCatalogItem,
  Storeroom,
  StoreroomId,
  StoreroomQueryParams,
  UpdateStoreroomPayload,
} from '@sgia/types';
import { del, get, patch, post } from '../http';
import { buildQuery, toPaginated, unwrap, type RawPaginated } from './shared';

// Administración (AD-01): pañoles (§2.0a), catálogo de roles (§2) y auditoría (§2.0b, REQ-NF-01).

// ---------------------------------------------------------------------------
// Pañoles. Lectura: todos los roles; escritura: AD-01.
// ---------------------------------------------------------------------------

export interface RawStoreroom {
  id: StoreroomId;
  name: string;
  code: string;
  general_location?: string | null;
  locations_count?: number | string | null;
  users_count?: number | string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

const toCount = (value: number | string | null | undefined): number | undefined =>
  value === undefined || value === null ? undefined : Number(value);

export function normalizeStoreroom(raw: RawStoreroom): Storeroom {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    general_location: raw.general_location ?? null,
    locations_count: toCount(raw.locations_count),
    users_count: toCount(raw.users_count),
    created_by: raw.created_by ?? null,
    updated_by: raw.updated_by ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

type StoreroomResponse = { data?: RawStoreroom } | RawStoreroom;

export async function fetchStorerooms(
  params?: StoreroomQueryParams,
): Promise<PaginatedResponse<Storeroom>> {
  const res = await get<RawPaginated<RawStoreroom>>(`/storerooms${buildQuery(params)}`);
  return toPaginated(res, normalizeStoreroom);
}

export async function fetchStoreroom(id: StoreroomId): Promise<Storeroom> {
  return normalizeStoreroom(unwrap(await get<StoreroomResponse>(`/storerooms/${id}`)));
}

/** El `code` se guarda en mayúsculas; letras, números y guiones; único. */
export async function createStoreroom(payload: CreateStoreroomPayload): Promise<Storeroom> {
  return normalizeStoreroom(
    unwrap(await post<CreateStoreroomPayload, StoreroomResponse>('/storerooms', payload)),
  );
}

export async function updateStoreroom(
  id: StoreroomId,
  payload: UpdateStoreroomPayload,
): Promise<Storeroom> {
  return normalizeStoreroom(
    unwrap(await patch<UpdateStoreroomPayload, StoreroomResponse>(`/storerooms/${id}`, payload)),
  );
}

/** `422` (`errors.storeroom`) si tiene salas, usuarios o préstamos. */
export async function deleteStoreroom(id: StoreroomId): Promise<void> {
  await del<void>(`/storerooms/${id}`);
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/** Catálogo fijo de roles para el formulario de usuarios. */
export async function fetchRoles(): Promise<RoleCatalogItem[]> {
  const res = await get<{ data?: RoleCatalogItem[] } | RoleCatalogItem[]>('/roles');
  return Array.isArray(res) ? res : (res?.data ?? []);
}

// ---------------------------------------------------------------------------
// Auditoría
// ---------------------------------------------------------------------------

/** Eventos críticos, solo lectura, más reciente primero. */
export async function fetchAuditLogs(
  params?: AuditLogQueryParams,
): Promise<PaginatedResponse<AuditLog>> {
  const res = await get<RawPaginated<AuditLog>>(`/audit-logs${buildQuery(params)}`);
  return toPaginated(res, (log) => log);
}

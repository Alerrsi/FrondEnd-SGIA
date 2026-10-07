import type {
  CajonEntity,
  CajonQueryParams,
  CreateCajonPayload,
  CreateLocationPayload,
  LocationEntity,
  LocationQueryParams,
  PaginatedResponse,
  UpdateCajonPayload,
  UpdateLocationPayload,
} from '@sgia/types';
import { del, get, patch, post } from '../http';

function normalizeLocation(raw: any): LocationEntity {
  if (!raw) return raw;
  return {
    id: raw.id,
    nombre: raw.nombre ?? raw.sala ?? '',
    tipo: raw.tipo ?? 'sala',
    sala: raw.sala ?? raw.nombre ?? '',
    cajon: raw.cajon ?? null,
    descripcion: raw.descripcion ?? raw.description ?? null,
    cajones_count: raw.cajones_count ?? (Array.isArray(raw.cajones) ? raw.cajones.length : 0),
    cajones: Array.isArray(raw.cajones) ? raw.cajones.map(normalizeCajon) : undefined,
    created_by: raw.created_by ?? null,
    updated_by: raw.updated_by ?? null,
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  };
}

function normalizeCajon(raw: any): CajonEntity {
  if (!raw) return raw;
  return {
    id: raw.id,
    codigo: raw.codigo ?? '',
    descripcion: raw.descripcion ?? raw.description ?? null,
    location_id: raw.location_id ?? raw.location?.id ?? 0,
    location: raw.location ? normalizeLocation(raw.location) : undefined,
    products_count: raw.products_count ?? 0,
    created_by: raw.created_by ?? null,
    updated_by: raw.updated_by ?? null,
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  };
}

function normalizePaginatedLocations(res: any): PaginatedResponse<LocationEntity> {
  const rawList = Array.isArray(res) ? res : res?.data ?? [];
  const data = rawList.map(normalizeLocation);
  const meta = res?.meta ?? {
    currentPage: res?.current_page ?? 1,
    lastPage: res?.last_page ?? 1,
    perPage: res?.per_page ?? data.length,
    total: res?.total ?? data.length,
  };
  return { data, meta };
}

function normalizePaginatedCajones(res: any): PaginatedResponse<CajonEntity> {
  const rawList = Array.isArray(res) ? res : res?.data ?? [];
  const data = rawList.map(normalizeCajon);
  const meta = res?.meta ?? {
    currentPage: res?.current_page ?? 1,
    lastPage: res?.last_page ?? 1,
    perPage: res?.per_page ?? data.length,
    total: res?.total ?? data.length,
  };
  return { data, meta };
}

export async function fetchLocations(
  params?: LocationQueryParams,
): Promise<PaginatedResponse<LocationEntity>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.tipo) query.set('tipo', params.tipo);
  if (params?.per_page) query.set('per_page', String(params.per_page));
  if (params?.page) query.set('page', String(params.page));

  const qs = query.toString();
  const response = await get<any>(`/locations${qs ? `?${qs}` : ''}`);
  return normalizePaginatedLocations(response);
}

export async function fetchLocation(id: number): Promise<LocationEntity> {
  const response = await get<any>(`/locations/${id}`);
  return normalizeLocation(response?.data ?? response);
}

export async function createLocation(
  payload: CreateLocationPayload,
): Promise<LocationEntity> {
  const response = await post<CreateLocationPayload, any>('/locations', payload);
  return normalizeLocation(response?.data ?? response);
}

export async function updateLocation(
  id: number,
  payload: UpdateLocationPayload,
): Promise<LocationEntity> {
  const response = await patch<UpdateLocationPayload, any>(`/locations/${id}`, payload);
  return normalizeLocation(response?.data ?? response);
}

export async function deleteLocation(id: number): Promise<void> {
  return del<void>(`/locations/${id}`);
}

export async function fetchCajones(
  params?: CajonQueryParams,
): Promise<PaginatedResponse<CajonEntity>> {
  const query = new URLSearchParams();
  if (params?.location_id) query.set('location_id', String(params.location_id));
  if (params?.search) query.set('search', params.search);
  if (params?.per_page) query.set('per_page', String(params.per_page));
  if (params?.page) query.set('page', String(params.page));

  const qs = query.toString();
  const response = await get<any>(`/cajones${qs ? `?${qs}` : ''}`);
  return normalizePaginatedCajones(response);
}

export async function fetchCajon(id: number): Promise<CajonEntity> {
  const response = await get<any>(`/cajones/${id}`);
  return normalizeCajon(response?.data ?? response);
}

export async function createCajon(
  payload: CreateCajonPayload,
): Promise<CajonEntity> {
  const response = await post<CreateCajonPayload, any>('/cajones', payload);
  return normalizeCajon(response?.data ?? response);
}

export async function updateCajon(
  id: number,
  payload: UpdateCajonPayload,
): Promise<CajonEntity> {
  const response = await patch<UpdateCajonPayload, any>(`/cajones/${id}`, payload);
  return normalizeCajon(response?.data ?? response);
}

export async function deleteCajon(id: number): Promise<void> {
  return del<void>(`/cajones/${id}`);
}

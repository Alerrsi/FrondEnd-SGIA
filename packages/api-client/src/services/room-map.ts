import type {
  CreateEstantePayload,
  CreateZonaPayload,
  Estante,
  EstanteContenido,
  EstanteContenidoCajon,
  EstanteContenidoUnidades,
  EstanteQueryParams,
  PaginatedResponse,
  SalaMapa,
  UpdateEstantePayload,
  UpdateZonaPayload,
  Zona,
} from '@sgia/types';
import { del, get, patch, post } from '../http';

// Mapa de salas (REQ-22). Contrato en BackEnd-SGIA/docs/mapa-salas.md; medidas en cm enteros.

interface Envelope<T> {
  data: T;
}

interface LaravelPage<T> {
  data: T[];
  meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number };
}

const UNIT_STATUSES = ['disponible', 'prestado', 'en_reparacion'] as const;

export function normalizeZona(raw: Zona): Zona {
  return {
    id: raw.id,
    location_id: raw.location_id,
    nombre: raw.nombre ?? '',
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    width: Number(raw.width) || 0,
    depth: Number(raw.depth) || 0,
  };
}

export function normalizeEstante(raw: Estante): Estante {
  return {
    id: raw.id,
    location_id: raw.location_id,
    zona_id: raw.zona_id ?? null,
    codigo: raw.codigo ?? '',
    nombre: raw.nombre ?? null,
    descripcion: raw.descripcion ?? null,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    width: Number(raw.width) || 0,
    depth: Number(raw.depth) || 0,
    rotation: Number(raw.rotation) === 90 ? 90 : 0,
    cajones: (raw.cajones ?? []).map((cajon) => ({
      id: cajon.id,
      codigo: cajon.codigo ?? '',
      barcode: cajon.barcode ?? null,
      products_count: cajon.products_count ?? 0,
      units_count: cajon.units_count ?? 0,
      lleno: Boolean(cajon.lleno),
    })),
    items_count: raw.items_count ?? 0,
    has_critical_stock: Boolean(raw.has_critical_stock),
  };
}

export function normalizeSalaMapa(raw: SalaMapa): SalaMapa {
  return {
    location: {
      id: raw.location.id,
      code: raw.location.code ?? '',
      nombre: raw.location.nombre ?? '',
      tipo: raw.location.tipo ?? 'sala',
      map_width_cm: Number(raw.location.map_width_cm) || 1000,
      map_height_cm: Number(raw.location.map_height_cm) || 600,
      has_dimensions: Boolean(raw.location.has_dimensions),
    },
    zonas: (raw.zonas ?? []).map(normalizeZona),
    estantes: (raw.estantes ?? []).map(normalizeEstante),
    cajones_sin_estante_count: raw.cajones_sin_estante_count ?? 0,
  };
}

function normalizeUnidades(raw: EstanteContenidoUnidades): EstanteContenidoUnidades {
  const byStatus = { disponible: 0, prestado: 0, en_reparacion: 0 };
  for (const status of UNIT_STATUSES) byStatus[status] = raw.by_status?.[status] ?? 0;
  return {
    product_id: raw.product_id,
    product_name: raw.product_name ?? '',
    type: raw.type ?? '',
    total: raw.total ?? 0,
    by_status: byStatus,
  };
}

function normalizeContenidoCajon(raw: EstanteContenidoCajon): EstanteContenidoCajon {
  return {
    id: raw.id,
    codigo: raw.codigo ?? '',
    barcode: raw.barcode ?? null,
    descripcion: raw.descripcion ?? null,
    lleno: Boolean(raw.lleno),
    productos: (raw.productos ?? []).map((producto) => ({
      ...producto,
      barcode: producto.barcode ?? null,
      is_critical: Boolean(producto.is_critical),
    })),
    unidades: (raw.unidades ?? []).map(normalizeUnidades),
  };
}

export function normalizeEstanteContenido(raw: EstanteContenido): EstanteContenido {
  return {
    estante: normalizeEstante(raw.estante),
    zona: raw.zona ?? null,
    location: raw.location,
    cajones: (raw.cajones ?? []).map(normalizeContenidoCajon),
  };
}

export async function fetchSalaMapa(locationId: number): Promise<SalaMapa> {
  const response = await get<Envelope<SalaMapa>>(`/locations/${locationId}/map`);
  return normalizeSalaMapa(response.data);
}

export async function fetchEstantes(params?: EstanteQueryParams): Promise<PaginatedResponse<Estante>> {
  const query = new URLSearchParams();
  if (params?.location_id) query.set('location_id', String(params.location_id));
  if (params?.search) query.set('search', params.search);
  if (params?.per_page) query.set('per_page', String(params.per_page));
  const qs = query.toString();

  const response = await get<LaravelPage<Estante>>(`/estantes${qs ? `?${qs}` : ''}`);
  const data = (response.data ?? []).map(normalizeEstante);
  return {
    data,
    meta: {
      currentPage: response.meta?.current_page ?? 1,
      lastPage: response.meta?.last_page ?? 1,
      perPage: response.meta?.per_page ?? data.length,
      total: response.meta?.total ?? data.length,
    },
  };
}

export async function createEstante(payload: CreateEstantePayload): Promise<Estante> {
  const response = await post<CreateEstantePayload, Envelope<Estante>>('/estantes', payload);
  return normalizeEstante(response.data);
}

export async function updateEstante(id: number, payload: UpdateEstantePayload): Promise<Estante> {
  const response = await patch<UpdateEstantePayload, Envelope<Estante>>(`/estantes/${id}`, payload);
  return normalizeEstante(response.data);
}

export async function deleteEstante(id: number): Promise<void> {
  return del<void>(`/estantes/${id}`);
}

export async function fetchEstanteContenido(id: number): Promise<EstanteContenido> {
  const response = await get<Envelope<EstanteContenido>>(`/estantes/${id}/contents`);
  return normalizeEstanteContenido(response.data);
}

export async function fetchZonas(locationId: number): Promise<Zona[]> {
  const response = await get<Envelope<Zona[]>>(`/zonas?location_id=${locationId}`);
  return (response.data ?? []).map(normalizeZona);
}

export async function createZona(payload: CreateZonaPayload): Promise<Zona> {
  const response = await post<CreateZonaPayload, Envelope<Zona>>('/zonas', payload);
  return normalizeZona(response.data);
}

export async function updateZona(id: number, payload: UpdateZonaPayload): Promise<Zona> {
  const response = await patch<UpdateZonaPayload, Envelope<Zona>>(`/zonas/${id}`, payload);
  return normalizeZona(response.data);
}

export async function deleteZona(id: number): Promise<void> {
  return del<void>(`/zonas/${id}`);
}

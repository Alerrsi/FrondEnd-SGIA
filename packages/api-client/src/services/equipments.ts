import type {
  EquipmentQueryParams,
  EquipmentReportQueryParams,
  EquipmentSpecs,
  EquipmentStatus,
  Equipo,
  UpdateEquipmentSpecsPayload,
} from '@sgia/types';
import { get, getBlob, put } from '../http';

// Fichas Técnicas de Equipos (FU-05 / REQ-12)
export async function fetchEquipmentSpecs(id: number): Promise<EquipmentSpecs> {
  const response = await get<any>(`/equipment/${id}/specs`);
  return response?.data ?? response;
}

export async function updateEquipmentSpecs(
  id: number,
  payload: UpdateEquipmentSpecsPayload | Partial<EquipmentSpecs>,
): Promise<EquipmentSpecs> {
  const response = await put<UpdateEquipmentSpecsPayload | Partial<EquipmentSpecs>, any>(
    `/equipment/${id}/specs`,
    payload,
  );
  return response?.data ?? response;
}

export async function fetchEquipmentTechnicalSheet(productId: number): Promise<Blob> {
  return getBlob(`/equipment/${productId}/technical-sheet`);
}

export async function fetchEquipmentReports(
  productId: number,
  params?: EquipmentReportQueryParams,
): Promise<any> {
  const query = new URLSearchParams();
  if (params?.severity) query.set('severity', params.severity);
  if (params?.status) query.set('status', params.status);
  if (params?.format) query.set('format', params.format);
  if (params?.per_page) query.set('per_page', String(params.per_page));
  if (params?.page) query.set('page', String(params.page));

  const qs = query.toString();
  const url = `/equipment/${productId}/reports${qs ? `?${qs}` : ''}`;
  if (params?.format === 'json') {
    return get<any>(url);
  }
  return getBlob(url);
}

export async function downloadEquipmentReports(
  productId: number,
  params?: EquipmentReportQueryParams,
): Promise<Blob> {
  return fetchEquipmentReports(productId, { ...params, format: 'pdf' });
}

interface RawEquipmentProduct {
  id: number;
  name: string;
  barcode: string | null;
  master_code: string | null;
  estado: string;
  oracle_category?: { name: string } | null;
  location?: { sala?: string; nombre?: string } | null;
  cajon?: { codigo?: string } | null;
  created_at: string;
  updated_at: string;
}

// `estado` operativo del producto (ProductResource) → estado de la ficha.
const EQUIPMENT_STATUS: Record<string, EquipmentStatus> = {
  disponible: 'operativo',
  en_reparacion: 'en_mantencion',
  dado_de_baja: 'baja',
  sin_stock: 'en_prestamo', // equipo sin unidades disponibles ni en taller: todas prestadas
};

function toEquipo(raw: RawEquipmentProduct): Equipo {
  const ubicacion = [raw.location?.sala ?? raw.location?.nombre, raw.cajon?.codigo]
    .filter(Boolean)
    .join(' · ');
  return {
    id: raw.id,
    nombre: raw.name,
    codigo: raw.master_code ?? raw.barcode ?? undefined,
    categoria: raw.oracle_category?.name ?? undefined,
    ubicacion: ubicacion || undefined,
    estado: EQUIPMENT_STATUS[raw.estado] ?? 'operativo',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// Las fichas se arman con los productos `equipo` (la API no tiene `GET /equipment`).
// shortcut: una sola página de 100; paginar en el servidor si hay más de 100 equipos.
export async function fetchEquipos(params?: EquipmentQueryParams): Promise<Equipo[]> {
  const query = new URLSearchParams({ type: 'equipo', per_page: String(params?.per_page ?? 100) });
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));

  const response = await get<{ data: RawEquipmentProduct[] }>(`/products?${query.toString()}`);
  return (response?.data ?? []).map(toEquipo);
}

export async function fetchEquipo(id: number): Promise<Equipo> {
  const response = await get<{ data: RawEquipmentProduct }>(`/products/${id}`);
  return toEquipo(response.data);
}

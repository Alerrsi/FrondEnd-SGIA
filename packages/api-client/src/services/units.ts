import type {
  Career,
  CareerQueryParams,
  CreateCareerPayload,
  CreateEquipmentUnitsPayload,
  EquipmentUnit,
  EquipmentUnitBarcodeResponse,
  EquipmentUnitQueryParams,
  EquipmentUnitStatus,
  PaginatedResponse,
  UpdateCareerPayload,
  UpdateEquipmentUnitPayload,
} from '@sgia/types';
import { del, get, getBlob, patch, post } from '../http';

function buildQuery(params?: object): string {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      query.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

function toPaginated<T>(res: any): PaginatedResponse<T> {
  const data: T[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  const meta = res?.meta ?? {};
  return {
    data,
    meta: {
      currentPage: meta.current_page ?? meta.currentPage ?? 1,
      lastPage: meta.last_page ?? meta.lastPage ?? 1,
      perPage: meta.per_page ?? meta.perPage ?? (data.length || 15),
      total: meta.total ?? data.length,
    },
  };
}

// Unidades de equipo (equipo / maqueta)
export async function fetchProductUnits(
  productId: number,
  params?: Omit<EquipmentUnitQueryParams, 'product_id'>,
): Promise<PaginatedResponse<EquipmentUnit>> {
  const res = await get<any>(`/products/${productId}/units${buildQuery(params)}`);
  return toPaginated<EquipmentUnit>(res);
}

export async function createProductUnits(
  productId: number,
  payload: CreateEquipmentUnitsPayload,
): Promise<EquipmentUnit[]> {
  const res = await post<CreateEquipmentUnitsPayload, any>(`/products/${productId}/units`, payload);
  const data = res?.data ?? res;
  return Array.isArray(data) ? data : [data];
}

export async function fetchEquipmentUnits(
  params?: EquipmentUnitQueryParams,
): Promise<PaginatedResponse<EquipmentUnit>> {
  const res = await get<any>(`/equipment-units${buildQuery(params)}`);
  return toPaginated<EquipmentUnit>(res);
}

export async function fetchEquipmentUnitByCode(code: string): Promise<EquipmentUnit> {
  const res = await get<any>(`/equipment-units/by-code/${encodeURIComponent(code)}`);
  return res?.data ?? res;
}

export async function fetchEquipmentUnit(id: number): Promise<EquipmentUnit> {
  const res = await get<any>(`/equipment-units/${id}`);
  return res?.data ?? res;
}

export async function updateEquipmentUnit(
  id: number,
  payload: UpdateEquipmentUnitPayload,
): Promise<EquipmentUnit> {
  const res = await patch<UpdateEquipmentUnitPayload, any>(`/equipment-units/${id}`, payload);
  return res?.data ?? res;
}

export async function updateEquipmentUnitStatus(
  id: number,
  status: EquipmentUnitStatus,
): Promise<EquipmentUnit> {
  const res = await patch<{ status: EquipmentUnitStatus }, any>(`/equipment-units/${id}/status`, {
    status,
  });
  return res?.data ?? res;
}

export async function deleteEquipmentUnit(id: number): Promise<void> {
  return del<void>(`/equipment-units/${id}`);
}

export async function fetchEquipmentUnitBarcode(id: number): Promise<EquipmentUnitBarcodeResponse> {
  const res = await get<any>(`/equipment-units/${id}/barcode`);
  const data = res?.data ?? res;
  return {
    barcode: data?.barcode ?? data?.code ?? '',
    svg: data?.svg ?? '',
    data_uri: data?.data_uri,
    html: data?.html,
  };
}

export async function fetchEquipmentUnitTechnicalSheet(id: number): Promise<Blob> {
  return getBlob(`/equipment-units/${id}/technical-sheet`);
}

export async function downloadEquipmentUnitReports(id: number): Promise<Blob> {
  return getBlob(`/equipment-units/${id}/reports?format=pdf`);
}

export async function fetchIncidentEvidencePhoto(reportId: number): Promise<Blob> {
  return getBlob(`/incident-reports/${reportId}/evidence-photo`);
}

// Carreras
export async function fetchCareers(params?: CareerQueryParams): Promise<PaginatedResponse<Career>> {
  const res = await get<any>(`/careers${buildQuery(params)}`);
  return toPaginated<Career>(res);
}

export async function fetchCareer(id: number): Promise<Career> {
  const res = await get<any>(`/careers/${id}`);
  return res?.data ?? res;
}

export async function createCareer(payload: CreateCareerPayload): Promise<Career> {
  const res = await post<CreateCareerPayload, any>('/careers', payload);
  return res?.data ?? res;
}

export async function updateCareer(id: number, payload: UpdateCareerPayload): Promise<Career> {
  const res = await patch<UpdateCareerPayload, any>(`/careers/${id}`, payload);
  return res?.data ?? res;
}

export async function deleteCareer(id: number): Promise<void> {
  return del<void>(`/careers/${id}`);
}

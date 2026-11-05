import type {
  CareerDistribution,
  DashboardAnalyticsParams,
  DashboardStats,
  EquipmentQueryParams,
  EquipmentReportQueryParams,
  EquipmentSpecs,
  Equipo,
  TeacherLoanRanking,
  TopDemandedItem,
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

export async function fetchEquipos(params?: EquipmentQueryParams): Promise<Equipo[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status && params.status !== 'todos') query.set('status', params.status);
  if (params?.category) query.set('category', params.category);
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));

  const qs = query.toString();
  const response = await get<any>(`/equipment${qs ? `?${qs}` : ''}`);
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchEquipo(id: number): Promise<Equipo> {
  const response = await get<any>(`/equipment/${id}/specs`);
  return response?.data ?? response;
}

// Dashboards y Analítica (FU-06 / REQ-14)
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await get<any>('/dashboard/stats');
  return response?.data ?? response;
}

export async function fetchTopProducts(params?: DashboardAnalyticsParams): Promise<TopDemandedItem[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.since) query.set('since', params.since);
  const qs = query.toString();
  const response = await get<any>(`/dashboard/top-products${qs ? `?${qs}` : ''}`);
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchTopSupplies(params?: DashboardAnalyticsParams): Promise<TopDemandedItem[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.since) query.set('since', params.since);
  const qs = query.toString();
  const response = await get<any>(`/dashboard/top-supplies${qs ? `?${qs}` : ''}`);
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchCareersDistribution(params?: { since?: string }): Promise<CareerDistribution[]> {
  const query = new URLSearchParams();
  if (params?.since) query.set('since', params.since);
  const qs = query.toString();
  const response = await get<any>(`/dashboard/careers-distribution${qs ? `?${qs}` : ''}`);
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchLeastDemanded(params?: DashboardAnalyticsParams): Promise<TopDemandedItem[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.since) query.set('since', params.since);
  const qs = query.toString();
  const response = await get<any>(`/dashboard/least-demanded${qs ? `?${qs}` : ''}`);
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchTopTeachers(params?: DashboardAnalyticsParams): Promise<TeacherLoanRanking[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.since) query.set('since', params.since);
  const qs = query.toString();
  const response = await get<any>(`/dashboard/top-teachers${qs ? `?${qs}` : ''}`);
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchLoansByTeacher(): Promise<any[]> {
  const response = await get<any>('/dashboard/loans-by-teacher');
  return Array.isArray(response) ? response : response?.data ?? [];
}

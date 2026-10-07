import type {
  CareerDistribution,
  CreateIncidentReportPayload,
  CreateNovedadPayload,
  DashboardStats,
  EquipmentQueryParams,
  EquipmentSpecs,
  Equipo,
  IncidentReport,
  IncidentSeverity,
  IncidentStatus,
  Novedad,
  PaginatedResponse,
  TeacherLoanRanking,
  TopDemandedItem,
  UpdateEquipmentSpecsPayload,
} from '@sgia/types';
import { get, getBlob, patch, post, put } from '../http';

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

export async function fetchEquipmentTechnicalSheet(id: number): Promise<Blob> {
  return getBlob(`/equipment/${id}/technical-sheet`);
}

export async function fetchEquipmentReports(id: number): Promise<Blob> {
  return getBlob(`/equipment/${id}/reports`);
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

// Informes de Novedades y Fallas (FU-05 / REQ-13)
export async function createIncidentReport(
  payload: CreateIncidentReportPayload | CreateNovedadPayload,
): Promise<IncidentReport | Novedad> {
  const form = new FormData();
  const productId =
    (payload as any).product_id ??
    (payload as any).productoId ??
    (payload as any).equipoId ??
    '';
  form.append('product_id', String(productId));

  const description =
    (payload as any).description ?? (payload as any).descripcion ?? '';
  form.append('description', description);

  const severity =
    (payload as any).severity ??
    ((payload as any).tipo === 'falla' ? 'media' : 'leve');
  form.append('severity', severity);

  const file = (payload as any).photo ?? (payload as any).adjunto;
  if (file) {
    form.append('photo', file);
  }

  return post<FormData, IncidentReport>('/incident-reports', form);
}

export const createNovedad = createIncidentReport;

export async function fetchIncidentReports(params?: {
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<IncidentReport>> {
  const query = new URLSearchParams();
  if (params?.severity) query.set('severity', params.severity);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));

  const qs = query.toString();
  return get<PaginatedResponse<IncidentReport>>(`/incident-reports${qs ? `?${qs}` : ''}`);
}

export async function updateIncidentReportStatus(
  id: number,
  status: IncidentStatus,
): Promise<IncidentReport> {
  return patch<{ status: IncidentStatus }, IncidentReport>(
    `/incident-reports/${id}/status`,
    { status },
  );
}

// Dashboards y Analítica (FU-06 / REQ-14)
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await get<any>('/dashboard/stats');
  return response?.data ?? response;
}

export async function fetchTopProducts(): Promise<TopDemandedItem[]> {
  const response = await get<any>('/dashboard/top-products');
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchTopSupplies(): Promise<TopDemandedItem[]> {
  const response = await get<any>('/dashboard/top-supplies');
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchCareersDistribution(): Promise<CareerDistribution[]> {
  const response = await get<any>('/dashboard/careers-distribution');
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchLeastDemanded(): Promise<TopDemandedItem[]> {
  const response = await get<any>('/dashboard/least-demanded');
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchTopTeachers(): Promise<TeacherLoanRanking[]> {
  const response = await get<any>('/dashboard/top-teachers');
  return Array.isArray(response) ? response : response?.data ?? [];
}

export async function fetchLoansByTeacher(): Promise<any[]> {
  const response = await get<any>('/dashboard/loans-by-teacher');
  return Array.isArray(response) ? response : response?.data ?? [];
}

import type {
  CreateIncidentReportPayload,
  IncidentReport,
  IncidentReportQueryParams,
  IncidentStatus,
  PaginatedResponse,
} from '@sgia/types';
import { get, getBlob, patch, post } from '../http';

// Informe de novedades (reemplaza a POST /equipment/{id}/reports).

interface RawPaginated<T> {
  data?: T[];
  meta?: Partial<PaginatedResponse<T>['meta']> & {
    current_page?: number;
    last_page?: number;
    per_page?: number;
  };
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export function normalizeIncidentReport(raw: IncidentReport): IncidentReport {
  const isLegacy = raw.is_legacy ?? raw.problems == null;
  return {
    ...raw,
    is_legacy: isLegacy,
    problems: raw.problems ?? null,
    allowed_transitions: raw.allowed_transitions ?? [],
  };
}

function toPaginated(res: RawPaginated<IncidentReport>): PaginatedResponse<IncidentReport> {
  const data = (res?.data ?? []).map(normalizeIncidentReport);
  const meta = res?.meta;
  return {
    data,
    meta: {
      currentPage: meta?.currentPage ?? meta?.current_page ?? res?.current_page ?? 1,
      lastPage: meta?.lastPage ?? meta?.last_page ?? res?.last_page ?? 1,
      perPage: meta?.perPage ?? meta?.per_page ?? res?.per_page ?? data.length,
      total: meta?.total ?? res?.total ?? data.length,
    },
  };
}

function buildQuery(params?: IncidentReportQueryParams): string {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.product_id) query.set('product_id', String(params.product_id));
  if (params?.equipment_unit_id) query.set('equipment_unit_id', String(params.equipment_unit_id));
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/** Bandeja del personal (`PAN-01`, `AD-01`, `DIR-01`). */
export async function fetchIncidentReports(
  params?: IncidentReportQueryParams,
): Promise<PaginatedResponse<IncidentReport>> {
  return toPaginated(
    await get<RawPaginated<IncidentReport>>(`/incident-reports${buildQuery(params)}`),
  );
}

/** Seguimiento del docente (`PRO-01`): solo sus informes. */
export async function fetchMyIncidentReports(
  params?: Pick<IncidentReportQueryParams, 'status' | 'per_page' | 'page'>,
): Promise<PaginatedResponse<IncidentReport>> {
  return toPaginated(
    await get<RawPaginated<IncidentReport>>(`/incident-reports/mine${buildQuery(params)}`),
  );
}

export async function fetchIncidentReport(id: number): Promise<IncidentReport> {
  const res = await get<{ data?: IncidentReport } | IncidentReport>(`/incident-reports/${id}`);
  return normalizeIncidentReport('data' in res && res.data ? res.data : (res as IncidentReport));
}

/**
 * Crea el informe (`PRO-01` y `PAN-01`). Sin foto va como JSON; con foto, como multipart con
 * `problems[0][type]`, `problems[0][description]`, …
 */
export async function createIncidentReport(
  payload: CreateIncidentReportPayload,
): Promise<IncidentReport> {
  const { evidence_photo: photo, ...rest } = payload;
  let res: { data?: IncidentReport } | IncidentReport;

  if (photo) {
    const form = new FormData();
    form.append('subject', rest.subject);
    if (rest.report_date) form.append('report_date', rest.report_date);
    form.append('location_id', String(rest.location_id));
    rest.problems.forEach((problem, index) => {
      form.append(`problems[${index}][type]`, problem.type);
      form.append(`problems[${index}][description]`, problem.description);
    });
    if (rest.suggestion) form.append('suggestion', rest.suggestion);
    form.append('signature', rest.signature);
    if (rest.equipment_code) form.append('equipment_code', rest.equipment_code);
    // En React Native el "archivo" es `{ uri, name, type }`; FormData lo acepta tal cual.
    form.append('evidence_photo', photo as Blob);
    res = await post<FormData, { data?: IncidentReport }>('/incident-reports', form);
  } else {
    res = await post<typeof rest, { data?: IncidentReport }>('/incident-reports', rest);
  }

  return normalizeIncidentReport('data' in res && res.data ? res.data : (res as IncidentReport));
}

export async function updateIncidentReportStatus(
  id: number,
  status: IncidentStatus,
): Promise<IncidentReport> {
  const res = await patch<{ status: IncidentStatus }, { data?: IncidentReport }>(
    `/incident-reports/${id}/status`,
    { status },
  );
  return normalizeIncidentReport('data' in res && res.data ? res.data : (res as IncidentReport));
}

// Los archivos se piden con el token: una <img src> directa respondería 401.
export async function downloadIncidentReportPdf(id: number): Promise<Blob> {
  return getBlob(`/incident-reports/${id}/pdf`);
}

export async function downloadIncidentReportSignature(id: number): Promise<Blob> {
  return getBlob(`/incident-reports/${id}/signature`);
}

export async function downloadIncidentReportPhoto(id: number): Promise<Blob> {
  return getBlob(`/incident-reports/${id}/evidence-photo`);
}

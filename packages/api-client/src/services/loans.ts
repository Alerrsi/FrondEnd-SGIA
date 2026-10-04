import type {
  AprobarPrestamoPayload,
  CreatePrestamoPayload,
  LoanCheckinPayload,
  LoanCheckoutPayload,
  PaginatedResponse,
  Prestamo,
  PrestamoParams,
  RechazarPrestamoPayload,
  RemoteLoanRequestPayload,
} from '@sgia/types';
import { del, get, post } from '../http';

function normalizePrestamo(raw: any): Prestamo {
  if (!raw) return raw;
  const items = (raw.items ?? []).map((it: any) => ({
    productoId: it.productoId ?? it.product_id ?? 0,
    cantidad: it.cantidad ?? it.quantity ?? 1,
  }));

  return {
    id: raw.id,
    codigo: raw.codigo ?? raw.code,
    solicitanteId: raw.solicitanteId ?? raw.user_id ?? 0,
    solicitanteNombre: raw.solicitanteNombre ?? raw.user?.name ?? raw.user?.nombre,
    user_id: raw.user_id ?? raw.solicitanteId,
    items,
    origen: raw.origen ?? raw.origin ?? 'remoto',
    estado: raw.estado ?? raw.status ?? 'en_proceso',
    asignatura: raw.asignatura ?? raw.subject ?? null,
    subject: raw.subject ?? raw.asignatura ?? null,
    sala: raw.sala ?? raw.room ?? null,
    room: raw.room ?? raw.sala ?? null,
    fechaSolicitada: raw.fechaSolicitada ?? raw.loan_date ?? null,
    loan_date: raw.loan_date ?? raw.fechaSolicitada ?? null,
    time_block: raw.time_block ?? null,
    fechaDevolucion: raw.fechaDevolucion ?? raw.return_date ?? null,
    motivoRechazo: raw.motivoRechazo ?? raw.rejection_reason ?? null,
    rejection_reason: raw.rejection_reason ?? raw.motivoRechazo ?? null,
    procesadoPorId: raw.procesadoPorId ?? raw.processed_by_id ?? null,
    tramitadoAt: raw.tramitadoAt ?? raw.processed_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? '',
    created_at: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? raw.updated_at ?? '',
    updated_at: raw.updated_at ?? raw.updatedAt ?? '',
  };
}

function normalizePaginatedLoans(res: any): PaginatedResponse<Prestamo> {
  const rawList = Array.isArray(res) ? res : res?.data ?? [];
  const data = rawList.map(normalizePrestamo);
  const meta = res?.meta ?? {
    currentPage: res?.current_page ?? 1,
    lastPage: res?.last_page ?? 1,
    perPage: res?.per_page ?? data.length,
    total: res?.total ?? data.length,
  };
  return { data, meta };
}

export async function fetchLoans(params?: PrestamoParams): Promise<PaginatedResponse<Prestamo>> {
  const query = new URLSearchParams();
  if (params?.estado) query.set('estado', params.estado);
  if (params?.origen) query.set('origen', params.origen);
  if (params?.docente) query.set('docente', params.docente);
  if (params?.asignatura) query.set('asignatura', params.asignatura);
  if (params?.sala) query.set('sala', params.sala);
  if (params?.page) query.set('page', String(params.page));

  const perPage = params?.per_page ?? params?.perPage;
  if (perPage) query.set('per_page', String(perPage));

  const qs = query.toString();
  const response = await get<any>(`/loans${qs ? `?${qs}` : ''}`);
  return normalizePaginatedLoans(response);
}

export async function fetchLoan(id: number): Promise<Prestamo> {
  const response = await get<any>(`/loans/${id}`);
  return normalizePrestamo(response?.data ?? response);
}

export async function fetchPendingLoans(): Promise<PaginatedResponse<Prestamo>> {
  const response = await get<any>('/loans/pending');
  return normalizePaginatedLoans(response);
}

export async function createLoanRequest(
  payload: RemoteLoanRequestPayload | CreatePrestamoPayload,
): Promise<Prestamo> {
  const body = {
    items: payload.items.map((it: any) => ({
      product_id: it.product_id ?? it.productoId,
      quantity: it.quantity ?? it.cantidad ?? 1,
    })),
    subject: (payload as any).subject ?? (payload as any).asignatura ?? '',
    room: (payload as any).room ?? (payload as any).sala ?? '',
    loan_date: (payload as any).loan_date ?? (payload as any).fechaSolicitada ?? '',
    time_block: (payload as any).time_block ?? '',
  };
  const response = await post<any, any>('/loans/requests', body);
  return normalizePrestamo(response?.data ?? response);
}

export const createPrestamo = createLoanRequest;

export async function fetchMyLoanRequests(): Promise<Prestamo[]> {
  const response = await get<any>('/loans/my-requests');
  const list = Array.isArray(response) ? response : response?.data ?? [];
  return list.map(normalizePrestamo);
}

export async function cancelLoanRequest(id: number): Promise<void> {
  return del<void>(`/loans/requests/${id}`);
}

export async function approveLoan(
  id: number,
  payload?: AprobarPrestamoPayload,
): Promise<Prestamo> {
  const body = {
    return_date: payload?.return_date ?? payload?.fechaDevolucion,
    notes: payload?.notes,
  };
  const response = await post<any, any>(`/loans/${id}/approve`, body);
  return normalizePrestamo(response?.data ?? response);
}

export const approbarPrestamo = approveLoan;

export async function rejectLoan(
  id: number,
  payload: RechazarPrestamoPayload,
): Promise<Prestamo> {
  const body = {
    rejection_reason: payload.rejection_reason ?? payload.motivoRechazo,
  };
  const response = await post<any, any>(`/loans/${id}/reject`, body);
  return normalizePrestamo(response?.data ?? response);
}

export const rechazarPrestamo = rejectLoan;

export async function checkoutLoan(payload: LoanCheckoutPayload): Promise<Prestamo> {
  const response = await post<LoanCheckoutPayload, any>('/loans/checkout', payload);
  return normalizePrestamo(response?.data ?? response);
}

export async function checkinLoan(payload: LoanCheckinPayload): Promise<Prestamo> {
  const response = await post<LoanCheckinPayload, any>('/loans/checkin', payload);
  return normalizePrestamo(response?.data ?? response);
}

export async function exportLoans(params?: {
  start_date?: string;
  end_date?: string;
  format?: 'pdf' | 'excel';
}): Promise<Blob> {
  const query = new URLSearchParams();
  if (params?.start_date) query.set('start_date', params.start_date);
  if (params?.end_date) query.set('end_date', params.end_date);
  if (params?.format) query.set('format', params.format);

  const qs = query.toString();
  return get<Blob>(`/loans/export${qs ? `?${qs}` : ''}`);
}

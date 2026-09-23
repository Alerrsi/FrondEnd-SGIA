import type {
  AprobarPrestamoPayload,
  CreatePrestamoPayload,
  PaginatedResponse,
  Prestamo,
  PrestamoParams,
  RechazarPrestamoPayload,
} from '@sgia/types';
import { get, patch, post } from '../http';

export async function fetchLoans(params?: PrestamoParams): Promise<PaginatedResponse<Prestamo>> {
  const query = new URLSearchParams();
  if (params?.estado) query.set('estado', params.estado);
  if (params?.origen) query.set('origen', params.origen);
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('perPage', String(params.perPage));

  const qs = query.toString();
  return get<PaginatedResponse<Prestamo>>(`/prestamos${qs ? `?${qs}` : ''}`);
}

export async function fetchLoan(id: number): Promise<Prestamo> {
  return get<Prestamo>(`/prestamos/${id}`);
}

export async function createPrestamo(payload: CreatePrestamoPayload): Promise<Prestamo> {
  return post<CreatePrestamoPayload, Prestamo>('/prestamos', payload);
}

export async function approbarPrestamo(
  id: number,
  payload: AprobarPrestamoPayload,
): Promise<Prestamo> {
  return patch<AprobarPrestamoPayload, Prestamo>(`/prestamos/${id}/aprobar`, payload);
}

export async function rechazarPrestamo(
  id: number,
  payload: RechazarPrestamoPayload,
): Promise<Prestamo> {
  return patch<RechazarPrestamoPayload, Prestamo>(`/prestamos/${id}/rechazar`, payload);
}
import type { Cotizacion, CotizacionParams, CreateCotizacionPayload, PaginatedResponse } from '@sgia/types';
import { get, post } from '../http';

export async function fetchQuotations(
  params?: CotizacionParams,
): Promise<PaginatedResponse<Cotizacion>> {
  const query = new URLSearchParams();
  if (params?.estado) query.set('estado', params.estado);
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('perPage', String(params.perPage));

  const qs = query.toString();
  return get<PaginatedResponse<Cotizacion>>(`/cotizaciones${qs ? `?${qs}` : ''}`);
}

export async function createCotizacion(payload: CreateCotizacionPayload): Promise<Cotizacion> {
  return post<CreateCotizacionPayload, Cotizacion>('/cotizaciones', payload);
}
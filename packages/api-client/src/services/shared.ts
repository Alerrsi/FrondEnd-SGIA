import type { PaginatedResponse } from '@sgia/types';

// Utilidades comunes de los servicios REST: paginación Laravel, query strings y montos decimales.

export type Amount = number | string | null | undefined;

/** Los montos decimales llegan como string (`"150000.00"`); aquí se llevan a número. */
export function toAmount(value: Amount): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Como `toAmount`, pero conserva `null` cuando el backend no informa el valor. */
export function toNullableAmount(value: Amount): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export interface RawPaginated<T> {
  data?: T[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}

export function toPaginated<R, T>(
  res: RawPaginated<R> | undefined,
  map: (raw: R) => T,
): PaginatedResponse<T> {
  const data = (res?.data ?? []).map(map);
  const meta = res?.meta ?? {};
  return {
    data,
    meta: {
      currentPage: meta.current_page ?? 1,
      lastPage: meta.last_page ?? 1,
      perPage: meta.per_page ?? (data.length || 15),
      total: meta.total ?? data.length,
    },
  };
}

/** Los booleanos viajan como `1` / `0` (la regla `boolean` de Laravel no acepta `"true"`). */
export function buildQuery(params?: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/** Los recursos de Laravel llegan envueltos en `{ data }`; algunas respuestas vienen sin envolver. */
export function unwrap<T>(res: { data?: T } | T): T {
  if (res && typeof res === 'object' && 'data' in res && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}

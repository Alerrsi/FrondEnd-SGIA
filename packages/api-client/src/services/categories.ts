import type { Category, CategoryQueryParams, PaginatedResponse } from '@sgia/types';
import { get } from '../http';

export async function fetchCategories(
  params?: CategoryQueryParams,
): Promise<PaginatedResponse<Category>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const qs = query.toString();
  const res = await get<{ data?: Category[]; meta?: Record<string, number> }>(
    `/categories${qs ? `?${qs}` : ''}`,
  );
  const data = res?.data ?? [];
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

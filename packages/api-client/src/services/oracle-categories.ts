import type { CreateOracleCategoryPayload, OracleCategory } from '@sgia/types';
import { get, post } from '../http';

/** Catálogo completo (sin paginar) de descripciones de categoría del maestro de Oracle. */
export async function fetchOracleCategories(): Promise<OracleCategory[]> {
  const res = await get<{ data?: OracleCategory[] }>('/oracle-categories');
  return res?.data ?? [];
}

/** Agrega una descripción de categoría; el backend la guarda en mayúsculas (422 si ya existe). */
export async function createOracleCategory(
  payload: CreateOracleCategoryPayload,
): Promise<OracleCategory> {
  const res = await post<CreateOracleCategoryPayload, { data: OracleCategory }>(
    '/oracle-categories',
    payload,
  );
  return res.data;
}

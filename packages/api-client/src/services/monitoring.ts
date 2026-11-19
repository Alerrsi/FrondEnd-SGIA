import type {
  ActiveSession,
  FailedLogin,
  FailedLoginQueryParams,
  LoginActivity,
  PaginatedResponse,
  SystemHealth,
} from '@sgia/types';
import { del, get } from '../http';
import { buildQuery, toPaginated, type RawPaginated } from './shared';

// Monitoreo de seguridad y salud (solo AD-01).

/** Inicios de sesión de las últimas `hours` horas (1-168), por hora. */
export async function fetchLoginActivity(hours = 24): Promise<LoginActivity> {
  return (await get<{ data: LoginActivity }>(`/monitoring/logins${buildQuery({ hours })}`)).data;
}

export async function fetchFailedLogins(
  params?: FailedLoginQueryParams,
): Promise<PaginatedResponse<FailedLogin>> {
  const res = await get<RawPaginated<FailedLogin>>(`/monitoring/failed-logins${buildQuery(params)}`);
  return toPaginated(res, (row) => row);
}

export async function fetchActiveSessions(params?: {
  per_page?: number;
  page?: number;
}): Promise<PaginatedResponse<ActiveSession>> {
  const res = await get<RawPaginated<ActiveSession>>(`/monitoring/sessions${buildQuery(params)}`);
  return toPaginated(res, (row) => row);
}

/** `422` si es la sesión propia actual. */
export async function revokeSession(id: number): Promise<void> {
  await del<void>(`/monitoring/sessions/${id}`);
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  return (await get<{ data: SystemHealth }>('/monitoring/health')).data;
}

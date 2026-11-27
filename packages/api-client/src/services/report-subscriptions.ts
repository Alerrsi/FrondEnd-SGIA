import type {
  CreateReportSubscriptionPayload,
  ReportSubscription,
  ReportSubscriptionList,
  UpdateReportSubscriptionPayload,
} from '@sgia/types';
import { del, get, patch, post } from '../http';

// Suscripción de reportes por correo (BackEnd-SGIA/docs/suscripcion-reportes.md): cada usuario, solo las suyas.

const BASE = '/me/report-subscriptions';

/** PHP puede serializar un objeto vacío como `[]`. */
function record<T>(value: unknown): Record<string, T> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, T>) : {};
}

function normalize(subscription: ReportSubscription): ReportSubscription {
  return { ...subscription, params: record(subscription.params), filters: record(subscription.filters) };
}

export async function fetchReportSubscriptions(): Promise<ReportSubscriptionList> {
  const res = await get<{ data?: ReportSubscription[]; meta?: { mail_enabled?: boolean; limit?: number } } | null>(BASE);
  return {
    data: (res?.data ?? []).map(normalize),
    mail_enabled: res?.meta?.mail_enabled ?? true,
    limit: res?.meta?.limit ?? 20,
  };
}

export async function createReportSubscription(payload: CreateReportSubscriptionPayload): Promise<ReportSubscription> {
  const res = await post<CreateReportSubscriptionPayload, { data: ReportSubscription }>(BASE, payload);
  return normalize(res.data);
}

export async function updateReportSubscription(
  id: number,
  payload: UpdateReportSubscriptionPayload,
): Promise<ReportSubscription> {
  const res = await patch<UpdateReportSubscriptionPayload, { data: ReportSubscription }>(`${BASE}/${id}`, payload);
  return normalize(res.data);
}

export async function deleteReportSubscription(id: number): Promise<void> {
  await del<unknown>(`${BASE}/${id}`);
}

/** «Enviar ahora»: queda en cola (`202`) y manda el último período completo. */
export async function sendReportSubscription(id: number): Promise<void> {
  await post<undefined, unknown>(`${BASE}/${id}/send`);
}

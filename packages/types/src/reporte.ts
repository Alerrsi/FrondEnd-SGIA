// Suscripción de reportes por correo (BackEnd-SGIA/docs/suscripcion-reportes.md).

export type ReportSubscriptionFrequency = 'weekly' | 'monthly' | 'semester';

export type ReportSubscriptionStatus = 'sent' | 'empty' | 'failed';

export interface ReportSubscription {
  id: number;
  /** `id` del catálogo del centro de reportes. */
  report_id: string;
  title: string;
  /** Ruta del export, con sus parámetros fijos. */
  path: string;
  /** Filtros guardados, sin el período (se calcula en cada envío). */
  params: Record<string, string | number | boolean>;
  /** Filtros en texto legible: `{ "Carrera": "Ingeniería en Informática" }`. */
  filters: Record<string, string>;
  frequency: ReportSubscriptionFrequency;
  is_active: boolean;
  paused_reason: string | null;
  next_send_at: string | null;
  last_sent_at: string | null;
  last_status: ReportSubscriptionStatus | null;
  created_at: string;
}

export interface ReportSubscriptionList {
  data: ReportSubscription[];
  /** `false` si el servidor no entrega correos (`MAIL_MAILER=log`). */
  mail_enabled: boolean;
  limit: number;
}

export interface CreateReportSubscriptionPayload {
  report_id: string;
  title: string;
  path: string;
  params: Record<string, string | number | boolean>;
  frequency: ReportSubscriptionFrequency;
}

export interface UpdateReportSubscriptionPayload {
  frequency?: ReportSubscriptionFrequency;
  is_active?: boolean;
}

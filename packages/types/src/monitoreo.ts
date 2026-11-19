import type { RoleCode } from './usuario';

// Monitoreo de seguridad y salud del sistema (AD-01). Contrato: ENDPOINTS.md §2.0c del backend.

export type FailedLoginReason = 'invalid_credentials' | 'inactive' | 'throttled';

export interface LoginActivityHour {
  /** Inicio de la hora, ISO 8601. */
  hour: string;
  successful: number;
  failed: number;
}

export interface LoginActivity {
  window_hours: number;
  from: string;
  to: string;
  totals: { successful: number; failed: number; throttled: number };
  /** Todas las horas de la ventana, también las vacías. */
  by_hour: LoginActivityHour[];
  top_ips: { ip_address: string | null; failed: number; last_attempt_at: string }[];
  /** Cuentas con 5 o más intentos fallidos en la ventana. */
  flagged_accounts: { email: string; failed: number; last_attempt_at: string }[];
}

export interface FailedLogin {
  id: number;
  email: string;
  user_id: number | null;
  reason: FailedLoginReason;
  ip_address: string | null;
  user_agent: string | null;
  attempted_at: string;
}

export interface FailedLoginQueryParams {
  email?: string;
  ip_address?: string;
  reason?: FailedLoginReason;
  per_page?: number;
  page?: number;
}

export interface ActiveSession {
  id: number;
  device_name: 'web' | 'mobile' | (string & {});
  user: { id: number; name: string; email: string; role: RoleCode } | null;
  /** La sesión desde la que se consulta (no se puede cerrar desde el panel). */
  is_current: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface HealthCheck {
  ok: boolean;
  error?: string;
}

export interface SystemHealth {
  status: 'ok' | 'degraded';
  checked_at: string;
  checks: {
    database: HealthCheck & { latency_ms?: number };
    storage: HealthCheck & { disk?: string };
    queue: HealthCheck & { connection?: string; pending?: number; failed?: number };
  };
}

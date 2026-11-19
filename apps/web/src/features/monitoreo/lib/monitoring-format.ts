import type { FailedLoginReason } from '@sgia/types';

export const FAILED_REASON_LABELS: Record<FailedLoginReason, string> = {
  invalid_credentials: 'Contraseña o correo incorrecto',
  inactive: 'Cuenta desactivada',
  throttled: 'Bloqueado por exceso de intentos',
};

export const DEVICE_LABELS: Record<string, string> = { web: 'Web', mobile: 'App móvil' };

export const dateTimeFormat = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' });

const relative = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' });

/** «hace 5 minutos», «hace 2 horas»; para fechas de más de un día, la fecha corta. */
export function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return 'Nunca';
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (Math.abs(minutes) < 1) return 'Ahora';
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
  if (Math.abs(minutes) < 24 * 60) return relative.format(Math.round(minutes / 60), 'hour');
  return dateTimeFormat.format(new Date(iso));
}

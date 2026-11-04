import type { Usuario } from './usuario';

// Registro de auditoría (REQ-NF-01). Solo lectura, AD-01.

export const AUDIT_ACTIONS = [
  'user.created',
  'user.updated',
  'user.role_changed',
  'user.activated',
  'user.deactivated',
  'user.password_changed',
  'user.deleted',
  'equipment_unit.written_off',
  'product.written_off',
  'purchase.created',
  'purchase.status_changed',
  'purchase.cancelled',
  'invoice_intake.confirmed',
  'invoice_intake.cancelled',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDITABLE_TYPES = [
  'user',
  'equipment_unit',
  'product',
  'purchase',
  'invoice_intake',
] as const;

export type AuditableType = (typeof AUDITABLE_TYPES)[number];

export interface AuditLog {
  id: number;
  /** Acción en notación `entidad.evento`. Se tipa abierta por si el backend suma eventos. */
  action: AuditAction | (string & {});
  auditable_type: AuditableType | (string & {});
  auditable_id: number | string | null;
  /** Autor del evento. */
  user_id?: number | null;
  user?: Pick<Usuario, 'id' | 'name' | 'nombre' | 'email'> | null;
  /** Contexto del evento: el backend puede enviar cualquiera de estos campos. */
  metadata?: Record<string, unknown> | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AuditLogQueryParams {
  /** Exacta (`user.created`) o prefijo con punto (`user.`). */
  action?: string;
  auditable_type?: AuditableType;
  auditable_id?: number;
  /** Autor del evento. */
  user_id?: number;
  /** `YYYY-MM-DD`. */
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

// Tipos de notificación push / broadcast (`data.type`).

export const PUSH_NOTIFICATION_TYPES = ['loan_due', 'loan_overdue', 'maintenance_due'] as const;

export type PushNotificationType = (typeof PUSH_NOTIFICATION_TYPES)[number];

/** `loan_due`: el préstamo vence hoy. `loan_overdue`: atrasado (se avisa una sola vez). Ambos con `loan_id`. */
export interface LoanPushData {
  type: 'loan_due' | 'loan_overdue';
  loan_id: number;
}

/** `maintenance_due`: unidades con mantención vencida, para `PAN-01`. */
export interface MaintenancePushData {
  type: 'maintenance_due';
  unit_ids: number[];
}

export type PushNotificationData = LoanPushData | MaintenancePushData;

/** Ruta del panel web a la que lleva cada notificación. */
export function pushNotificationTarget(data: PushNotificationData): string {
  switch (data.type) {
    case 'loan_due':
    case 'loan_overdue':
      return `/prestamos/historial?loan=${data.loan_id}`;
    case 'maintenance_due':
      return '/mantenciones?vencidas=1';
  }
}

/** Texto corto para la campana o un toast. */
export function pushNotificationLabel(data: PushNotificationData): string {
  switch (data.type) {
    case 'loan_due':
      return 'Un préstamo vence hoy';
    case 'loan_overdue':
      return 'Un préstamo está atrasado';
    case 'maintenance_due': {
      const n = data.unit_ids.length;
      return n === 1 ? '1 unidad con mantención vencida' : `${n} unidades con mantención vencida`;
    }
  }
}

/** Valida el `data` de una notificación recibida (llega como objeto sin tipar). */
export function parsePushNotificationData(raw: unknown): PushNotificationData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Record<string, unknown>;
  if (data.type === 'loan_due' || data.type === 'loan_overdue') {
    const loanId = Number(data.loan_id);
    return Number.isFinite(loanId) ? { type: data.type, loan_id: loanId } : null;
  }
  if (data.type === 'maintenance_due') {
    const ids = Array.isArray(data.unit_ids)
      ? data.unit_ids.map(Number).filter(Number.isFinite)
      : [];
    return { type: 'maintenance_due', unit_ids: ids };
  }
  return null;
}

import type { AuditAction } from '@sgia/types';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'user.created': 'Usuario creado',
  'user.updated': 'Usuario actualizado',
  'user.role_changed': 'Cambio de rol',
  'user.activated': 'Usuario activado',
  'user.deactivated': 'Usuario desactivado',
  'user.password_changed': 'Cambio de contraseña',
  'user.deleted': 'Usuario eliminado',
  'equipment_unit.written_off': 'Unidad dada de baja',
  'product.written_off': 'Producto dado de baja',
  'purchase.created': 'Compra creada',
  'purchase.status_changed': 'Cambio de estado de compra',
  'purchase.cancelled': 'Compra cancelada',
  'invoice_intake.confirmed': 'Factura confirmada',
  'invoice_intake.cancelled': 'Factura anulada',
};

export const AUDITABLE_TYPE_LABELS: Record<string, string> = {
  user: 'Usuario',
  equipment_unit: 'Unidad de equipo',
  product: 'Producto',
  purchase: 'Compra',
  invoice_intake: 'Ingreso de factura',
};

/** Etiqueta legible; las acciones desconocidas se muestran tal cual. */
export function auditActionLabel(action: string): string {
  return (AUDIT_ACTION_LABELS as Record<string, string>)[action] ?? action;
}

/** Contexto del evento: el primer objeto disponible entre metadata, cambios nuevos y anteriores. */
export function auditDetails(log: {
  metadata?: Record<string, unknown> | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
}): Array<[string, unknown]> {
  const sections: Array<[string, Record<string, unknown> | null | undefined]> = [
    ['Antes', log.old_values],
    ['Después', log.new_values],
    ['Detalle', log.metadata],
  ];
  return sections.filter(([, v]) => v && Object.keys(v).length > 0) as Array<[string, unknown]>;
}

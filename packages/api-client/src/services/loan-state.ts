import type { Prestamo } from '@sgia/types';

/**
 * Fase de un préstamo tal como la ve el usuario. El backend (`LoanStateMachine`) solo tiene
 * `pendiente` → `en_proceso` (aprobada, stock descontado y preparada) → `procesado` (entregada),
 * con salida a `rechazado`. La devolución no es un estado (`returned_at`) y el atraso tampoco (`diasAtraso`).
 * Los nombres antiguos (`preparado`, `activo`, `devuelto`, `atrasado`…) se aceptan por compatibilidad.
 */
export type LoanDisplayState =
  | 'pendiente'
  | 'preparado'
  | 'en_prestamo'
  | 'atrasado'
  | 'devuelto'
  | 'rechazado'
  | 'otro';

export type LoanStateFields = Partial<Pick<Prestamo, 'status' | 'estado' | 'returned_at' | 'diasAtraso'>>;

export function loanDisplayState(loan: LoanStateFields): LoanDisplayState {
  const state = String(loan.status ?? loan.estado ?? '').toLowerCase();
  switch (state) {
    case 'pendiente':
      return 'pendiente';
    case 'en_proceso':
    case 'preparado':
      return 'preparado';
    case 'procesado':
    case 'procesada':
    case 'entregado':
    case 'activo':
    case 'atrasado':
      if (loan.returned_at) return 'devuelto';
      return state === 'atrasado' || (loan.diasAtraso ?? 0) > 0 ? 'atrasado' : 'en_prestamo';
    case 'devuelto':
    case 'finalizado':
      return 'devuelto';
    case 'rechazado':
    case 'rechazada':
    case 'cancelado':
      return 'rechazado';
    default:
      return 'otro';
  }
}

export interface TeacherLoanSummary {
  /** El pañol aún no la aprueba. */
  inReview: number;
  /** Aprobada y preparada: hay que ir a retirarla. */
  readyToPickUp: number;
  /** Entregada, sin devolver y vencida. */
  overdue: number;
}

/** Cuentas de «Lo que te toca hoy» del docente (web y móvil). */
export function summarizeTeacherLoans(loans: LoanStateFields[]): TeacherLoanSummary {
  const summary: TeacherLoanSummary = { inReview: 0, readyToPickUp: 0, overdue: 0 };
  for (const loan of loans) {
    const state = loanDisplayState(loan);
    if (state === 'pendiente') summary.inReview += 1;
    else if (state === 'preparado') summary.readyToPickUp += 1;
    else if (state === 'atrasado') summary.overdue += 1;
  }
  return summary;
}

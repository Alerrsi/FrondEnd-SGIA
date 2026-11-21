import type { IncidentReport, Prestamo } from '@sgia/types';

/** Estado crudo de la solicitud (`status` del backend; `estado` en datos antiguos). */
export function loanState(loan: Prestamo): string {
  return String(loan.status ?? loan.estado ?? '').toLowerCase();
}

/** Fecha de uso de la solicitud en `AAAA-MM-DD`, o `null` si no la trae. */
export function loanDay(loan: Prestamo): string | null {
  const raw = loan.loan_date ?? loan.fechaSolicitada ?? loan.fechaPrestamo ?? null;
  return raw ? raw.slice(0, 10) : null;
}

export interface LoanSummary {
  /** El pañol aún no la prepara. */
  inReview: number;
  /** El pañol ya la está preparando o la preparó: hay que ir a retirarla. */
  readyToPickUp: number;
  /** Entregadas, sin devolver y vencidas. */
  overdue: number;
}

/** Cuentas de «Lo que te toca hoy» con los estados reales del backend (el atraso viene en `diasAtraso`). */
export function summarizeLoans(loans: Prestamo[]): LoanSummary {
  let inReview = 0;
  let readyToPickUp = 0;
  let overdue = 0;
  for (const loan of loans) {
    const state = loanState(loan);
    if (state === 'pendiente') inReview += 1;
    else if (state === 'en_proceso' || state === 'preparado') readyToPickUp += 1;
    if (state === 'atrasado' || ((loan.diasAtraso ?? 0) > 0 && !loan.returned_at)) overdue += 1;
  }
  return { inReview, readyToPickUp, overdue };
}

/** Próximas clases: solicitudes de hoy en adelante que siguen en pie, de la más cercana a la más lejana. */
export function upcomingLoans(loans: Prestamo[], today: string, limit = 3): Prestamo[] {
  return loans
    .filter((loan) => {
      const day = loanDay(loan);
      const state = loanState(loan);
      return day !== null && day >= today && state !== 'rechazado' && state !== 'rechazada' && !loan.returned_at;
    })
    .sort((a, b) => {
      const byDay = (loanDay(a) ?? '').localeCompare(loanDay(b) ?? '');
      return byDay !== 0 ? byDay : (a.start_time ?? '').localeCompare(b.start_time ?? '');
    })
    .slice(0, limit);
}

const OPEN_REPORT_STATES = new Set(['reportado', 'en_revision', 'en_reparacion']);

/** Informes de novedades que el pañol aún no cierra. */
export function countOpenReports(reports: IncidentReport[]): number {
  return reports.filter((report) => OPEN_REPORT_STATES.has(report.status)).length;
}

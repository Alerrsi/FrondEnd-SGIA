import { loanDisplayState } from '@sgia/api-client/loan-state';
import type { IncidentReport, Prestamo } from '@sgia/types';

/** Fecha de uso de la solicitud en `AAAA-MM-DD`, o `null` si no la trae. */
export function loanDay(loan: Prestamo): string | null {
  const raw = loan.loan_date ?? loan.fechaSolicitada ?? loan.fechaPrestamo ?? null;
  return raw ? raw.slice(0, 10) : null;
}

/** Cuentas de «Lo que te toca hoy»: la misma regla que el Inicio web (`summarizeTeacherLoans`). */
export { summarizeTeacherLoans as summarizeLoans, type TeacherLoanSummary as LoanSummary } from '@sgia/api-client/loan-state';

/** Próximas clases: solicitudes de hoy en adelante que siguen en pie, de la más cercana a la más lejana. */
export function upcomingLoans(loans: Prestamo[], today: string, limit = 3): Prestamo[] {
  return loans
    .filter((loan) => {
      const day = loanDay(loan);
      const state = loanDisplayState(loan);
      return day !== null && day >= today && state !== 'rechazado' && state !== 'devuelto' && state !== 'otro';
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

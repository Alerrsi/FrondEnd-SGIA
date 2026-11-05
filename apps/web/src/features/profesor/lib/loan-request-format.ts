import type { Prestamo } from '@sgia/types';

/** `08:30 - 10:00`; en solicitudes antiguas cae al texto libre `time_block`. */
export function loanSchedule(loan: Prestamo): string {
  if (loan.start_time && loan.end_time) return `${loan.start_time} - ${loan.end_time}`;
  return loan.time_block ?? '—';
}

export function loanLaboratory(loan: Prestamo): string {
  return loan.location?.nombre ?? loan.room ?? loan.sala ?? '—';
}

export function loanCareer(loan: Prestamo): string {
  return loan.career?.name ?? loan.carrera ?? '—';
}

/** Solo una solicitud `pendiente` se puede cancelar (el backend responde 422 en otro caso). */
export function canCancelLoanRequest(loan: Prestamo): boolean {
  return String(loan.estado) === 'pendiente';
}

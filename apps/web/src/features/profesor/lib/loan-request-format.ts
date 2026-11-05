import type { Prestamo } from '@sgia/types';

import { formatDate } from '@/features/compras/lib/format';

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

/**
 * Fecha sin hora (`AAAA-MM-DD`, p. ej. `loan_date`, `report_date`) como `DD-MM-AAAA`.
 * `formatDate` la interpreta como UTC y en America/Santiago mostraría el día anterior.
 */
export function formatDateOnly(value: string | null | undefined): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return formatDate(value);
  return `${match[3]}-${match[2]}-${match[1]}`;
}

import type { Prestamo } from '@sgia/types';

/** `08:30 - 10:00`; en préstamos antiguos cae al texto libre `time_block`. */
export function loanSchedule(loan: Prestamo): string {
  if (loan.start_time && loan.end_time) return `${loan.start_time} - ${loan.end_time}`;
  return loan.time_block ?? loan.bloqueHorario ?? '—';
}

/** Laboratorio (sala o taller); en préstamos antiguos, el texto libre `room`. */
export function loanLaboratory(loan: Prestamo): string {
  return loan.location?.nombre ?? loan.room ?? loan.sala ?? '—';
}

export function loanCareer(loan: Prestamo): string {
  return loan.career?.name ?? loan.carrera ?? '—';
}

/** Pañol que prepara el préstamo (`null` en préstamos antiguos sin pañol informado). */
export function loanStoreroom(loan: Prestamo): string {
  return loan.storeroom?.name ?? '—';
}

/** Profesor que hizo la solicitud: `teacher` (nuevo) o el solicitante de los préstamos antiguos. */
export function loanTeacher(loan: Prestamo): string {
  return (
    loan.teacher?.name ?? loan.solicitanteNombre ?? loan.usuario?.name ?? 'Docente no registrado'
  );
}

import type { Prestamo } from '@sgia/types';

export {
  loanCareer,
  loanLaboratory,
  loanSchedule,
  loanStoreroom,
} from '@/features/prestamos/lib/loan-display';

/** Solo una solicitud `pendiente` se puede cancelar (el backend responde 422 en otro caso). */
export function canCancelLoanRequest(loan: Prestamo): boolean {
  return String(loan.estado) === 'pendiente';
}

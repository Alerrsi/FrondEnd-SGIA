import type { LoanCheckoutPayload, Student } from '@sgia/types';

/** Estudiante que retira en el mostrador: ya registrado o RUT nuevo (el backend lo crea). */
export type StudentBorrower =
  | { kind: 'existing'; student: Student }
  | { kind: 'new'; rut: string; name: string };

/** Campos del checkout según el flujo REQ-20: `student_id`, o `student_rut` + nombre opcional. */
export function studentBorrowerPayload(
  borrower: StudentBorrower,
): Pick<LoanCheckoutPayload, 'student_id' | 'student_rut' | 'borrower_name'> {
  if (borrower.kind === 'existing') return { student_id: borrower.student.id };
  const name = borrower.name.trim();
  return { student_rut: borrower.rut, ...(name ? { borrower_name: name } : {}) };
}

export function studentBorrowerLabel(borrower: StudentBorrower): string {
  return borrower.kind === 'existing'
    ? borrower.student.full_name || borrower.student.rut
    : borrower.name.trim() || borrower.rut;
}

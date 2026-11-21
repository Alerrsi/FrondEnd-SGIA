import { loanDisplayState, type LoanDisplayState, type LoanStateFields } from '@sgia/api-client/loan-state';

import type { Tone } from '@/theme';

/** Nombre y tono de cada fase para el docente (misma regla que el web: `loanDisplayState`). */
const TEACHER_STATE: Record<Exclude<LoanDisplayState, 'otro'>, { tone: Tone; label: string }> = {
  pendiente: { tone: 'warn', label: 'En revisión' },
  preparado: { tone: 'accent', label: 'Lista para retirar' },
  en_prestamo: { tone: 'info', label: 'En préstamo' },
  atrasado: { tone: 'danger', label: 'Atrasada' },
  devuelto: { tone: 'ok', label: 'Devuelta' },
  rechazado: { tone: 'danger', label: 'Rechazada' },
};

export function loanStatusMeta(loan: LoanStateFields): { tone: Tone; label: string } {
  const state = loanDisplayState(loan);
  if (state === 'otro') return { tone: 'neutral', label: String(loan.status ?? loan.estado ?? 'Sin estado') };
  return TEACHER_STATE[state];
}

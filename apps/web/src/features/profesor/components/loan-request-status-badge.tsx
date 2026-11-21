import { loanDisplayState, type LoanDisplayState, type LoanStateFields } from '@sgia/api-client/loan-state';

import { Badge, type Tone } from '@/components/ui/badge';

/** Nombres pensados para el docente: qué tiene que hacer él con su solicitud. */
const TEACHER_STATE: Record<Exclude<LoanDisplayState, 'otro'>, { label: string; tone: Tone }> = {
  pendiente: { label: 'En revisión', tone: 'warning' },
  preparado: { label: 'Lista para retirar', tone: 'accent' },
  en_prestamo: { label: 'En préstamo', tone: 'loaned' },
  atrasado: { label: 'Atrasada', tone: 'critical' },
  devuelto: { label: 'Devuelta', tone: 'available' },
  rechazado: { label: 'Rechazada', tone: 'danger' },
};

/** Estado de una solicitud remota del docente (`returned_at` y `diasAtraso` distinguen entregada, atrasada y devuelta). */
export function LoanRequestStatusBadge({ loan }: { loan: LoanStateFields }) {
  const state = loanDisplayState(loan);
  const meta =
    state === 'otro'
      ? { label: String(loan.status ?? loan.estado ?? '—'), tone: 'neutral' as Tone }
      : TEACHER_STATE[state];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

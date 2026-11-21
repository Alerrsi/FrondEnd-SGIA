import type { Prestamo } from '@sgia/types';

import type { Tone } from '@/theme';

/**
 * Estado de una solicitud con tono y nombre, siempre con texto. Máquina del backend (`LoanStateMachine`):
 * `pendiente` → `en_proceso` (aprobada y preparada) → `procesado` (entregada), con salida a `rechazado`.
 * La devolución no es un estado: es `returned_at`; el atraso es `diasAtraso`.
 */
export function loanStatusMeta(loan: Pick<Prestamo, 'status' | 'estado' | 'returned_at' | 'diasAtraso'>): {
  tone: Tone;
  label: string;
} {
  const state = String(loan.status ?? loan.estado ?? '').toLowerCase();
  switch (state) {
    case 'pendiente':
      return { tone: 'warn', label: 'Pendiente en pañol' };
    case 'en_proceso':
    case 'preparado':
      return { tone: 'accent', label: 'Lista para retirar' };
    case 'procesado':
    case 'procesada':
    case 'entregado':
    case 'activo':
    case 'atrasado':
      if (loan.returned_at) return { tone: 'ok', label: 'Devuelto' };
      if (state === 'atrasado' || (loan.diasAtraso ?? 0) > 0) return { tone: 'danger', label: 'Atrasado' };
      return { tone: 'info', label: 'En préstamo' };
    case 'devuelto':
    case 'finalizado':
      return { tone: 'ok', label: 'Devuelto' };
    case 'rechazado':
    case 'rechazada':
    case 'cancelado':
      return { tone: 'danger', label: 'Rechazado' };
    default:
      return { tone: 'neutral', label: state || 'Sin estado' };
  }
}

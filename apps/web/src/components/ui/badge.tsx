import type { HTMLAttributes, ReactNode } from 'react';
import { loanDisplayState, type LoanDisplayState, type LoanStateFields } from '@sgia/api-client/loan-state';
import { PurchaseStatus, QuotationStatus } from '@sgia/types';

import { cn } from '@/lib/cn';

export type Tone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'critical'
  | 'accent'
  | 'loaned'
  | 'available'
  | 'maintenance'
  | 'retired';

// Tonos «Trazo»: fondo suave + texto del estado, sin borde. El burdeo (accent) no es un estado:
// `accent` queda para marcas propias del flujo (p. ej. «Preparado»).
const OK = 'bg-ok-bg text-ok';
const WARN = 'bg-warn-bg text-warn';
const DANGER = 'bg-danger-bg text-danger';
const INFO = 'bg-info-bg text-info';
const NEUTRAL = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';

const toneClasses: Record<Tone, string> = {
  neutral: NEUTRAL,
  success: OK,
  available: OK,
  warning: WARN,
  maintenance: WARN,
  danger: DANGER,
  critical: DANGER,
  accent: 'bg-accent-soft text-accent',
  loaned: INFO,
  retired: NEUTRAL,
};

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-zinc-400',
  success: 'bg-ok',
  available: 'bg-ok',
  warning: 'bg-warn',
  maintenance: 'bg-warn',
  danger: 'bg-danger',
  critical: 'bg-danger',
  accent: 'bg-accent',
  loaned: 'bg-info',
  retired: 'bg-zinc-400',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  mono?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  dot = false,
  mono = false,
  icon,
  children,
  className,
  ...props
}: BadgeProps) {
  const statusStr = typeof children === 'string' ? children.toLowerCase().trim() : undefined;

  return (
    <span
      data-tone={tone}
      data-status={statusStr}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        mono ? 'font-mono' : 'font-sans',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0 -ml-0.5">{icon}</span>}
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[tone])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

const LOAN_STATE_META: Record<Exclude<LoanDisplayState, 'otro'>, { tone: Tone; label: string }> = {
  pendiente: { tone: 'warning', label: 'Pendiente' },
  preparado: { tone: 'accent', label: 'Preparado' },
  en_prestamo: { tone: 'loaned', label: 'En préstamo' },
  atrasado: { tone: 'critical', label: 'Atrasado' },
  devuelto: { tone: 'available', label: 'Devuelto' },
  rechazado: { tone: 'danger', label: 'Rechazado' },
};

/**
 * Estado de un préstamo. Con `loan` distingue entregado, atrasado y devuelto (`returned_at`, `diasAtraso`);
 * solo con `estado`, un préstamo `procesado` se muestra «En préstamo».
 */
export function LoanStatusBadge({ estado, loan }: { estado?: string; loan?: LoanStateFields }) {
  const state = loanDisplayState(loan ?? { status: estado });
  const meta = state === 'otro' ? { tone: 'neutral' as Tone, label: String(loan?.status ?? loan?.estado ?? estado ?? '—') } : LOAN_STATE_META[state];

  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

export function QuotationStatusBadge({ estado }: { estado: QuotationStatus }) {
  const tone: Tone =
    estado === QuotationStatus.COMPLETA
      ? 'success'
      : estado === QuotationStatus.EN_CAMINO
        ? 'warning'
        : 'accent';
  return <Badge tone={tone}>{estado}</Badge>;
}

const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = {
  [PurchaseStatus.PENDIENTE]: 'Pendiente',
  [PurchaseStatus.EN_CAMINO]: 'En camino',
  [PurchaseStatus.COMPLETA]: 'Completa',
  [PurchaseStatus.CANCELADA]: 'Cancelada',
};

const PURCHASE_STATUS_TONE: Record<PurchaseStatus, Tone> = {
  [PurchaseStatus.PENDIENTE]: 'warning',
  [PurchaseStatus.EN_CAMINO]: 'loaned',
  [PurchaseStatus.COMPLETA]: 'success',
  [PurchaseStatus.CANCELADA]: 'retired',
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  const tone: Tone = PURCHASE_STATUS_TONE[status] ?? 'neutral';
  return (
    <Badge tone={tone} dot>
      {PURCHASE_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

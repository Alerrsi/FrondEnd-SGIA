import type { HTMLAttributes, ReactNode } from 'react';
import { QuotationStatus } from '@sgia/types';

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

const toneClasses: Record<Tone, string> = {
  // Gris técnico atenuado
  neutral:
    'bg-zinc-100 text-zinc-700 border-zinc-200/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60',
  // Verde esmeralda (Disponible / En stock / Óptimo)
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  available:
    'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  // Ámbar preventivo (En mantención / Revisión / Alerta preventiva)
  warning:
    'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  maintenance:
    'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  // Rojo institucional / Error
  danger:
    'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  // Rosa técnico de stock crítico (< umbral mínimo)
  critical:
    'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  // Acento institucional INACAP
  accent:
    'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
  // Azul técnico (En préstamo / Asignado en pañol)
  loaned:
    'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
  retired:
    'bg-zinc-100 text-zinc-700 border-zinc-200/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60',
};

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-zinc-400 dark:bg-zinc-500',
  success: 'bg-emerald-500',
  available: 'bg-emerald-500',
  warning: 'bg-amber-500',
  maintenance: 'bg-amber-500',
  danger: 'bg-rose-500',
  critical: 'bg-rose-600 dark:bg-rose-500 animate-pulse',
  accent: 'bg-red-600 dark:bg-red-500',
  loaned: 'bg-blue-500',
  retired: 'bg-zinc-400 dark:bg-zinc-500',
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
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium transition-colors',
        mono ? 'font-mono tracking-tight text-[11px]' : 'font-sans',
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

export function LoanStatusBadge({ estado }: { estado: string }) {
  let tone: Tone = 'neutral';
  let label = estado;

  const normalized = String(estado).toLowerCase();
  switch (normalized) {
    case 'pendiente':
    case 'en_proceso':
      tone = 'warning';
      label = 'Pendiente';
      break;
    case 'preparado':
      tone = 'accent';
      label = 'Preparado';
      break;
    case 'entregado':
    case 'activo':
      tone = 'loaned';
      label = 'En Préstamo';
      break;
    case 'devuelto':
    case 'procesada':
    case 'finalizado':
      tone = 'available';
      label = 'Devuelto';
      break;
    case 'atrasado':
      tone = 'critical';
      label = 'Atrasado';
      break;
    case 'rechazada':
    case 'rechazado':
    case 'cancelado':
      tone = 'danger';
      label = 'Rechazado';
      break;
    default:
      tone = 'neutral';
      break;
  }

  return (
    <Badge tone={tone} dot>
      {label}
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

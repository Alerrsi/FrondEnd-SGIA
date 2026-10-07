import type { ReactNode } from 'react';
import { LoanStatus, QuotationStatus } from '@sgia/types';

import { cn } from '@/lib/cn';

export type Tone =
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'available'
  | 'loaned'
  | 'critical'
  | 'maintenance'
  | 'retired';

const dotClasses: Record<Tone, string> = {
  accent: 'bg-red-500 dark:bg-red-400',
  success: 'bg-emerald-500 dark:bg-emerald-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-rose-500 dark:bg-rose-400',
  neutral: 'bg-zinc-400 dark:bg-zinc-500',

  available: 'bg-emerald-500 dark:bg-emerald-400',
  loaned: 'bg-blue-500 dark:bg-blue-400',
  critical: 'bg-rose-500 dark:bg-rose-400',
  maintenance: 'bg-amber-500 dark:bg-amber-400',
  retired: 'bg-zinc-400 dark:bg-zinc-500',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  withDot = true,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  withDot?: boolean;
}) {
  const isPulse = tone === 'danger' || tone === 'critical';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] font-medium tracking-tight',
        'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60',
        className,
      )}
    >
      {withDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            dotClasses[tone],
            isPulse && 'animate-pulse',
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export function LoanStatusBadge({ estado }: { estado: LoanStatus }) {
  const tone: Tone =
    estado === LoanStatus.PROCESADA
      ? 'neutral'
      : estado === LoanStatus.RECHAZADA
        ? 'danger'
        : 'success';
  return <Badge tone={tone}>{estado}</Badge>;
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

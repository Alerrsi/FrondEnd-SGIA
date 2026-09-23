import { LoanStatus, QuotationStatus } from '@sgia/types';

import { cn } from '@/lib/cn';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent-muted border-accent/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  neutral: 'bg-transparent text-text-muted border-border',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono-tabular text-xs',
        toneClasses[tone],
        className,
      )}
    >
      {children}
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
import type { HTMLAttributes, ReactNode } from 'react';
import {
  InvoiceIntakeStatus,
  PurchaseStatus,
  QuotationStatus,
  type EquipmentUnitStatus,
} from '@sgia/types';

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
  neutral: 'bg-surface-raised text-text-muted border-border',
  retired: 'bg-surface-raised text-text-muted border-border',
  success: 'bg-ok-bg text-ok border-ok/30',
  available: 'bg-ok-bg text-ok border-ok/30',
  warning: 'bg-warn-bg text-warn border-warn/30',
  maintenance: 'bg-warn-bg text-warn border-warn/30',
  danger: 'bg-danger-bg text-danger border-danger/30',
  critical: 'bg-danger-bg text-danger border-danger/30',
  // Marca INACAP: distinto del rojo de error
  accent: 'bg-brand-soft text-brand-strong border-brand/30',
  loaned: 'bg-info/10 text-info border-info/30',
};

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-text-muted',
  retired: 'bg-text-muted',
  success: 'bg-ok',
  available: 'bg-ok',
  warning: 'bg-warn',
  maintenance: 'bg-warn',
  danger: 'bg-danger',
  critical: 'bg-danger animate-pulse',
  accent: 'bg-brand',
  loaned: 'bg-info',
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
        mono ? 'font-mono tracking-tight text-xs' : 'font-sans',
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

const INVOICE_STATUS_META: Record<InvoiceIntakeStatus, { label: string; tone: Tone }> = {
  [InvoiceIntakeStatus.BORRADOR]: { label: 'Borrador', tone: 'warning' },
  [InvoiceIntakeStatus.CONFIRMADO]: { label: 'Confirmado', tone: 'success' },
  [InvoiceIntakeStatus.ANULADO]: { label: 'Anulado', tone: 'retired' },
};

export function InvoiceIntakeStatusBadge({ status }: { status: InvoiceIntakeStatus }) {
  const meta = INVOICE_STATUS_META[status] ?? { label: status, tone: 'neutral' as const };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

const UNIT_STATUS_META: Record<EquipmentUnitStatus, { label: string; tone: Tone }> = {
  disponible: { label: 'Disponible', tone: 'available' },
  prestado: { label: 'Prestado', tone: 'loaned' },
  en_reparacion: { label: 'En reparación', tone: 'maintenance' },
  dado_de_baja: { label: 'De baja', tone: 'retired' },
};

export const UNIT_STATUS_LABELS = Object.fromEntries(
  Object.entries(UNIT_STATUS_META).map(([k, v]) => [k, v.label]),
) as Record<EquipmentUnitStatus, string>;

export function UnidadStatusBadge({ status }: { status: EquipmentUnitStatus }) {
  const meta = UNIT_STATUS_META[status] ?? { label: status, tone: 'neutral' as Tone };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

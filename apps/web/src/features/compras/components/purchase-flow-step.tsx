import { usePurchaseRequests } from '@sgia/api-client';
import type { PurchaseRequestStatus } from '@sgia/types';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

export interface PurchaseFlowStepProps {
  number: number;
  title: string;
  /** Qué ocurre en la etapa, en una línea. */
  description: string;
  /** Estado de la solicitud que espera esta etapa; el contador es el total de ese estado. */
  status: PurchaseRequestStatus;
  pendingLabel: string;
}

/** Etapa del flujo de compras: enlaza al listado de solicitudes filtrado por su estado. */
export function PurchaseFlowStep({ number, title, description, status, pendingLabel }: PurchaseFlowStepProps) {
  const { data, isLoading, isError } = usePurchaseRequests({ status, per_page: 1 });
  const total = data?.meta.total;
  const known = !isLoading && !isError && total !== undefined;
  const pending = known && total > 0;
  const countText = isLoading ? 'cargando' : known ? (pending ? `${total} ${pendingLabel}` : 'al día') : 'sin datos';

  return (
    <Link
      to={`/compras/solicitudes?status=${status}`}
      aria-label={`Paso ${number}, ${title}: ${countText}`}
      className={cn(
        'group flex h-full flex-col gap-2 rounded-md border bg-white px-3 py-2.5 shadow-xs transition-all duration-150',
        'hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400',
        'dark:bg-zinc-900 dark:hover:border-zinc-600',
        pending ? 'border-zinc-300 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-800',
      )}
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition-colors',
            pending
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'border border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400',
          )}
        >
          {number}
        </span>
        {title}
      </span>

      <span className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{description}</span>

      <span className="mt-auto flex items-center justify-between gap-2 text-[11px]">
        {pending ? (
          <span className="text-zinc-700 dark:text-zinc-300">
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{total}</span> {pendingLabel}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
            {known && <Check className="h-3 w-3" />}
            {isLoading ? '…' : known ? 'Al día' : '—'}
          </span>
        )}
        <span className="flex items-center gap-0.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Ver
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

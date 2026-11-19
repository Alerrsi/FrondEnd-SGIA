import { usePurchaseRequests } from '@sgia/api-client';
import type { PurchaseRequestStatus } from '@sgia/types';
import { Check } from 'lucide-react';
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
        'group relative flex h-full flex-col gap-2 p-4 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
        'focus-visible:outline-2 focus-visible:-outline-offset-2',
        // Barra burdeo arriba: la etapa tiene solicitudes esperando acción
        pending && 'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-accent',
      )}
    >
      <span className="flex items-baseline gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        <span className="font-code text-xs text-zinc-500 dark:text-zinc-400">{number}</span>
        {title}
      </span>

      {pending ? (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-medium leading-none tracking-[-0.02em] tabular-nums text-zinc-900 dark:text-zinc-100">
            {total}
          </span>
          <span className="text-[13px] text-zinc-600 dark:text-zinc-300">{pendingLabel}</span>
        </span>
      ) : (
        <span className="flex h-7.5 items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          {known && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
          {isLoading ? '…' : known ? 'Al día' : '—'}
        </span>
      )}

      <span className="mt-auto text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">{description}</span>
    </Link>
  );
}

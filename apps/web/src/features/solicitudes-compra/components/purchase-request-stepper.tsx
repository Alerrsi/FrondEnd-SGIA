import { PurchaseRequestStatus } from '@sgia/types';
import { Check } from 'lucide-react';

import {
  PURCHASE_REQUEST_FLOW,
  PURCHASE_REQUEST_STATUS_LABEL,
} from '@/features/solicitudes-compra/lib/purchase-request-status';
import { cn } from '@/lib/cn';

/**
 * Progreso de la solicitud en el camino feliz: un tramo por etapa con una barra arriba (llena hasta la
 * etapa actual). Bajo 640px solo se ve el nombre de la etapa actual; desde 640px, todas. Una cancelada se
 * muestra atenuada.
 */
export function PurchaseRequestStepper({ status }: { status: PurchaseRequestStatus }) {
  const cancelled = status === PurchaseRequestStatus.CANCELADA;
  const current = PURCHASE_REQUEST_FLOW.indexOf(status);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-2 flex items-baseline justify-between gap-2 text-[13px] sm:hidden">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {cancelled ? 'Cancelada' : PURCHASE_REQUEST_STATUS_LABEL[status]}
        </span>
        {!cancelled && current >= 0 && (
          <span className="font-mono text-zinc-500 dark:text-zinc-400">
            Etapa {current + 1} de {PURCHASE_REQUEST_FLOW.length}
          </span>
        )}
      </p>
      <ol
        aria-label="Etapas de la solicitud"
        className={cn('flex gap-1 sm:gap-2', cancelled && 'opacity-60')}
      >
        {PURCHASE_REQUEST_FLOW.map((step, i) => {
          const done = !cancelled && i < current;
          const active = !cancelled && i === current;
          return (
            <li
              key={step}
              aria-current={active ? 'step' : undefined}
              className="flex min-w-0 flex-1 flex-col gap-1.5"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-1 rounded-full',
                  done || active ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800',
                )}
              />
              <span
                className={cn(
                  'flex min-w-0 items-center gap-1 text-[13px] max-sm:sr-only',
                  active
                    ? 'font-medium text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400',
                )}
              >
                {done ? (
                  <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-ok" />
                ) : (
                  <span className="font-mono text-xs">{i + 1}</span>
                )}
                <span className="truncate">{PURCHASE_REQUEST_STATUS_LABEL[step]}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <p className="mt-2 hidden text-[13px] font-medium text-zinc-500 dark:text-zinc-400 sm:block">Cancelada</p>
      )}
    </div>
  );
}

import { PurchaseRequestStatus } from '@sgia/types';
import { Check } from 'lucide-react';

import {
  PURCHASE_REQUEST_FLOW,
  PURCHASE_REQUEST_STATUS_LABEL,
} from '@/features/solicitudes-compra/lib/purchase-request-status';
import { cn } from '@/lib/cn';

/** Progreso de la solicitud en el camino feliz; una cancelada se muestra atenuada. */
export function PurchaseRequestStepper({ status }: { status: PurchaseRequestStatus }) {
  const cancelled = status === PurchaseRequestStatus.CANCELADA;
  const current = PURCHASE_REQUEST_FLOW.indexOf(status);

  return (
    <ol
      aria-label="Etapas de la solicitud"
      className={cn(
        'flex flex-wrap items-center gap-x-1 gap-y-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-900',
        cancelled && 'opacity-60',
      )}
    >
      {PURCHASE_REQUEST_FLOW.map((step, i) => {
        const done = !cancelled && i < current;
        const active = !cancelled && i === current;
        return (
          <li key={step} className="flex items-center gap-1" aria-current={active ? 'step' : undefined}>
            {i > 0 && <span className="mx-1 h-px w-4 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />}
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full border font-mono text-[9px]',
                done && 'border-emerald-500 bg-emerald-500 text-white',
                active && 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900',
                !done && !active && 'border-zinc-300 text-zinc-400 dark:border-zinc-700',
              )}
            >
              {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'font-medium',
                active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              {PURCHASE_REQUEST_STATUS_LABEL[step]}
            </span>
          </li>
        );
      })}
      {cancelled && (
        <li className="ml-auto font-mono font-semibold uppercase text-zinc-500">Cancelada</li>
      )}
    </ol>
  );
}

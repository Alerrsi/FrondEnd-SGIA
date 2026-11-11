import { usePurchaseRequests } from '@sgia/api-client';
import { PurchaseRequestStatus } from '@sgia/types';
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react';

import { formatCLP } from '@/features/compras/lib/format';
import {
  isPurchaseRequestCode,
  normalizePurchaseRequestCode,
} from '@/features/solicitudes-compra/lib/purchase-request-code';
import { cn } from '@/lib/cn';

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs uppercase text-zinc-800 dark:text-zinc-200 placeholder:normal-case placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';

interface PurchaseRequestCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Código de solicitud (flujo nuevo): liga la factura a la OC de esa solicitud.
 * Busca la solicitud para confirmar que existe y tiene OC; el backend valida al subir.
 */
export function PurchaseRequestCodeField({
  value,
  onChange,
  disabled,
  error,
}: PurchaseRequestCodeFieldProps) {
  const code = normalizePurchaseRequestCode(value);
  const complete = isPurchaseRequestCode(code);
  const { data, isFetching } = usePurchaseRequests({ code, per_page: 5 }, { enabled: complete });
  const match = complete ? (data?.data ?? []).find((r) => r.code === code) : undefined;
  const hasOrder = match?.status === PurchaseRequestStatus.CON_OC;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="ii-request-code"
        className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
      >
        Solicitud de compra (opcional)
      </label>
      <input
        id="ii-request-code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SC-2026-0001"
        autoComplete="off"
        aria-invalid={Boolean(error) || undefined}
        disabled={disabled}
        className={cn(inputClasses, 'max-w-xs')}
      />
      {error ? (
        <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
      ) : complete && isFetching && !match ? (
        <p className="flex items-center gap-1 text-[11px] text-zinc-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Buscando solicitud…
        </p>
      ) : complete && match && hasOrder ? (
        <p className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          OC {match.order?.order_number ?? match.order?.code ?? ''} · reserva{' '}
          {formatCLP(match.order?.reserved_amount)}
        </p>
      ) : complete && !isFetching ? (
        <p className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
          <TriangleAlert className="h-3 w-3" />
          {match
            ? 'La solicitud aún no tiene orden de compra subida.'
            : 'No se encontró una solicitud con ese código.'}
        </p>
      ) : (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Si la compra viene de una solicitud, la factura se liga a su OC.
        </p>
      )}
    </div>
  );
}

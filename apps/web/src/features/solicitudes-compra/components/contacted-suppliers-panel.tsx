import { useResendPurchaseRequest } from '@sgia/api-client';
import { SUPPLIER_AREA_LABELS, type PurchaseRequest } from '@sgia/types';
import { Loader2, Mail, RotateCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/features/compras/lib/format';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

interface ContactedSuppliersPanelProps {
  request: PurchaseRequest;
  canManage: boolean;
}

/** Proveedores contactados al enviar, con el estado de su correo y reintento de los fallidos. */
export function ContactedSuppliersPanel({ request, canManage }: ContactedSuppliersPanelProps) {
  const resend = useResendPurchaseRequest();
  const failed = request.suppliers.filter((s) => s.email_status === 'fallido').length;
  const quotedIds = new Set(request.quotations.map((q) => q.supplier_id));

  const handleResend = async () => {
    try {
      const res = await resend.mutateAsync(request.id);
      const stillFailing = res.suppliers.filter((s) => s.email_error).length;
      if (stillFailing > 0) toast.warning(`${stillFailing} correo(s) siguen fallando.`);
      else toast.success('Correos reenviados correctamente.');
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <Mail className="h-4 w-4 text-zinc-400" />
            Proveedores contactados ({request.suppliers.length})
          </h2>
          <p className="text-[11px] text-zinc-500">
            Áreas:{' '}
            {request.areas.length
              ? request.areas.map((a) => SUPPLIER_AREA_LABELS[a]).join(', ')
              : '—'}
            {request.sent_at && ` · enviada ${formatDate(request.sent_at)}`}
          </p>
        </div>
        {canManage && request.actions.can_resend && failed > 0 && (
          <Button size="sm" variant="outline" onClick={handleResend} disabled={resend.isPending}>
            {resend.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCw className="h-3.5 w-3.5" />
            )}
            Reenviar fallidos ({failed})
          </Button>
        )}
      </header>
      {request.suppliers.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-zinc-400">
          Aún no se envía a proveedores.
        </p>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40">
              <th className="px-3 py-2 font-medium">Proveedor</th>
              <th className="px-3 py-2 font-medium">Correo</th>
              <th className="px-3 py-2 font-medium">Estado del correo</th>
              <th className="px-3 py-2 font-medium">Cotización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {request.suppliers.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                  {s.supplier?.name ?? `Proveedor #${s.supplier_id}`}
                </td>
                <td className="px-3 py-2 font-mono text-zinc-500">{s.supplier?.email ?? '—'}</td>
                <td className="px-3 py-2">
                  {s.email_status === 'fallido' ? (
                    <span title={s.email_error ?? undefined}>
                      <Badge tone="danger" dot>
                        Falló
                      </Badge>
                    </span>
                  ) : s.email_status === 'enviado' ? (
                    <Badge tone="success" dot>
                      Enviado {formatDate(s.email_sent_at)}
                    </Badge>
                  ) : (
                    <Badge tone="warning" dot>
                      En cola
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2">
                  {quotedIds.has(s.supplier_id) ? (
                    <Badge tone="loaned">Recibida</Badge>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

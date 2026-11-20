import { useResendPurchaseRequest } from '@sgia/api-client';
import { SUPPLIER_AREA_LABELS, type PurchaseRequest } from '@sgia/types';
import { Loader2, Mail, RotateCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/features/compras/lib/format';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { SectionTitle } from '@/components/ui/section-title';
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

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
    <section className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <SectionTitle icon={Mail}>Proveedores contactados ({request.suppliers.length})</SectionTitle>
          <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
            Áreas:{' '}
            {request.areas.length
              ? request.areas.map((a) => SUPPLIER_AREA_LABELS[a]).join(', ')
              : '—'}
            {request.sent_at && ` · enviada ${formatDate(request.sent_at)}`}
          </p>
        </div>
        {canManage && request.actions.can_resend && failed > 0 && (
          <Button size="sm" variant="secondary" onClick={handleResend} disabled={resend.isPending}>
            {resend.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            Reenviar fallidos ({failed})
          </Button>
        )}
      </header>
      {request.suppliers.length === 0 ? (
        <p className={`px-4 py-8 ${STATE_TEXT_CLASS}`}>
          Aún no se envía a proveedores.
        </p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className={`${TH_CLASS} ${STICKY_COL_CLASS} max-md:bg-zinc-50`}>Proveedor</th>
              <th className={TH_CLASS}>Correo</th>
              <th className={TH_CLASS}>Estado del correo</th>
              <th className={TH_CLASS}>Cotización</th>
            </tr>
          </thead>
          <tbody>
            {request.suppliers.map((s) => (
              <tr key={s.id} className={ROW_CLASS}>
                <td className={`${TD_CLASS} ${STICKY_COL_CLASS} font-medium text-zinc-900 dark:text-zinc-100`}>
                  {s.supplier?.name ?? `Proveedor #${s.supplier_id}`}
                </td>
                <td className={`${TD_CLASS} text-[13px] text-zinc-500 dark:text-zinc-400`}>{s.supplier?.email ?? '—'}</td>
                <td className={TD_CLASS}>
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
                <td className={TD_CLASS}>
                  {quotedIds.has(s.supplier_id) ? (
                    <Badge tone="loaned">Recibida</Badge>
                  ) : (
                    <span className="text-zinc-500 dark:text-zinc-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
}

import { useState } from 'react';
import {
  downloadPurchaseRequestQuotationFile,
  useDeletePurchaseRequestQuotation,
  useSelectPurchaseRequestQuotation,
} from '@sgia/api-client';
import type { PurchaseRequest, PurchaseRequestQuotation } from '@sgia/types';
import { CheckCircle2, FileDown, FileStack, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { UploadQuotationDialog } from '@/features/solicitudes-compra/components/upload-quotation-dialog';
import { openBlob } from '@/features/solicitudes-compra/lib/open-blob';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { SectionTitle } from '@/components/ui/section-title';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

interface QuotationsPanelProps {
  request: PurchaseRequest;
  canManage: boolean;
}

function supplierName(q: PurchaseRequestQuotation): string {
  return q.supplier?.name ?? `Proveedor #${q.supplier_id}`;
}

/** Cotizaciones subidas: archivo, comparador de totales y elección libre (mín. 3 subidas). */
export function QuotationsPanel({ request, canManage }: QuotationsPanelProps) {
  const remove = useDeletePurchaseRequestQuotation();
  const select = useSelectPurchaseRequestQuotation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PurchaseRequestQuotation | null>(null);
  const [toSelect, setToSelect] = useState<PurchaseRequestQuotation | null>(null);

  const quotations = request.quotations;
  const count = quotations.length;
  const min = request.min_quotations;
  // Lo que permite el estado lo decide el backend (`can_*`); el rol, el cliente.
  const canUpload = canManage && request.actions.can_upload_quotation;
  const canRemove = canManage && request.actions.can_remove_quotation;
  const canSelect = canManage && request.actions.can_select_quotation;
  const enoughToSelect = count >= min;
  const minTotal = count ? Math.min(...quotations.map((q) => q.total)) : 0;
  const maxTotal = count ? Math.max(...quotations.map((q) => q.total)) : 0;
  const sorted = [...quotations].sort((a, b) => a.total - b.total);

  const handleDownload = async (q: PurchaseRequestQuotation) => {
    try {
      openBlob(await downloadPurchaseRequestQuotationFile(request.id, q.id));
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync({ id: request.id, quotationId: toDelete.id });
      toast.success(`Cotización de ${supplierName(toDelete)} eliminada.`);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setToDelete(null);
    }
  };

  const handleSelect = async () => {
    if (!toSelect) return;
    try {
      await select.mutateAsync({ id: request.id, quotationId: toSelect.id });
      toast.success(`Cotización de ${supplierName(toSelect)} elegida. Ya puedes subir la OC.`);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setToSelect(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <div>
          <SectionTitle icon={FileStack}>
            Cotizaciones recibidas
            <span
            className={cn(
            'font-mono text-xs',
            enoughToSelect ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500',
            )}
            >
            {count}/{min}
            </span>
          </SectionTitle>
          <p className="text-[11px] text-zinc-500">
            {enoughToSelect
              ? 'Elige libremente con cuál quedarte; no tiene que ser la más barata.'
              : `Faltan ${min - count} para poder elegir.`}
          </p>
        </div>
        {canUpload && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Subir cotización
          </Button>
        )}
      </header>

      {count === 0 ? (
        <p className={`px-3 py-6 ${STATE_TEXT_CLASS}`}>
          Aún no se sube ninguna cotización.
        </p>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-3 py-2 font-medium">Proveedor</th>
              <th className="px-3 py-2 font-medium">Comparación</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Recibida</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {sorted.map((q) => {
              const selected = request.selected_quotation_id === q.id;
              const ratio = maxTotal > 0 ? (q.total / maxTotal) * 100 : 0;
              const diff = q.total - minTotal;
              return (
                <tr
                  key={q.id}
                  className={cn(selected && 'bg-emerald-50/50 dark:bg-emerald-950/20')}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                      {supplierName(q)}
                      {selected && (
                        <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>
                          Elegida
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className={cn(
                            'h-full',
                            diff === 0 ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500',
                          )}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {diff === 0 ? 'menor' : `+${formatCLP(diff)}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCLP(q.total)}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-500">
                    {formatDate(q.received_at ?? q.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {q.has_file && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Ver archivo"
                          aria-label={`Ver archivo de ${supplierName(q)}`}
                          onClick={() => handleDownload(q)}
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canSelect && !selected && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!enoughToSelect || select.isPending}
                          title={
                            enoughToSelect
                              ? undefined
                              : `Se necesitan ${min} cotizaciones`
                          }
                          onClick={() => setToSelect(q)}
                        >
                          Elegir
                        </Button>
                      )}
                      {canRemove && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Eliminar cotización"
                          aria-label={`Eliminar cotización de ${supplierName(q)}`}
                          onClick={() => setToDelete(q)}
                          className="text-zinc-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {canUpload && (
        <UploadQuotationDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          request={request}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar cotización"
        description={
          toDelete
            ? `Se quitará la cotización de ${supplierName(toDelete)} (${formatCLP(toDelete.total)}). Úsalo solo si se subió por error.`
            : ''
        }
        confirmLabel="Eliminar"
        variant="danger"
        loading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
      <ConfirmDialog
        open={toSelect !== null}
        title="Elegir cotización"
        description={
          toSelect
            ? `Se elegirá la cotización de ${supplierName(toSelect)} por ${formatCLP(toSelect.total)}. Ese total se reservará del presupuesto al subir la OC.`
            : ''
        }
        confirmLabel="Elegir"
        loading={select.isPending}
        onConfirm={handleSelect}
        onCancel={() => setToSelect(null)}
      />
    </section>
  );
}

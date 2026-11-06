import { useState } from 'react';
import { useBudget, useInvoiceIntake, useProducts, usePurchase } from '@sgia/api-client';
import { InvoiceIntakeStatus } from '@sgia/types';
import { Ban, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { CancelInvoiceIntakeDialog } from '@/features/ingresos-factura/components/cancel-invoice-intake-dialog';
import { InvoiceFilePreview } from '@/features/ingresos-factura/components/invoice-file-preview';
import { InvoiceIntakeStatusBadge } from '@/components/ui/badge';
import { InvoiceReviewForm } from '@/features/ingresos-factura/components/invoice-review-form';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';

interface InvoiceIntakeReviewSheetProps {
  intakeId: number | null;
  onClose: () => void;
}

/** Detalle del ingreso: archivo a la izquierda y, si es borrador, la revisión editable a la derecha. */
export function InvoiceIntakeReviewSheet({ intakeId, onClose }: InvoiceIntakeReviewSheetProps) {
  const { data: intake, isLoading } = useInvoiceIntake(intakeId ?? undefined);
  const { data: budget } = useBudget(intake?.annual_budget_id ?? undefined);
  const { data: purchase } = usePurchase(intake?.purchase_id ?? undefined);
  // El catálogo se carga antes de montar la revisión para asociar los ítems del OCR por nombre.
  const { data: catalog, isSuccess: catalogReady } = useProducts({
    page: 1,
    per_page: 100,
  });
  const [cancelling, setCancelling] = useState(false);

  const isDraft = intake?.status === InvoiceIntakeStatus.BORRADOR;
  const canCancel = intake !== undefined && intake.status !== InvoiceIntakeStatus.ANULADO;

  return (
    <>
      <Sheet open={intakeId !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="center" className="overflow-y-auto">
          {isLoading || !intake ? (
            <div className="flex items-center justify-center py-16 text-xs text-zinc-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando ingreso…
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-zinc-100">
                  <span className="font-mono">
                    {intake.document_number ?? `Ingreso #${intake.id}`}
                  </span>
                  <InvoiceIntakeStatusBadge status={intake.status} />
                </SheetTitle>
                <SheetDescription className="text-sm text-zinc-600 dark:text-zinc-300">
                  {budget
                    ? `${careerLabel(budget)} · ${budget.year}`
                    : intake.annual_budget_id
                      ? `Presupuesto #${intake.annual_budget_id}`
                      : 'Sin presupuesto asociado'}
                  {purchase ? ` · Compra ${purchase.code ?? `#${purchase.id}`}` : ''}
                  {` · Recibida ${formatDate(intake.received_at ?? intake.created_at)}`}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-2 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <InvoiceFilePreview intakeId={intake.id} hasFile={intake.has_file} />

                <div className="flex flex-col gap-3">
                  {isDraft && !catalogReady ? (
                    <div className="flex items-center justify-center py-10 text-xs text-zinc-400">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando catálogo de productos…
                    </div>
                  ) : isDraft ? (
                    <InvoiceReviewForm
                      key={intake.id}
                      intake={intake}
                      catalog={catalog?.data ?? []}
                      budget={budget}
                      purchaseReserved={purchase?.reserved_amount ?? 0}
                    />
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            <th className="px-3 py-2 font-medium">Producto</th>
                            <th className="px-3 py-2 text-right font-medium">Cant.</th>
                            <th className="px-3 py-2 text-right font-medium">P. unit.</th>
                            <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                          {intake.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2">
                                <div className="text-zinc-800 dark:text-zinc-200">
                                  {item.product?.nombre ??
                                    item.product?.name ??
                                    `Producto #${item.product_id}`}
                                </div>
                                {item.detected_name && (
                                  <div className="text-[11px] text-zinc-400">
                                    OCR: {item.detected_name}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {formatCLP(item.unit_price)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {formatCLP(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                          {intake.items.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-6 text-center text-zinc-400">
                                Sin ítems registrados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-zinc-200 dark:border-zinc-800 font-semibold">
                            <td className="px-3 py-2" colSpan={3}>
                              Total descontado
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {formatCLP(intake.total_deducted)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {canCancel && (
                    <Button
                      variant="ghost"
                      onClick={() => setCancelling(true)}
                      className="self-start text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Ban className="h-4 w-4" />
                      {isDraft ? 'Anular borrador' : 'Anular factura confirmada'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {cancelling && intake && (
        <CancelInvoiceIntakeDialog intake={intake} onClose={() => setCancelling(false)} />
      )}
    </>
  );
}

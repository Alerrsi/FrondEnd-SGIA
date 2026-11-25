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
import { InvoiceIntakeStatusBadge } from '@/features/ingresos-factura/components/invoice-intake-status-badge';
import { InvoiceReviewForm } from '@/features/ingresos-factura/components/invoice-review-form';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';

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
        {/* Bajo 640px, pantalla completa; desde 640px, centrado en ambos ejes con márgenes automáticos (el
            Sheet ya fija top/bottom en 0, por eso `top-1/2` + translate lo dejaba con la mitad fuera). */}
        <SheetContent side="center" className="sm:my-auto sm:h-[90dvh] sm:max-w-7xl sm:rounded-lg sm:border-y">
          {isLoading || !intake ? (
            <div role="status" className="grid h-full grid-cols-1 gap-4 p-1 lg:grid-cols-2">
              <span className="sr-only">Cargando ingreso…</span>
              <Skeleton className="h-full min-h-64" />
              <div className="flex flex-col gap-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>
                  <span className="font-code">
                    {intake.document_number ?? `Ingreso #${intake.id}`}
                  </span>
                  <InvoiceIntakeStatusBadge status={intake.status} />
                </SheetTitle>
                <SheetDescription>
                  {budget
                    ? `${careerLabel(budget)} · ${budget.year}`
                    : intake.annual_budget_id
                      ? `Presupuesto #${intake.annual_budget_id}`
                      : 'Sin presupuesto asociado'}
                  {purchase ? ` · Compra ${purchase.code ?? `#${purchase.id}`}` : ''}
                  {` · Recibida ${formatDate(intake.received_at ?? intake.created_at)}`}
                </SheetDescription>
              </SheetHeader>

              {/* Desde 1280px, factura (1/3) y revisión (2/3) lado a lado: la tabla de ítems necesita ~48rem. */}
              <div className="mt-2 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <InvoiceFilePreview intakeId={intake.id} hasFile={intake.has_file} />

                <div className="flex flex-col gap-3">
                  {isDraft && !catalogReady ? (
                    <div className={`flex items-center justify-center py-10 ${STATE_TEXT_CLASS}`}>
                      <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
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
                    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full border-collapse text-left text-[13px] text-zinc-700 dark:text-zinc-300">
                        <thead className={TABLE_HEAD_CLASS}>
                          <tr>
                            <th className="px-3 py-2 font-medium">Producto</th>
                            <th className="px-3 py-2 text-right font-medium">Cant.</th>
                            <th className="px-3 py-2 text-right font-medium">P. unit.</th>
                            <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {intake.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2">
                                <div className="text-zinc-800 dark:text-zinc-200">
                                  {item.product?.nombre ??
                                    item.product?.name ??
                                    `Producto #${item.product_id}`}
                                </div>
                                {item.detected_name && (
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                    OCR: {item.detected_name}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap font-mono">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap font-mono">
                                {formatCLP(item.unit_price)}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap font-mono">
                                {formatCLP(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                          {intake.items.length === 0 && (
                            <tr>
                              <td colSpan={4} className={`px-3 py-6 ${STATE_TEXT_CLASS}`}>
                                Sin ítems registrados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-zinc-200 font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                            <td className="px-3 py-2" colSpan={3}>
                              Total descontado
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-semibold">
                              {formatCLP(intake.total_deducted)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {canCancel && (
                    <Button variant="secondary" onClick={() => setCancelling(true)} className="self-start">
                      <Ban aria-hidden="true" className="h-4 w-4" />
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

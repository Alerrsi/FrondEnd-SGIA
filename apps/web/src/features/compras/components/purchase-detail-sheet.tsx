import { useRef, useState } from 'react';
import {
  downloadPurchaseArrivalDocument,
  useScanPurchaseArrival,
  useUpdatePurchaseStatus,
} from '@sgia/api-client';
import { PurchaseStatus, type PurchaseOrder } from '@sgia/types';
import { Calendar, FileDown, Loader2, PackageCheck, ScanLine, Truck } from 'lucide-react';

import { PurchaseStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

interface PurchaseDetailSheetProps {
  open: boolean;
  onClose: () => void;
  purchase: PurchaseOrder | null;
}

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50';

export function PurchaseDetailSheet({ open, onClose, purchase }: PurchaseDetailSheetProps) {
  const updateStatus = useUpdatePurchaseStatus();
  const scanArrival = useScanPurchaseArrival();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReceive, setConfirmReceive] = useState(false);
  const [guideNumber, setGuideNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!purchase) return null;

  const canShip = purchase.allowed_transitions?.includes(PurchaseStatus.EN_CAMINO) ?? false;
  const canReceive = purchase.allowed_transitions?.includes(PurchaseStatus.COMPLETA) ?? false;
  const canScan = purchase.status !== PurchaseStatus.COMPLETA;
  const hasScanInput = Boolean(file || guideNumber.trim() || invoiceNumber.trim());

  const changeStatus = async (status: PurchaseStatus) => {
    try {
      await updateStatus.mutateAsync({ id: purchase.id, status });
      toast.success(
        status === PurchaseStatus.COMPLETA
          ? 'Llegada confirmada. Se notificó al pañolero para ubicar los productos.'
          : 'Orden marcada en camino.',
      );
      setConfirmReceive(false);
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
      setConfirmReceive(false);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasScanInput) return;
    try {
      await scanArrival.mutateAsync({
        id: purchase.id,
        payload: {
          document: file,
          guide_number: guideNumber.trim() || null,
          invoice_number: invoiceNumber.trim() || null,
        },
      });
      toast.success('Guía registrada. La orden quedó completa y se notificó al pañolero.');
      setFile(null);
      setGuideNumber('');
      setInvoiceNumber('');
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadPurchaseArrivalDocument(purchase.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const code = purchase.code ?? `#${purchase.id}`;

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono text-zinc-900 dark:text-zinc-100">
              Orden {code}
            </SheetTitle>
            <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {purchase.supplier?.name ?? 'Proveedor sin nombre'}
              {purchase.quotation_id ? ` · Cotización #${purchase.quotation_id}` : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <PurchaseStatusBadge status={purchase.status} />
              <span className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400">
                <Calendar className="h-3 w-3" />
                {formatDate(purchase.created_at)}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 p-3 text-xs">
              <div>
                <dt className="text-zinc-500">Llegada estimada</dt>
                <dd className="font-mono">{formatDate(purchase.expected_at)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Recibida</dt>
                <dd className="font-mono">{formatDate(purchase.received_at)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">N° guía</dt>
                <dd className="font-mono">{purchase.guide_number ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">N° factura</dt>
                <dd className="font-mono">{purchase.invoice_number ?? '—'}</dd>
              </div>
            </dl>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Ítem</th>
                    <th className="px-3 py-2 text-right font-semibold">Cant.</th>
                    <th className="px-3 py-2 text-right font-semibold">P. unit.</th>
                    <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items.map((item, i) => (
                    <tr key={item.id ?? i} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-3 py-1.5 text-zinc-800 dark:text-zinc-200">
                        {item.name ?? `Producto #${item.product_id}`}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">{item.quantity}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatCLP(item.unit_price)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {formatCLP(item.subtotal ?? (item.unit_price ?? 0) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 dark:border-zinc-800 font-semibold">
                    <td className="px-3 py-2" colSpan={3}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{formatCLP(purchase.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {purchase.notes && (
              <p className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                {purchase.notes}
              </p>
            )}

            {purchase.arrival_document_url && (
              <Button variant="outline" onClick={handleDownload} className="text-xs">
                <FileDown className="h-4 w-4" />
                Ver documento de llegada
              </Button>
            )}

            {(canShip || canReceive) && (
              <div className="flex flex-col gap-2">
                {canShip && (
                  <Button
                    variant="outline"
                    onClick={() => changeStatus(PurchaseStatus.EN_CAMINO)}
                    disabled={updateStatus.isPending}
                    className="text-xs"
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                    Marcar en camino
                  </Button>
                )}
                {canReceive && (
                  <Button onClick={() => setConfirmReceive(true)} className="text-xs">
                    <PackageCheck className="h-4 w-4" />
                    Confirmar llegada / Marcar completa
                  </Button>
                )}
              </div>
            )}

            {canScan && (
              <form
                onSubmit={handleScan}
                className="flex flex-col gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 p-3"
              >
                <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <ScanLine className="h-3.5 w-3.5" />
                  Registrar guía / factura de llegada
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Al registrarla la orden pasa a completa y se lee la factura por OCR.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  aria-label="Documento de llegada"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-xs text-zinc-600 dark:text-zinc-300"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    aria-label="Número de guía"
                    placeholder="N° guía"
                    value={guideNumber}
                    onChange={(e) => setGuideNumber(e.target.value)}
                    className={inputClasses}
                  />
                  <input
                    aria-label="Número de factura"
                    placeholder="N° factura"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <Button type="submit" disabled={!hasScanInput || scanArrival.isPending} className="text-xs">
                  {scanArrival.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Registrar y completar
                </Button>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmReceive}
        title="Confirmar llegada"
        description={`La orden ${code} pasará a completa y se notificará al pañolero para ubicar físicamente los productos. Esta acción no se puede deshacer.`}
        confirmLabel="Marcar completa"
        loading={updateStatus.isPending}
        onConfirm={() => changeStatus(PurchaseStatus.COMPLETA)}
        onCancel={() => setConfirmReceive(false)}
      />
    </>
  );
}

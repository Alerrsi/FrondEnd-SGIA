import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { downloadPurchaseRequestOrderFile, useUploadPurchaseRequestOrder } from '@sgia/api-client';
import { PurchaseRequestStatus, type PurchaseRequest } from '@sgia/types';
import { FileDown, Loader2, ReceiptText, ShoppingCart, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCLP } from '@/features/compras/lib/format';
import { FileField } from '@/features/solicitudes-compra/components/file-field';
import { openBlob } from '@/features/solicitudes-compra/lib/open-blob';
import {
  ORDER_FILE_EXTENSIONS,
  orderUploadSchema,
  type OrderUploadValues,
  type OrderUploadParsed,
} from '@/features/solicitudes-compra/lib/quotation-upload-schema';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';

const errorClasses = 'text-[11px] text-rose-600 dark:text-rose-400';

interface OrderPanelProps {
  request: PurchaseRequest;
  canManage: boolean;
  /** DIR-01 y AD-01 registran facturas (`scanInvoice`). */
  canRegisterInvoice: boolean;
}

const EMPTY: OrderUploadValues = { order_number: '', file: null };

/** OC emitida fuera del sistema: se sube su archivo (reserva el total elegido) y luego se factura. */
export function OrderPanel({ request, canManage, canRegisterInvoice }: OrderPanelProps) {
  const upload = useUploadPurchaseRequestOrder();
  const selected = request.quotations.find((q) => q.id === request.selected_quotation_id);
  const order = request.order;
  const canUpload = canManage && order === null && request.actions.can_issue_order;
  const canInvoice = canRegisterInvoice && request.status === PurchaseRequestStatus.CON_OC;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<OrderUploadValues, unknown, OrderUploadParsed>({ resolver: zodResolver(orderUploadSchema), defaultValues: EMPTY });

  useEffect(() => {
    reset(EMPTY);
  }, [request.selected_quotation_id, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await upload.mutateAsync({
        id: request.id,
        payload: { file: values.file, order_number: values.order_number },
      });
      toast.success(
        `OC registrada. Se reservaron ${formatCLP(updated.order?.reserved_amount ?? selected?.total)} del presupuesto.`,
      );
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      if (fieldErrors.order_number) setError('order_number', { message: fieldErrors.order_number });
      if (fieldErrors.file) setError('file', { message: fieldErrors.file });
      // 422 por presupuesto insuficiente u otra regla: el mensaje del backend manda.
      toast.error(apiErrorToMessage(error));
    }
  });

  const handleDownload = async () => {
    try {
      openBlob(await downloadPurchaseRequestOrderFile(request.id));
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const pending = upload.isPending;

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <ShoppingCart className="h-4 w-4 text-zinc-400" />
          Orden de compra y factura
        </h2>
        <p className="text-[11px] text-zinc-500">
          La OC se emite fuera del sistema; aquí se sube su archivo ligado a {request.code}.
        </p>
      </header>

      <div className="flex flex-col gap-3 p-3 text-xs">
        {selected && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Cotización elegida:{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {selected.supplier?.name ?? `Proveedor #${selected.supplier_id}`}
            </span>{' '}
            · <span className="font-mono">{formatCLP(selected.total)}</span>
          </p>
        )}

        {order ? (
          <dl className="grid grid-cols-2 gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800 sm:grid-cols-4">
            <div>
              <dt className="text-zinc-500">Código</dt>
              <dd className="font-mono">{order.code ?? `#${order.id}`}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">N° OC</dt>
              <dd className="font-mono">{order.order_number ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Proveedor</dt>
              <dd>{order.supplier_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Estado OC</dt>
              <dd className="font-mono">{order.status}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Total</dt>
              <dd className="font-mono">{formatCLP(order.total_amount)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Reservado</dt>
              <dd className="font-mono">{formatCLP(order.reserved_amount)}</dd>
            </div>
            <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-4">
              {order.has_order_file && (
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <FileDown className="h-3.5 w-3.5" />
                  Ver archivo de la OC
                </Button>
              )}
              <Link
                to={`/compras/${order.id}/trazabilidad`}
                className="text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                Ver trazabilidad
              </Link>
            </div>
          </dl>
        ) : canUpload ? (
          <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="oc-number"
                className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                N° de la orden de compra
              </label>
              <input
                id="oc-number"
                {...register('order_number')}
                aria-invalid={Boolean(errors.order_number) || undefined}
                disabled={pending}
                className={`${inputClasses} max-w-xs`}
              />
              {errors.order_number && <p className={errorClasses}>{errors.order_number.message}</p>}
            </div>
            <Controller
              control={control}
              name="file"
              render={({ field }) => (
                <FileField
                  label="Archivo de la orden de compra"
                  extensions={ORDER_FILE_EXTENSIONS}
                  hint="PDF, PNG, JPG o WEBP · máx. 10 MB"
                  file={field.value}
                  onChange={field.onChange}
                  disabled={pending}
                  invalid={Boolean(errors.file)}
                />
              )}
            />
            {errors.file && <p className={errorClasses}>{errors.file.message}</p>}
            <div>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Subir OC y reservar presupuesto
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-zinc-400">
            {request.selected_quotation_id === null
              ? 'Primero elige una cotización.'
              : 'Sin orden de compra registrada.'}
          </p>
        )}

        {request.invoices.length > 0 && (
          <ul className="flex flex-col gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
            {request.invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2">
                <ReceiptText className="h-3.5 w-3.5 text-zinc-400" />
                <span className="font-mono">Factura {inv.document_number ?? `#${inv.id}`}</span>
                <Badge
                  tone={
                    inv.status === 'confirmado'
                      ? 'success'
                      : inv.status === 'anulado'
                        ? 'retired'
                        : 'warning'
                  }
                  dot
                >
                  {inv.status}
                </Badge>
                {inv.total_deducted > 0 && (
                  <span className="font-mono text-zinc-500">{formatCLP(inv.total_deducted)}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {request.status === PurchaseRequestStatus.FACTURADA && (
          <p className="text-[11px] text-zinc-500">
            Si se anula la factura, la solicitud vuelve a «Con OC» y se puede registrar otra.
          </p>
        )}

        {canInvoice && (
          <div>
            <Link
              to={`/ingresos-factura?solicitud=${encodeURIComponent(request.code)}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <ReceiptText className="h-3.5 w-3.5" />
              Registrar factura
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

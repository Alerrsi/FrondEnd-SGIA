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
import { SectionTitle } from '@/components/ui/section-title';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { ButtonLink } from '@/components/shared/button-link';

const inputClasses = FORM_CONTROL_CLASS;

const errorClasses = 'text-xs text-danger';
const TERM_CLASS = 'text-zinc-500 dark:text-zinc-400';

interface OrderPanelProps {
  request: PurchaseRequest;
  canManage: boolean;
  /** DIR-01 registra facturas (`scanInvoice`). */
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
    <section className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <SectionTitle icon={ShoppingCart}>Orden de compra y factura</SectionTitle>
        <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
          La OC se emite fuera del sistema; aquí se sube su archivo ligado a {request.code}.
        </p>
      </header>

      <div className="flex flex-col gap-3 p-4 text-[13px] text-zinc-700 dark:text-zinc-300">
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
          <dl className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 min-[400px]:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className={TERM_CLASS}>Código</dt>
              <dd className="font-code text-xs">{order.code ?? `#${order.id}`}</dd>
            </div>
            <div>
              <dt className={TERM_CLASS}>N° OC</dt>
              <dd className="font-code text-xs">{order.order_number ?? '—'}</dd>
            </div>
            <div>
              <dt className={TERM_CLASS}>Proveedor</dt>
              <dd>{order.supplier_name ?? '—'}</dd>
            </div>
            <div>
              <dt className={TERM_CLASS}>Estado OC</dt>
              <dd>{order.status}</dd>
            </div>
            <div>
              <dt className={TERM_CLASS}>Total</dt>
              <dd className="font-mono">{formatCLP(order.total_amount)}</dd>
            </div>
            <div>
              <dt className={TERM_CLASS}>Reservado</dt>
              <dd className="font-mono">{formatCLP(order.reserved_amount)}</dd>
            </div>
            <div className="flex flex-wrap items-center gap-3 min-[400px]:col-span-2 lg:col-span-4">
              {order.has_order_file && (
                <Button size="sm" variant="secondary" onClick={handleDownload}>
                  <FileDown aria-hidden="true" className="h-3.5 w-3.5" />
                  Ver archivo de la OC
                </Button>
              )}
              <Link
                to={`/compras/ordenes/${order.id}/trazabilidad`}
                className="text-[13px] font-medium text-accent underline underline-offset-2 hover:no-underline"
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
                className={FIELD_LABEL_CLASS}
              >
                N° de la orden de compra
              </label>
              <input
                id="oc-number"
                {...register('order_number')}
                aria-invalid={Boolean(errors.order_number) || undefined}
                disabled={pending}
                className={`${inputClasses} sm:max-w-xs`}
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
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                Subir OC y reservar presupuesto
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400">
            {request.selected_quotation_id === null
              ? 'Primero elige una cotización.'
              : 'Sin orden de compra registrada.'}
          </p>
        )}

        {request.invoices.length > 0 && (
          <ul className="flex flex-col gap-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            {request.invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-2">
                <ReceiptText aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
                <span>
                  Factura <span className="font-code text-xs">{inv.document_number ?? `#${inv.id}`}</span>
                </span>
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
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">{formatCLP(inv.total_deducted)}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {request.status === PurchaseRequestStatus.FACTURADA && (
          <p className="text-zinc-500 dark:text-zinc-400">
            Si se anula la factura, la solicitud vuelve a «Con OC» y se puede registrar otra.
          </p>
        )}

        {canInvoice && (
          <div>
            <ButtonLink
              variant="primary"
              size="sm"
              to={`/compras/facturas?solicitud=${encodeURIComponent(request.code)}`}
            >
              <ReceiptText aria-hidden="true" className="h-3.5 w-3.5" />
              Registrar factura
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

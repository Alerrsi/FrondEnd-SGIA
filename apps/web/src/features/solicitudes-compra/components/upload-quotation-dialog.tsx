import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUploadPurchaseRequestQuotation } from '@sgia/api-client';
import type { PurchaseRequest } from '@sgia/types';
import { Calculator, Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import { FileField } from '@/features/solicitudes-compra/components/file-field';
import {
  itemsSubtotal,
  QUOTATION_FILE_EXTENSIONS,
  quotationUploadSchema,
  type QuotationUploadValues,
  type QuotationUploadParsed,
} from '@/features/solicitudes-compra/lib/quotation-upload-schema';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';

const inputClasses =
  FORM_CONTROL_CLASS;

const labelClasses = FIELD_LABEL_CLASS;

const errorClasses = 'text-[11px] text-rose-600 dark:text-rose-400';

interface UploadQuotationDialogProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
}

function defaults(request: PurchaseRequest): QuotationUploadValues {
  return {
    supplier_id: Number.NaN,
    file: null,
    total: Number.NaN,
    received_at: '',
    items: request.items.map((i) => ({ purchase_request_item_id: i.id, unit_price: Number.NaN })),
  };
}

/** Sube a mano una cotización recibida por correo: proveedor contactado, archivo, total y precios. */
export function UploadQuotationDialog({ open, onClose, request }: UploadQuotationDialogProps) {
  const upload = useUploadPurchaseRequestQuotation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<QuotationUploadValues, unknown, QuotationUploadParsed>({
    resolver: zodResolver(quotationUploadSchema),
    defaultValues: defaults(request),
  });
  const items = useWatch({ control, name: 'items' });

  useEffect(() => {
    if (open) reset(defaults(request));
  }, [open, request, reset]);

  // Solo proveedores contactados que aún no tienen cotización subida (unique por proveedor).
  const quoted = useMemo(() => new Set(request.quotations.map((q) => q.supplier_id)), [request]);
  const candidates = request.suppliers.filter((s) => !quoted.has(s.supplier_id));
  const quantities = useMemo(
    () => new Map(request.items.map((i) => [i.id, i.quantity])),
    [request.items],
  );
  const subtotal = itemsSubtotal(items ?? [], quantities);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await upload.mutateAsync({
        id: request.id,
        payload: {
          supplier_id: values.supplier_id,
          file: values.file,
          total: values.total,
          received_at: values.received_at || undefined,
          items: values.items,
        },
      });
      toast.success(
        `Cotización registrada: ${updated.quotations_count} de ${request.min_quotations} mínimas.`,
      );
      onClose();
    } catch (error) {
      for (const [field, message] of Object.entries(apiFieldErrors(error))) {
        const match = /^items\.(\d+)\.(unit_price|purchase_request_item_id)$/.exec(field);
        if (match) setError(`items.${Number(match[1])}.unit_price`, { message });
        else if (
          field === 'supplier_id' ||
          field === 'file' ||
          field === 'total' ||
          field === 'received_at'
        )
          setError(field, { message });
        else if (field === 'items') toast.error(message);
      }
      toast.error(apiErrorToMessage(error));
    }
  });

  const pending = upload.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title={`Subir cotización · ${request.code}`}
      description="Las cotizaciones no entran solas: sube el archivo que respondió el proveedor y digita el total y los precios unitarios."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q-supplier" className={labelClasses}>
            Proveedor contactado
          </label>
          <select
            id="q-supplier"
            {...register('supplier_id', { valueAsNumber: true })}
            aria-invalid={Boolean(errors.supplier_id) || undefined}
            disabled={pending}
            className={inputClasses}
          >
            <option value="">Selecciona un proveedor…</option>
            {candidates.map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>
                {s.supplier?.name ?? `Proveedor #${s.supplier_id}`}
              </option>
            ))}
          </select>
          {candidates.length === 0 && (
            <p className="text-[11px] text-zinc-500">
              Todos los proveedores contactados ya tienen cotización subida.
            </p>
          )}
          {errors.supplier_id && <p className={errorClasses}>{errors.supplier_id.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClasses}>Archivo de la cotización</span>
          <Controller
            control={control}
            name="file"
            render={({ field }) => (
              <FileField
                label="Archivo de la cotización"
                extensions={QUOTATION_FILE_EXTENSIONS}
                hint="PDF, imagen, Word o Excel · máx. 10 MB"
                file={field.value}
                onChange={field.onChange}
                disabled={pending}
                invalid={Boolean(errors.file)}
              />
            )}
          />
          {errors.file && <p className={errorClasses}>{errors.file.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="q-received" className={labelClasses}>
            Fecha de recepción (opcional)
          </label>
          <input
            id="q-received"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            {...register('received_at')}
            aria-invalid={Boolean(errors.received_at) || undefined}
            disabled={pending}
            className={`${inputClasses} max-w-xs`}
          />
          {errors.received_at && <p className={errorClasses}>{errors.received_at.message}</p>}
        </div>

        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Indica el precio unitario de <strong>cada</strong> producto de la solicitud.
        </p>
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 text-right font-medium">Cant.</th>
                <th className="px-3 py-2 text-right font-medium">Precio unit.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {request.items.map((item, index) => {
                const priceError = errors.items?.[index]?.unit_price?.message;
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                      {item.product_name}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step="1"
                        aria-label={`Precio unitario de ${item.product_name}`}
                        aria-invalid={Boolean(priceError) || undefined}
                        disabled={pending}
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                        className="h-7 w-28 rounded border border-zinc-200 bg-zinc-50 px-2 text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 aria-invalid:border-rose-400 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      {priceError && <p className={errorClasses}>{priceError}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="q-total" className={labelClasses}>
            Total de la cotización (CLP)
          </label>
          <div className="flex gap-2">
            <input
              id="q-total"
              type="number"
              min={0}
              step="1"
              {...register('total', { valueAsNumber: true })}
              aria-invalid={Boolean(errors.total) || undefined}
              disabled={pending}
              className={`${inputClasses} max-w-xs`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || subtotal <= 0}
              onClick={() => setValue('total', subtotal, { shouldDirty: true, shouldValidate: true })}
            >
              <Calculator className="h-3.5 w-3.5" />
              Usar suma ({formatCLP(subtotal)})
            </Button>
          </div>
          {errors.total && <p className={errorClasses}>{errors.total.message}</p>}
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Este total es lo que se reserva del presupuesto si eliges esta cotización (puede incluir
            despacho o impuestos).
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending || candidates.length === 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir cotización
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

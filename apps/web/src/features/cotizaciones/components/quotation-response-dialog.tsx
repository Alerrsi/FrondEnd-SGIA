import { useForm, useWatch } from 'react-hook-form';
import { useUpdateQuotationResponse } from '@sgia/api-client';
import type { Cotizacion, QuotationResponsePayload, Supplier } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-border bg-surface px-3 font-mono text-xs text-text focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50 aria-invalid:border-danger';
const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-text-muted font-mono';
const errorClasses = 'text-xs text-danger';

interface FormValues {
  status: 'aceptada' | 'rechazada';
  quotation_number: string;
  notes: string;
  prices: string[];
}

interface QuotationResponseDialogProps {
  open: boolean;
  onClose: () => void;
  cotizacion: Cotizacion;
  supplier: Supplier;
}

/** Registra la respuesta de un proveedor (DIR-01 / AD-01), con precio unitario por ítem si acepta. */
export function QuotationResponseDialog({
  open,
  onClose,
  cotizacion,
  supplier,
}: QuotationResponseDialogProps) {
  const update = useUpdateQuotationResponse();
  const items = (cotizacion.items ?? cotizacion.products ?? []).map((it) => ({
    productId: (it.productoId ?? it.product_id) as number,
    name: it.name ?? `Producto #${it.productoId ?? it.product_id}`,
    quantity: it.cantidad ?? it.quantity ?? 0,
  }));
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: { status: 'aceptada', quotation_number: '', notes: '', prices: items.map(() => '') },
  });
  const status = useWatch({ control, name: 'status' });
  const prices = useWatch({ control, name: 'prices' });
  const accepted = status === 'aceptada';
  const offerTotal = items.reduce((sum, it, i) => sum + (Number(prices?.[i]) || 0) * it.quantity, 0);

  const onSubmit = handleSubmit(async (values) => {
    const payload: QuotationResponsePayload = {
      supplier_id: supplier.id,
      status: values.status,
      quotation_number: values.quotation_number.trim() || undefined,
      notes: values.notes.trim() || undefined,
      ...(accepted && {
        offer_total: offerTotal,
        items: items.map((it, i) => ({
          product_id: it.productId,
          offered_unit_price: Number(values.prices[i]),
        })),
      }),
    };
    try {
      await update.mutateAsync({ id: cotizacion.id, payload });
      toast.success(`Respuesta de ${supplier.name} registrada.`);
      onClose();
    } catch (error) {
      for (const [field, message] of Object.entries(apiFieldErrors(error))) {
        const m = /^items\.(\d+)\./.exec(field);
        if (m) setError(`prices.${Number(m[1])}`, { message });
        else if (field === 'quotation_number' || field === 'notes')
          setError(field, { message });
        else setError('status', { message });
      }
      toast.error(apiErrorToMessage(error));
    }
  });

  const pending = update.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title={`Respuesta de ${supplier.name}`}
      description={`Cotización #${cotizacion.id}`}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-status" className={labelClasses}>
            Respuesta
          </label>
          <select id="qr-status" {...register('status')} disabled={pending} className={inputClasses}>
            <option value="aceptada">Aceptada</option>
            <option value="rechazada">Rechazada</option>
          </select>
          {errors.status && <p className={errorClasses}>{errors.status.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-number" className={labelClasses}>
            N° de cotización
          </label>
          <input
            id="qr-number"
            {...register('quotation_number')}
            aria-invalid={Boolean(errors.quotation_number) || undefined}
            disabled={pending}
            className={inputClasses}
          />
          {errors.quotation_number && (
            <p className={errorClasses}>{errors.quotation_number.message}</p>
          )}
        </div>
        {accepted && (
          <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
            <legend className={`px-1 ${labelClasses}`}>Precio unitario por ítem</legend>
            {items.map((it, i) => (
              <div key={it.productId} className="flex flex-col gap-0.5">
                <div className="grid grid-cols-[1fr_7rem] items-center gap-2 text-xs">
                  <label htmlFor={`qr-price-${i}`}>
                    {it.name} <span className="font-mono text-text-muted">×{it.quantity}</span>
                  </label>
                  <input
                    id={`qr-price-${i}`}
                    type="number"
                    min={0}
                    placeholder="$"
                    {...register(`prices.${i}`, {
                      required: 'Indica el precio unitario.',
                      min: { value: 0, message: 'No puede ser negativo.' },
                    })}
                    aria-invalid={Boolean(errors.prices?.[i]) || undefined}
                    disabled={pending}
                    className={`${inputClasses} text-right`}
                  />
                </div>
                {errors.prices?.[i] && <p className={errorClasses}>{errors.prices[i]?.message}</p>}
              </div>
            ))}
            <p className="text-right font-mono text-xs text-text-muted">
              Total ofertado: {formatCLP(offerTotal)}
            </p>
          </fieldset>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-notes" className={labelClasses}>
            Notas
          </label>
          <textarea
            id="qr-notes"
            rows={2}
            {...register('notes')}
            disabled={pending}
            className={`${inputClasses} h-auto py-2`}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Registrar respuesta
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCotizaciones, useCreatePurchase, useSuppliers } from '@sgia/api-client';
import type { AnnualBudget, CreatePurchasePayload, PurchaseOrder } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import {
  EMPTY_PURCHASE_FORM,
  MIN_QUOTATIONS,
  purchaseFormSchema,
  type PurchaseFormValues,
} from '@/features/compras/lib/purchase-form-schema';
import { BudgetFreeAmount } from '@/features/presupuestos/components/budget-free-amount';
import { BudgetSelect } from '@/features/presupuestos/components/budget-select';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';

const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono';

const NO_PRICE_MESSAGE =
  'El proveedor no cargó precio para este producto: regístralo en la cotización.';

const errorClasses = 'text-[11px] text-rose-600 dark:text-rose-400';

const optionalId = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v);

interface PurchaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Cotización aceptada preseleccionada (flujo desde /cotizaciones). */
  initialQuotationId?: number | null;
  onCreated?: (purchase: PurchaseOrder) => void;
}

export function PurchaseFormDialog({
  open,
  onClose,
  initialQuotationId = null,
  onCreated,
}: PurchaseFormDialogProps) {
  const createPurchase = useCreatePurchase();
  const { data: quotations } = useCotizaciones({
    status: 'aceptada',
    per_page: 100,
  });
  const { data: suppliers } = useSuppliers({ is_active: true, per_page: 100 });
  const [priceError, setPriceError] = useState<string | null>(null);
  const [budget, setBudget] = useState<AnnualBudget | undefined>(undefined);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: EMPTY_PURCHASE_FORM,
  });
  const origin = useWatch({ control, name: 'origin' });
  const quotationIds = useWatch({ control, name: 'quotation_ids' });

  useEffect(() => {
    if (!open) return;
    reset({ ...EMPTY_PURCHASE_FORM, quotation_id: initialQuotationId ?? undefined });
    setBudget(undefined);
    setPriceError(null);
  }, [open, initialQuotationId, reset]);

  const acceptedQuotations = quotations?.data ?? [];
  const isPending = createPurchase.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setPriceError(null);
    const base = {
      annual_budget_id: values.annual_budget_id,
      expected_at: values.expected_at || undefined,
      notes: values.notes.trim() || undefined,
    };
    const payload: CreatePurchasePayload =
      values.origin === 'single'
        ? {
            ...base,
            quotation_id: values.quotation_id,
            quotation_justification: values.quotation_justification.trim() || undefined,
          }
        : { ...base, quotation_ids: values.quotation_ids, supplier_id: values.supplier_id };

    try {
      const created = await createPurchase.mutateAsync(payload);
      toast.success(
        `Orden de compra ${created.code ?? `#${created.id}`} generada. Se reservaron ${formatCLP(created.total_amount)}.`,
      );
      onCreated?.(created);
      onClose();
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      // El 422 por monto llega en `total`: se muestra junto al presupuesto elegido.
      if (fieldErrors.total) setError('annual_budget_id', { message: fieldErrors.total });
      if (fieldErrors.quotation_ids)
        setError('quotation_ids', { message: fieldErrors.quotation_ids });
      if (fieldErrors.supplier_id) setError('supplier_id', { message: fieldErrors.supplier_id });
      if (fieldErrors.annual_budget_id)
        setError('annual_budget_id', { message: fieldErrors.annual_budget_id });
      if (fieldErrors.quotation_id) setError('quotation_id', { message: fieldErrors.quotation_id });
      if (fieldErrors.quotation_justification)
        setError('quotation_justification', { message: fieldErrors.quotation_justification });
      // El backend responde `items.N.unit_price` cuando el proveedor no cargó precio del producto.
      if (Object.keys(fieldErrors).some((f) => /^items\.\d+\.unit_price$/.test(f)))
        setPriceError(NO_PRICE_MESSAGE);
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title="Nueva orden de compra"
      description="Genérala desde una cotización aceptada o desde 3 o más cotizaciones aceptadas. El total se reserva en el presupuesto elegido."
      className="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Controller
          control={control}
          name="origin"
          render={({ field }) => (
            <div className="flex gap-2" role="radiogroup" aria-label="Origen de la orden">
              {(['single', 'multiple'] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  role="radio"
                  aria-checked={field.value === value}
                  variant={field.value === value ? 'primary' : 'outline'}
                  onClick={() => field.onChange(value)}
                  disabled={isPending}
                >
                  {value === 'single' ? 'Una cotización' : '3 o más cotizaciones'}
                </Button>
              ))}
            </div>
          )}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="po-budget" className={labelClasses}>
            Presupuesto
          </label>
          <Controller
            control={control}
            name="annual_budget_id"
            render={({ field }) => (
              <BudgetSelect
                id="po-budget"
                value={Number.isFinite(field.value) ? field.value : undefined}
                onChange={(id, selected) => {
                  field.onChange(id ?? Number.NaN);
                  setBudget(selected);
                }}
                invalid={Boolean(errors.annual_budget_id)}
                disabled={isPending}
                className={inputClasses}
              />
            )}
          />
          {errors.annual_budget_id && (
            <p className={errorClasses}>{errors.annual_budget_id.message}</p>
          )}
          {budget && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Inicial <span className="font-mono">{formatCLP(budget.initial_amount)}</span>
              {' · '}reservado{' '}
              <span className="font-mono">{formatCLP(budget.reserved_amount)}</span>
              {' · '}consumido{' '}
              <span className="font-mono">{formatCLP(budget.consumed_amount)}</span>
              {' · '}libre{' '}
              <BudgetFreeAmount
                amount={budget.free_amount}
                className="text-zinc-800 dark:text-zinc-200"
              />
            </p>
          )}
        </div>

        {origin === 'single' ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="po-quotation" className={labelClasses}>
                Cotización aceptada
              </label>
              <select
                id="po-quotation"
                {...register('quotation_id', { setValueAs: optionalId })}
                aria-invalid={Boolean(errors.quotation_id) || undefined}
                disabled={isPending}
                className={inputClasses}
              >
                <option value="">Selecciona una cotización…</option>
                {acceptedQuotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    #{q.id} · {q.proveedor ?? 'Múltiples proveedores'} · {q.items.length} ítems
                  </option>
                ))}
              </select>
              {errors.quotation_id && <p className={errorClasses}>{errors.quotation_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="po-justification" className={labelClasses}>
                Justificación
              </label>
              <textarea
                id="po-justification"
                rows={2}
                {...register('quotation_justification')}
                aria-invalid={Boolean(errors.quotation_justification) || undefined}
                disabled={isPending}
                className={`${inputClasses} h-auto py-2`}
              />
              {errors.quotation_justification && (
                <p className={errorClasses}>{errors.quotation_justification.message}</p>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Obligatoria si respondieron menos de 3 proveedores.
              </p>
            </div>
          </>
        ) : (
          <>
            <fieldset className="flex flex-col gap-1.5">
              <legend className={labelClasses}>
                Cotizaciones aceptadas ({quotationIds?.length ?? 0}/{MIN_QUOTATIONS} mínimo)
              </legend>
              <Controller
                control={control}
                name="quotation_ids"
                render={({ field }) => (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 p-2 space-y-1">
                    {acceptedQuotations.map((q) => (
                      <label key={q.id} className="flex items-center gap-2 text-xs font-mono">
                        <input
                          type="checkbox"
                          checked={field.value.includes(q.id)}
                          disabled={isPending}
                          onChange={(e) =>
                            field.onChange(
                              e.target.checked
                                ? [...field.value, q.id]
                                : field.value.filter((id) => id !== q.id),
                            )
                          }
                        />
                        #{q.id} · {q.proveedor ?? 'Múltiples proveedores'} · {q.items.length} ítems
                      </label>
                    ))}
                    {acceptedQuotations.length === 0 && (
                      <p className="text-xs text-zinc-400">
                        No hay cotizaciones aceptadas disponibles.
                      </p>
                    )}
                  </div>
                )}
              />
              {errors.quotation_ids && (
                <p className={errorClasses}>{errors.quotation_ids.message}</p>
              )}
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="po-supplier" className={labelClasses}>
                Proveedor adjudicado
              </label>
              <select
                id="po-supplier"
                {...register('supplier_id', { setValueAs: optionalId })}
                aria-invalid={Boolean(errors.supplier_id) || undefined}
                disabled={isPending}
                className={inputClasses}
              >
                <option value="">Selecciona un proveedor…</option>
                {(suppliers?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplier_id && <p className={errorClasses}>{errors.supplier_id.message}</p>}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Se consolidan los ítems por producto y el precio sale de la oferta del proveedor;
                las cotizaciones pasarán a «convertida» y el total quedará reservado en el
                presupuesto.
              </p>
            </div>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="po-expected" className={labelClasses}>
              Llegada estimada
            </label>
            <input
              id="po-expected"
              type="date"
              {...register('expected_at')}
              disabled={isPending}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="po-notes" className={labelClasses}>
              Notas
            </label>
            <input
              id="po-notes"
              {...register('notes')}
              disabled={isPending}
              className={inputClasses}
            />
          </div>
        </div>

        {priceError && (
          <p className={errorClasses} role="alert">
            {priceError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isPending || (origin === 'multiple' && (quotationIds?.length ?? 0) < MIN_QUOTATIONS)
            }
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generar orden
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

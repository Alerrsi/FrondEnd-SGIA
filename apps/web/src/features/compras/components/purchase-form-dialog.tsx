import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCotizaciones, useCreatePurchase, useProducts, useSuppliers } from '@sgia/api-client';
import type { AnnualBudget, CreatePurchasePayload, PurchaseOrder } from '@sgia/types';
import { AlertTriangle, Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import {
  EMPTY_PURCHASE_FORM,
  purchaseFormSchema,
  purchaseTotal,
  type PurchaseFormValues,
} from '@/features/compras/lib/purchase-form-schema';
import { BudgetSelect } from '@/features/presupuestos/components/budget-select';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';

const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono';

const errorClasses = 'text-[11px] text-rose-600 dark:text-rose-400';

const numberOrNaN = (v: unknown) =>
  v === '' || v === null || v === undefined ? Number.NaN : Number(v);
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
  const { data: products } = useProducts({ page: 1, per_page: 100 });
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
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const origin = useWatch({ control, name: 'origin' });
  const items = useWatch({ control, name: 'items' });

  useEffect(() => {
    if (!open) return;
    reset({
      ...EMPTY_PURCHASE_FORM,
      quotation_id: initialQuotationId ?? undefined,
    });
    setBudget(undefined);
  }, [open, initialQuotationId, reset]);

  const acceptedQuotations = quotations?.data ?? [];
  const isPending = createPurchase.isPending;
  const manualTotal = purchaseTotal(items ?? []);
  const exceedsBudget =
    origin === 'manual' && budget !== undefined && manualTotal > budget.available_amount;

  const addProduct = (productId: number) => {
    const product = products?.data.find((p) => p.id === productId);
    if (!product) return;
    append({
      product_id: product.id,
      name: product.nombre ?? product.name ?? `Producto #${product.id}`,
      quantity: 1,
      unit_price: product.reference_price ?? Number.NaN,
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    const base = {
      annual_budget_id: values.annual_budget_id,
      expected_at: values.expected_at || undefined,
      notes: values.notes.trim() || undefined,
    };
    const payload: CreatePurchasePayload =
      values.origin === 'quotation'
        ? { ...base, quotation_id: values.quotation_id }
        : {
            ...base,
            supplier_id: values.supplier_id,
            items: values.items.map((it) => ({
              name: it.name.trim(),
              product_id: it.product_id,
              quantity: it.quantity,
              unit_price: it.unit_price,
            })),
          };

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
      if (fieldErrors.annual_budget_id)
        setError('annual_budget_id', { message: fieldErrors.annual_budget_id });
      for (const [field, message] of Object.entries(fieldErrors)) {
        const match = /^items\.(\d+)\.(name|quantity|unit_price)$/.exec(field);
        if (match)
          setError(`items.${Number(match[1])}.${match[2] as 'name' | 'quantity' | 'unit_price'}`, {
            message,
          });
      }
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title="Nueva orden de compra"
      description="Genérala desde una cotización aceptada o registra una compra directa. El total se reserva en el presupuesto elegido."
      className="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Controller
          control={control}
          name="origin"
          render={({ field }) => (
            <div className="flex gap-2" role="radiogroup" aria-label="Origen de la orden">
              {(['quotation', 'manual'] as const).map((value) => (
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
                  {value === 'quotation' ? 'Desde cotización aceptada' : 'Compra directa'}
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
              Disponible{' '}
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {formatCLP(budget.available_amount)}
              </span>
              {' · '}reservado{' '}
              <span className="font-mono">{formatCLP(budget.reserved_amount)}</span>
            </p>
          )}
        </div>

        {origin === 'quotation' ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="po-quotation" className={labelClasses}>
              Cotización aceptada
            </label>
            {/* Controlado: la cotización puede venir preseleccionada desde /cotizaciones. */}
            <Controller
              control={control}
              name="quotation_id"
              render={({ field }) => (
                <select
                  id="po-quotation"
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(optionalId(e.target.value))}
                  onBlur={field.onBlur}
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
              )}
            />
            {errors.quotation_id && <p className={errorClasses}>{errors.quotation_id.message}</p>}
            {acceptedQuotations.length === 0 && (
              <p className="text-xs text-zinc-400">No hay cotizaciones aceptadas disponibles.</p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Se copian proveedor, ítems y precios de la oferta aceptada; la cotización pasará a
              «convertida».
            </p>
          </div>
        ) : (
          <>
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
            </div>

            <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
              <legend className={`px-1 ${labelClasses}`}>Ítems</legend>
              {fields.length > 0 && (
                <div className="grid grid-cols-[1fr_4.5rem_7rem_auto] gap-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  <span>Descripción</span>
                  <span className="text-center">Cant.</span>
                  <span className="text-right">P. unitario</span>
                  <span className="w-7" />
                </div>
              )}
              {fields.map((field, index) => {
                const itemErrors = errors.items?.[index];
                return (
                  <div key={field.id} className="flex flex-col gap-0.5">
                    <div className="grid grid-cols-[1fr_4.5rem_7rem_auto] items-center gap-2">
                      <input
                        aria-label={`Nombre del ítem ${index + 1}`}
                        {...register(`items.${index}.name`)}
                        aria-invalid={Boolean(itemErrors?.name) || undefined}
                        placeholder="Descripción"
                        className={inputClasses}
                        disabled={isPending}
                      />
                      <input
                        aria-label={`Cantidad del ítem ${index + 1}`}
                        type="number"
                        min={1}
                        {...register(`items.${index}.quantity`, {
                          setValueAs: numberOrNaN,
                        })}
                        aria-invalid={Boolean(itemErrors?.quantity) || undefined}
                        className={`${inputClasses} text-center`}
                        disabled={isPending}
                      />
                      <input
                        aria-label={`Precio unitario del ítem ${index + 1}`}
                        type="number"
                        min={0}
                        placeholder="$"
                        {...register(`items.${index}.unit_price`, {
                          setValueAs: numberOrNaN,
                        })}
                        aria-invalid={Boolean(itemErrors?.unit_price) || undefined}
                        className={`${inputClasses} text-right`}
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label={`Quitar ítem ${index + 1}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {(itemErrors?.name || itemErrors?.quantity || itemErrors?.unit_price) && (
                      <p className={errorClasses}>
                        {itemErrors.name?.message ??
                          itemErrors.quantity?.message ??
                          itemErrors.unit_price?.message}
                      </p>
                    )}
                  </div>
                );
              })}
              {errors.items?.message && <p className={errorClasses}>{errors.items.message}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Agregar producto del inventario"
                  value=""
                  onChange={(e) => e.target.value && addProduct(Number(e.target.value))}
                  disabled={isPending}
                  className={`${inputClasses} max-w-xs`}
                >
                  <option value="">Agregar producto del inventario…</option>
                  {(products?.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre ?? p.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ name: '', quantity: 1, unit_price: Number.NaN })}
                  disabled={isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ítem libre
                </Button>
                <span
                  className={cn(
                    'ml-auto font-mono text-xs',
                    exceedsBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-zinc-600 dark:text-zinc-300',
                  )}
                >
                  Total: {formatCLP(manualTotal)}
                </span>
              </div>
              {exceedsBudget && budget && (
                <p
                  className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400"
                  role="alert"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  El total supera el disponible del presupuesto (
                  {formatCLP(budget.available_amount)}).
                </p>
              )}
            </fieldset>
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

        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generar orden
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

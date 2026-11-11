import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCreatePurchaseRequest,
  useProducts,
  useUpdatePurchaseRequest,
} from '@sgia/api-client';
import type { Producto, PurchaseRequest } from '@sgia/types';
import { FileText, Loader2, Package, Search, Wallet, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { BudgetSelect } from '@/features/presupuestos/components/budget-select';
import {
  purchaseRequestFormDefaults,
  purchaseRequestFormSchema,
  toPurchaseRequestPayload,
  type PurchaseRequestFormValues,
} from '@/features/solicitudes-compra/lib/purchase-request-form-schema';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50 aria-invalid:border-rose-400 dark:aria-invalid:border-rose-700';

const legendClasses =
  'px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono';

const fieldsetClasses =
  'rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50';

const errorClasses = 'text-[11px] text-rose-600 dark:text-rose-400';

interface PurchaseRequestFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Con solicitud: edición (solo en `borrador`). */
  request?: PurchaseRequest | null;
  onSaved?: (request: PurchaseRequest) => void;
}

function productName(p: Producto): string {
  return p.nombre ?? p.name ?? `Producto #${p.id}`;
}

/** Crea o edita una solicitud en borrador: productos + cantidades + presupuesto anual. */
export function PurchaseRequestFormDialog({
  open,
  onClose,
  request = null,
  onSaved,
}: PurchaseRequestFormDialogProps) {
  const isEdit = request !== null;
  const createRequest = useCreatePurchaseRequest();
  const updateRequest = useUpdatePurchaseRequest();
  const { data: productsData } = useProducts({ page: 1, per_page: 200 });
  const [search, setSearch] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestFormSchema),
    defaultValues: purchaseRequestFormDefaults(null),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (!open) return;
    reset(purchaseRequestFormDefaults(request));
    setSearch('');
  }, [open, request, reset]);

  const selectedIds = useMemo(() => new Set(fields.map((f) => f.product_id)), [fields]);
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return (productsData?.data ?? [])
      .filter((p) => !selectedIds.has(p.id))
      .filter(
        (p) =>
          productName(p).toLowerCase().includes(q) ||
          (p.codigoBarras ?? p.barcode ?? '').toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [productsData, search, selectedIds]);

  const isPending = createRequest.isPending || updateRequest.isPending;

  const onSubmit = handleSubmit(async (values) => {
    const payload = toPurchaseRequestPayload(values);
    try {
      const saved =
        isEdit && request
          ? await updateRequest.mutateAsync({ id: request.id, payload })
          : await createRequest.mutateAsync(payload);
      toast.success(
        isEdit ? `Solicitud ${saved.code} actualizada.` : `Solicitud ${saved.code} creada en borrador.`,
      );
      onSaved?.(saved);
      onClose();
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      for (const [field, message] of Object.entries(fieldErrors)) {
        const match = /^items\.(\d+)\.(product_id|quantity)$/.exec(field);
        if (match) setError(`items.${Number(match[1])}.quantity`, { message });
        else if (field === 'items') setError('items', { message });
        else if (field === 'annual_budget_id') setError('annual_budget_id', { message });
        else if (field === 'notes') setError('notes', { message });
      }
      toast.error(apiErrorToMessage(error));
    }
  });

  const itemsError = errors.items?.message ?? errors.items?.root?.message;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title={isEdit ? `Editar solicitud ${request?.code ?? ''}` : 'Nueva solicitud de compra'}
      description="Se crea en borrador con código SC-AAAA-NNNN. Después de aprobarla se envía a los proveedores por área."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <fieldset className={fieldsetClasses}>
          <legend className={legendClasses}>
            <Wallet className="h-3.5 w-3.5 text-zinc-400" />
            Presupuesto
          </legend>
          <Controller
            control={control}
            name="annual_budget_id"
            render={({ field }) => (
              <BudgetSelect
                id="pr-budget"
                aria-label="Presupuesto anual"
                value={Number.isFinite(field.value) ? field.value : undefined}
                onChange={(id) => field.onChange(id ?? Number.NaN)}
                invalid={Boolean(errors.annual_budget_id)}
                disabled={isPending}
                className={inputClasses}
              />
            )}
          />
          {errors.annual_budget_id && (
            <p className={errorClasses}>{errors.annual_budget_id.message}</p>
          )}
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            La disponibilidad se valida al subir la orden de compra, no antes.
          </p>
        </fieldset>

        <fieldset className={fieldsetClasses}>
          <legend className={legendClasses}>
            <Package className="h-3.5 w-3.5 text-zinc-400" />
            Productos ({fields.length})
          </legend>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              aria-label="Buscar producto"
              placeholder="Buscar producto por nombre o código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isPending}
              className={`${inputClasses} pl-8`}
            />
            {matches.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        append({ product_id: p.id, product_name: productName(p), quantity: 1 });
                        setSearch('');
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {productName(p)}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        Stock {p.stock ?? p.quantity ?? 0}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {fields.length === 0 ? (
            <p className="py-2 text-center text-xs text-zinc-400">
              Busca y agrega los productos que se van a comprar.
            </p>
          ) : (
            <ul className="space-y-2">
              {fields.map((field, index) => {
                const qtyError = errors.items?.[index]?.quantity?.message;
                return (
                  <li key={field.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                      <span className="flex-1 truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {field.product_name}
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        aria-label={`Cantidad de ${field.product_name}`}
                        aria-invalid={Boolean(qtyError) || undefined}
                        disabled={isPending}
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="h-7 w-20 rounded border border-zinc-200 bg-zinc-50 px-2 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 aria-invalid:border-rose-400 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <button
                        type="button"
                        title="Quitar producto"
                        aria-label={`Quitar ${field.product_name}`}
                        onClick={() => remove(index)}
                        disabled={isPending}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {qtyError && <p className={errorClasses}>{qtyError}</p>}
                  </li>
                );
              })}
            </ul>
          )}
          {itemsError && <p className={errorClasses}>{itemsError}</p>}
        </fieldset>

        <fieldset className={fieldsetClasses}>
          <legend className={legendClasses}>
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
            Notas
          </legend>
          <textarea
            aria-label="Notas"
            rows={3}
            placeholder="Especificaciones, plazos, condiciones…"
            disabled={isPending}
            {...register('notes')}
            className={`${inputClasses} h-auto resize-none py-2`}
          />
          {errors.notes && <p className={errorClasses}>{errors.notes.message}</p>}
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <DialogCloseButton disabled={isPending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear solicitud'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

import { useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCajones, useConfirmInvoiceIntake, usePurchases } from '@sgia/api-client';
import type { AnnualBudget, InvoiceIntake, Producto } from '@sgia/types';
import { AlertTriangle, Check, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useOptionalAuth } from '@/features/auth/context/auth-context';
import { canDo } from '@/features/auth/types/roles';
import { formatCLP } from '@/features/compras/lib/format';
import { BudgetFreeAmount } from '@/features/presupuestos/components/budget-free-amount';
import { BudgetSelect } from '@/features/presupuestos/components/budget-select';
import { QuickProductDialog } from '@/features/ingresos-factura/components/quick-product-dialog';
import {
  buildInvoiceReviewSchema,
  initialReviewValues,
  reviewTotal,
  suggestProducts,
  toConfirmPayload,
  type InvoiceReviewValues,
} from '@/features/ingresos-factura/lib/invoice-review-schema';
import { parseOverBudget, type OverBudgetInfo } from '@/features/ingresos-factura/lib/over-budget';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';

type ProductType = NonNullable<Producto['type']>;

const inputClasses =
  FORM_CONTROL_CLASS;
const errorClasses = 'mt-0.5 text-[11px] text-rose-600 dark:text-rose-400';

const toNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? Number.NaN : Number(v);
const optionalId = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v);
const productName = (p: Producto) => p.nombre ?? p.name ?? `Producto #${p.id}`;

interface InvoiceReviewFormProps {
  intake: InvoiceIntake;
  /** Catálogo ya cargado; el formulario se monta recién cuando está disponible. */
  catalog: Producto[];
  budget: AnnualBudget | undefined;
  /** Reserva vigente de la compra ligada: se libera al confirmar y cuenta como disponible. */
  purchaseReserved: number;
  onConfirmed?: (intake: InvoiceIntake) => void;
}

/** Revisión del borrador: asociar productos, corregir cantidades/precios, elegir cajón y confirmar. */
export function InvoiceReviewForm({
  intake,
  catalog,
  budget,
  purchaseReserved,
  onConfirmed,
}: InvoiceReviewFormProps) {
  const confirmIntake = useConfirmInvoiceIntake();
  const canAuthorize = canDo(useOptionalAuth()?.user?.rol, 'authorizeOverBudget');
  // Exceso detectado por el servidor: DIR-01 pasa por alerta → cartel final; el resto solo ve el aviso.
  const [overBudget, setOverBudget] = useState<{
    info: OverBudgetInfo;
    stage: 'alert' | 'final' | 'blocked';
    values: InvoiceReviewValues;
  } | null>(null);
  const [purchaseId, setPurchaseId] = useState(intake.purchase_id ? String(intake.purchase_id) : '');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  // Factura sin OC: el backend pide el presupuesto (needs_budget o 422 en annual_budget_id).
  const [budgetId, setBudgetId] = useState<number | undefined>(undefined);
  const [pickedBudget, setPickedBudget] = useState<AnnualBudget | undefined>(undefined);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [budgetRequired, setBudgetRequired] = useState(false);
  const showBudgetSelect = !purchaseId && (intake.needs_budget === true || budgetRequired);
  const { data: linkable } = usePurchases({ linkable: true, per_page: 100 });
  const openPurchases = linkable?.data ?? [];
  const { data: cajonesPage } = useCajones({ per_page: 100 });
  const [created, setCreated] = useState<Producto[]>([]);
  const [quickFor, setQuickFor] = useState<{
    index: number;
    name: string;
  } | null>(null);

  // Paso previo a crear: muestra parecidos y exige confirmar la creación.
  const [suggestFor, setSuggestFor] = useState<{
    index: number;
    name: string;
  } | null>(null);

  const products = useMemo(() => {
    const extra = created.filter((c) => !catalog.some((b) => b.id === c.id));
    return [...extra, ...catalog];
  }, [catalog, created]);

  const suggestions = useMemo(
    () => (suggestFor ? suggestProducts(suggestFor.name, products) : []),
    [suggestFor, products],
  );

  const productTypes = useMemo(
    () => new Map<number, ProductType>(products.map((p) => [p.id, p.type ?? 'insumo'])),
    [products],
  );
  const schema = useMemo(() => buildInvoiceReviewSchema(productTypes), [productTypes]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<InvoiceReviewValues>({
    resolver: zodResolver(schema),
    // El catálogo llega cargado: se asocia por nombre al iniciar, sin reset posterior.
    defaultValues: initialReviewValues(intake, catalog),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' });

  const total = reviewTotal(items ?? []);
  const activeBudget = showBudgetSelect ? pickedBudget : budget;
  const available = (activeBudget?.free_amount ?? 0) + purchaseReserved;
  const exceeds = activeBudget !== undefined && total > available;
  const autoMatched = (items ?? []).filter((it) => Number.isFinite(it.product_id)).length;

  const submitConfirm = async (values: InvoiceReviewValues, allowOverBudget = false) => {
    setPurchaseError(null);
    setBudgetError(null);
    if (showBudgetSelect && !budgetId) {
      setBudgetError('Selecciona el presupuesto al que se imputa la factura.');
      return;
    }
    try {
      const confirmed = await confirmIntake.mutateAsync({
        id: intake.id,
        payload: {
          ...toConfirmPayload(values, productTypes),
          ...(purchaseId ? { purchase_id: Number(purchaseId) } : {}),
          ...(showBudgetSelect && budgetId ? { annual_budget_id: budgetId } : {}),
          ...(allowOverBudget ? { allow_over_budget: true } : {}),
        },
      });
      toast.success(
        `Stock ingresado. ${
          confirmed.purchase_id
            ? `Orden ${confirmed.purchase?.code ?? `#${confirmed.purchase_id}`} asociada; se descontaron ${formatCLP(confirmed.total_deducted)} del presupuesto.`
            : 'Sin orden de compra asociada (no se pudo asociar automáticamente).'
        }`,
      );
      onConfirmed?.(confirmed);
      setOverBudget(null);
    } catch (error) {
      const over = parseOverBudget(error);
      if (over) {
        setOverBudget({ info: over, stage: canAuthorize ? 'alert' : 'blocked', values });
        return;
      }
      setOverBudget(null);
      const fieldErrors = apiFieldErrors(error);
      for (const [field, message] of Object.entries(fieldErrors)) {
        const match = /^items\.(\d+)\.(product_id|quantity|unit_price|cajon_id)$/.exec(field);
        if (match) {
          setError(
            `items.${Number(match[1])}.${match[2] as 'product_id' | 'quantity' | 'unit_price' | 'cajon_id'}`,
            {
              message,
            },
          );
        } else if (field === 'purchase_id') {
          setPurchaseError(message);
        } else if (field === 'annual_budget_id') {
          setBudgetRequired(true);
          setBudgetError(message);
        } else if (field === 'document_number') {
          setError('document_number', { message });
        }
      }
      toast.error(apiErrorToMessage(error));
    }
  };
  const onSubmit = handleSubmit((values) => submitConfirm(values));

  const pending = confirmIntake.isPending;

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        {!intake.raw_ocr_payload.ocr_available && (
          <p className="flex items-center gap-2 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            El OCR no estuvo disponible: agrega los ítems de la factura a mano.
          </p>
        )}
        {intake.raw_ocr_payload.ocr_available && intake.raw_ocr_payload.items.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Sparkles className="h-3.5 w-3.5" />
            {intake.raw_ocr_payload.items.length} ítem(s) detectados · {autoMatched} asociados
            automáticamente por nombre.
            {intake.raw_ocr_payload.supplier_name &&
              ` Proveedor: ${intake.raw_ocr_payload.supplier_name}.`}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="ii-document"
            className={FIELD_LABEL_CLASS}
          >
            N° de factura
          </label>
          <input
            id="ii-document"
            {...register('document_number')}
            aria-invalid={Boolean(errors.document_number) || undefined}
            disabled={pending}
            className={cn(inputClasses, 'max-w-xs')}
          />
          {errors.document_number && (
            <p className={errorClasses}>{errors.document_number.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="ii-purchase"
            className={FIELD_LABEL_CLASS}
          >
            Orden de compra (opcional)
          </label>
          <select
            id="ii-purchase"
            value={purchaseId}
            onChange={(e) => setPurchaseId(e.target.value)}
            disabled={pending}
            className={cn(inputClasses, 'max-w-xs')}
          >
            <option value="">Detectar automáticamente</option>
            {/* La OC ya ligada al borrador no viene en `linkable` (su propio ingreso la excluye). */}
            {intake.purchase_id && !openPurchases.some((p) => p.id === intake.purchase_id) && (
              <option value={intake.purchase_id}>{intake.purchase?.code ?? `#${intake.purchase_id}`}</option>
            )}
            {openPurchases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ?? `#${p.id}`}
              </option>
            ))}
          </select>
          {purchaseError && <p className={errorClasses}>{purchaseError}</p>}
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Si la factura se asocia a una orden de compra, la orden quedará completa y se descontará
            del presupuesto el total de la factura.
          </p>
        </div>

        {showBudgetSelect && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor="ii-budget"
              className={FIELD_LABEL_CLASS}
            >
              Presupuesto
            </label>
            <BudgetSelect
              id="ii-budget"
              value={budgetId}
              onChange={(id, selected) => {
                setBudgetId(id);
                setPickedBudget(selected);
              }}
              invalid={Boolean(budgetError)}
              disabled={pending}
              className={cn(inputClasses, 'max-w-xs')}
            />
            {budgetError && <p className={errorClasses}>{budgetError}</p>}
            {pickedBudget && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Inicial <span className="font-mono">{formatCLP(pickedBudget.initial_amount)}</span>
                {' · '}reservado{' '}
                <span className="font-mono">{formatCLP(pickedBudget.reserved_amount)}</span>
                {' · '}consumido{' '}
                <span className="font-mono">{formatCLP(pickedBudget.consumed_amount)}</span>
                {' · '}libre <BudgetFreeAmount amount={pickedBudget.free_amount} />
              </p>
            )}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              La factura no tiene orden de compra asociada: elige la carrera y el año a los que se
              consume el monto.
            </p>
          </div>
        )}

        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <table className="w-full border-collapse text-left text-sm">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th className="min-w-56 p-2 font-medium">Producto</th>
                <th className="w-36 p-2 font-medium">Cajón</th>
                <th className="w-20 p-2 font-medium">Cant.</th>
                <th className="w-28 p-2 font-medium">P. unit.</th>
                <th className="w-28 p-2 text-right font-medium">Subtotal</th>
                <th className="w-8 p-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {fields.map((field, index) => {
                const item = items?.[index];
                const type = item ? productTypes.get(item.product_id) : undefined;
                const needsCajon = type === 'equipo' || type === 'maqueta';
                const rowErrors = errors.items?.[index];
                const subtotal = item ? reviewTotal([item]) : 0;
                return (
                  <tr key={field.id} className="align-top">
                    <td className="p-2">
                      {item?.detected_name && (
                        <div
                          className="mb-1 truncate text-[11px] text-zinc-400"
                          title={item.detected_name}
                        >
                          OCR: {item.detected_name}
                        </div>
                      )}
                      <div className="flex gap-1">
                        <Controller
                          control={control}
                          name={`items.${index}.product_id`}
                          render={({ field: productField }) => (
                            <select
                              aria-label={`Producto del ítem ${index + 1}`}
                              name={productField.name}
                              ref={productField.ref}
                              value={
                                Number.isFinite(productField.value)
                                  ? String(productField.value)
                                  : ''
                              }
                              onChange={(e) => productField.onChange(toNumber(e.target.value))}
                              onBlur={productField.onBlur}
                              aria-invalid={Boolean(rowErrors?.product_id) || undefined}
                              disabled={pending}
                              className={inputClasses}
                            >
                              <option value="">Asociar producto…</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {productName(p)}
                                  {p.type && p.type !== 'insumo' ? ` (${p.type})` : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          title="Crear producto nuevo"
                          aria-label={`Crear producto nuevo para el ítem ${index + 1}`}
                          disabled={pending}
                          onClick={() =>
                            setSuggestFor({
                              index,
                              name: item?.detected_name ?? '',
                            })
                          }
                          className="shrink-0 px-2"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {suggestFor?.index === index && (
                        <div className="mt-1 space-y-1 rounded border border-zinc-200 dark:border-zinc-800 p-2 text-xs">
                          {suggestions.length > 0 ? (
                            <>
                              <p className="text-zinc-500">¿Es alguno de estos productos?</p>
                              {suggestions.map((p) => (
                                <Button
                                  key={p.id}
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="mr-1"
                                  onClick={() => {
                                    setValue(`items.${index}.product_id`, p.id, {
                                      shouldValidate: true,
                                    });
                                    setSuggestFor(null);
                                  }}
                                >
                                  {productName(p)}
                                </Button>
                              ))}
                            </>
                          ) : (
                            <p className="text-zinc-500">
                              No existe un producto parecido; se creará uno nuevo.
                            </p>
                          )}
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setQuickFor(suggestFor);
                                setSuggestFor(null);
                              }}
                            >
                              {suggestions.length > 0
                                ? 'Ninguno, crear producto nuevo'
                                : 'Crear producto nuevo'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setSuggestFor(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                      {rowErrors?.product_id && (
                        <p className={errorClasses}>{rowErrors.product_id.message}</p>
                      )}
                    </td>
                    <td className="p-2">
                      {needsCajon ? (
                        <>
                          <select
                            aria-label={`Cajón del ítem ${index + 1}`}
                            {...register(`items.${index}.cajon_id`, {
                              setValueAs: optionalId,
                            })}
                            aria-invalid={Boolean(rowErrors?.cajon_id) || undefined}
                            disabled={pending}
                            className={inputClasses}
                          >
                            <option value="">Cajón…</option>
                            {(cajonesPage?.data ?? []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.codigo}
                                {c.location?.nombre ? ` · ${c.location.nombre}` : ''}
                              </option>
                            ))}
                          </select>
                          {rowErrors?.cajon_id && (
                            <p className={errorClasses}>{rowErrors.cajon_id.message}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-zinc-400">
                          {type === 'insumo' ? 'Suma al stock' : '—'}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        aria-label={`Cantidad del ítem ${index + 1}`}
                        type="number"
                        min={1}
                        {...register(`items.${index}.quantity`, {
                          setValueAs: toNumber,
                        })}
                        aria-invalid={Boolean(rowErrors?.quantity) || undefined}
                        disabled={pending}
                        className={inputClasses}
                      />
                      {rowErrors?.quantity && (
                        <p className={errorClasses}>{rowErrors.quantity.message}</p>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        aria-label={`Precio unitario del ítem ${index + 1}`}
                        type="number"
                        min={0}
                        {...register(`items.${index}.unit_price`, {
                          setValueAs: toNumber,
                        })}
                        aria-invalid={Boolean(rowErrors?.unit_price) || undefined}
                        disabled={pending}
                        className={cn(inputClasses, 'text-right')}
                      />
                      {rowErrors?.unit_price && (
                        <p className={errorClasses}>{rowErrors.unit_price.message}</p>
                      )}
                    </td>
                    <td className="p-2 pt-4 text-right font-mono tabular-nums">
                      {formatCLP(subtotal)}
                    </td>
                    <td className="p-2 pt-3">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={pending}
                        aria-label={`Quitar ítem ${index + 1}`}
                        className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {fields.length === 0 && (
                <tr>
                  <td colSpan={6} className={`p-6 ${STATE_TEXT_CLASS}`}>
                    Sin ítems. Agrega los productos de la factura.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {errors.items?.message && <p className={errorClasses}>{errors.items.message}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              append({
                product_id: Number.NaN,
                detected_name: null,
                quantity: 1,
                unit_price: Number.NaN,
                cajon_id: undefined,
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar ítem
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">
              Libre
              {purchaseReserved > 0 ? ' (+ reserva de la compra)' : ''}:{' '}
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {activeBudget ? formatCLP(available) : '—'}
              </span>
            </span>
            <span
              className={cn(
                'font-mono font-semibold',
                exceeds ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100',
              )}
            >
              Total {formatCLP(total)}
            </span>
          </div>
        </div>
        {exceeds && (
          <p
            role="alert"
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            El total supera lo libre del presupuesto; el servidor lo rechazará, salvo que el director de carrera autorice el exceso.
          </p>
        )}

        {overBudget?.stage === 'blocked' && (
          <p
            role="alert"
            className="flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            La factura supera lo libre del presupuesto por {formatCLP(overBudget.info.overBy)}. Solo
            el director de carrera puede autorizar el exceso; pídele que confirme esta factura.
          </p>
        )}

        <div className="flex justify-end border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirmar e ingresar stock
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={overBudget?.stage === 'alert'}
        title="La factura supera el presupuesto"
        description={`El total de la factura (${formatCLP(overBudget?.info.total)}) excede lo libre del presupuesto (${formatCLP(overBudget?.info.freeAmount)}) por ${formatCLP(overBudget?.info.overBy)}. Como director de carrera puedes autorizar el exceso.`}
        confirmLabel="Continuar"
        variant="danger"
        onConfirm={() => setOverBudget((o) => (o ? { ...o, stage: 'final' } : o))}
        onCancel={() => setOverBudget(null)}
      />
      <ConfirmDialog
        open={overBudget?.stage === 'final'}
        title="Confirmación final: autorizar exceso"
        description={`Vas a sobrepasar el presupuesto en ${formatCLP(overBudget?.info.overBy)}. Quedará registrado a tu nombre en la auditoría y el presupuesto quedará con saldo libre negativo. Esta acción no se puede deshacer.`}
        confirmLabel="Autorizar exceso y confirmar factura"
        variant="danger"
        loading={pending}
        onConfirm={() => overBudget && void submitConfirm(overBudget.values, true)}
        onCancel={() => setOverBudget(null)}
      />
      <QuickProductDialog
        open={quickFor !== null}
        onClose={() => setQuickFor(null)}
        initialName={quickFor?.name ?? ''}
        onCreated={(product) => {
          setCreated((prev) => [product, ...prev]);
          if (quickFor)
            setValue(`items.${quickFor.index}.product_id`, product.id, {
              shouldValidate: true,
            });
        }}
      />
    </>
  );
}

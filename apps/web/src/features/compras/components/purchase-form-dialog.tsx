import { useEffect, useState } from 'react';
import { useCotizaciones, useCreatePurchase, useProducts, useSuppliers } from '@sgia/api-client';
import type { CreatePurchasePayload, PurchaseOrder } from '@sgia/types';
import { Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

interface DraftItem {
  product_id?: number;
  name: string;
  quantity: number;
  unit_price: number;
}

type Origin = 'quotation' | 'manual';

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50';

const labelClasses =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono';

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
  const { data: quotations } = useCotizaciones({ status: 'aceptada', per_page: 100 });
  const { data: suppliers } = useSuppliers({ is_active: true, per_page: 100 });
  const { data: products } = useProducts({ page: 1, per_page: 100 });

  const [origin, setOrigin] = useState<Origin>('quotation');
  const [quotationId, setQuotationId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [expectedAt, setExpectedAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setOrigin('quotation');
    setQuotationId(initialQuotationId ?? '');
    setSupplierId('');
    setItems([]);
    setExpectedAt('');
    setNotes('');
  }, [open, initialQuotationId]);

  const acceptedQuotations = quotations?.data ?? [];
  const isPending = createPurchase.isPending;
  const isDirty = quotationId !== '' || supplierId !== '' || items.length > 0 || notes !== '';

  const updateItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const addProduct = (productId: number) => {
    const product = products?.data.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        name: product.nombre ?? product.name ?? `Producto #${product.id}`,
        quantity: 1,
        unit_price: product.reference_price ?? 0,
      },
    ]);
  };

  const manualTotal = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
  const canSubmit =
    origin === 'quotation'
      ? quotationId !== ''
      : supplierId !== '' && items.length > 0 && items.every((it) => it.name.trim() && it.quantity > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const base: CreatePurchasePayload = {
      expected_at: expectedAt || undefined,
      notes: notes.trim() || undefined,
    };
    const payload: CreatePurchasePayload =
      origin === 'quotation'
        ? { ...base, quotation_id: Number(quotationId) }
        : {
            ...base,
            supplier_id: Number(supplierId),
            items: items.map((it) => ({
              name: it.name.trim(),
              product_id: it.product_id,
              quantity: it.quantity,
              unit_price: it.unit_price > 0 ? it.unit_price : undefined,
            })),
          };

    try {
      const created = await createPurchase.mutateAsync(payload);
      toast.success(`Orden de compra ${created.code ?? `#${created.id}`} generada.`);
      onCreated?.(created);
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title="Nueva orden de compra"
      description="Genérala desde una cotización aceptada o registra una compra directa a un proveedor."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex gap-2" role="radiogroup" aria-label="Origen de la orden">
          {(['quotation', 'manual'] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              role="radio"
              aria-checked={origin === value}
              variant={origin === value ? 'primary' : 'outline'}
              onClick={() => setOrigin(value)}
              disabled={isPending}
            >
              {value === 'quotation' ? 'Desde cotización aceptada' : 'Compra directa'}
            </Button>
          ))}
        </div>

        {origin === 'quotation' ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="po-quotation" className={labelClasses}>
              Cotización aceptada
            </label>
            <select
              id="po-quotation"
              value={quotationId}
              onChange={(e) => setQuotationId(e.target.value ? Number(e.target.value) : '')}
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
            {acceptedQuotations.length === 0 && (
              <p className="text-xs text-zinc-400">No hay cotizaciones aceptadas disponibles.</p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Se copian proveedor e ítems de la cotización, que pasará a «convertida».
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
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
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
            </div>

            <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
              <legend className={`px-1 ${labelClasses}`}>Ítems</legend>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_4.5rem_7rem_auto] items-center gap-2">
                  <input
                    aria-label={`Nombre del ítem ${index + 1}`}
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="Descripción"
                    className={inputClasses}
                    disabled={isPending}
                  />
                  <input
                    aria-label={`Cantidad del ítem ${index + 1}`}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className={`${inputClasses} text-center`}
                    disabled={isPending}
                  />
                  <input
                    aria-label={`Precio unitario del ítem ${index + 1}`}
                    type="number"
                    min={0}
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                    className={`${inputClasses} text-right`}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label={`Quitar ítem ${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
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
                  onClick={() => setItems((prev) => [...prev, { name: '', quantity: 1, unit_price: 0 }])}
                  disabled={isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ítem libre
                </Button>
                <span className="ml-auto font-mono text-xs text-zinc-600 dark:text-zinc-300">
                  Total: {formatCLP(manualTotal)}
                </span>
              </div>
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
              value={expectedAt}
              onChange={(e) => setExpectedAt(e.target.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit || isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generar orden
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

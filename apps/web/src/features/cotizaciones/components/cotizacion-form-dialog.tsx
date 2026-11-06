import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCotizacion, useProducts, useSuppliers } from '@sgia/api-client';
import {
  AlertCircle,
  Building2,
  FileText,
  Loader2,
  Package,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { useUnsavedChangesWarning } from '@/lib/use-unsaved-changes';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

interface ProductItem {
  product_id: number;
  product_name: string;
  quantity: number;
  current_stock: number;
}

interface FormValues {
  products: ProductItem[];
  supplier_ids: number[];
  notes: string;
}

const inputClasses =
  'w-full h-8.5 rounded-md border border-border bg-surface px-3 font-mono text-xs text-text placeholder:text-text-muted dark:placeholder:text-text-muted transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50';

const MIN_SUPPLIERS = 1;

export function CotizacionFormDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createCotizacion = useCreateCotizacion();
  const { data: productsData } = useProducts({ page: 1, per_page: 200 });
  const { data: suppliersData } = useSuppliers({ is_active: true, per_page: 200 });

  const [productSearch, setProductSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      products: [],
      supplier_ids: [],
      notes: '',
    },
  });

  const watchedProducts = watch('products');
  const watchedSupplierIds = watch('supplier_ids');

  useEffect(() => {
    if (open) {
      reset({
        products: [],
        supplier_ids: [],
        notes: '',
      });
      setProductSearch('');
    }
  }, [open, reset]);

  const allProducts = productsData?.data ?? [];
  const allSuppliers = suppliersData?.data ?? [];
  const selectedProductIds = (watchedProducts ?? []).map((p) => p.product_id);

  const filteredProducts = allProducts.filter((p) => {
    if (selectedProductIds.includes(p.id)) return false;
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    const nombre = p.nombre ?? p.name ?? '';
    const codigo = p.codigoBarras ?? p.barcode ?? '';
    return nombre.toLowerCase().includes(q) || codigo.toLowerCase().includes(q);
  });

  const handleAddProduct = (product: { id: number; nombre?: string; name?: string; stock?: number; quantity?: number }) => {
    const newItem: ProductItem = {
      product_id: product.id,
      product_name: product.nombre ?? product.name ?? `Producto #${product.id}`,
      quantity: 1,
      current_stock: product.stock ?? product.quantity ?? 0,
    };
    const current = watchedProducts ?? [];
    setValue('products', [...current, newItem], { shouldDirty: true });
    setProductSearch('');
  };

  const handleRemoveProduct = (index: number) => {
    const current = [...(watchedProducts ?? [])];
    current.splice(index, 1);
    setValue('products', current, { shouldDirty: true });
  };

  const handleProductQuantityChange = (index: number, quantity: number) => {
    const current = [...(watchedProducts ?? [])];
    if (current[index]) {
      current[index] = { ...current[index], quantity: Math.max(1, quantity) };
      setValue('products', current, { shouldDirty: true });
    }
  };

  const handleToggleSupplier = (supplierId: number) => {
    const current = watchedSupplierIds ?? [];
    if (current.includes(supplierId)) {
      setValue(
        'supplier_ids',
        current.filter((id) => id !== supplierId),
        { shouldDirty: true },
      );
    } else {
      setValue('supplier_ids', [...current, supplierId], { shouldDirty: true });
    }
  };

  const suppliersCount = (watchedSupplierIds ?? []).length;
  const productsCount = (watchedProducts ?? []).length;
  const isFormValid = productsCount > 0 && suppliersCount >= MIN_SUPPLIERS;
  const isPending = createCotizacion.isPending;

  useUnsavedChangesWarning(isDirty);

  const onSubmit = handleSubmit(async (values) => {
    if (values.supplier_ids.length < MIN_SUPPLIERS) {
      toast.error(`Debes seleccionar al menos ${MIN_SUPPLIERS} proveedor.`);
      return;
    }
    if (values.products.length === 0) {
      toast.error('Agrega al menos un producto a la cotización.');
      return;
    }
    try {
      await createCotizacion.mutateAsync({
        products: values.products.map((p) => ({ id: p.product_id, quantity: p.quantity })),
        supplier_ids: values.supplier_ids,
        notes: values.notes.trim() || undefined,
      });
      toast.success('Cotización emitida correctamente a los proveedores seleccionados.');
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title="Nueva cotización múltiple"
      description="Selecciona productos y al menos 1 proveedor para emitir la solicitud de cotización."
      className="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 text-text" noValidate>
        {/* Fieldset: Productos a cotizar */}
        <fieldset className="rounded-md border border-border p-3 space-y-3 bg-surface-raised">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-1.5 font-mono">
            <Package className="h-3.5 w-3.5 text-text-muted" />
            Productos a Cotizar
          </legend>

          {/* Product search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar producto por nombre o código…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              disabled={isPending}
              className={inputClasses}
            />
            {productSearch && filteredProducts.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
                {filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-surface-raised transition-colors"
                  >
                    <span className="text-text font-medium">
                      {product.nombre ?? product.name}
                    </span>
                    <span className="font-mono text-text-muted text-xs">
                      Stock: {product.stock ?? product.quantity ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected products list */}
          {(watchedProducts ?? []).length === 0 ? (
            <p className="text-xs text-text-muted py-2 text-center">
              Busca y agrega productos para incluir en la cotización.
            </p>
          ) : (
            <div className="space-y-2">
              {(watchedProducts ?? []).map((item, index) => (
                <div
                  key={`${item.product_id}-${index}`}
                  className="flex items-center gap-2 rounded-md border border-border bg-white dark:bg-zinc-950 px-3 py-2"
                >
                  <span className="flex-1 text-xs font-medium text-text truncate">
                    {item.product_name}
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    Stock: {item.current_stock}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleProductQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                    disabled={isPending}
                    className="w-16 h-7 rounded border border-border bg-surface-raised px-2 text-center font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    aria-label={`Cantidad de ${item.product_name}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                    title="Quitar producto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        {/* Fieldset: Proveedores */}
        <fieldset className="rounded-md border border-border p-3 space-y-3 bg-surface-raised">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-1.5 font-mono">
            <Building2 className="h-3.5 w-3.5 text-text-muted" />
            Proveedores Destinatarios (Mínimo {MIN_SUPPLIERS})
          </legend>

          {suppliersCount < MIN_SUPPLIERS && (
            <div className="flex items-start gap-2 rounded-md border border-warn/30 bg-warn-bg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-warn mt-0.5" />
              <p className="text-xs text-warn">
                Debes seleccionar al menos <strong>{MIN_SUPPLIERS} proveedor</strong> para
                emitir una solicitud de cotización. Seleccionados: <strong>{suppliersCount}</strong>.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {allSuppliers.map((supplier) => {
              const isSelected = (watchedSupplierIds ?? []).includes(supplier.id);
              return (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => handleToggleSupplier(supplier.id)}
                  disabled={isPending}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'border-emerald-300 dark:border-emerald-800 bg-ok-bg text-emerald-800 dark:text-emerald-300'
                      : 'border-border bg-white dark:bg-zinc-950 text-text hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div
                    className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">{supplier.name}</span>
                    <span className="text-xs text-text-muted font-mono truncate block">
                      {supplier.email}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {allSuppliers.length === 0 && (
            <p className="text-xs text-text-muted text-center py-2">
              No hay proveedores activos registrados. Registra proveedores primero.
            </p>
          )}
        </fieldset>

        {/* Notas */}
        <fieldset className="rounded-md border border-border p-3 space-y-3 bg-surface-raised">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-1.5 font-mono">
            <FileText className="h-3.5 w-3.5 text-text-muted" />
            Notas y Especificaciones
          </legend>
          <textarea
            placeholder="Especificaciones adicionales, plazos de entrega, condiciones de pago…"
            disabled={isPending}
            className={`${inputClasses} h-20 resize-none`}
            {...register('notes')}
          />
        </fieldset>

        <div className="mt-1 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <span className="text-xs text-text-muted font-mono">
            {productsCount} producto{productsCount !== 1 ? 's' : ''} · {suppliersCount} proveedor{suppliersCount !== 1 ? 'es' : ''}
          </span>
          <div className="flex gap-2">
            <DialogCloseButton disabled={isPending} className="text-xs">
              Cancelar
            </DialogCloseButton>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || !isFormValid}
              className="min-w-36 text-xs"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Emitir cotización
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

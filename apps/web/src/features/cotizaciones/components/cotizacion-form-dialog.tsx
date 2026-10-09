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
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50';

const MIN_SUPPLIERS = 3;

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

  const onSubmit = handleSubmit(async (values) => {
    if (values.supplier_ids.length < MIN_SUPPLIERS) {
      toast.error(`Debes seleccionar al menos ${MIN_SUPPLIERS} proveedores (regla institucional INACAP).`);
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
      description="Selecciona productos y al menos 3 proveedores para emitir la solicitud de cotización."
      className="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-100" noValidate>
        {/* Fieldset: Productos a cotizar */}
        <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono">
            <Package className="h-3.5 w-3.5 text-zinc-400" />
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
              <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
                {filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {product.nombre ?? product.name}
                    </span>
                    <span className="font-mono text-zinc-400 text-[10px]">
                      Stock: {product.stock ?? product.quantity ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected products list */}
          {(watchedProducts ?? []).length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2 text-center">
              Busca y agrega productos para incluir en la cotización.
            </p>
          ) : (
            <div className="space-y-2">
              {(watchedProducts ?? []).map((item, index) => (
                <div
                  key={`${item.product_id}-${index}`}
                  className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2"
                >
                  <span className="flex-1 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {item.product_name}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Stock: {item.current_stock}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleProductQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                    disabled={isPending}
                    className="w-16 h-7 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 text-center font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    aria-label={`Cantidad de ${item.product_name}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
        <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono">
            <Building2 className="h-3.5 w-3.5 text-zinc-400" />
            Proveedores Destinatarios (Mínimo {MIN_SUPPLIERS})
          </legend>

          {suppliersCount < MIN_SUPPLIERS && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Regla institucional INACAP: debes seleccionar al menos <strong>{MIN_SUPPLIERS} proveedores</strong> para
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
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
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
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate block">
                      {supplier.email}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {allSuppliers.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-2">
              No hay proveedores activos registrados. Registra proveedores primero.
            </p>
          )}
        </fieldset>

        {/* Notas */}
        <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono">
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
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
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
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

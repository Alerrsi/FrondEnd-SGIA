import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useCreateProducto, useUpdateProducto } from '@sgia/api-client';
import type { CreateProductoPayload, Producto, UpdateProductoPayload } from '@sgia/types';
import { Barcode, Loader2, MapPin, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { AREAS_INACAP } from './inventario-table';

interface FormValues {
  name: string;
  description: string;
  area: string;
  quantity: number;
  stock_minimo: number;
  barcode: string;
  sala: string;
  cajon: string;
}

const inputClasses =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1 block text-xs text-danger">{message}</span>;
}

function Label({ htmlFor, children, required }: { htmlFor: string; children: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-text">
      {children}
      {required && <span className="ml-0.5 text-accent">*</span>}
    </label>
  );
}

export function ProductoFormDialog({
  open,
  onClose,
  producto,
}: {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
}) {
  const esEdicion = producto !== null;
  const createProducto = useCreateProducto();
  const updateProducto = useUpdateProducto();
  const [autoBarcode, setAutoBarcode] = useState(!esEdicion);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      area: 'Informática',
      quantity: 1,
      stock_minimo: 5,
      barcode: '',
      sala: '',
      cajon: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (producto) {
        reset({
          name: producto.nombre || producto.name || '',
          description: producto.description || '',
          area: producto.area || 'Informática',
          quantity: producto.stock ?? producto.quantity ?? 0,
          stock_minimo: producto.stockCritico ?? producto.stock_minimo ?? 5,
          barcode: producto.codigoBarras || producto.barcode || '',
          sala: producto.ubicacion?.sala || '',
          cajon: producto.ubicacion?.cajon || '',
        });
        setAutoBarcode(false);
      } else {
        reset({
          name: '',
          description: '',
          area: 'Informática',
          quantity: 1,
          stock_minimo: 5,
          barcode: '',
          sala: '',
          cajon: '',
        });
        setAutoBarcode(true);
      }
    }
  }, [open, producto, reset]);

  const isPending = createProducto.isPending || updateProducto.isPending;

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        if (esEdicion && producto) {
          const payload: UpdateProductoPayload = {
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            area: values.area || undefined,
            quantity: Number(values.quantity),
            stock_minimo: Number(values.stock_minimo),
            barcode: values.barcode.trim() || undefined,
            sala: values.sala.trim() || undefined,
            cajon: values.cajon.trim() || undefined,
          };
          await updateProducto.mutateAsync({ id: producto.id, payload });
          toast.success('Producto actualizado correctamente');
        } else {
          const payload: CreateProductoPayload = {
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            area: values.area || undefined,
            quantity: Number(values.quantity),
            stock_minimo: Number(values.stock_minimo),
            barcode: autoBarcode ? undefined : values.barcode.trim() || undefined,
            sala: values.sala.trim() || undefined,
            cajon: values.cajon.trim() || undefined,
          };
          await createProducto.mutateAsync(payload);
          toast.success('Producto dado de alta en inventario');
        }
        onClose();
      } catch (error) {
        toast.error(apiErrorToMessage(error));
      }
    },
    (formErrors) => {
      const first = Object.values(formErrors)[0];
      if (first?.message) {
        toast.error(String(first.message));
      }
    },
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar producto' : 'Nuevo producto en pañol'}
      description={
        esEdicion
          ? 'Actualiza los datos de stock, ubicación física o especificaciones del producto.'
          : 'Registra un nuevo activo o insumo para el control de inventario y préstamos.'
      }
      className="max-w-xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {/* Nombre */}
        <div>
          <Label htmlFor="prod-name" required>
            Nombre del producto
          </Label>
          <input
            id="prod-name"
            type="text"
            disabled={isPending}
            placeholder="Ej. Multímetro Digital True RMS Fluke 115"
            className={inputClasses}
            {...register('name', {
              required: 'El nombre del producto es obligatorio',
              minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' },
            })}
          />
          <FieldError message={errors.name?.message} />
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="prod-desc">Descripción o especificación técnica</Label>
          <textarea
            id="prod-desc"
            rows={2}
            disabled={isPending}
            placeholder="Detalles sobre modelo, rango de medición, conectores incluidos…"
            className={inputClasses}
            {...register('description')}
          />
        </div>

        {/* Área y Código de Barras */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="prod-area">Área académica / Carrera</Label>
            <select id="prod-area" disabled={isPending} className={inputClasses} {...register('area')}>
              {AREAS_INACAP.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="prod-barcode">Código de barra</Label>
              {!esEdicion && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoBarcode;
                    setAutoBarcode(next);
                    if (next) setValue('barcode', '');
                  }}
                  className="mb-1 flex items-center gap-1 text-[11px] text-accent hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{autoBarcode ? 'Manual' : 'Autogenerar'}</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="prod-barcode"
                type="text"
                disabled={isPending || autoBarcode}
                placeholder={autoBarcode ? 'SGIA-XXXXXXXX (Automático)' : 'Ej. 7801234567890'}
                className={cn(inputClasses, 'font-mono-tabular', autoBarcode && 'bg-surface-raised/60')}
                {...register('barcode')}
              />
              <Barcode className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </div>
            <FieldError message={errors.barcode?.message} />
          </div>
        </div>

        {/* Stock Actual y Stock Mínimo */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="prod-quantity" required>
              Cantidad en stock
            </Label>
            <input
              id="prod-quantity"
              type="number"
              min={0}
              disabled={isPending}
              className={cn(inputClasses, 'font-mono-tabular')}
              {...register('quantity', {
                required: 'La cantidad de stock es obligatoria',
                valueAsNumber: true,
                min: { value: 0, message: 'La cantidad debe ser mayor o igual a 0' },
              })}
            />
            <FieldError message={errors.quantity?.message} />
          </div>

          <div>
            <Label htmlFor="prod-stock-min" required>
              Stock mínimo (alerta crítica)
            </Label>
            <input
              id="prod-stock-min"
              type="number"
              min={0}
              disabled={isPending}
              className={cn(inputClasses, 'font-mono-tabular')}
              {...register('stock_minimo', {
                required: 'El stock mínimo es obligatorio',
                valueAsNumber: true,
                min: { value: 0, message: 'El stock mínimo debe ser mayor o igual a 0' },
              })}
            />
            <FieldError message={errors.stock_minimo?.message} />
          </div>
        </div>

        {/* Ubicación Física (Sala y Cajón) */}
        <div className="rounded-lg border border-border/80 bg-surface-raised/40 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-text">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <span>Ubicación física en pañol (REQ-05)</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="prod-sala">Sala o Almacén</Label>
              <input
                id="prod-sala"
                type="text"
                disabled={isPending}
                placeholder="Ej. Pañol Central, Lab 201"
                className={inputClasses}
                {...register('sala')}
              />
            </div>
            <div>
              <Label htmlFor="prod-cajon">Cajón o Estante</Label>
              <input
                id="prod-cajon"
                type="text"
                disabled={isPending}
                placeholder="Ej. Estante B-2, Cajón 05"
                className={inputClasses}
                {...register('cajon')}
              />
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className="min-w-28">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {esEdicion ? 'Guardar cambios' : 'Dar de alta producto'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

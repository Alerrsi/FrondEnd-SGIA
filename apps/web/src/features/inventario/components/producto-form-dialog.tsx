import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCajones,
  useCreateProducto,
  useLocations,
  useUpdateProducto,
} from '@sgia/api-client';
import type {
  CreateProductoPayload,
  LocationEntity,
  Producto,
  UpdateProductoPayload,
} from '@sgia/types';
import { Barcode, Loader2, MapPin, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { AREAS_INACAP } from './inventario-table';

const productoSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  area: z.string().optional(),
  quantity: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  stock_minimo: z.number().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
  barcode: z.string().optional(),
  location_id: z.number().nullable().optional(),
  cajon_id: z.number().nullable().optional(),
  sala: z.string().optional(),
  cajon: z.string().optional(),
});

type FormValues = z.infer<typeof productoSchema>;

const inputClasses =
  'w-full h-8 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50 font-mono';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1 block text-xs font-medium text-rose-600 dark:text-rose-400">{message}</span>;
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
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
  const [manualLocationMode, setManualLocationMode] = useState(false);

  const { data: locationsData } = useLocations({ per_page: 50 });
  const locations = locationsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      name: '',
      description: '',
      area: 'Informática',
      quantity: 1,
      stock_minimo: 5,
      barcode: '',
      location_id: null,
      cajon_id: null,
      sala: '',
      cajon: '',
    },
  });

  const selectedLocationId = watch('location_id');

  const { data: cajonesData } = useCajones(
    selectedLocationId
      ? { location_id: selectedLocationId, per_page: 50 }
      : undefined,
  );
  const cajones = cajonesData?.data ?? [];

  useEffect(() => {
    if (open) {
      if (producto) {
        const locId =
          producto.location_id ??
          (producto.location && 'id' in producto.location
            ? (producto.location as LocationEntity).id
            : null);
        const cajId = producto.cajon_id ?? producto.cajon?.id ?? null;

        reset({
          name: producto.nombre || producto.name || '',
          description: producto.description || '',
          area: producto.area || producto.categoria || 'Informática',
          quantity: producto.stock ?? producto.quantity ?? 0,
          stock_minimo: producto.stockCritico ?? producto.stock_minimo ?? 5,
          barcode: producto.codigoBarras || producto.barcode || '',
          location_id: locId,
          cajon_id: cajId,
          sala: producto.ubicacion?.sala || '',
          cajon: producto.ubicacion?.cajon || '',
        });
        setAutoBarcode(false);
        setManualLocationMode(!locId && !!producto.ubicacion?.sala);
      } else {
        reset({
          name: '',
          description: '',
          area: 'Informática',
          quantity: 1,
          stock_minimo: 5,
          barcode: '',
          location_id: null,
          cajon_id: null,
          sala: '',
          cajon: '',
        });
        setAutoBarcode(true);
        setManualLocationMode(false);
      }
    }
  }, [open, producto, reset]);

  const handleSelectLocation = (locIdStr: string) => {
    if (locIdStr === 'manual') {
      setManualLocationMode(true);
      setValue('location_id', null);
      setValue('cajon_id', null);
      return;
    }

    setManualLocationMode(false);
    const id = Number(locIdStr) || null;
    setValue('location_id', id);
    setValue('cajon_id', null);

    const loc = locations.find((l) => l.id === id);
    if (loc) {
      setValue('sala', loc.nombre || loc.sala);
    }
  };

  const handleSelectCajon = (cajIdStr: string) => {
    const id = Number(cajIdStr) || null;
    setValue('cajon_id', id);
    const caj = cajones.find((c) => c.id === id);
    if (caj) {
      setValue('cajon', caj.codigo);
    }
  };

  const isPending = createProducto.isPending || updateProducto.isPending;

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        if (esEdicion && producto) {
          const payload: UpdateProductoPayload = {
            name: values.name.trim(),
            description: values.description?.trim() || undefined,
            area: values.area || undefined,
            quantity: Number(values.quantity),
            stock_minimo: Number(values.stock_minimo),
            barcode: values.barcode?.trim() || undefined,
            location_id: values.location_id || undefined,
            cajon_id: values.cajon_id || undefined,
            sala: values.sala?.trim() || undefined,
            cajon: values.cajon?.trim() || undefined,
          };
          await updateProducto.mutateAsync({ id: producto.id, payload });
          toast.success('Producto actualizado correctamente');
        } else {
          const payload: CreateProductoPayload = {
            name: values.name.trim(),
            description: values.description?.trim() || undefined,
            area: values.area || undefined,
            quantity: Number(values.quantity),
            stock_minimo: Number(values.stock_minimo),
            barcode: autoBarcode ? undefined : values.barcode?.trim() || undefined,
            location_id: values.location_id || undefined,
            cajon_id: values.cajon_id || undefined,
            sala: values.sala?.trim() || undefined,
            cajon: values.cajon?.trim() || undefined,
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
          ? 'Actualiza los datos de stock, ubicación física o especificaciones técnicas del activo.'
          : 'Registra un nuevo activo o insumo para el control de inventario y préstamos.'
      }
      className="max-w-xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-100" noValidate>
        {/* Fieldset: Identificación de Hardware */}
        <fieldset className="flex flex-col gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3.5">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Identificación de Hardware
          </legend>

          <div>
            <Label htmlFor="prod-name" required>
              Nombre del producto
            </Label>
            <input
              id="prod-name"
              type="text"
              disabled={isPending}
              placeholder="Ej. Multímetro Digital True RMS Fluke 115"
              className={cn(inputClasses, 'font-sans text-xs')}
              {...register('name')}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="prod-desc">Descripción o especificación técnica</Label>
            <textarea
              id="prod-desc"
              rows={2}
              disabled={isPending}
              placeholder="Detalles sobre modelo, rango de medición, conectores incluidos…"
              className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="prod-area">Área académica / Especialidad</Label>
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
                <Label htmlFor="prod-barcode">Código de barra / Code128</Label>
                {!esEdicion && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoBarcode;
                      setAutoBarcode(next);
                      if (next) setValue('barcode', '');
                    }}
                    className="mb-1 flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <Sparkles className="h-3 w-3 text-amber-500" />
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
                  className={cn(inputClasses, autoBarcode && 'opacity-60 text-zinc-400')}
                  {...register('barcode')}
                />
                <Barcode className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
              <FieldError message={errors.barcode?.message} />
            </div>
          </div>
        </fieldset>

        {/* Fieldset: Parámetros de Stock */}
        <fieldset className="flex flex-col gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3.5">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Parámetros de Stock y Alertas
          </legend>

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
                className={inputClasses}
                {...register('quantity', { valueAsNumber: true })}
              />
              <FieldError message={errors.quantity?.message} />
            </div>

            <div>
              <Label htmlFor="prod-stock-min" required>
                Stock mínimo (umbral crítico)
              </Label>
              <input
                id="prod-stock-min"
                type="number"
                min={0}
                disabled={isPending}
                className={inputClasses}
                {...register('stock_minimo', { valueAsNumber: true })}
              />
              <FieldError message={errors.stock_minimo?.message} />
            </div>
          </div>
        </fieldset>

        {/* Fieldset: Ubicación en Pañol */}
        <fieldset className="flex flex-col gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3.5">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-zinc-400" />
            <span>Ubicación en Pañol</span>
          </legend>

          {manualLocationMode ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="prod-sala">Sala o Almacén</Label>
                <input
                  id="prod-sala"
                  type="text"
                  disabled={isPending}
                  placeholder="Ej. Pañol Central"
                  className={inputClasses}
                  {...register('sala')}
                />
              </div>
              <div>
                <Label htmlFor="prod-cajon">Cajón o Gaveta</Label>
                <input
                  id="prod-cajon"
                  type="text"
                  disabled={isPending}
                  placeholder="Ej. Cajón 05"
                  className={inputClasses}
                  {...register('cajon')}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="prod-loc-select">Sala / Ubicación</Label>
                <select
                  id="prod-loc-select"
                  disabled={isPending}
                  value={selectedLocationId ?? ''}
                  onChange={(e) => handleSelectLocation(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Selecciona sala…</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nombre || loc.sala}
                    </option>
                  ))}
                  <option value="manual">Otro (ingreso manual)…</option>
                </select>
              </div>

              <div>
                <Label htmlFor="prod-cajon-select">Cajón / Gaveta</Label>
                <select
                  id="prod-cajon-select"
                  disabled={isPending || !selectedLocationId}
                  value={watch('cajon_id') ?? ''}
                  onChange={(e) => handleSelectCajon(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">
                    {selectedLocationId ? 'Selecciona gaveta…' : 'Primero selecciona sala'}
                  </option>
                  {cajones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} size="sm">
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} size="sm" className="min-w-28">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {esEdicion ? 'Guardar cambios' : 'Dar de alta producto'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

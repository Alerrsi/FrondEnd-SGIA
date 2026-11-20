import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCareers, useCategories, useCreateProducto } from '@sgia/api-client';
import type { Producto } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { AREAS_INACAP } from '@/features/inventario/components/inventario-table';
import { OracleCategorySelect } from '@/features/inventario/components/oracle-category-select';
import { oracleMasterFields } from '@/features/inventario/lib/producto-form-schema';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';

// Mismo patrón que valida el backend para el nombre.
const NAME_REGEX = /^[\p{L}\p{N} \-.,/]+$/u;

const toNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? Number.NaN : Number(v);

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre.')
    .regex(NAME_REGEX, 'Solo letras, números, espacios y - . , /'),
  type: z.enum(['insumo', 'equipo', 'maqueta']),
  category_id: z
    .number({ error: 'Selecciona la categoría.' })
    .int()
    .positive('Selecciona la categoría.'),
  career_id: z.number({ error: 'Selecciona la carrera.' }).int().positive('Selecciona la carrera.'),
  area: z.string().min(1),
  ...oracleMasterFields,
  stock_minimo: z
    .number({ error: 'Indica el stock mínimo.' })
    .int()
    .min(0, 'No puede ser negativo.'),
});

type Values = z.infer<typeof schema>;

const inputClasses =
  FORM_CONTROL_CLASS;
const labelClasses = FIELD_LABEL_CLASS;
const errorClasses = 'mt-1 text-xs text-danger';

interface QuickProductDialogProps {
  open: boolean;
  onClose: () => void;
  /** Nombre detectado por el OCR, para precargar. */
  initialName: string;
  onCreated: (product: Producto) => void;
}

/**
 * Alta de un producto que aún no existe en el catálogo, con cantidad 0: el stock (o las unidades)
 * lo ingresa la confirmación de la factura.
 */
export function QuickProductDialog({
  open,
  onClose,
  initialName,
  onCreated,
}: QuickProductDialogProps) {
  const createProducto = useCreateProducto();
  const categories = useCategories({ per_page: 100 }).data?.data ?? [];
  const careers = useCareers({ per_page: 100 }).data?.data ?? [];
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialName,
      type: 'insumo',
      category_id: Number.NaN,
      career_id: Number.NaN,
      area: AREAS_INACAP[0],
      stock_minimo: 5,
      master_code: '',
      oracle_category_id: null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialName,
        type: 'insumo',
        category_id: Number.NaN,
        career_id: Number.NaN,
        area: AREAS_INACAP[0],
        stock_minimo: 5,
        master_code: '',
        oracle_category_id: null,
      });
    }
  }, [open, initialName, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createProducto.mutateAsync({
        ...values,
        name: values.name.trim(),
        master_code: values.master_code.trim().toUpperCase() || undefined,
        oracle_category_id: values.oracle_category_id ?? undefined,
        quantity: 0,
      });
      toast.success(
        `Producto «${values.name.trim()}» creado. Su stock entra al confirmar la factura.`,
      );
      onCreated(created);
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  });

  const pending = createProducto.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nuevo producto del catálogo"
      description="Se crea sin stock; la factura le sumará la cantidad (o las unidades, si es equipo o maqueta)."
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="qp-name" className={labelClasses}>
            Nombre
          </label>
          <input
            id="qp-name"
            {...register('name')}
            aria-invalid={Boolean(errors.name) || undefined}
            disabled={pending}
            className={`${inputClasses} mt-1.5`}
          />
          {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="qp-type" className={labelClasses}>
              Tipo
            </label>
            <select
              id="qp-type"
              {...register('type')}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            >
              <option value="insumo">Insumo</option>
              <option value="equipo">Equipo</option>
              <option value="maqueta">Maqueta</option>
            </select>
          </div>
          <div>
            <label htmlFor="qp-min" className={labelClasses}>
              Stock mínimo
            </label>
            <input
              id="qp-min"
              type="number"
              min={0}
              {...register('stock_minimo', { setValueAs: toNumber })}
              aria-invalid={Boolean(errors.stock_minimo) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.stock_minimo && <p className={errorClasses}>{errors.stock_minimo.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="qp-category" className={labelClasses}>
            Categoría
          </label>
          <select
            id="qp-category"
            {...register('category_id', { setValueAs: toNumber })}
            aria-invalid={Boolean(errors.category_id) || undefined}
            disabled={pending}
            className={`${inputClasses} mt-1.5`}
          >
            <option value="">Selecciona…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className={errorClasses}>{errors.category_id.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="qp-career" className={labelClasses}>
              Carrera
            </label>
            <select
              id="qp-career"
              {...register('career_id', { setValueAs: toNumber })}
              aria-invalid={Boolean(errors.career_id) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            >
              <option value="">Selecciona…</option>
              {careers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} · ${c.name}` : c.name}
                </option>
              ))}
            </select>
            {errors.career_id && <p className={errorClasses}>{errors.career_id.message}</p>}
          </div>
          <div>
            <label htmlFor="qp-area" className={labelClasses}>
              Área
            </label>
            <select
              id="qp-area"
              {...register('area')}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            >
              {AREAS_INACAP.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="qp-master-code" className={labelClasses}>
              Código maestro (opcional)
            </label>
            <input
              id="qp-master-code"
              maxLength={30}
              placeholder="Ej. OF33075"
              {...register('master_code')}
              aria-invalid={Boolean(errors.master_code) || undefined}
              disabled={pending}
              className={`${inputClasses} mt-1.5`}
            />
            {errors.master_code && <p className={errorClasses}>{errors.master_code.message}</p>}
          </div>
          <div>
            <label htmlFor="qp-oracle-category" className={labelClasses}>
              Descripción de categoría
            </label>
            <OracleCategorySelect
              id="qp-oracle-category"
              value={watch('oracle_category_id')}
              onChange={(id) => setValue('oracle_category_id', id)}
              disabled={pending}
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" size="sm" disabled={pending}>
            {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Crear producto
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

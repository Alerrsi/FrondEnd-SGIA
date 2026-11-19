import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreateLocation, useUpdateLocation } from '@sgia/api-client';
import type { LocationEntity } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import {
  LOCATION_CODE_MAX,
  sanitizeLocationCode,
  suggestLocationCode,
} from '@/features/ubicaciones/lib/location-code';

const locationFormSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre de la ubicación es obligatorio'),
  code: z
    .string()
    .regex(/^([A-Z0-9]{2,10})?$/, 'El código lleva de 2 a 10 letras (A-Z) o números, sin espacios'),
  tipo: z.string(),
  descripcion: z.string(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

function defaults(location: LocationEntity | null): LocationFormValues {
  return {
    nombre: location?.nombre ?? '',
    code: location?.code ?? '',
    tipo: location?.tipo ?? 'sala',
    descripcion: location?.descripcion ?? '',
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-red-600 dark:text-red-400">{message}</span>;
}

/** Alta y edición de una sala. El código se sugiere desde el nombre y no se puede cambiar después de crearla. */
export function LocationFormDialog({
  open,
  onClose,
  location,
}: {
  open: boolean;
  onClose: () => void;
  location: LocationEntity | null;
}) {
  const isEdit = location !== null;
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const isPending = createLocation.isPending || updateLocation.isPending;
  // Mientras el usuario no escriba el código a mano, se rellena con la sugerencia del nombre.
  const [codeTouched, setCodeTouched] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: defaults(null),
  });

  useEffect(() => {
    if (open) {
      reset(defaults(location));
      setCodeTouched(false);
    }
  }, [open, location, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const base = {
      nombre: values.nombre.trim(),
      tipo: values.tipo,
      descripcion: values.descripcion.trim() || undefined,
    };
    try {
      if (isEdit) {
        await updateLocation.mutateAsync({ id: location.id, payload: base });
        toast.success('Ubicación actualizada correctamente');
      } else {
        await createLocation.mutateAsync({ ...base, code: values.code || undefined });
        toast.success('Ubicación creada correctamente');
      }
      onClose();
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      if (fieldErrors.code) setError('code', { message: fieldErrors.code });
      if (fieldErrors.nombre) setError('nombre', { message: fieldErrors.nombre });
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      hasUnsavedChanges={isDirty}
      title={isEdit ? 'Editar ubicación' : 'Nueva sala / ubicación'}
      description="Define los datos del recinto o sala de pañol."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="location-nombre" className={FIELD_LABEL_CLASS}>
            Nombre de la sala / recinto *
          </label>
          <input
            id="location-nombre"
            placeholder="Ej. pañol central, laboratorio L-206…"
            className={FORM_CONTROL_CLASS}
            aria-invalid={errors.nombre ? true : undefined}
            {...register('nombre', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!isEdit && !codeTouched) {
                  setValue('code', suggestLocationCode(e.target.value), { shouldDirty: true });
                }
              },
            })}
          />
          <FieldError message={errors.nombre?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="location-code" className={FIELD_LABEL_CLASS}>
            Código de sala
          </label>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <input
                id="location-code"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(e) => {
                  const value = sanitizeLocationCode(e.target.value);
                  field.onChange(value);
                  // Si lo borra entero vuelve a la sugerencia.
                  setCodeTouched(value !== '');
                }}
                readOnly={isEdit}
                maxLength={LOCATION_CODE_MAX}
                placeholder="Ej. L206"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={errors.code ? true : undefined}
                aria-describedby="location-code-hint"
                className={`${FORM_CONTROL_CLASS} uppercase ${
                  isEdit ? 'cursor-not-allowed bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400' : ''
                }`}
              />
            )}
          />
          <span id="location-code-hint" className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {isEdit
              ? 'No se puede cambiar: las etiquetas de sus cajones dependen de él.'
              : 'Hasta 10 letras o números. Va en las etiquetas de sus cajones y no se puede cambiar después.'}
          </span>
          <FieldError message={errors.code?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="location-tipo" className={FIELD_LABEL_CLASS}>
            Tipo de espacio
          </label>
          <select id="location-tipo" className={FORM_CONTROL_CLASS} {...register('tipo')}>
            <option value="sala">Sala de clases</option>
            <option value="panol">Pañol TI</option>
            <option value="taller">Taller práctico</option>
            <option value="bodega">Bodega de almacenamiento</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="location-descripcion" className={FIELD_LABEL_CLASS}>
            Descripción / referencia
          </label>
          <input
            id="location-descripcion"
            placeholder="Ej. edificio B, segundo piso, sector redes"
            className={FORM_CONTROL_CLASS}
            {...register('descripcion')}
          />
        </div>

        <DialogFooter>
          <DialogCloseButton disabled={isPending}>Cancelar</DialogCloseButton>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Guardar ubicación
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

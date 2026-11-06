import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateStoreroom, useUpdateStoreroom } from '@sgia/api-client';
import type { Storeroom } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import {
  storeroomFormSchema,
  type StoreroomFormValues,
} from '@/features/administracion/lib/storeroom-schema';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-border bg-surface px-3 font-mono text-xs text-text focus:border-text-muted focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50 aria-invalid:border-rose-400';
const labelClasses = 'text-xs font-semibold uppercase tracking-wider text-text-muted font-mono';
const errorClasses = 'mt-1 text-xs text-danger';
const empty: StoreroomFormValues = { name: '', code: '', general_location: '' };

export function StoreroomFormDialog({
  open,
  onClose,
  storeroom,
}: {
  open: boolean;
  onClose: () => void;
  storeroom: Storeroom | null;
}) {
  const create = useCreateStoreroom();
  const update = useUpdateStoreroom();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<StoreroomFormValues>({ resolver: zodResolver(storeroomFormSchema), defaultValues: empty });

  useEffect(() => {
    if (!open) return;
    reset(
      storeroom
        ? { name: storeroom.name, code: storeroom.code, general_location: storeroom.general_location ?? '' }
        : empty,
    );
  }, [open, storeroom, reset]);

  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      code: values.code.toUpperCase(),
      general_location: values.general_location || null,
    };
    try {
      if (storeroom) await update.mutateAsync({ id: storeroom.id, payload });
      else await create.mutateAsync(payload);
      toast.success(storeroom ? 'Pañol actualizado' : 'Pañol creado');
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      if (fields.code) setError('code', { message: fields.code });
      if (fields.name) setError('name', { message: fields.name });
      toast.error(apiErrorToMessage(error));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title={storeroom ? 'Editar pañol' : 'Nuevo pañol'}
      description="El código se guarda en mayúsculas y debe ser único."
      className="max-w-md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <div>
          <label htmlFor="sr-name" className={labelClasses}>
            Nombre
          </label>
          <input id="sr-name" disabled={pending} aria-invalid={Boolean(errors.name) || undefined} className={`${inputClasses} mt-1.5 font-sans`} {...register('name')} />
          {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="sr-code" className={labelClasses}>
            Código
          </label>
          <input id="sr-code" placeholder="PAN-TEMUCO" disabled={pending} aria-invalid={Boolean(errors.code) || undefined} className={`${inputClasses} mt-1.5 uppercase`} {...register('code')} />
          {errors.code && <p className={errorClasses}>{errors.code.message}</p>}
        </div>
        <div>
          <label htmlFor="sr-loc" className={labelClasses}>
            Ubicación general (opcional)
          </label>
          <input id="sr-loc" disabled={pending} className={`${inputClasses} mt-1.5 font-sans`} {...register('general_location')} />
          {errors.general_location && <p className={errorClasses}>{errors.general_location.message}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {storeroom ? 'Guardar cambios' : 'Crear pañol'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

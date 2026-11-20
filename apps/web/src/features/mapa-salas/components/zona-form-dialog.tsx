import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useCreateZona, useDeleteZona, useUpdateZona } from '@sgia/api-client';
import type { Zona } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { firstFreeSlot, roomRect, zonaRect } from '../lib/map-geometry';
import { cmToMeters, metersToCm, zonaFormSchema, type ZonaFormValues } from '../lib/map-forms';
import { FieldError } from './field-error';

export interface ZonaFormDialogProps {
  open: boolean;
  onClose: () => void;
  locationId: number;
  room: { width: number; height: number };
  zonas: Zona[];
  /** Con zona, edita; sin zona, crea. */
  zona?: Zona | null;
}

const DEFAULTS: ZonaFormValues = { nombre: '', width: 3, depth: 3 };

/** Crear o editar una zona (medidas en metros). Una nueva aparece en el primer lugar sin otra zona. */
export function ZonaFormDialog({ open, onClose, locationId, room, zonas, zona }: ZonaFormDialogProps) {
  const createZona = useCreateZona();
  const updateZona = useUpdateZona();
  const deleteZona = useDeleteZona();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isPending = createZona.isPending || updateZona.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ZonaFormValues>({ resolver: zodResolver(zonaFormSchema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (!open) return;
    reset(zona ? { nombre: zona.nombre, width: cmToMeters(zona.width), depth: cmToMeters(zona.depth) } : DEFAULTS);
  }, [open, zona, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const width = Math.min(metersToCm(values.width), room.width);
    const depth = Math.min(metersToCm(values.depth), room.height);
    try {
      if (zona) {
        await updateZona.mutateAsync({ id: zona.id, locationId, payload: { nombre: values.nombre.trim(), width, depth } });
        toast.success(`${values.nombre.trim()} actualizada`);
      } else {
        const others = zonas.map(zonaRect);
        const slot = firstFreeSlot(roomRect(room.width, room.height), width, depth, others) ?? { x: 0, y: 0 };
        await createZona.mutateAsync({ location_id: locationId, nombre: values.nombre.trim(), x: slot.x, y: slot.y, width, depth });
        toast.success({ title: `${values.nombre.trim()} creada`, description: 'Muévela o cambia su tamaño en el plano.' });
      }
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      if (fields.nombre) setError('nombre', { message: fields.nombre });
      toast.error(apiErrorToMessage(error));
    }
  });

  const handleDelete = async () => {
    if (!zona) return;
    try {
      await deleteZona.mutateAsync({ id: zona.id, locationId });
      toast.success(`${zona.nombre} eliminada; sus estantes quedan sin zona`);
      setConfirmDelete(false);
      onClose();
    } catch (error) {
      setConfirmDelete(false);
      toast.error(apiErrorToMessage(error));
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        size="sm"
        hasUnsavedChanges={isDirty}
        title={zona ? `Editar ${zona.nombre}` : 'Nueva zona'}
        description="Un área con nombre dentro de la sala. Puede contener estantes."
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="zona-nombre" className={FIELD_LABEL_CLASS}>Nombre *</label>
            <input id="zona-nombre" autoComplete="off" placeholder="Ej. Zona A" className={FORM_CONTROL_CLASS} {...register('nombre')} />
            <FieldError message={errors.nombre?.message} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="zona-width" className={FIELD_LABEL_CLASS}>Ancho (m) *</label>
              <input id="zona-width" type="number" inputMode="decimal" step={0.1} min={0.5} className={FORM_CONTROL_CLASS} {...register('width', { valueAsNumber: true })} />
              <FieldError message={errors.width?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="zona-depth" className={FIELD_LABEL_CLASS}>Largo (m) *</label>
              <input id="zona-depth" type="number" inputMode="decimal" step={0.1} min={0.5} className={FORM_CONTROL_CLASS} {...register('depth', { valueAsNumber: true })} />
              <FieldError message={errors.depth?.message} />
            </div>
          </div>
          <DialogFooter className={zona ? 'sm:justify-between' : undefined}>
            {zona && (
              <Button type="button" size="sm" variant="ghost" className="text-danger sm:mr-auto" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Eliminar zona
              </Button>
            )}
            <DialogCloseButton disabled={isPending}>Cancelar</DialogCloseButton>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              {zona ? 'Guardar cambios' : 'Crear zona'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar ${zona?.nombre ?? 'la zona'}?`}
        description="Sus estantes no se borran: quedan en su lugar, sin zona."
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteZona.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

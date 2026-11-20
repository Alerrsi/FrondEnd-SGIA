import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useCreateEstante, useDeleteEstante, useUpdateEstante } from '@sgia/api-client';
import type { Estante, Zona } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { CODE_CHIP_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { estanteFormSchema, normalizeEstanteCode, type EstanteFormValues } from '../lib/map-forms';
import { FieldError } from './field-error';

export interface EstanteFormDialogProps {
  open: boolean;
  onClose: () => void;
  locationId: number;
  zonas: Zona[];
  /** Con estante, edita; sin estante, crea en la sala del mapa. */
  estante?: Estante | null;
  onCreated?: (estante: Estante) => void;
}

const DEFAULTS: EstanteFormValues = { codigo: '', nombre: '', zona_id: '', width: 200, depth: 60, rotation: '0' };

function toValues(estante: Estante | null | undefined): EstanteFormValues {
  if (!estante) return DEFAULTS;
  return {
    codigo: estante.codigo,
    nombre: estante.nombre ?? '',
    zona_id: estante.zona_id ? String(estante.zona_id) : '',
    width: estante.width,
    depth: estante.depth,
    rotation: estante.rotation === 90 ? '90' : '0',
  };
}

/** Crear o editar un estante. Uno nuevo queda en la sala del mapa, en el primer hueco libre (o en la zona elegida). */
export function EstanteFormDialog({ open, onClose, locationId, zonas, estante, onCreated }: EstanteFormDialogProps) {
  const createEstante = useCreateEstante();
  const updateEstante = useUpdateEstante();
  const deleteEstante = useDeleteEstante();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = Boolean(estante);
  const isPending = createEstante.isPending || updateEstante.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<EstanteFormValues>({ resolver: zodResolver(estanteFormSchema), defaultValues: toValues(estante) });

  useEffect(() => {
    if (open) reset(toValues(estante));
  }, [open, estante, reset]);

  const codigo = useWatch({ control, name: 'codigo' });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      codigo: values.codigo.trim(),
      nombre: values.nombre.trim() || null,
      zona_id: values.zona_id ? Number(values.zona_id) : null,
      width: values.width,
      depth: values.depth,
      rotation: values.rotation === '90' ? (90 as const) : (0 as const),
    };
    try {
      if (estante) {
        await updateEstante.mutateAsync({ id: estante.id, locationId, payload });
        toast.success(`Estante ${normalizeEstanteCode(payload.codigo)} actualizado`);
      } else {
        const created = await createEstante.mutateAsync({ location_id: locationId, ...payload });
        toast.success({ title: `Estante ${created.codigo} creado`, description: 'Arrástralo a su lugar en la sala.' });
        onCreated?.(created);
      }
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      if (fields.codigo) setError('codigo', { message: fields.codigo });
      if (fields.zona_id) setError('zona_id', { message: fields.zona_id });
      if (fields.width) setError('width', { message: fields.width });
      if (fields.depth) setError('depth', { message: fields.depth });
      toast.error(apiErrorToMessage(error));
    }
  });

  const handleDelete = async () => {
    if (!estante) return;
    try {
      await deleteEstante.mutateAsync({ id: estante.id, locationId });
      toast.success(`Estante ${estante.codigo} eliminado`);
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
        title={editing ? `Editar estante ${estante?.codigo ?? ''}` : 'Nuevo estante'}
        description={editing ? 'Cambia sus datos; su posición se mantiene.' : 'Queda en esta sala, en el primer lugar libre. Después lo arrastras a su sitio.'}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="estante-codigo" className={FIELD_LABEL_CLASS}>Código *</label>
            <input id="estante-codigo" autoComplete="off" placeholder="Ej. EST-A1" className={FORM_CONTROL_CLASS} aria-invalid={errors.codigo ? true : undefined} {...register('codigo')} />
            {normalizeEstanteCode(codigo ?? '') !== '' && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Se verá como <span className={CODE_CHIP_CLASS}>{normalizeEstanteCode(codigo ?? '')}</span>
              </span>
            )}
            <FieldError message={errors.codigo?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="estante-nombre" className={FIELD_LABEL_CLASS}>Nombre (opcional)</label>
            <input id="estante-nombre" placeholder="Ej. Rack de redes" className={FORM_CONTROL_CLASS} {...register('nombre')} />
            <FieldError message={errors.nombre?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="estante-zona" className={FIELD_LABEL_CLASS}>Zona (opcional)</label>
            <select id="estante-zona" className={FORM_CONTROL_CLASS} {...register('zona_id')}>
              <option value="">Sin zona</option>
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.id}>{zona.nombre}</option>
              ))}
            </select>
            <FieldError message={errors.zona_id?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="estante-width" className={FIELD_LABEL_CLASS}>Largo (cm) *</label>
              <input id="estante-width" type="number" inputMode="numeric" min={20} max={2000} className={FORM_CONTROL_CLASS} {...register('width', { valueAsNumber: true })} />
              <FieldError message={errors.width?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="estante-depth" className={FIELD_LABEL_CLASS}>Fondo (cm) *</label>
              <input id="estante-depth" type="number" inputMode="numeric" min={20} max={2000} className={FORM_CONTROL_CLASS} {...register('depth', { valueAsNumber: true })} />
              <FieldError message={errors.depth?.message} />
            </div>
          </div>

          <fieldset className="flex flex-col gap-1">
            <legend className={FIELD_LABEL_CLASS}>Orientación</legend>
            <div className="flex flex-wrap gap-4 pt-1 text-sm text-zinc-700 dark:text-zinc-300">
              <label className="flex items-center gap-2"><input type="radio" value="0" className="accent-accent" {...register('rotation')} /> Horizontal</label>
              <label className="flex items-center gap-2"><input type="radio" value="90" className="accent-accent" {...register('rotation')} /> Vertical</label>
            </div>
          </fieldset>

          <DialogFooter className={editing ? 'sm:justify-between' : undefined}>
            {editing && (
              <Button type="button" size="sm" variant="ghost" className="text-danger sm:mr-auto" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Eliminar estante
              </Button>
            )}
            <DialogCloseButton disabled={isPending}>Cancelar</DialogCloseButton>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear estante'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar el estante ${estante?.codigo ?? ''}?`}
        description="Solo se puede eliminar un estante sin cajones. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteEstante.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
